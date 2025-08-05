import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

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
      const lead = await storage.updateLead(req.params.id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
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
          error: "Email and password are required" 
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ 
          error: "Invalid email or password" 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: "Account is deactivated" 
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
          error: "User with this email already exists" 
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
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
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

  app.put("/api/users/profile", async (req, res) => {
    try {
      const { email, currentPassword, newPassword, ...updates } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password is required to change password" });
        }
        if (user.password !== currentPassword) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }
        updates.password = newPassword;
      }

      const updatedUser = await storage.updateUser(user.id, updates);
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

  return httpServer;
}
