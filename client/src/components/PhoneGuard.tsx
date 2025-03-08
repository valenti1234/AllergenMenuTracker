import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePhone } from '@/contexts/PhoneContext';

export function PhoneGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePhone();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // List of routes that require phone number
    const protectedRoutes = ['/menu', '/track'];
    const isProtectedRoute = protectedRoutes.some(route => location.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
      // Store the attempted URL to redirect back after phone number is entered
      localStorage.setItem('redirectAfterPhone', location);
      setLocation('/signin');
    }
  }, [location, isAuthenticated, setLocation]);

  return <>{children}</>;
} 