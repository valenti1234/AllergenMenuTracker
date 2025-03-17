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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <LanguageProvider>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <PhoneProvider>
                <OrderStatusProvider>
                  <App />
                </OrderStatusProvider>
              </PhoneProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
