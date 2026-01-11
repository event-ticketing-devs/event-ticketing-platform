import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  
  // If user is logged in, redirect to dashboard/profile
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}
