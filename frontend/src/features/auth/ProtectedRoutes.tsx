import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "./service/authhook";

/**
 * Route guard — wraps protected routes.
 * Redirects unauthenticated users to /login, preserving the intended destination.
 *
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoutes />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 */
export default function ProtectedRoutes() {
  const { data: user, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
