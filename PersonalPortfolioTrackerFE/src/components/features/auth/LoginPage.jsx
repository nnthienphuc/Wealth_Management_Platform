import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({}); // Quản lý lỗi FE
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("activated") === "true") {
      toast.success("Your account has been activated. Please sign in.", { toastId: "act-success" });
    } else if (params.get("activated") === "false") {
      toast.error("Activation token is invalid or this account is already active.", { toastId: "act-err" });
    }

    if (params.get("reset") === "success") {
      toast.success("Password has been reset. Please sign in.", { toastId: "reset-success" });
    } else if (params.get("reset") === "failed") {
      toast.error("Password reset token is invalid or has expired.", { toastId: "reset-err" });
    }
    
    // Mẹo nhỏ Tech Lead: Xóa param trên URL sau khi đã hiện toast để lúc sếp F5 nó không hiện lại
    if (params.has("activated") || params.has("reset")) {
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location.search, location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: "" })); // Xóa lỗi khi user bắt đầu gõ lại
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.password) {
      errors.password = "Please enter your password.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Dừng lại nếu FE có lỗi

    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", formData);
      const { token, fullName, email } = res.data;

      localStorage.setItem("token", token);
      if (fullName) localStorage.setItem("fullName", fullName);
      if (email) localStorage.setItem("email", email);
      
      // Không cần toast lúc login thành công, vào thẳng Dashboard luôn cho mượt
      navigate("/investor");
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign-in failed.", {
        toastId: "login-error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const res = await axiosInstance.post("/Auth/google-login", { idToken });
      const { token, fullName, email } = res.data;

      localStorage.setItem("token", token);
      if (fullName) localStorage.setItem("fullName", fullName);
      if (email) localStorage.setItem("email", email);

      navigate("/investor");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google sign-in failed.");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-in failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 transform transition-all">
        <h2 className="text-2xl font-bold text-center text-pink-600 mb-6 tracking-wide">
          Sign in
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.email ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              value={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.password ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              value={formData.password}
              onChange={handleChange}
            />
            {fieldErrors.password && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.password}</p>}
          </div>

          <div className="flex justify-between items-center px-1">
            <label className="flex items-center text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-gray-300"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-pink-500 font-medium hover:text-pink-600 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <div className="my-6 flex items-center text-gray-400 before:flex-1 before:border-t before:mr-3 after:flex-1 after:border-t after:ml-3 text-sm italic">
          or
        </div>

        <div className="flex justify-center mb-6">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="outline" shape="pill" />
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Don't have an account? <Link to="/register" className="text-pink-500 font-bold hover:text-pink-600 transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}