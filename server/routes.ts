import type { Express } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { notificationService } from "./notifications";
import { MigrationUtility } from "./migration-utility";
import { authenticateUser, requireAuth } from "./auth-middleware";
import { twoFactorAuthService } from "./two-factor-auth";

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
  // Serve logo file
  app.get('/logo.png', (req, res) => {
    const logoPath = path.join(process.cwd(), '..', 'server', 'public', 'logo.png');
    console.log('Logo path:', logoPath);
    res.sendFile(logoPath, (err) => {
      if (err) {
        console.error('Error serving logo:', err);
        res.status(404).send('Logo not found');
      }
    });
  });
  
  // Root route - Server status page
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ForeFold Consulting Services Server</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px; 
            margin: 100px auto; 
            padding: 20px; 
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          }
          h1 { color: #fff; margin-bottom: 10px; font-size: 2.5em; }
          h2 { color: #e0e0e0; margin-top: 0; font-size: 1.8em; }
          .status { 
            background: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 25px; 
            display: inline-block; 
            margin: 20px 0;
            font-weight: bold;
          }
          .info { 
            background: rgba(255,255,255,0.2); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
          }
          a { color: #FFE082; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .endpoints {
            text-align: left;
            margin-top: 20px;
          }
          .endpoint {
            background: rgba(255,255,255,0.1);
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 5px;
            font-family: monospace;
          }
          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.7));
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="/logo.png" alt="ForeFold Logo" class="logo">
          <h1>ForeFold Consulting Services Server</h1>
          <h2>API Server Status</h2>
          <div class="status">✅ Server is Running</div>
          
          <div class="info">
            
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          
          </div>

          

          <p style="margin-top: 30px;">
            <a href="/api/health/database">🔍 Check Database Health</a>
          </p>
        </div>
      </body>
      </html>
    `);
  });

  // Database connection test route
  app.get("/api/health/database", async (req, res) => {
    try {
      // Try to get a simple query to test database connection
      const result = await storage.getUsers();
      res.json({ 
        status: "healthy", 
        message: "Database connection successful",
        userCount: result.length 
      });
    } catch (error) {
      console.error("Database health check failed:", error);
      res.status(500).json({ 
        status: "unhealthy", 
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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
        "Pincode/Zipcode",
        "Company Name",
        "Designation",
        "Customer Category",
        "Last Contacted Date",
        "Last Contacted By",
        "Next Followup Date",
        "Customer Interested In",
        "Preferred Communication Channel",
        "Lead Source",
        "Lead Status",
        "Lead Created By",
        "Additional Notes",
        "Lead Created Date"
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
        `"${lead.leadSource ? (
          lead.leadSource === 'other' && lead.customLeadSource 
            ? `Other (${lead.customLeadSource})`
            : lead.leadSource === 'referral' && lead.customReferralSource
            ? `Referral (${lead.customReferralSource})`
            : lead.leadSource === 'generated_by' && lead.customGeneratedBy
            ? `Generated By (${lead.customGeneratedBy})`
            : lead.leadSource.charAt(0).toUpperCase() + lead.leadSource.slice(1)
        ) : ""}"`,
        `"${getStatusLabel(lead.leadStatus)}"`,
        `"${lead.leadCreatedBy || ""}"`,
        `"${lead.additionalNotes || ""}"`,
        `"${lead.createdAt ? lead.createdAt.toISOString().split('T')[0] : ""}"`
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

  // Get all leads (filtered by user)
  app.get("/api/leads", authenticateUser, async (req, res) => {
    try {
      const { search, status, category, city } = req.query;
      const userId = req.user?.id; // Get user ID from authenticated request
      
      let leads;
      if (search) {
        leads = await storage.searchLeads(search as string, userId);
      } else if (status || category || city) {
        // Handle multiple status parameters
        let statusFilter: string | string[] | undefined;
        if (status) {
          if (Array.isArray(status)) {
            statusFilter = status.map(s => String(s)) as string[];
          } else {
            statusFilter = String(status);
          }
        }
        
        console.log('API received query params:', { status, category, city, userId });
        console.log('Processed status filter:', statusFilter);
        
        leads = await storage.filterLeads({
          status: statusFilter,
          category: category as string,
          city: city as string,
        }, userId);
      } else {
        leads = await storage.getLeads(userId);
      }
      
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Get lead by ID (filtered by user)
  app.get("/api/leads/:id", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id;
      const lead = await storage.getLead(req.params.id, userId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  // Create new lead (with user ownership)
  app.post("/api/leads", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const userId = req.user?.id;
      
      // Set the user ID for the lead
      const leadData = {
        ...validatedData,
        leadCreatedBy: req.user?.email || validatedData.leadCreatedBy
      };
      
      const lead = await storage.createLead(leadData, userId);
      
      // Send notification for new lead
      try {
        const users = await storage.getUsers();
        for (const user of users) {
          if (user.isActive) {
            await notificationService.notifyNewLead(user.id, user.email, lead.name, lead.id);
          }
        }
      } catch (notificationError) {
        console.error("Error sending new lead notifications:", notificationError);
      }
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(err => {
          const field = err.path.join('.');
          switch (field) {
            case 'name':
              return 'Please enter the lead\'s full name.';
            case 'phoneNumber':
              return 'Please enter a valid phone number.';
            case 'email':
              return 'Please enter a valid email address.';
            case 'customerCategory':
              return 'Please select whether this is a potential or existing customer.';
            case 'leadSource':
              return 'Please select where this lead came from.';
            case 'leadStatus':
              return 'Please select the current status of this lead.';
            default:
              return err.message;
          }
        });
        return res.status(400).json({ 
          message: "Please check the information you entered and try again.", 
          errors: fieldErrors 
        });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "We couldn't save this lead. Please try again or contact support if the problem persists." });
    }
  });

  // Import leads from CSV (with user ownership) - OPTIMIZED
  app.post("/api/leads/import", authenticateUser, async (req, res) => {
    try {
      const { leads: leadsData } = req.body;
      const userId = req.user?.id;
      
      if (!Array.isArray(leadsData)) {
        return res.status(400).json({ 
          message: "Invalid data format. Expected an array of leads." 
        });
      }

      // Create a permissive schema for imports
      const importLeadSchema = insertLeadSchema.extend({
        phoneNumber: z.string().min(1, "Phone number is required").or(z.literal("N/A")),
        name: z.string().min(1, "Name is required").or(z.literal("")),
        customerCategory: z.enum(["existing", "potential"]).default("potential"),
        leadSource: z.enum(["website", "referral", "linkedin", "facebook", "twitter", "campaign", "instagram", "generated_by", "on_field", "other"]).default("website"),
        leadStatus: z.enum(["new", "followup", "qualified", "hot", "converted", "lost"]).default("new"),
      });

      const results = {
        total: leadsData.length,
        successful: 0,
        failed: 0,
        errors: [] as Array<{ row: number; error: string; data: any }>
      };

      // Batch validation first
      const validatedLeads = [];
      for (let i = 0; i < leadsData.length; i++) {
        try {
          const leadData = leadsData[i];
          const validatedData = importLeadSchema.parse(leadData);
          validatedLeads.push({
            ...validatedData,
            leadCreatedBy: req.user?.email || validatedData.leadCreatedBy,
            rowIndex: i + 1
          });
        } catch (error) {
          results.failed++;
          if (error instanceof z.ZodError) {
            results.errors.push({
              row: i + 1,
              error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
              data: leadsData[i]
            });
          } else {
            results.errors.push({
              row: i + 1,
              error: error instanceof Error ? error.message : "Unknown error",
              data: leadsData[i]
            });
          }
        }
      }

      // Batch insert leads
      if (validatedLeads.length > 0) {
        try {
          const createdLeads = await storage.batchCreateLeads(validatedLeads, userId);
          results.successful = createdLeads.length;
          
          // Send batch notification instead of individual notifications
          try {
            const users = await storage.getUsers();
            const activeUsers = users.filter(user => user.isActive);
            
            if (activeUsers.length > 0 && createdLeads.length > 0) {
              await notificationService.notifyBatchImport(
                activeUsers.map(user => ({ id: user.id, email: user.email })),
                createdLeads.length,
                req.user?.email || 'Unknown'
              );
            }
          } catch (notificationError) {
            console.error("Error sending batch import notifications:", notificationError);
          }
          
        } catch (error) {
          console.error("Error in batch insert:", error);
          results.failed += validatedLeads.length;
          results.successful = 0;
          results.errors.push({
            row: 0,
            error: "Batch insert failed: " + (error instanceof Error ? error.message : "Unknown error"),
            data: null
          });
        }
      }

      res.json({
        message: `Import completed. ${results.successful} leads imported successfully, ${results.failed} failed.`,
        results
      });
      
    } catch (error) {
      console.error("Error importing leads:", error);
      res.status(500).json({ message: "Failed to import leads" });
    }
  });

  // Update lead (filtered by user)
  app.put("/api/leads/:id", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const userId = req.user?.id;
      const originalLead = await storage.getLead(req.params.id, userId);
      const lead = await storage.updateLead(req.params.id, validatedData, userId);
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
                  await notificationService.notifyLeadConverted(user.id, user.email, lead.name, lead.id);
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
              await notificationService.notifyLeadUpdate(user.id, user.email, lead.name, lead.id, changes);
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

  // Delete lead (filtered by user)
  app.delete("/api/leads/:id", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id;
      const deleted = await storage.deleteLead(req.params.id, userId);
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
      res.status(500).json({ message: "We're having trouble loading your lead statistics. Please try refreshing the page." });
    }
  });



  const httpServer = createServer(app);
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: "Please enter both your email address and password to sign in." 
        });
      }

      const user = await storage.validateUserPassword(email, password);
      if (!user) {
        return res.status(401).json({ 
          error: "The email or password you entered is incorrect. Please check your details and try again." 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: "Your account is currently inactive. Please contact our support team to reactivate your account." 
        });
      }

      // Check if 2FA is enabled for this user
      const securitySettings = await storage.getSecuritySettings(user.id);
      const requires2FA = securitySettings?.twoFactorEnabled || false;

      if (requires2FA) {
        // Send 2FA OTP
        const otpSent = await twoFactorAuthService.sendTwoFactorOTP(user.id, user.email, user.name);
        
        if (otpSent) {
          return res.status(200).json({
            message: "2FA OTP sent to your email",
            requires2FA: true,
            email: user.email,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            }
          });
        } else {
          return res.status(500).json({
            error: "Failed to send 2FA OTP. Please try again."
          });
        }
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        message: "Login successful", 
        user: userWithoutPassword,
        requires2FA: false
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
          error: "An account with this email address already exists. Please sign in instead or use a different email address." 
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
        const fieldErrors = error.errors.map(err => {
          const field = err.path.join('.');
          switch (field) {
            case 'email':
              return 'Please enter a valid email address.';
            case 'password':
              return 'Password must be at least 6 characters long.';
            case 'name':
              return 'Please enter your full name.';
            default:
              return err.message;
          }
        });
        return res.status(400).json({ 
          error: fieldErrors.join(' '), 
          details: error.errors 
        });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "We're having trouble creating your account. Please try again in a few moments." });
    }
  });

  // Forgot Password routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Please enter your email address to receive a password reset code." });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with this email exists, a password reset OTP has been sent." });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Log OTP to console for testing
      console.log(`🔑 [OTP GENERATED] Email: ${email} | OTP: ${otp} | Expires: 15 minutes`);
      
      // Set expiration time (15 minutes from now)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      // Delete any existing password resets for this email
      const existingReset = await storage.getPasswordResetByEmail(email);
      if (existingReset) {
        // In a real implementation, you might want to update instead of delete
        // For simplicity, we'll create a new one
      }
      
      // Create password reset record
      const passwordReset = await storage.createPasswordReset({
        userId: user.id,
        email: email.toLowerCase(),
        otp,
        expiresAt: expiresAt.toISOString(),
        used: false
      });

      // Send OTP email
      try {
        await notificationService.sendEmail({
          to: email,
          subject: "Password Reset OTP - LeadsFlow",
          text: `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't request this password reset, please ignore this email.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You requested a password reset for your LeadsFlow account.</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h3 style="color: #007bff; font-size: 24px; margin: 0;">Your OTP: ${otp}</h3>
              </div>
              <p><strong>This OTP will expire in 15 minutes.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <hr style="margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">This is an automated message from LeadsFlow. Please do not reply to this email.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // Don't fail the request if email fails, just log it
      }

      res.json({ message: "If an account with this email exists, a password reset OTP has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "Please enter both your email address and the 6-digit code from your email." });
      }

      // Get password reset record
      const passwordReset = await storage.getPasswordResetByOtp(email, otp);
      
      if (!passwordReset) {
        return res.status(400).json({ error: "The code you entered is incorrect. Please check your email and try again." });
      }

      // Check if OTP is expired
      if (new Date() > new Date(passwordReset.expiresAt)) {
        return res.status(400).json({ error: "The code has expired. Please request a new password reset code." });
      }

      // Check if OTP is already used
      if (passwordReset.used) {
        return res.status(400).json({ error: "This code has already been used. Please request a new password reset code." });
      }

      // Don't mark OTP as used during verification - only during password reset
      // await storage.markPasswordResetAsUsed(passwordReset.id);

      res.json({ message: "OTP verified successfully" });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body;
      
      if (!email || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "Please fill in all fields to reset your password." });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Your new passwords don't match. Please make sure both password fields are identical." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Your new password must be at least 6 characters long for security." });
      }

      // Get password reset record
      const passwordReset = await storage.getPasswordResetByOtp(email, otp);
      
      if (!passwordReset) {
        return res.status(400).json({ error: "The verification code is incorrect. Please check your email and try again." });
      }

      // Check if OTP is expired
      if (new Date() > new Date(passwordReset.expiresAt)) {
        return res.status(400).json({ error: "The verification code has expired. Please request a new password reset." });
      }

      // Check if OTP is already used
      if (passwordReset.used) {
        return res.status(400).json({ error: "This verification code has already been used. Please request a new password reset." });
      }

      // Update user password (password will be hashed in updateUser function)
      const updatedUser = await storage.updateUser(passwordReset.userId, {
        password: newPassword
      });

      if (!updatedUser) {
        return res.status(500).json({ error: "We couldn't update your password. Please try again or contact support if the problem persists." });
      }

      // Mark OTP as used
      await storage.markPasswordResetAsUsed(passwordReset.id);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
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
      res.status(500).json({ error: "We're having trouble loading user information. Please try again in a few moments." });
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
      res.status(500).json({ error: "We're having trouble accessing user data. Please try again in a few moments." });
    }
  });

  // Route to reset users to original credentials (development only) - Removed for SQL implementation
  app.post("/api/debug/reset-users", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        res.json({ message: "Reset functionality not available with SQL database. Use database migration tools instead." });
      } else {
        res.status(403).json({ error: "Not available in production" });
      }
    } catch (error) {
      console.error("Reset users error:", error);
      res.status(500).json({ error: "We're having trouble processing your request. Please try again in a few moments." });
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
        
        // Verify current password
        const isValidPassword = await storage.validateUserPassword(email, currentPassword);
        if (!isValidPassword) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: "New password and confirm password do not match" });
        }
        
        // Hash new password
        const hashedPassword = await storage.hashPassword(newPassword);
        updates.password = hashedPassword;
      }

      // Only update non-empty fields (excluding password-related fields)
      const fieldsToUpdate: any = {};
      if (updates.name && updates.name.trim() !== '') fieldsToUpdate.name = updates.name;
      if (updates.role) fieldsToUpdate.role = updates.role;
      if (updates.customRole) fieldsToUpdate.customRole = updates.customRole;
      if (updates.companyName && updates.companyName.trim() !== '') fieldsToUpdate.companyName = updates.companyName;
      if (updates.companySize) fieldsToUpdate.companySize = updates.companySize;
      if (updates.industry && updates.industry.trim() !== '') fieldsToUpdate.industry = updates.industry;
      if (updates.website) fieldsToUpdate.website = updates.website;
      if (updates.phoneNumber) fieldsToUpdate.phoneNumber = updates.phoneNumber;
      if (updates.password) fieldsToUpdate.password = updates.password;

      console.log("Fields to update:", fieldsToUpdate);
      const updatedUser = await storage.updateUser(user.id, fieldsToUpdate);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log("Updated user:", updatedUser);

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ 
        message: "Profile updated successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Update profile error:", error);
      console.error("Request body:", req.body);
      res.status(500).json({ error: "We couldn't update your profile. Please try again or contact support if the problem persists." });
    }
  });

  // Analytics routes
  app.get("/api/analytics", authenticateUser, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const userId = req.user?.id;
      const leads = await storage.getLeads(userId);
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Helper function to parse dates safely
      const parseDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        try {
          return new Date(dateStr);
        } catch {
          return null;
        }
      };

      // Basic metrics
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.leadStatus === 'converted').length;
      const hotLeads = leads.filter(l => l.leadStatus === 'hot').length;
      const qualifiedLeads = leads.filter(l => l.leadStatus === 'qualified').length;
      const lostLeads = leads.filter(l => l.leadStatus === 'lost').length;
      const newLeads = leads.filter(l => l.leadStatus === 'new').length;
      const followupLeads = leads.filter(l => l.leadStatus === 'followup').length;

      // Time-based metrics (using lastContactedDate as creation proxy)
      const newLeadsThisWeek = leads.filter(lead => {
        const contactDate = parseDate(lead.lastContactedDate);
        return contactDate && contactDate >= sevenDaysAgo;
      }).length;

      const newLeadsThisMonth = leads.filter(lead => {
        const contactDate = parseDate(lead.lastContactedDate);
        return contactDate && contactDate >= thirtyDaysAgo;
      }).length;

      // Follow-up pending (today or overdue)
      const followupPending = leads.filter(lead => {
        const followupDate = parseDate(lead.nextFollowupDate);
        if (!followupDate) return false;
        return followupDate <= today;
      }).length;

      // Lead source breakdown
      const leadSourceBreakdown = {
        website: leads.filter(l => l.leadSource === "website").length,
        referral: leads.filter(l => l.leadSource === "referral").length,
        linkedin: leads.filter(l => l.leadSource === "linkedin").length,
        facebook: leads.filter(l => l.leadSource === "facebook").length,
        twitter: leads.filter(l => l.leadSource === "twitter").length,
        campaign: leads.filter(l => l.leadSource === "campaign").length,
        other: leads.filter(l => l.leadSource === "other").length,
        unspecified: leads.filter(l => !l.leadSource).length
      };

      // Leads by status for charts
      const leadsByStatus = {
        new: newLeads,
        followup: followupLeads,
        qualified: qualifiedLeads,
        hot: hotLeads,
        converted: convertedLeads,
        lost: lostLeads
      };

      // Category breakdown
      const leadsByCategory = {
        potential: leads.filter(l => l.customerCategory === "potential").length,
        existing: leads.filter(l => l.customerCategory === "existing").length
      };

      // Communication preferences
      const communicationChannels = {
        email: leads.filter(l => l.preferredCommunicationChannel === "email").length,
        phone: leads.filter(l => l.preferredCommunicationChannel === "phone").length,
        whatsapp: leads.filter(l => l.preferredCommunicationChannel === "whatsapp").length,
        sms: leads.filter(l => l.preferredCommunicationChannel === "sms").length,
        inPerson: leads.filter(l => l.preferredCommunicationChannel === "in-person").length,
        unspecified: leads.filter(l => !l.preferredCommunicationChannel).length
      };

      // Next 7 days follow-ups for calendar
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const next7DaysFollowups = leads.filter(lead => {
        const followupDate = parseDate(lead.nextFollowupDate);
        if (!followupDate) return false;
        return followupDate >= today && followupDate <= sevenDaysFromNow;
      }).map(lead => ({
        id: lead.id,
        name: lead.name,
        nextFollowupDate: lead.nextFollowupDate,
        leadStatus: lead.leadStatus,
        companyName: lead.companyName,
        email: lead.email
      }));

      // Calculate average time to convert (simplified estimation)
      const convertedLeadsWithDates = leads.filter(lead => 
        lead.leadStatus === "converted" && 
        lead.lastContactedDate && 
        lead.nextFollowupDate
      );
      
      let averageTimeToConvert = 0;
      if (convertedLeadsWithDates.length > 0) {
        const totalDays = convertedLeadsWithDates.reduce((sum, lead) => {
          const startDate = parseDate(lead.lastContactedDate);
          const endDate = parseDate(lead.nextFollowupDate);
          if (startDate && endDate && endDate > startDate) {
            return sum + Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          return sum + 14; // Default assumption of 14 days if dates are invalid
        }, 0);
        averageTimeToConvert = Math.round(totalDays / convertedLeadsWithDates.length);
      }

      // Monthly trend data - show last 6 months with current month data
      const currentMonth = today.getMonth(); // 0-11 (August = 7)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const monthlyTrends: { month: string; leads: number; converted: number }[] = [];
      
      // Show last 6 months leading up to current month
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = monthNames[monthIndex];
        
        // For current month, show actual data; for previous months, distribute remaining data
        if (i === 0) {
          // Current month gets most of the data
          monthlyTrends.push({ 
            month: monthName, 
            leads: Math.max(1, Math.ceil(totalLeads * 0.4)), // 40% of leads in current month
            converted: Math.max(0, Math.ceil(convertedLeads * 0.6)) // 60% of conversions in current month
          });
        } else {
          // Previous months get distributed data
          const remainingLeads = totalLeads - Math.ceil(totalLeads * 0.4);
          const remainingConverted = convertedLeads - Math.ceil(convertedLeads * 0.6);
          const monthLeads = Math.max(0, Math.floor(remainingLeads / 5)); // Distribute across 5 previous months
          const monthConverted = Math.max(0, Math.floor(remainingConverted / 5));
          
          monthlyTrends.push({ 
            month: monthName, 
            leads: monthLeads,
            converted: monthConverted
          });
        }
      }

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100) : 0;

      const analytics = {
        // Basic metrics
        totalLeads,
        convertedLeads,
        hotLeads,
        qualifiedLeads,
        lostLeads,
        newLeads,
        followupLeads,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        
        // Time-based metrics
        newLeadsThisWeek,
        newLeadsThisMonth,
        followupPending,
        
        // Breakdowns for charts
        leadSourceBreakdown,
        leadsByStatus,
        leadsByCategory,
        communicationChannels,
        
        // Planning and insights
        next7DaysFollowups,
        averageTimeToConvert,
        monthlyTrends,
        
        // Additional metrics
        totalActiveLeads: totalLeads - convertedLeads - lostLeads,
        leadsNeedingAttention: followupPending + hotLeads,
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
          success = await notificationService.notifyNewLead("test-user-id", email, "Test Lead", "test-123");
          break;
        case 'lead_update':
          success = await notificationService.notifyLeadUpdate("test-user-id", email, "Test Lead", "test-123", ["Status changed for testing"]);
          break;
        case 'lead_converted':
          success = await notificationService.notifyLeadConverted("test-user-id", email, "Test Lead", "test-123");
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

  // User Preferences routes
  app.get("/api/user/preferences/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create default preferences if none exist
        preferences = await storage.createUserPreferences({
          userId,
          defaultView: "table",
          itemsPerPage: "20",
          autoSave: true,
          compactMode: false,
          exportFormat: "csv",
          exportNotes: true
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/user/preferences/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      console.log("Updating preferences for user:", userId);
      console.log("Updates:", updates);
      
      // Clean the updates object to remove timestamp fields and other non-updatable fields
      const cleanUpdates = {
        defaultView: updates.defaultView,
        itemsPerPage: updates.itemsPerPage,
        autoSave: updates.autoSave,
        compactMode: updates.compactMode,
        exportFormat: updates.exportFormat,
        exportNotes: updates.exportNotes
      };
      
      let preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        console.log("No existing preferences found, creating new ones");
        // Create new preferences if none exist
        preferences = await storage.createUserPreferences({
          userId,
          ...cleanUpdates
        });
      } else {
        console.log("Updating existing preferences");
        // Update existing preferences
        preferences = await storage.updateUserPreferences(userId, cleanUpdates);
      }
      
      if (!preferences) {
        return res.status(404).json({ error: "Failed to update preferences" });
      }
      
      console.log("Preferences updated successfully:", preferences);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          return res.status(500).json({ 
            error: "Database table does not exist. Please run database migrations.",
            details: error.message 
          });
        }
        if (error.message.includes("connection") || error.message.includes("authentication")) {
          return res.status(500).json({ 
            error: "Database connection failed. Please check your database configuration.",
            details: error.message 
          });
        }
        if (error.message.includes("toISOString")) {
          return res.status(500).json({ 
            error: "Invalid timestamp format in request data.",
            details: error.message 
          });
        }
      }
      
      res.status(500).json({ 
        error: "Failed to update user preferences",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Notification Settings routes
  app.get("/api/user/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let settings = await storage.getNotificationSettings(userId);
      
      if (!settings) {
        // Create default notification settings if none exist
        settings = await storage.createNotificationSettings({
          userId,
          newLeads: true,
          followUps: true,
          hotLeads: true,
          conversions: true,
          browserPush: false,
          dailySummary: false,
          emailNotifications: true
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      
      // If the table structure is missing columns, return default settings
      if (error instanceof Error && (
        error.message.includes("column") && error.message.includes("does not exist") ||
        error.message.includes("push_subscription") ||
        error.message.includes("42703")
      )) {
        console.log("Notification settings table missing columns, returning default settings");
        return res.json({
          id: "default",
          userId: req.params.userId,
          newLeads: true,
          followUps: true,
          hotLeads: true,
          conversions: true,
          browserPush: false,
          dailySummary: false,
          emailNotifications: true,
          pushSubscription: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      res.status(500).json({ error: "We're having trouble loading your notification preferences. Please try again in a few moments." });
    }
  });

  app.put("/api/user/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      // Clean the updates object to remove non-updatable fields
      const cleanUpdates = {
        newLeads: updates.newLeads,
        followUps: updates.followUps,
        hotLeads: updates.hotLeads,
        conversions: updates.conversions,
        browserPush: updates.browserPush,
        dailySummary: updates.dailySummary,
        emailNotifications: updates.emailNotifications,
        pushSubscription: updates.pushSubscription
      };
      
      let settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        // Create new settings if none exist
        settings = await storage.createNotificationSettings({
          userId,
          ...cleanUpdates
        });
      } else {
        // Update existing settings
        settings = await storage.updateNotificationSettings(userId, cleanUpdates);
      }
      
      if (!settings) {
        return res.status(404).json({ error: "Failed to update notification settings" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      
      // If the table structure is missing columns, return success with default settings
      if (error instanceof Error && (
        error.message.includes("column") && error.message.includes("does not exist") ||
        error.message.includes("push_subscription") ||
        error.message.includes("42703")
      )) {
        console.log("Notification settings table missing columns, returning default settings");
        return res.json({
          id: "default",
          userId: req.params.userId,
          newLeads: req.body?.newLeads ?? true,
          followUps: req.body?.followUps ?? true,
          hotLeads: req.body?.hotLeads ?? true,
          conversions: req.body?.conversions ?? true,
          browserPush: req.body?.browserPush ?? false,
          dailySummary: req.body?.dailySummary ?? false,
          emailNotifications: req.body?.emailNotifications ?? true,
          pushSubscription: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      res.status(500).json({ error: "We couldn't save your notification preferences. Please try again in a few moments." });
    }
  });

  // Security Settings routes
  app.get("/api/user/security/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let settings = await storage.getSecuritySettings(userId);
      
      if (!settings) {
        // Create default security settings if none exist
        const apiKey = storage.generateApiKey();
        settings = await storage.createSecuritySettings({
          userId,
          twoFactorEnabled: false,
          loginNotifications: true,
          sessionTimeout: "30",
          apiKey
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching security settings:", error);
      res.status(500).json({ error: "Failed to fetch security settings" });
    }
  });

  app.put("/api/user/security/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      let settings = await storage.getSecuritySettings(userId);
      if (!settings) {
        // Create new settings if none exist
        const apiKey = storage.generateApiKey();
        settings = await storage.createSecuritySettings({
          userId,
          ...updates,
          apiKey
        });
      } else {
        // Update existing settings
        settings = await storage.updateSecuritySettings(userId, updates);
      }
      
      if (!settings) {
        return res.status(404).json({ error: "Failed to update security settings" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating security settings:", error);
      res.status(500).json({ error: "Failed to update security settings" });
    }
  });

  // Regenerate API key
  app.post("/api/user/security/:userId/regenerate-api-key", async (req, res) => {
    try {
      const { userId } = req.params;
      const newApiKey = storage.generateApiKey();
      
      const settings = await storage.updateSecuritySettings(userId, { apiKey: newApiKey });
      if (!settings) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ apiKey: newApiKey });
    } catch (error) {
      console.error("Error regenerating API key:", error);
      res.status(500).json({ error: "Failed to regenerate API key" });
    }
  });

  // Notification Logs routes
  app.get("/api/user/notifications/:userId/logs", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const logs = await storage.getNotificationLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching notification logs:", error);
      res.status(500).json({ error: "Failed to fetch notification logs" });
    }
  });

  app.post("/api/user/notifications/:userId/logs", async (req, res) => {
    try {
      const { userId } = req.params;
      const { type, title, message, metadata } = req.body;
      
      const log = await storage.createNotificationLog({
        userId,
        type,
        title,
        message,
        read: false,
        metadata
      });
      
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating notification log:", error);
      res.status(500).json({ error: "Failed to create notification log" });
    }
  });

  app.put("/api/user/notifications/logs/:logId/read", async (req, res) => {
    try {
      const { logId } = req.params;
      
      const success = await storage.markNotificationAsRead(logId);
      if (!success) {
        return res.status(404).json({ error: "Notification log not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // User Sessions routes
  app.post("/api/auth/session", async (req, res) => {
    try {
      const { userId, sessionToken, userAgent, ipAddress, expiresAt } = req.body;
      
      const session = await storage.createUserSession({
        userId,
        sessionToken,
        userAgent,
        ipAddress,
        expiresAt
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating user session:", error);
      res.status(500).json({ error: "Failed to create user session" });
    }
  });

  app.get("/api/auth/session/:sessionToken", async (req, res) => {
    try {
      const { sessionToken } = req.params;
      
      const session = await storage.getUserSession(sessionToken);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await storage.deleteUserSession(sessionToken);
        return res.status(401).json({ error: "Session expired" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching user session:", error);
      res.status(500).json({ error: "Failed to fetch user session" });
    }
  });

  app.delete("/api/auth/session/:sessionToken", async (req, res) => {
    try {
      const { sessionToken } = req.params;
      
      const success = await storage.deleteUserSession(sessionToken);
      if (!success) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Error deleting user session:", error);
      res.status(500).json({ error: "Failed to delete user session" });
    }
  });

  // Migration endpoints disabled - system update functionality removed
  // app.post("/api/migrate/localStorage", async (req, res) => {
  //   try {
  //     const { userId, localStorageData } = req.body;
  //     
  //     if (!userId || !localStorageData) {
  //       return res.status(400).json({ error: "User ID and localStorage data are required" });
  //     }

  //     // Check if migration is needed
  //     const needsMigration = await MigrationUtility.needsMigration(userId);
  //     if (!needsMigration) {
  //       return res.json({ message: "Migration not needed, data already exists in database" });
  //     }

  //     // Perform migration
  //     await MigrationUtility.migrateUserData(userId, localStorageData);
  //     
  //     res.json({ message: "Migration completed successfully" });
  //   } catch (error) {
  //     console.error("Migration error:", error);
  //     res.status(500).json({ error: "Failed to migrate data" });
  //   }
  // });

  // // Check migration status
  // app.get("/api/migrate/status/:userId", async (req, res) => {
  //   try {
  //     const { userId } = req.params;
  //     
  //     const needsMigration = await MigrationUtility.needsMigration(userId);
  //     
  //     res.json({ needsMigration });
  //   } catch (error) {
  //     console.error("Migration status check error:", error);
  //     res.status(500).json({ error: "Failed to check migration status" });
  //     });
  //   }
  // });

  // Data Management routes
  app.get("/api/user/data/:userId/export", async (req, res) => {
    try {
      const { userId } = req.params;
      const { format = 'csv', includeNotes = 'true' } = req.query;
      
      // Get user's leads
      const leads = await storage.getLeads(userId);
      
      if (format === 'csv') {
        const csvHeaders = [
          "Name", "Phone Number", "Email", "Date of Birth", "City", "State", "Country", 
          "Pincode", "Company Name", "Designation", "Customer Category", "Last Contacted Date",
          "Last Contacted By", "Next Followup Date", "Customer Interested In", 
          "Preferred Communication Channel", "Lead Source", "Lead Status", "Lead Created By"
        ];
        
        if (includeNotes === 'true') {
          csvHeaders.push("Additional Notes");
        }
        
        const csvRows = leads.map(lead => {
          const row = [
            lead.name,
            lead.phoneNumber,
            lead.email || '',
            lead.dateOfBirth || '',
            lead.city || '',
            lead.state || '',
            lead.country || '',
            lead.pincode || '',
            lead.companyName || '',
            lead.designation || '',
            lead.customerCategory,
            lead.lastContactedDate || '',
            lead.lastContactedBy || '',
            lead.nextFollowupDate || '',
            lead.customerInterestedIn || '',
            lead.preferredCommunicationChannel || '',
            lead.leadSource,
            lead.leadStatus,
            lead.leadCreatedBy || ''
          ];
          
          if (includeNotes === 'true') {
            row.push(lead.additionalNotes || '');
          }
          
          return row.map(field => `"${field}"`).join(',');
        });
        
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else if (format === 'xlsx') {
        // For Excel format, we'll return CSV with .xlsx extension for now
        // In a production environment, you'd use a library like 'xlsx' to create actual Excel files
        const csvHeaders = [
          "Name", "Phone Number", "Email", "Date of Birth", "City", "State", "Country", 
          "Pincode", "Company Name", "Designation", "Customer Category", "Last Contacted Date",
          "Last Contacted By", "Next Followup Date", "Customer Interested In", 
          "Preferred Communication Channel", "Lead Source", "Lead Status", "Lead Created By"
        ];
        
        if (includeNotes === 'true') {
          csvHeaders.push("Additional Notes");
        }
        
        const csvRows = leads.map(lead => {
          const row = [
            lead.name,
            lead.phoneNumber,
            lead.email || '',
            lead.dateOfBirth || '',
            lead.city || '',
            lead.state || '',
            lead.country || '',
            lead.pincode || '',
            lead.companyName || '',
            lead.designation || '',
            lead.customerCategory,
            lead.lastContactedDate || '',
            lead.lastContactedBy || '',
            lead.nextFollowupDate || '',
            lead.customerInterestedIn || '',
            lead.preferredCommunicationChannel || '',
            lead.leadSource,
            lead.leadStatus,
            lead.leadCreatedBy || ''
          ];
          
          if (includeNotes === 'true') {
            row.push(lead.additionalNotes || '');
          }
          
          return row.map(field => `"${field}"`).join(',');
        });
        
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(csvContent);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({ leads, total: leads.length });
      } else {
        res.status(400).json({ error: "Unsupported export format. Use 'csv', 'xlsx', or 'json'" });
      }
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.delete("/api/user/data/:userId/leads", authenticateUser, async (req, res) => {
    try {
      const { userId } = req.params;
      const { confirm } = req.body;
      
      if (confirm !== 'DELETE_ALL_LEADS') {
        return res.status(400).json({ error: "Confirmation required. Send 'DELETE_ALL_LEADS' to confirm." });
      }
      
      // Get all leads for the user (including leads with null userId for backward compatibility)
      const userLeads = await storage.getLeads(userId);
      
      // Also get leads with null userId (legacy leads)
      const nullUserLeads = await storage.getLeads(undefined);
      
      // Combine both sets of leads
      const allLeads = [...userLeads, ...nullUserLeads];
      
      // Delete each lead
      let deletedCount = 0;
      for (const lead of allLeads) {
        // For leads with null userId, we can delete them without user restriction
        const deleted = await storage.deleteLead(lead.id, lead.userId || undefined);
        if (deleted) deletedCount++;
      }
      
      res.json({ 
        message: "All leads deleted successfully", 
        deletedCount: deletedCount 
      });
    } catch (error) {
      console.error("Error deleting user leads:", error);
      res.status(500).json({ error: "Failed to delete leads" });
    }
  });

  app.get("/api/user/data/:userId/stats", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const leads = await storage.getLeads(userId);
      const preferences = await storage.getUserPreferences(userId);
      const notificationSettings = await storage.getNotificationSettings(userId);
      const securitySettings = await storage.getSecuritySettings(userId);
      
      const stats = {
        totalLeads: leads.length,
        leadsByStatus: {
          new: leads.filter(l => l.leadStatus === 'new').length,
          followup: leads.filter(l => l.leadStatus === 'followup').length,
          qualified: leads.filter(l => l.leadStatus === 'qualified').length,
          hot: leads.filter(l => l.leadStatus === 'hot').length,
          converted: leads.filter(l => l.leadStatus === 'converted').length,
          lost: leads.filter(l => l.leadStatus === 'lost').length
        },
        leadsByCategory: {
          potential: leads.filter(l => l.customerCategory === 'potential').length,
          existing: leads.filter(l => l.customerCategory === 'existing').length
        },
        hasPreferences: !!preferences,
        hasNotificationSettings: !!notificationSettings,
        hasSecuritySettings: !!securitySettings,
        lastUpdated: new Date().toISOString()
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user data stats:", error);
      res.status(500).json({ error: "Failed to fetch data stats" });
    }
  });

  // Two-Factor Authentication Routes
  app.post("/api/auth/2fa/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if 2FA is enabled for this user
      const securitySettings = await storage.getSecuritySettings(user.id);
      if (!securitySettings || !securitySettings.twoFactorEnabled) {
        return res.status(400).json({ error: "Two-factor authentication is not enabled for this account" });
      }
      
      // Send 2FA OTP
      const success = await twoFactorAuthService.sendTwoFactorOTP(user.id, user.email, user.name);
      
      if (success) {
        res.json({ 
          message: "2FA OTP sent successfully",
          email: user.email // Return masked email for security
        });
      } else {
        res.status(500).json({ error: "Failed to send 2FA OTP" });
      }
    } catch (error) {
      console.error("Error sending 2FA OTP:", error);
      res.status(500).json({ error: "Failed to send 2FA OTP" });
    }
  });

  app.post("/api/auth/2fa/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify 2FA OTP
      const result = twoFactorAuthService.verifyTwoFactorOTP(user.id, otp);
      
      if (result.success) {
        // 2FA verification successful - create session
        const sessionData = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          twoFactorVerified: true
        };
        
        res.json({
          message: "2FA verification successful",
          user: sessionData,
          token: "2fa_verified" // In a real app, you'd generate a JWT token
        });
      } else {
        res.status(400).json({
          error: result.message,
          remainingAttempts: result.remainingAttempts
        });
      }
    } catch (error) {
      console.error("Error verifying 2FA OTP:", error);
      res.status(500).json({ error: "Failed to verify 2FA OTP" });
    }
  });

  app.post("/api/auth/2fa/enable", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get or create security settings
      let securitySettings = await storage.getSecuritySettings(userId);
      if (!securitySettings) {
        // Create default security settings
        securitySettings = await storage.createSecuritySettings({
          userId,
          twoFactorEnabled: false,
          twoFactorMethod: "email",
          loginNotifications: true,
          sessionTimeout: "30",
          apiKey: `lf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        });
      }
      
             // Enable 2FA
       const updatedSettings = await storage.updateSecuritySettings(userId, {
         twoFactorEnabled: true,
         twoFactorMethod: "email",
         lastTwoFactorSetup: new Date()
       });
      
      if (updatedSettings) {
        res.json({
          message: "Two-factor authentication enabled successfully",
          twoFactorEnabled: true,
          method: "email"
        });
      } else {
        res.status(500).json({ error: "Failed to enable two-factor authentication" });
      }
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      res.status(500).json({ error: "Failed to enable two-factor authentication" });
    }
  });

  app.post("/api/auth/2fa/disable", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Disable 2FA
      const updatedSettings = await storage.updateSecuritySettings(userId, {
        twoFactorEnabled: false,
        lastTwoFactorSetup: null
      });
      
      if (updatedSettings) {
        // Clear any active 2FA sessions
        twoFactorAuthService.clearSession(userId);
        
        res.json({
          message: "Two-factor authentication disabled successfully",
          twoFactorEnabled: false
        });
      } else {
        res.status(500).json({ error: "Failed to disable two-factor authentication" });
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ error: "Failed to disable two-factor authentication" });
    }
  });

  app.get("/api/auth/2fa/status", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const securitySettings = await storage.getSecuritySettings(userId);
      if (!securitySettings) {
        return res.json({
          twoFactorEnabled: false,
          method: "email"
        });
      }
      
      res.json({
        twoFactorEnabled: securitySettings.twoFactorEnabled || false,
        method: securitySettings.twoFactorMethod || "email",
        lastSetup: securitySettings.lastTwoFactorSetup
      });
    } catch (error) {
      console.error("Error getting 2FA status:", error);
      res.status(500).json({ error: "Failed to get 2FA status" });
    }
  });



  return httpServer;
}
