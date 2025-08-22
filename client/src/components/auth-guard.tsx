import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader } from "@/components/ui/loader";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr || userStr === "null" || userStr === "undefined") {
          setIsAuthenticated(false);
          setLocation("/login");
          return;
        }
        const user = JSON.parse(userStr);
        if (user && user.id) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setLocation("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        setLocation("/login");
      }
    };

    checkAuth();
  }, [setLocation]);

  if (isAuthenticated === null) {
    return <Loader text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}