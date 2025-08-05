import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema } from "@shared/schema";
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
  return httpServer;
}
