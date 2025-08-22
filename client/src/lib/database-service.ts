import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// API request helper
const apiRequest = async (method: string, endpoint: string, data?: any) => {
  // Build full URL using environment variable
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const response = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response;
};

// Get current user from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "null" || userStr === "undefined") {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

// User Preferences
export const useUserPreferences = () => {
  const user = getCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ["userPreferences", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("GET", `/api/user/preferences/${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (preferences: any) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/user/preferences/${userId}`, preferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences", userId] });
    },
  });
};

// Notification Settings
export const useNotificationSettings = () => {
  const user = getCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ["notificationSettings", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("GET", `/api/user/notifications/${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (settings: any) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/user/notifications/${userId}`, settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationSettings", userId] });
    },
  });
};

// Security Settings
export const useSecuritySettings = () => {
  const user = getCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ["securitySettings", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("GET", `/api/user/security/${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });
};

export const useUpdateSecuritySettings = () => {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (settings: any) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/user/security/${userId}`, settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securitySettings", userId] });
    },
  });
};

export const useRegenerateApiKey = () => {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const userId = user?.id;

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/user/security/${userId}/regenerate-api-key`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securitySettings", userId] });
    },
  });
};

// Notification Logs
export const useNotificationLogs = (limit: number = 10) => {
  const user = getCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ["notificationLogs", userId, limit],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("GET", `/api/user/notifications/${userId}/logs?limit=${limit}`);
      return response.json();
    },
    enabled: !!userId,
  });
};

export const useCreateNotificationLog = () => {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (log: any) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/user/notifications/${userId}/logs`, log);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationLogs", userId] });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (logId: string) => {
      const response = await apiRequest("PUT", `/api/user/notifications/logs/${logId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationLogs", userId] });
    },
  });
};

// Migration
export const useCheckMigrationStatus = () => {
  const user = getCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ["migrationStatus", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("GET", `/api/migrate/status/${userId}`);
      return response.json();
    },
    enabled: !!userId,
    refetchInterval: false, // Don't auto-refetch
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

export const useMigrateLocalStorage = () => {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (localStorageData: any) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("POST", "/api/migrate/localStorage", {
        userId,
        localStorageData,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all user-related queries after migration
      queryClient.invalidateQueries({ queryKey: ["userPreferences", userId] });
      queryClient.invalidateQueries({ queryKey: ["notificationSettings", userId] });
      queryClient.invalidateQueries({ queryKey: ["securitySettings", userId] });
      queryClient.invalidateQueries({ queryKey: ["notificationLogs", userId] });
      queryClient.invalidateQueries({ queryKey: ["migrationStatus", userId] });
    },
  });
};

// Utility function to collect localStorage data for migration
export const collectLocalStorageData = () => {
  const data: any = {};
  
  try {
    // User preferences
    const preferenceSettings = localStorage.getItem("preferenceSettings");
    if (preferenceSettings) {
      data.preferenceSettings = JSON.parse(preferenceSettings);
    }

    // Notification settings
    const notificationSettings = localStorage.getItem("notificationSettings");
    if (notificationSettings) {
      data.notificationSettings = JSON.parse(notificationSettings);
    }

    // Security settings
    const securitySettings = localStorage.getItem("securitySettings");
    if (securitySettings) {
      data.securitySettings = JSON.parse(securitySettings);
    }

    // API key
    const userApiKey = localStorage.getItem("userApiKey");
    if (userApiKey) {
      data.userApiKey = userApiKey;
    }

    // Notification logs
    const notificationLogs = localStorage.getItem("notificationLogs");
    if (notificationLogs) {
      data.notificationLogs = JSON.parse(notificationLogs);
    }

    return data;
  } catch (error) {
    console.error("Error collecting localStorage data:", error);
    return {};
  }
};

// Utility function to clear localStorage after successful migration
export const clearLocalStorageData = () => {
  try {
    localStorage.removeItem("preferenceSettings");
    localStorage.removeItem("notificationSettings");
    localStorage.removeItem("securitySettings");
    localStorage.removeItem("userApiKey");
    localStorage.removeItem("notificationLogs");
    console.log("LocalStorage data cleared after successful migration");
  } catch (error) {
    console.error("Error clearing localStorage data:", error);
  }
};

// Utility function to check if localStorage has meaningful data
export const hasLocalStorageData = (localStorageData: any): boolean => {
  return Object.keys(localStorageData).some(key => 
    key !== 'userApiKey' && localStorageData[key] && 
    (Array.isArray(localStorageData[key]) ? localStorageData[key].length > 0 : true)
  );
}; 