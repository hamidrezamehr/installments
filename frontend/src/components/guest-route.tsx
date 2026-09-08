import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/use-auth";

function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    const returnTo =
      new URLSearchParams(location.search).get("returnTo") ?? "/";
    const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/";
    return <Navigate to={safeReturnTo} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
