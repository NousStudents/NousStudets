import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

type Props = { 
  children: React.ReactNode; 
  roles?: Array<"admin" | "teacher" | "student" | "parent"> 
};

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roles?.length && role && !roles.includes(role as any)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. Required role: {roles.join(' or ')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
