import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Menu as MenuIcon,
  Users,
  LogOut,
  ClipboardList,
  Utensils,
  Archive as ArchiveIcon,
  Database,
  Globe,
  FileText,
  Settings as SettingsIcon,
  CreditCard,
  UtensilsCrossed,
  ChefHat,
  GraduationCap,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useTranslation } from "react-i18next";
import { languages } from "@shared/schema";
import { useTheme } from "@/components/theme-provider";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  // Flag emoji mapping
  const flagEmoji: Record<string, string> = {
    en: "🇬🇧",
    it: "🇮🇹",
    es: "🇪🇸"
  };
  
  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem("preferredLanguage", language);
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      // Invalidate auth session after logout
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
      navigate("/admin/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error", "Error"),
        description: t("admin.logoutError", "Failed to logout")
      });
    }
  };

  // Define all menu items
  const allMenuItems = [
    {
      title: t("nav.dashboard", "Dashboard"),
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      roles: ["admin", "manager"]
    },
    {
      title: t("nav.menuItems", "Menu Items"),
      icon: MenuIcon,
      href: "/admin/menu-items",
      roles: ["admin", "manager"]
    },
    {
      title: t("nav.orders", "Orders"),
      icon: ClipboardList,
      href: "/admin/orders",
      roles: ["admin", "manager"]
    },
    {
      title: t("nav.archive", "Archive"),
      icon: ArchiveIcon,
      href: "/admin/archive",
      roles: ["admin", "manager"]
    },
    {
      title: t("nav.kitchenDisplay", "Kitchen Display"),
      icon: Utensils,
      href: "/admin/kds",
      roles: ["admin", "manager", "kitchen"]
    },
    {
      title: t("nav.userManagement", "User Management"),
      icon: Users,
      href: "/admin/users",
      roles: ["admin"]
    },
    {
      title: t("nav.database", "Database"),
      icon: Database,
      href: "/admin/database",
      roles: ["admin"]
    },
    {
      title: t("nav.apiDocs", "API Documentation"),
      icon: FileText,
      href: "/admin/api-docs",
      roles: ["admin", "manager"]
    },
    {
      title: t("nav.posSettings", "POS Settings"),
      icon: CreditCard,
      href: "/admin/pos-settings",
      roles: ["admin"]
    },
    {
      title: t("nav.settings", "Settings"),
      icon: SettingsIcon,
      href: "/admin/settings",
      roles: ["admin"]
    },
    {
      title: t("nav.training", "Training"),
      icon: GraduationCap,
      href: "/admin/training",
      roles: ["admin", "manager"]
    }
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(
    item => user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
          {user?.role === "kitchen" 
            ? t("admin.kitchenStaff", "Kitchen Staff") 
            : t("admin.title", "Restaurant Admin")}
        </h2>
      </div>
      
      {/* Menu items */}
      <nav className="px-4 space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      
      {/* Theme selector at bottom */}
      <div className="mt-auto">
        <div className="px-4 py-2 border-t border-sidebar-border">
          <div className="flex flex-col">
            <div className="text-xs font-medium text-sidebar-foreground mb-2">
              {t('admin.theme.select', 'Theme')}
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'system' ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setTheme('system')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Language selector */}
        <div className="px-4 py-2 border-t border-sidebar-border">
          <div className="flex flex-col">
            <div className="text-xs font-medium text-sidebar-foreground mb-2">
              {t('admin.language.select', 'Seleziona Lingua')}
            </div>
            <div className="flex gap-2">
              <Button
                variant={i18n.language === 'en' ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleLanguageChange('en')}
              >
                <span>{flagEmoji['en']}</span>
              </Button>
              <Button
                variant={i18n.language === 'it' ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleLanguageChange('it')}
              >
                <span>{flagEmoji['it']}</span>
              </Button>
              <Button
                variant={i18n.language === 'es' ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleLanguageChange('es')}
              >
                <span>{flagEmoji['es']}</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Logout Button */}
        <div className="px-4 py-2 border-t border-sidebar-border">
          <Button
            variant="outline"
            className="w-full justify-start text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("admin.logout", "Disconnetti")}
          </Button>
        </div>
      </div>
    </div>
  );
}