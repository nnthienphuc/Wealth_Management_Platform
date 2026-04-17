import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  // Nếu đã login → tự redirect về /investor
  return token ? <Navigate to="/investor" replace /> : children;
}
