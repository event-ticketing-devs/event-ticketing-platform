import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role?.toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
