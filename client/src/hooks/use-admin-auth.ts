import { useQuery } from "@tanstack/react-query";
import type { UserRole } from "@shared/schema";

interface AdminSessionResponse {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
}

export function useAdminAuth() {
  const { data, isLoading, error, refetch } = useQuery<AdminSessionResponse>({
    queryKey: ["/api/admin/session"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Aggiungi un po' di logging per il debug
  if (error) {
    console.error("Authentication error:", error);
  }

  return {
    isAuthenticated: data?.authenticated ?? false,
    user: data?.user,
    isLoading,
    error,
    refetch
  };
}