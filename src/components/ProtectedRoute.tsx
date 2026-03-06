import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Wait for role to load
  if (role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Teste role can only access /whatsapp
  if (role === "teste" && location.pathname !== "/whatsapp") {
    return <Navigate to="/whatsapp" replace />;
  }

  // Investor role can only access /investor/* routes
  if (role === "investor" && !location.pathname.startsWith("/investor")) {
    return <Navigate to="/investor" replace />;
  }

  // Admin/technician should not access /investor/* routes
  if (role !== "investor" && location.pathname.startsWith("/investor")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
