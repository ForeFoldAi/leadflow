import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse JSON response for user-friendly error messages
    try {
      const errorData = JSON.parse(text);
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      // If no error field but JSON, use the whole response as string
      throw new Error(JSON.stringify(errorData));
    } catch (parseError) {
      // If not JSON, use the raw text
      throw new Error(text);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get user from localStorage
  const userStr = localStorage.getItem("user");
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
  }

  // Build full URL using environment variable
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // Prepare headers
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add user information to headers
  if (user?.id) {
    headers["x-user-id"] = user.id;
  }
  if (user?.email) {
    headers["x-user-email"] = user.email;
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }

    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add user information to headers
    if (user?.id) {
      headers["x-user-id"] = user.id;
    }
    if (user?.email) {
      headers["x-user-email"] = user.email;
    }

    // Build full URL using environment variable
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
