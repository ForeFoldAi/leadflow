import { type Lead, type InsertLead } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Lead operations
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  searchLeads(query: string): Promise<Lead[]>;
  filterLeads(filters: {
    status?: string;
    category?: string;
    city?: string;
  }): Promise<Lead[]>;
}

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;

  constructor() {
    this.leads = new Map();
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleLeads = [
      {
        id: "1",
        name: "John Smith",
        phoneNumber: "+1 (555) 123-4567",
        email: "john.smith@techcorp.com",
        dateOfBirth: "1985-03-15",
        city: "New York",
        state: "New York",
        country: "United States",
        pincode: "10001",
        companyName: "TechCorp Solutions",
        designation: "CTO",
        customerCategory: "potential" as const,
        lastContactedDate: "2024-01-15",
        lastContactedBy: "Sarah Johnson",
        nextFollowupDate: "2024-02-01",
        customerInterestedIn: "Enterprise software solutions for scalability",
        preferredCommunicationChannel: "email" as const,
        leadStatus: "hot" as const,
        additionalNotes: "Very interested in our enterprise package, budget approved"
      },
      {
        id: "2", 
        name: "Emily Chen",
        phoneNumber: "+1 (555) 987-6543",
        email: "emily.chen@startup.io",
        dateOfBirth: null,
        city: "San Francisco",
        state: "California", 
        country: "United States",
        pincode: "94102",
        companyName: "InnovateStartup",
        designation: "Founder",
        customerCategory: "potential" as const,
        lastContactedDate: "2024-01-10",
        lastContactedBy: "Mike Wilson",
        nextFollowupDate: "2024-01-25",
        customerInterestedIn: "Cloud infrastructure and deployment tools",
        preferredCommunicationChannel: "phone" as const,
        leadStatus: "qualified" as const,
        additionalNotes: "Needs solution for 50+ developers, considering competitors"
      },
      {
        id: "3",
        name: "Robert Davis",
        phoneNumber: "+1 (555) 456-7890", 
        email: "robert.davis@manufacturing.com",
        dateOfBirth: "1978-08-22",
        city: "Chicago",
        state: "Illinois",
        country: "United States", 
        pincode: "60601",
        companyName: "Davis Manufacturing",
        designation: "Operations Manager",
        customerCategory: "existing" as const,
        lastContactedDate: "2024-01-20",
        lastContactedBy: "Lisa Anderson",
        nextFollowupDate: "2024-02-05",
        customerInterestedIn: "Inventory management and tracking systems",
        preferredCommunicationChannel: "whatsapp" as const,
        leadStatus: "converted" as const,
        additionalNotes: "Converted to premium plan, very satisfied with service"
      },
      {
        id: "4",
        name: "Maria Rodriguez",
        phoneNumber: "+1 (555) 321-0987",
        email: "maria.rodriguez@consulting.biz",
        dateOfBirth: null,
        city: "Miami",
        state: "Florida",
        country: "United States",
        pincode: "33101", 
        companyName: "Rodriguez Consulting",
        designation: "Senior Consultant",
        customerCategory: "potential" as const,
        lastContactedDate: "2024-01-08",
        lastContactedBy: "Tom Brown",
        nextFollowupDate: "2024-01-30",
        customerInterestedIn: "Business process automation and workflow tools",
        preferredCommunicationChannel: "email" as const,
        leadStatus: "followup" as const,
        additionalNotes: "Interested but needs approval from partners"
      },
      {
        id: "5",
        name: "David Kim", 
        phoneNumber: "+1 (555) 654-3210",
        email: "david.kim@retailchain.com",
        dateOfBirth: "1992-11-05",
        city: "Los Angeles",
        state: "California",
        country: "United States",
        pincode: "90210",
        companyName: "RetailChain Plus",
        designation: "IT Director", 
        customerCategory: "potential" as const,
        lastContactedDate: "2024-01-05",
        lastContactedBy: "Amy White",
        nextFollowupDate: "2024-01-28",
        customerInterestedIn: "Point of sale systems and customer analytics",
        preferredCommunicationChannel: "phone" as const,
        leadStatus: "new" as const,
        additionalNotes: "Initial contact made, needs detailed proposal"
      }
    ];

    sampleLeads.forEach(lead => {
      this.leads.set(lead.id, lead);
    });
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      new Date(b.lastContactedDate || '1970-01-01').getTime() - 
      new Date(a.lastContactedDate || '1970-01-01').getTime()
    );
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = { 
      ...insertLead, 
      id,
      dateOfBirth: insertLead.dateOfBirth || null,
      companyName: insertLead.companyName || null,
      designation: insertLead.designation || null,
      lastContactedDate: insertLead.lastContactedDate || null,
      lastContactedBy: insertLead.lastContactedBy || null,
      nextFollowupDate: insertLead.nextFollowupDate || null,
      customerInterestedIn: insertLead.customerInterestedIn || null,
      preferredCommunicationChannel: insertLead.preferredCommunicationChannel || null,
      additionalNotes: insertLead.additionalNotes || null
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const existingLead = this.leads.get(id);
    if (!existingLead) return undefined;
    
    const updatedLead: Lead = { ...existingLead, ...updateData };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  async searchLeads(query: string): Promise<Lead[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.leads.values()).filter(lead =>
      lead.name.toLowerCase().includes(lowerQuery) ||
      lead.email.toLowerCase().includes(lowerQuery) ||
      lead.phoneNumber.toLowerCase().includes(lowerQuery) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(lowerQuery))
    );
  }

  async filterLeads(filters: {
    status?: string;
    category?: string;
    city?: string;
  }): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => {
      if (filters.status && lead.leadStatus !== filters.status) return false;
      if (filters.category && lead.customerCategory !== filters.category) return false;
      if (filters.city && lead.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      return true;
    });
  }
}

export const storage = new MemStorage();
