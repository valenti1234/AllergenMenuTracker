import React from "react";
import { createRoot } from "react-dom/client";
import "@/lib/i18n";  // Import i18n configuration
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PhoneProvider } from "@/contexts/PhoneContext";
import { OrderStatusProvider } from "@/contexts/OrderStatusContext";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";

// Determina se siamo in un path admin
const isAdminPath = window.location.pathname.startsWith('/admin');

// Seleziona il percorso base corretto
const basePath = isAdminPath ? '/admin' : '';

// Wrapper condizionale per PhoneProvider
function ConditionalPhoneProvider({ children }: { children: React.ReactNode }) {
  if (isAdminPath) {
    // Nell'area admin, non usare PhoneProvider
    return <>{children}</>;
  } else {
    // Nell'area clienti, usa PhoneProvider
    return <PhoneProvider>{children}</PhoneProvider>;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <LanguageProvider>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Router base={basePath}>
                <ConditionalPhoneProvider>
                  <OrderStatusProvider>
                    <App />
                  </OrderStatusProvider>
                </ConditionalPhoneProvider>
              </Router>
            </TooltipProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
