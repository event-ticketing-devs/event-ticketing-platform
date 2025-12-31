import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  return currentUser ? children : <Navigate to="/login" state={{ from: location }} />;
}
