import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export default function AdminIndex() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAdminAuth();

  useEffect(() => {
    // Se l'autenticazione è ancora in caricamento, aspetta
    if (isLoading) return;
    
    // Usa setLocation per reindirizzare con percorsi relativi al base path
    if (isAuthenticated && user) {
      console.log("User authenticated as:", user.role);
      if (user.role === "kitchen") {
        setLocation("/kds");
      } else {
        setLocation("/dashboard");
      }
    } else {
      console.log("User not authenticated, redirecting to login");
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  // UI migliorata per l'attesa
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Admin Area</h2>
        <p className="text-muted-foreground mb-4">Checking authentication status...</p>
        <div className="animate-spin w-8 h-8 border-t-2 border-primary rounded-full mx-auto"></div>
      </div>
    </div>
  );
}