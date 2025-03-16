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
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useTranslation } from "react-i18next";
import { languages } from "@shared/schema";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const { t, i18n } = useTranslation();
  
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
    <div className="min-h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
          {user?.role === "kitchen" 
            ? t("admin.kitchenStaff", "Kitchen Staff") 
            : t("admin.title", "Restaurant Admin")}
        </h2>
        
        {/* Global Language Selector */}
        <div className="mb-6 border rounded-md p-3 bg-sidebar-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-sidebar-foreground" />
            <span className="text-sm font-medium text-sidebar-foreground">
              {t('admin.language.select', 'Select Language')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {languages.map((lang) => (
              <Button
                key={lang}
                variant={i18n.language === lang ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => handleLanguageChange(lang)}
              >
                <span className="mr-2">{flagEmoji[lang]}</span>
                {t(`admin.language.${lang}`, lang === 'en' ? 'English' : lang === 'it' ? 'Italian' : 'Spanish')}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <nav className="px-4 space-y-2">
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
      <div className="absolute bottom-4 w-64 px-4">
        <Button
          variant="outline"
          className="w-full justify-start text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("admin.logout", "Logout")}
        </Button>
      </div>
    </div>
  );
}