import { config } from "dotenv";
import { 
  type Lead, 
  type InsertLead, 
  type User, 
  type InsertUser,
  type UserPreferences,
  type InsertUserPreferences,
  type NotificationSettings,
  type InsertNotificationSettings,
  type SecuritySettings,
  type InsertSecuritySettings,
  type NotificationLog,
  type InsertNotificationLog,
  type UserSession,
  type InsertUserSession,
  type PasswordReset,
  type InsertPasswordReset,
  leads, 
  users,
  userPreferences,
  notificationSettings,
  securitySettings,
  notificationLogs,
  userSessions,
  passwordResets
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, or, like, desc, asc, ilike, sql, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Load environment variables
config();

export interface IStorage {
  // Lead operations
  getLeads(userId?: string): Promise<Lead[]>;
  getLead(id: string, userId?: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead, userId?: string): Promise<Lead>;
  batchCreateLeads(leads: InsertLead[], userId?: string): Promise<Lead[]>;
  updateLead(id: string, lead: Partial<InsertLead>, userId?: string): Promise<Lead | undefined>;
  deleteLead(id: string, userId?: string): Promise<boolean>;
  searchLeads(query: string, userId?: string): Promise<Lead[]>;
  filterLeads(filters: {
    status?: string | string[];
    category?: string;
    city?: string;
  }, userId?: string): Promise<Lead[]>;
  
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // User Preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Notification Settings operations
  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  
  // Security Settings operations
  getSecuritySettings(userId: string): Promise<SecuritySettings | undefined>;
  createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings>;
  updateSecuritySettings(userId: string, settings: Partial<InsertSecuritySettings>): Promise<SecuritySettings | undefined>;
  generateApiKey(): string;
  
  // Notification Logs operations
  getNotificationLogs(userId: string, limit?: number): Promise<NotificationLog[]>;
  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  markNotificationAsRead(logId: string): Promise<boolean>;
  deleteOldNotificationLogs(userId: string, daysOld: number): Promise<number>;
  
  // User Sessions operations
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteUserSession(sessionToken: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<number>;
  
  // Password Reset operations
  createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset>;
  getPasswordResetByEmail(email: string): Promise<PasswordReset | undefined>;
  getPasswordResetByOtp(email: string, otp: string): Promise<PasswordReset | undefined>;
  markPasswordResetAsUsed(id: string): Promise<boolean>;
  deleteExpiredPasswordResets(): Promise<number>;
  
  // Authentication helpers
  validateUserPassword(email: string, password: string): Promise<User | null>;
  hashPassword(password: string): Promise<string>;
}

export class SqlStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: any;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for AWS RDS
      },
      // Additional connection options for better reliability
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
      query_timeout: 30000, // Query timeout of 30 seconds
      statement_timeout: 30000, // Statement timeout of 30 seconds
    });
    
    // Handle pool errors
    this.pool.on('error', (err: any) => {
      console.error('Unexpected error on idle client', err);
    });
    
    this.db = drizzle(this.pool);
  }

  // Lead operations
  async getLeads(userId?: string): Promise<Lead[]> {
    try {
      if (userId) {
        return await this.db
          .select()
          .from(leads)
          .where(eq(leads.userId, userId))
          .orderBy(desc(leads.createdAt));
      } else {
        return await this.db
          .select()
          .from(leads)
          .orderBy(desc(leads.createdAt));
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      throw new Error("Failed to fetch leads from database");
    }
  }

  async getLead(id: string, userId?: string): Promise<Lead | undefined> {
    try {
      if (userId) {
        const result = await this.db
          .select()
          .from(leads)
          .where(and(eq(leads.id, id), eq(leads.userId, userId)))
          .limit(1);
        return result[0];
      } else {
        const result = await this.db
          .select()
          .from(leads)
          .where(eq(leads.id, id))
          .limit(1);
        return result[0];
      }
    } catch (error) {
      console.error("Error fetching lead:", error);
      throw new Error("Failed to fetch lead from database");
    }
  }

  async createLead(insertLead: InsertLead, userId?: string): Promise<Lead> {
    try {
      const result = await this.db
        .insert(leads)
        .values({
          ...insertLead,
          userId: userId || insertLead.userId,
          email: insertLead.email || null,
          dateOfBirth: insertLead.dateOfBirth || null,
          city: insertLead.city || null,
          state: insertLead.state || null,
          country: insertLead.country || null,
          pincode: insertLead.pincode || null,
          companyName: insertLead.companyName || null,
          designation: insertLead.designation || null,
          lastContactedDate: insertLead.lastContactedDate || null,
          lastContactedBy: insertLead.lastContactedBy || null,
          nextFollowupDate: insertLead.nextFollowupDate || null,
          customerInterestedIn: insertLead.customerInterestedIn || null,
          preferredCommunicationChannel: insertLead.preferredCommunicationChannel || null,
          customCommunicationChannel: insertLead.customCommunicationChannel || null,
          customLeadSource: insertLead.customLeadSource || null,
          customReferralSource: insertLead.customReferralSource || null,
          customGeneratedBy: insertLead.customGeneratedBy || null,
          leadCreatedBy: insertLead.leadCreatedBy || null,
          additionalNotes: insertLead.additionalNotes || null,
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating lead:", error);
      throw new Error("Failed to create lead in database");
    }
  }

  async batchCreateLeads(insertLeads: InsertLead[], userId?: string): Promise<Lead[]> {
    try {
      if (insertLeads.length === 0) {
        return [];
      }

      const values = insertLeads.map(lead => ({
        ...lead,
        userId: userId || lead.userId,
        email: lead.email || null,
        dateOfBirth: lead.dateOfBirth || null,
        city: lead.city || null,
        state: lead.state || null,
        country: lead.country || null,
        pincode: lead.pincode || null,
        companyName: lead.companyName || null,
        designation: lead.designation || null,
        lastContactedDate: lead.lastContactedDate || null,
        lastContactedBy: lead.lastContactedBy || null,
        nextFollowupDate: lead.nextFollowupDate || null,
        customerInterestedIn: lead.customerInterestedIn || null,
        preferredCommunicationChannel: lead.preferredCommunicationChannel || null,
        customCommunicationChannel: lead.customCommunicationChannel || null,
        customLeadSource: lead.customLeadSource || null,
        customReferralSource: lead.customReferralSource || null,
        customGeneratedBy: lead.customGeneratedBy || null,
        leadCreatedBy: lead.leadCreatedBy || null,
        additionalNotes: lead.additionalNotes || null,
      }));

      const result = await this.db
        .insert(leads)
        .values(values)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error batch creating leads:", error);
      throw new Error("Failed to batch create leads in database");
    }
  }

  async updateLead(id: string, updateData: Partial<InsertLead>, userId?: string): Promise<Lead | undefined> {
    try {
      if (userId) {
        const result = await this.db
          .update(leads)
          .set(updateData)
          .where(and(eq(leads.id, id), eq(leads.userId, userId)))
          .returning();
        
        return result[0];
      } else {
        const result = await this.db
          .update(leads)
          .set(updateData)
          .where(eq(leads.id, id))
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      throw new Error("Failed to update lead in database");
    }
  }

  async deleteLead(id: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        const result = await this.db
          .delete(leads)
          .where(and(eq(leads.id, id), eq(leads.userId, userId)))
          .returning();
        
        return result.length > 0;
      } else {
        const result = await this.db
          .delete(leads)
          .where(eq(leads.id, id))
          .returning();
        
        return result.length > 0;
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      throw new Error("Failed to delete lead from database");
    }
  }

  async searchLeads(query: string, userId?: string): Promise<Lead[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      if (userId) {
        return await this.db
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.userId, userId),
              or(
                ilike(leads.name, searchTerm),
                ilike(leads.email, searchTerm),
                ilike(leads.phoneNumber, searchTerm),
                ilike(leads.city, searchTerm),
                ilike(leads.state, searchTerm),
                ilike(leads.country, searchTerm),
                ilike(leads.pincode, searchTerm),
                ilike(leads.companyName, searchTerm),
                ilike(leads.designation, searchTerm),
                ilike(leads.lastContactedBy, searchTerm),
                ilike(leads.customerInterestedIn, searchTerm),
                ilike(leads.additionalNotes, searchTerm),
                ilike(leads.leadStatus, searchTerm),
                ilike(leads.customerCategory, searchTerm),
                ilike(leads.preferredCommunicationChannel, searchTerm),
                ilike(leads.leadSource, searchTerm)
              )
            )
          )
          .orderBy(desc(leads.createdAt));
      } else {
        return await this.db
          .select()
          .from(leads)
          .where(
            or(
              ilike(leads.name, searchTerm),
              ilike(leads.email, searchTerm),
              ilike(leads.phoneNumber, searchTerm),
              ilike(leads.city, searchTerm),
              ilike(leads.state, searchTerm),
              ilike(leads.country, searchTerm),
              ilike(leads.pincode, searchTerm),
              ilike(leads.companyName, searchTerm),
              ilike(leads.designation, searchTerm),
              ilike(leads.lastContactedBy, searchTerm),
              ilike(leads.customerInterestedIn, searchTerm),
              ilike(leads.additionalNotes, searchTerm),
              ilike(leads.leadStatus, searchTerm),
              ilike(leads.customerCategory, searchTerm),
              ilike(leads.preferredCommunicationChannel, searchTerm),
              ilike(leads.leadSource, searchTerm)
            )
          )
          .orderBy(desc(leads.createdAt));
      }
    } catch (error) {
      console.error("Error searching leads:", error);
      throw new Error("Failed to search leads in database");
    }
  }

  async filterLeads(filters: {
    status?: string | string[];
    category?: string;
    city?: string;
  }, userId?: string): Promise<Lead[]> {
    try {
      const conditions = [];
      
      // Add user filter if userId is provided
      if (userId) {
        conditions.push(eq(leads.userId, userId));
      }
      
      if (filters.status) {
        if (Array.isArray(filters.status) && filters.status.length > 0) {
          const statusConditions = filters.status.map(status => eq(leads.leadStatus, status));
          conditions.push(or(...statusConditions));
        } else if (typeof filters.status === 'string') {
          conditions.push(eq(leads.leadStatus, filters.status));
        }
      }
      
      if (filters.category) {
        conditions.push(eq(leads.customerCategory, filters.category));
      }
      
      if (filters.city) {
        conditions.push(ilike(leads.city, filters.city));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      return await this.db
        .select()
        .from(leads)
        .where(whereClause)
        .orderBy(desc(leads.createdAt));
    } catch (error) {
      console.error("Error filtering leads:", error);
      throw new Error("Failed to filter leads in database");
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    try {
      return await this.db
        .select()
        .from(users)
        .orderBy(asc(users.createdAt));
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users from database");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user from database");
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw new Error("Failed to fetch user by email from database");
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Hash password before storing
      const hashedPassword = await this.hashPassword(user.password);
      
      const result = await this.db
        .insert(users)
        .values({
          ...user,
          email: user.email.toLowerCase(),
          password: hashedPassword,
          customRole: user.customRole || null,
          website: user.website || null,
          phoneNumber: user.phoneNumber || null,
          subscriptionStatus: user.subscriptionStatus || "trial",
          subscriptionPlan: user.subscriptionPlan || "basic",
        })
        .returning();
      
      return result[0];
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes("duplicate key") || error.code === '23505') {
        throw new Error("A user with this email already exists");
      }
      throw new Error("Failed to create user in database");
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const updateData: any = { ...updates };
      
      // Hash password if it's being updated
      if (updates.password) {
        updateData.password = await this.hashPassword(updates.password);
      }
      
      // Ensure email is lowercase
      if (updates.email) {
        updateData.email = updates.email.toLowerCase();
      }
      
      // Update timestamp
      updateData.updatedAt = new Date();
      
      const result = await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      
      return result[0];
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.message?.includes("duplicate key") || error.code === '23505') {
        throw new Error("A user with this email already exists");
      }
      throw new Error("Failed to update user in database");
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user from database");
    }
  }

  // User Preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const result = await this.db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      throw new Error("Failed to fetch user preferences from database");
    }
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    try {
      const result = await this.db
        .insert(userPreferences)
        .values(preferences)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user preferences:", error);
      throw new Error("Failed to create user preferences in database");
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    try {
      const result = await this.db
        .update(userPreferences)
        .set(preferences)
        .where(eq(userPreferences.userId, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw new Error("Failed to update user preferences in database");
    }
  }

  // Notification Settings operations
  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    try {
      const result = await this.db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      
      // If the table structure is missing columns, return undefined to trigger default creation
      if (error instanceof Error && (
        error.message.includes("column") && error.message.includes("does not exist") ||
        error.message.includes("push_subscription") ||
        error.message.includes("42703")
      )) {
        console.log("Notification settings table missing columns, returning undefined to trigger defaults");
        return undefined;
      }
      
      throw new Error("Failed to fetch notification settings from database");
    }
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    try {
      const result = await this.db
        .insert(notificationSettings)
        .values(settings)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating notification settings:", error);
      
      // If the table structure is missing columns, return a mock object
      if (error instanceof Error && (
        error.message.includes("column") && error.message.includes("does not exist") ||
        error.message.includes("push_subscription") ||
        error.message.includes("42703")
      )) {
        console.log("Notification settings table missing columns, returning mock object");
        return {
          id: "mock",
          userId: settings.userId,
          newLeads: settings.newLeads,
          followUps: settings.followUps,
          hotLeads: settings.hotLeads,
          conversions: settings.conversions,
          browserPush: settings.browserPush,
          dailySummary: settings.dailySummary,
          emailNotifications: settings.emailNotifications,
          pushSubscription: null,
          createdAt: new Date(),
          updatedAt: new Date()
        } as NotificationSettings;
      }
      
      throw new Error("Failed to create notification settings in database");
    }
  }

  async updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    try {
      const result = await this.db
        .update(notificationSettings)
        .set(settings)
        .where(eq(notificationSettings.userId, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating notification settings:", error);
      
      // If the table structure is missing columns, return a mock object
      if (error instanceof Error && (
        error.message.includes("column") && error.message.includes("does not exist") ||
        error.message.includes("push_subscription") ||
        error.message.includes("42703")
      )) {
        console.log("Notification settings table missing columns, returning mock object");
        return {
          id: "mock",
          userId: userId,
          newLeads: settings.newLeads ?? true,
          followUps: settings.followUps ?? true,
          hotLeads: settings.hotLeads ?? true,
          conversions: settings.conversions ?? true,
          browserPush: settings.browserPush ?? false,
          dailySummary: settings.dailySummary ?? false,
          emailNotifications: settings.emailNotifications ?? true,
          pushSubscription: null,
          createdAt: new Date(),
          updatedAt: new Date()
        } as NotificationSettings;
      }
      
      throw new Error("Failed to update notification settings in database");
    }
  }

  // Security Settings operations
  async getSecuritySettings(userId: string): Promise<SecuritySettings | undefined> {
    try {
      const result = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.userId, userId))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching security settings:", error);
      
      // If the error is due to missing columns, return a default object
      if (error instanceof Error && error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log("Security settings table missing 2FA columns, returning default object");
        return {
          id: 'default',
          userId: userId,
          twoFactorEnabled: false,
          twoFactorMethod: 'email',
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          loginNotifications: true,
          sessionTimeout: '30',
          apiKey: 'default',
          lastPasswordChange: null,
          lastTwoFactorSetup: null,
          createdAt: new Date(),
          updatedAt: new Date()
        } as SecuritySettings;
      }
      
      throw new Error("Failed to fetch security settings from database");
    }
  }

  async createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    try {
      const result = await this.db
        .insert(securitySettings)
        .values({
          ...settings,
          lastPasswordChange: settings.lastPasswordChange ? new Date(settings.lastPasswordChange) : null
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating security settings:", error);
      
      // If the error is due to missing columns, return a mock created object
      if (error instanceof Error && error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log("Security settings table missing 2FA columns, returning mock created object");
        return {
          id: 'mock',
          userId: settings.userId,
          twoFactorEnabled: settings.twoFactorEnabled ?? false,
          twoFactorMethod: settings.twoFactorMethod ?? 'email',
          twoFactorSecret: settings.twoFactorSecret ?? null,
          twoFactorBackupCodes: settings.twoFactorBackupCodes ?? null,
          loginNotifications: settings.loginNotifications ?? true,
          sessionTimeout: settings.sessionTimeout ?? '30',
          apiKey: settings.apiKey ?? 'mock',
          lastPasswordChange: settings.lastPasswordChange ? new Date(settings.lastPasswordChange) : null,
          lastTwoFactorSetup: settings.lastTwoFactorSetup ? new Date(settings.lastTwoFactorSetup) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        } as SecuritySettings;
      }
      
      throw new Error("Failed to create security settings in database");
    }
  }

  async updateSecuritySettings(userId: string, settings: Partial<InsertSecuritySettings>): Promise<SecuritySettings | undefined> {
    try {
      const updateData: any = { ...settings };
      if (settings.lastPasswordChange) {
        updateData.lastPasswordChange = new Date(settings.lastPasswordChange);
      }
      
      const result = await this.db
        .update(securitySettings)
        .set(updateData)
        .where(eq(securitySettings.userId, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating security settings:", error);
      
      // If the error is due to missing columns, return a mock updated object
      if (error instanceof Error && error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log("Security settings table missing 2FA columns, returning mock updated object");
        return {
          id: 'mock',
          userId: userId,
          twoFactorEnabled: settings.twoFactorEnabled ?? false,
          twoFactorMethod: settings.twoFactorMethod ?? 'email',
          twoFactorSecret: settings.twoFactorSecret ?? null,
          twoFactorBackupCodes: settings.twoFactorBackupCodes ?? null,
          loginNotifications: settings.loginNotifications ?? true,
          sessionTimeout: settings.sessionTimeout ?? '30',
          apiKey: settings.apiKey ?? 'mock',
          lastPasswordChange: settings.lastPasswordChange ? new Date(settings.lastPasswordChange) : null,
          lastTwoFactorSetup: settings.lastTwoFactorSetup ? new Date(settings.lastTwoFactorSetup) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        } as SecuritySettings;
      }
      
      throw new Error("Failed to update security settings in database");
    }
  }

  generateApiKey(): string {
    const apiKey = crypto.randomBytes(32).toString('hex');
    return apiKey;
  }

  // Notification Logs operations
  async getNotificationLogs(userId: string, limit?: number): Promise<NotificationLog[]> {
    try {
      const query = this.db
        .select()
        .from(notificationLogs)
        .where(eq(notificationLogs.userId, userId));
      
      if (limit) {
        query.limit(limit);
      }

      return await query.orderBy(desc(notificationLogs.createdAt));
    } catch (error) {
      console.error("Error fetching notification logs:", error);
      throw new Error("Failed to fetch notification logs from database");
    }
  }

  async createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog> {
    try {
      const result = await this.db
        .insert(notificationLogs)
        .values(log)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating notification log:", error);
      throw new Error("Failed to create notification log in database");
    }
  }

  async markNotificationAsRead(logId: string): Promise<boolean> {
    try {
      const result = await this.db
        .update(notificationLogs)
        .set({ read: true })
        .where(eq(notificationLogs.id, logId))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read in database");
    }
  }

  async deleteOldNotificationLogs(userId: string, daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const result = await this.db
        .delete(notificationLogs)
        .where(and(eq(notificationLogs.userId, userId), lt(notificationLogs.createdAt, cutoffDate)))
        .returning();
      return result.length;
    } catch (error) {
      console.error("Error deleting old notification logs:", error);
      throw new Error("Failed to delete old notification logs from database");
    }
  }

  // User Sessions operations
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    try {
      const result = await this.db
        .insert(userSessions)
        .values({
          ...session,
          expiresAt: new Date(session.expiresAt)
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user session:", error);
      throw new Error("Failed to create user session in database");
    }
  }

  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    try {
      const result = await this.db
        .select()
        .from(userSessions)
        .where(eq(userSessions.sessionToken, sessionToken))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user session:", error);
      throw new Error("Failed to fetch user session from database");
    }
  }

  async deleteUserSession(sessionToken: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(userSessions)
        .where(eq(userSessions.sessionToken, sessionToken))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user session:", error);
      throw new Error("Failed to delete user session from database");
    }
  }

  async deleteExpiredSessions(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const result = await this.db
        .delete(userSessions)
        .where(lt(userSessions.createdAt, cutoffDate))
        .returning();
      return result.length;
    } catch (error) {
      console.error("Error deleting expired sessions:", error);
      throw new Error("Failed to delete expired sessions from database");
    }
  }

  // Password Reset operations
  async createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset> {
    try {
      const result = await this.db
        .insert(passwordResets)
        .values({
          ...reset,
          expiresAt: new Date(reset.expiresAt)
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating password reset:", error);
      throw new Error("Failed to create password reset in database");
    }
  }

  async getPasswordResetByEmail(email: string): Promise<PasswordReset | undefined> {
    try {
      const result = await this.db
        .select()
        .from(passwordResets)
        .where(eq(passwordResets.email, email.toLowerCase()))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching password reset by email:", error);
      throw new Error("Failed to fetch password reset by email from database");
    }
  }

  async getPasswordResetByOtp(email: string, otp: string): Promise<PasswordReset | undefined> {
    try {
      const result = await this.db
        .select()
        .from(passwordResets)
        .where(and(eq(passwordResets.email, email.toLowerCase()), eq(passwordResets.otp, otp)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching password reset by OTP:", error);
      throw new Error("Failed to fetch password reset by OTP from database");
    }
  }

  async markPasswordResetAsUsed(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .update(passwordResets)
        .set({ used: true })
        .where(eq(passwordResets.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error marking password reset as used:", error);
      throw new Error("Failed to mark password reset as used in database");
    }
  }

  async deleteExpiredPasswordResets(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const result = await this.db
        .delete(passwordResets)
        .where(lt(passwordResets.createdAt, cutoffDate))
        .returning();
      return result.length;
    } catch (error) {
      console.error("Error deleting expired password resets:", error);
      throw new Error("Failed to delete expired password resets from database");
    }
  }

  // Authentication helpers
  async validateUserPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.isActive) {
        return null;
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      return isValidPassword ? user : null;
    } catch (error) {
      console.error("Error validating user password:", error);
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error("Error hashing password:", error);
      throw new Error("Failed to hash password");
    }
  }
}

export const storage = new SqlStorage();
