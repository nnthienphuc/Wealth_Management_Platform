import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Auth Features ---
import LoginPage from "./components/features/auth/LoginPage";
import RegisterPage from "./components/features/auth/RegisterPage";
import ForgotPasswordPage from "./components/features/auth/ForgotPasswordPage";
import ChangePasswordPage from "./components/features/auth/ChangePasswordPage";
import ActivateAccountPage from "./components/features/auth/ActivateAccountPage";
import ConfirmResetPasswordPage from "./components/features/auth/ConfirmResetPasswordPage";

// --- Portfolio Features ---
import InvestorHomePage from "./components/features/portfolio/InvestorHomePage";
import TickerPage from "./components/features/portfolio/TickerPage";
import AccountsPage from "./components/features/portfolio/AccountPage";
import HoldingsPage from "./components/features/portfolio/HoldingsPage";

// --- Shared Components & Layouts ---
import PublicRoute from "./components/shared/PublicRoute";
import PrivateRoute from "./components/shared/PrivateRoute";
import InvestorLayout from "./components/shared/InvestorLayout";

function App() {
  return (
    <>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/activate" element={<PublicRoute><ActivateAccountPage /></PublicRoute>} />
        <Route path="/confirm-reset-password" element={<PublicRoute><ConfirmResetPasswordPage /></PublicRoute>} />

        {/* Protected investor routes */}
        <Route path="/investor" element={<PrivateRoute><InvestorLayout /></PrivateRoute>}>
          <Route index element={<InvestorHomePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="tickers" element={<TickerPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="holdings" element={<HoldingsPage />} />
        </Route>

        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} limit={3} />
    </>
  );
}

export default App;