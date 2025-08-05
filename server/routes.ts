import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { notificationService } from "./notifications";

// Helper function to get status labels
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    new: "New Lead",
    followup: "Follow-up",
    qualified: "Qualified",
    hot: "Hot Lead",
    converted: "Converted to Customer",
    lost: "Lost"
  };
  return statusMap[status] || status;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Export leads as CSV - placed first to avoid route conflicts
  app.get("/api/leads/export", async (req, res) => {
    try {
      const { search, status, category, city } = req.query;
      
      let leads;
      if (search) {
        leads = await storage.searchLeads(search as string);
      } else if (status || category || city) {
        leads = await storage.filterLeads({
          status: status as string,
          category: category as string,
          city: city as string,
        });
      } else {
        leads = await storage.getLeads();
      }

      // CSV Headers
      const csvHeaders = [
        "Name",
        "Phone Number",
        "Email",
        "Date of Birth",
        "City",
        "State",
        "Country",
        "Pincode",
        "Company Name",
        "Designation",
        "Customer Category",
        "Last Contacted Date",
        "Last Contacted By",
        "Next Followup Date",
        "Customer Interested In",
        "Preferred Communication Channel",
        "Lead Status",
        "Additional Notes"
      ];

      // Convert leads to CSV format
      const csvRows = leads.map(lead => [
        `"${lead.name || ""}"`,
        `"${lead.phoneNumber || ""}"`,
        `"${lead.email || ""}"`,
        `"${lead.dateOfBirth || ""}"`,
        `"${lead.city || ""}"`,
        `"${lead.state || ""}"`,
        `"${lead.country || ""}"`,
        `"${lead.pincode || ""}"`,
        `"${lead.companyName || ""}"`,
        `"${lead.designation || ""}"`,
        `"${lead.customerCategory === "existing" ? "Existing Customer" : "Potential Customer"}"`,
        `"${lead.lastContactedDate || ""}"`,
        `"${lead.lastContactedBy || ""}"`,
        `"${lead.nextFollowupDate || ""}"`,
        `"${lead.customerInterestedIn || ""}"`,
        `"${lead.preferredCommunicationChannel || ""}"`,
        `"${getStatusLabel(lead.leadStatus)}"`,
        `"${lead.additionalNotes || ""}"`
      ]);

      // Combine headers and rows
      const csvContent = [csvHeaders.join(","), ...csvRows.map(row => row.join(","))].join("\n");

      // Set headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `leads_export_${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ message: "Failed to export leads" });
    }
  });

  // Get all leads
  app.get("/api/leads", async (req, res) => {
    try {
      const { search, status, category, city } = req.query;
      
      let leads;
      if (search) {
        leads = await storage.searchLeads(search as string);
      } else if (status || category || city) {
        leads = await storage.filterLeads({
          status: status as string,
          category: category as string,
          city: city as string,
        });
      } else {
        leads = await storage.getLeads();
      }
      
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Get lead by ID
  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  // Create new lead
  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      
      // Send notification for new lead
      try {
        const users = await storage.getUsers();
        for (const user of users) {
          if (user.isActive) {
            await notificationService.notifyNewLead(user.email, lead.name, lead.id);
          }
        }
      } catch (notificationError) {
        console.error("Error sending new lead notifications:", notificationError);
      }
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Update lead
  app.put("/api/leads/:id", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const originalLead = await storage.getLead(req.params.id);
      const lead = await storage.updateLead(req.params.id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Send notifications for lead updates
      try {
        const users = await storage.getUsers();
        const changes: string[] = [];
        
        // Detect what changed
        if (originalLead) {
          if (originalLead.leadStatus !== lead.leadStatus) {
            changes.push(`Status changed from ${originalLead.leadStatus} to ${lead.leadStatus}`);
            
            // Special notification for conversions
            if (lead.leadStatus === 'converted') {
              for (const user of users) {
                if (user.isActive) {
                  await notificationService.notifyLeadConverted(user.email, lead.name, lead.id);
                }
              }
            }
          }
          if (originalLead.nextFollowupDate !== lead.nextFollowupDate) {
            changes.push(`Next follow-up date updated to ${lead.nextFollowupDate || 'Not set'}`);
          }
          if (originalLead.lastContactedBy !== lead.lastContactedBy) {
            changes.push(`Last contacted by updated to ${lead.lastContactedBy || 'Not set'}`);
          }
        }

        // Send update notifications if there are changes
        if (changes.length > 0 && lead.leadStatus !== 'converted') {
          for (const user of users) {
            if (user.isActive) {
              await notificationService.notifyLeadUpdate(user.email, lead.name, lead.id, changes);
            }
          }
        }
      } catch (notificationError) {
        console.error("Error sending lead update notifications:", notificationError);
      }

      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  // Delete lead
  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Get lead statistics
  app.get("/api/leads/stats/summary", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      
      const stats = {
        totalLeads: leads.length,
        hotLeads: leads.filter(lead => lead.leadStatus === "hot").length,
        converted: leads.filter(lead => lead.leadStatus === "converted").length,
        conversionRate: leads.length > 0 
          ? ((leads.filter(lead => lead.leadStatus === "converted").length / leads.length) * 100).toFixed(1)
          : "0.0"
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching lead stats:", error);
      res.status(500).json({ message: "Failed to fetch lead statistics" });
    }
  });



  const httpServer = createServer(app);
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: "Please enter both email and password to continue." 
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ 
          error: "Invalid credentials. Please check your email and password and try again." 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: "Your account has been deactivated. Please contact support for assistance." 
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        message: "Login successful", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ 
          error: "An account with this email already exists. Please try logging in instead." 
        });
      }

      const newUser = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({ 
        message: "User created successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Please check your information and try again.", 
          details: error.errors 
        });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Debug route to check user credentials (development only)
  app.get("/api/debug/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Only show this in development
      if (process.env.NODE_ENV === 'development') {
        res.json(users.map(user => ({
          email: user.email,
          hasPassword: !!user.password,
          passwordLength: user.password?.length || 0,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        })));
      } else {
        res.status(403).json({ error: "Not available in production" });
      }
    } catch (error) {
      console.error("Debug users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Route to reset users to original credentials (development only)
  app.post("/api/debug/reset-users", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        storage.resetUsers();
        res.json({ message: "Users reset to original credentials successfully" });
      } else {
        res.status(403).json({ error: "Not available in production" });
      }
    } catch (error) {
      console.error("Reset users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/profile", async (req, res) => {
    try {
      const { email, currentPassword, newPassword, confirmPassword, ...updates } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Only process password change if newPassword is provided and not empty
      if (newPassword && newPassword.trim() !== '') {
        if (!currentPassword || currentPassword.trim() === '') {
          return res.status(400).json({ error: "Current password is required to change password" });
        }
        if (user.password !== currentPassword) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: "New passwords do not match" });
        }
        updates.password = newPassword;
      }

      // Only update non-empty fields (excluding password-related fields)
      const fieldsToUpdate: any = {};
      if (updates.name && updates.name.trim() !== '') fieldsToUpdate.name = updates.name;
      if (updates.role) fieldsToUpdate.role = updates.role;
      if (updates.password) fieldsToUpdate.password = updates.password;

      const updatedUser = await storage.updateUser(user.id, fieldsToUpdate);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ 
        message: "Profile updated successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const leads = await storage.getLeads();
      
      // Calculate analytics data
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.leadStatus === 'converted').length;
      const hotLeads = leads.filter(l => l.leadStatus === 'hot').length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100) : 0;

      const analytics = {
        totalLeads,
        convertedLeads,
        hotLeads,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        timeRange: days,
      };

      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notification management routes
  app.post("/api/notifications/push/subscribe", async (req, res) => {
    try {
      const { userId, subscription } = req.body;
      if (!userId || !subscription) {
        return res.status(400).json({ error: "User ID and subscription data required" });
      }
      
      notificationService.subscribeToPush(userId, subscription);
      res.json({ message: "Successfully subscribed to push notifications" });
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ error: "Failed to subscribe to push notifications" });
    }
  });

  app.delete("/api/notifications/push/unsubscribe/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      notificationService.unsubscribeFromPush(userId);
      res.json({ message: "Successfully unsubscribed from push notifications" });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from push notifications" });
    }
  });

  // Test notification endpoint
  app.post("/api/notifications/test", async (req, res) => {
    try {
      const { email, type } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let success = false;
      switch (type) {
        case 'new_lead':
          success = await notificationService.notifyNewLead(email, "Test Lead", "test-123");
          break;
        case 'lead_update':
          success = await notificationService.notifyLeadUpdate(email, "Test Lead", "test-123", ["Status changed for testing"]);
          break;
        case 'lead_converted':
          success = await notificationService.notifyLeadConverted(email, "Test Lead", "test-123");
          break;
        default:
          return res.status(400).json({ error: "Invalid notification type" });
      }

      if (success) {
        res.json({ message: "Test notification sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send test notification" });
      }
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  return httpServer;
}
