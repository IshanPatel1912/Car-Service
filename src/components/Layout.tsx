import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Car as CarIcon, Wrench, LogOut, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Helper to check which link is currently active for highlighting
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background">
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (Hidden on Mobile)                        */}
      {/* ========================================================= */}
      <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 left-0 border-r bg-card z-40">
        {/* Logo Section */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Car className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">AutoManage</span>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/dashboard")
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            to="/cars"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/cars")
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <CarIcon className="h-4 w-4" />
            My Cars
          </Link>

          <Link
            to="/services"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/services")
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Wrench className="h-4 w-4" />
            Services
          </Link>
        </nav>

        {/* Bottom Logout Button */}
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT WRAPPER                                      */}
      {/* ========================================================= */}
      {/* Notice the 'md:pl-64' to make room for the desktop sidebar */}
      {/* Notice the 'pb-20' to prevent the mobile bar from hiding content */}
      <div className="flex flex-1 flex-col md:pl-64 pb-20 md:pb-0">
        <main className="flex-1 p-4 md:p-8">
          {/* This renders the current sub-page (Dashboard, Cars, etc.) */}
          <Outlet />
        </main>
      </div>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION (Hidden on Desktop)             */}
      {/* ========================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card flex justify-around items-center h-16 z-50 px-2 shadow-lg">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isActive("/dashboard") ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </Link>

        <Link
          to="/cars"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isActive("/cars") ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          <CarIcon className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">My Cars</span>
        </Link>

        <Link
          to="/services"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isActive("/services") ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          <Wrench className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Services</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-1 text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Logout</span>
        </button>
      </div>
    </div>
  );
}