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
import Training from "@/pages/admin/training";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import SignIn from "@/pages/signin";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

// Versione semplificata che mostra solo la pagina di signin direttamente
function HomeRedirect() {
  // Invece di reindirizzare automaticamente, mostriamo direttamente il componente SignIn
  // ma wrappato nel nostro UI personalizzato
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        <SignIn />
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Component /> : null;
}

// Determina se siamo in un path admin
const isAdminPath = window.location.pathname.startsWith('/admin');

function App() {
  // Router per l'area admin
  if (isAdminPath) {
    return (
      <>
        <Switch>
          <Route path="/" component={AdminIndex} />
          <Route path="/login" component={AdminLogin} />
          <Route path="/dashboard">
            <ProtectedRoute component={AdminDashboard} />
          </Route>
          <Route path="/menu-items">
            <ProtectedRoute component={MenuItems} />
          </Route>
          <Route path="/orders">
            <ProtectedRoute component={Orders} />
          </Route>
          <Route path="/archive">
            <ProtectedRoute component={Archive} />
          </Route>
          <Route path="/kds">
            <ProtectedRoute component={KDS} />
          </Route>
          <Route path="/users">
            <ProtectedRoute component={Users} />
          </Route>
          <Route path="/database">
            <ProtectedRoute component={Database} />
          </Route>
          <Route path="/api-docs">
            <ProtectedRoute component={ApiDocs} />
          </Route>
          <Route path="/settings">
            <ProtectedRoute component={Settings} />
          </Route>
          <Route path="/pos-settings">
            <ProtectedRoute component={PosSettings} />
          </Route>
          <Route path="/training">
            <ProtectedRoute component={Training} />
          </Route>
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </>
    );
  }
  
  // Router per l'area clienti
  return (
    <>
      <Switch>
        <Route path="/signin" component={SignIn} />
        <Route path="/menu" component={Menu} />
        <Route path="/cart" component={Cart} />
        <Route path="/track" component={TrackOrder} />
        <Route path="/payment" component={Payment} />
        <Route path="/" component={HomeRedirect} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;