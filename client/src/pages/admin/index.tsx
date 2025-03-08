import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export default function AdminIndex() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAdminAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If user is kitchen staff, redirect directly to KDS
        if (user?.role === "kitchen") {
          setLocation("/admin/kds");
        } else {
          setLocation("/admin/dashboard");
        }
      } else {
        setLocation("/admin/login");
      }
    }
  }, [isLoading, isAuthenticated, user?.role, setLocation]);

  // Show loading state while checking authentication
  return <div>Loading...</div>;
}