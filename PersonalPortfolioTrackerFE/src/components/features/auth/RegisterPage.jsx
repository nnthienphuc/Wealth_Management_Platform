import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    passwordConfirmation: "", 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Please enter a valid email address.";

    if (!formData.fullName) errors.fullName = "Please enter your full name.";
    if (!formData.password) errors.password = "Please enter your password.";
    else if (formData.password.length < 6) errors.password = "Password must be at least 6 characters long.";
    
    if (!formData.passwordConfirmation) errors.passwordConfirmation = "Please confirm your password.";
    else if (formData.password !== formData.passwordConfirmation) errors.passwordConfirmation = "Password confirmation does not match.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/Auth/register", formData);
      toast.success(res.data.message, { toastId: "register-success" }); 
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message, { toastId: "register-error" });
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
      <Link
              to="/"
              className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 font-medium hover:text-pink-600 transition-colors group"
            >
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span>Explore App</span>
            </Link>

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 transform transition-all">
        <h2 className="text-2xl font-bold text-center text-pink-600 mb-6 tracking-wide">Sign up</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.email ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              onChange={handleChange}
            />
            {fieldErrors.email && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.email}</p>}
          </div>

          <div>
            <input
              name="fullName"
              type="text"
              placeholder="Full name"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.fullName ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              onChange={handleChange}
            />
            {fieldErrors.fullName && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.fullName}</p>}
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.password ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              onChange={handleChange}
            />
            {fieldErrors.password && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.password}</p>}
          </div>

          <div>
            <input
              name="passwordConfirmation"
              type="password"
              placeholder="Confirm password"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.passwordConfirmation ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              onChange={handleChange}
            />
            {fieldErrors.passwordConfirmation && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.passwordConfirmation}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? "PROCESSING..." : "SIGN UP"}
          </button>
        </form>

        <div className="my-6 flex items-center text-gray-400 before:flex-1 before:border-t before:mr-3 after:flex-1 after:border-t after:ml-3">or</div>

        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="outline" shape="pill" />
        </div>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-pink-500 font-bold hover:text-pink-600 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}