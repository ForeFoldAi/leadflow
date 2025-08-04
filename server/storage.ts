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
