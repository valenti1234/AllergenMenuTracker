import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Archive,
  Users,
  Database,
  ChefHat,
  Globe,
  Moon,
  Sun,
  Monitor,
  LineChart
} from "lucide-react";
import { languages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Link } from "wouter";

// Usa percorsi completi con /admin/
const menuItems = [
  {
    title: "nav.dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard"
  },
  {
    title: "nav.menuItems",
    icon: UtensilsCrossed,
    href: "/admin/menu-items"
  },
  {
    title: "nav.orders",
    icon: ClipboardList,
    href: "/admin/orders"
  },
  {
    title: "nav.archive",
    icon: Archive,
    href: "/admin/archive"
  },
  {
    title: "nav.kitchen",
    icon: ChefHat,
    href: "/admin/kds" 
  },
  {
    title: "nav.kitchenPerformance",
    icon: LineChart,
    href: "/admin/kitchen-performance" 
  },
  {
    title: "nav.users",
    icon: Users,
    href: "/admin/users"
  },
  {
    title: "nav.database",
    icon: Database,
    href: "/admin/database"
  }
] as const;

export function Sidebar() {
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

  // Get current path to determine active link
  const currentPath = window.location.pathname;

  return (
    <div className="w-64 border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('admin.title')}</h2>
        
        {/* Global Language Selector */}
        <div className="mb-4 border rounded-md p-3 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">{t('admin.language.select')}</span>
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
                {t(`admin.language.${lang}`)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Theme Selector */}
        <div className="mb-6 border rounded-md p-3 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{t('admin.theme.select')}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant={theme === 'light' ? "default" : "outline"}
              size="sm"
              className="justify-start"
              onClick={() => setTheme('light')}
            >
              <Sun className="mr-2 h-4 w-4" />
              {t('admin.theme.light')}
            </Button>
            <Button
              variant={theme === 'dark' ? "default" : "outline"}
              size="sm"
              className="justify-start"
              onClick={() => setTheme('dark')}
            >
              <Moon className="mr-2 h-4 w-4" />
              {t('admin.theme.dark')}
            </Button>
            <Button
              variant={theme === 'system' ? "default" : "outline"}
              size="sm"
              className="justify-start"
              onClick={() => setTheme('system')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              {t('admin.theme.system')}
            </Button>
          </div>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || (item.href === '/admin/dashboard' && currentPath === '/admin');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.title)}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 