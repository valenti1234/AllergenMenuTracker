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
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAdminAuth();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      // Invalidate auth session after logout
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
      navigate("/admin/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout"
      });
    }
  };

  // Define all menu items
  const allMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      roles: ["admin", "manager"]
    },
    {
      title: "Menu Items",
      icon: MenuIcon,
      href: "/admin/menu-items",
      roles: ["admin", "manager"]
    },
    {
      title: "Orders",
      icon: ClipboardList,
      href: "/admin/orders",
      roles: ["admin", "manager"]
    },
    {
      title: "Archive",
      icon: ArchiveIcon,
      href: "/admin/archive",
      roles: ["admin", "manager"]
    },
    {
      title: "Kitchen Display",
      icon: Utensils,
      href: "/admin/kds",
      roles: ["admin", "manager", "kitchen"]
    },
    {
      title: "User Management",
      icon: Users,
      href: "/admin/users",
      roles: ["admin"]
    },
    {
      title: "Database",
      icon: Database,
      href: "/admin/database",
      roles: ["admin"]
    }
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(
    item => user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          {user?.role === "kitchen" ? "Kitchen Staff" : "Restaurant Admin"}
        </h2>
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
          Logout
        </Button>
      </div>
    </div>
  );
}