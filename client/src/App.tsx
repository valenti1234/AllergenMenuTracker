import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Menu from "@/pages/menu";
import Cart from "@/pages/cart";
import TrackOrder from "@/pages/track";
import Payment from "@/pages/payment";
import AdminIndex from "@/pages/admin";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import MenuItems from "@/pages/admin/menu-items";
import Orders from "@/pages/admin/orders";
import Archive from "@/pages/admin/archive";
import KDS from "@/pages/admin/kds";
import Users from "@/pages/admin/users";
import Database from "@/pages/admin/database";
import ApiDocs from "@/pages/admin/api-docs";
import Settings from "@/pages/admin/settings";
import PosSettings from "@/pages/admin/pos-settings";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { PhoneProvider } from "./contexts/PhoneContext";
import SignIn from "@/pages/signin";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/menu" component={Menu} />
      <Route path="/cart" component={Cart} />
      <Route path="/track" component={TrackOrder} />
      <Route path="/payment" component={Payment} />
      <Route path="/" component={SignIn} />
      <Route path="/admin" component={AdminIndex} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/menu-items">
        <ProtectedRoute component={MenuItems} />
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute component={Orders} />
      </Route>
      <Route path="/admin/archive">
        <ProtectedRoute component={Archive} />
      </Route>
      <Route path="/admin/kds">
        <ProtectedRoute component={KDS} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute component={Users} />
      </Route>
      <Route path="/admin/database">
        <ProtectedRoute component={Database} />
      </Route>
      <Route path="/admin/api-docs">
        <ProtectedRoute component={ApiDocs} />
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/admin/pos-settings">
        <ProtectedRoute component={PosSettings} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <LanguageProvider>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <PhoneProvider>
                <Router />
                <Toaster />
              </PhoneProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;