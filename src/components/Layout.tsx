import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Car, Wrench, LogOut } from "lucide-react";

export default function Layout() {
  const { logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Cars", path: "/cars", icon: Car },
    { name: "Services", path: "/services", icon: Wrench },
  ];

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar - Hidden on mobile, visible on medium screens and up */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold text-lg tracking-tight">AutoManage</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="md:hidden font-semibold">AutoManage</div>
          <div className="flex flex-1 justify-end">
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}