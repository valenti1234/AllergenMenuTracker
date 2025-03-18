import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  useEffect(() => {
    // Se già autenticato, reindirizza alla dashboard usando percorsi relativi
    if (!authLoading && isAuthenticated) {
      console.log("User is authenticated, redirecting to dashboard");
      setLocation("/dashboard");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      console.log("Attempting login with:", data.username);
      const response = await apiRequest("POST", "/api/admin/login", data);
      console.log("Login response:", response);
      
      // Invalidate the auth query to force a refresh of the authentication state
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
      
      // Controlla subito lo stato di autenticazione
      const sessionResponse = await apiRequest("GET", "/api/admin/session", undefined);
      console.log("Session response after login:", sessionResponse);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      // Reindirizza manualmente dopo un login riuscito
      if (sessionResponse.authenticated) {
        // Usa percorsi relativi per il reindirizzamento
        setLocation("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Authentication</h2>
          <p className="text-muted-foreground mb-4">Checking authentication status...</p>
          <div className="animate-spin w-8 h-8 border-t-2 border-primary rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Already Authenticated</h2>
          <p className="text-muted-foreground mb-4">Redirecting to dashboard...</p>
          <div className="animate-spin w-8 h-8 border-t-2 border-primary rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Per accedere, usa username: valenti1234 e password: Itnelav3465#
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}