import React, { useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email) {
      setFieldError("Please enter your email.");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/Auth/reset-password", { email });
      toast.success(res.data.message); // BE: "Please check your email to reset..."
      setEmail(""); // Clear ô nhập sau khi gửi thành công
    } catch (err) {
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 transform transition-all">
        <h2 className="text-2xl font-bold text-center text-pink-600 mb-6 tracking-wide">
          Forgot password
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          Enter your email to receive a reset link
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email address"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldError ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError("");
              }}
            />
            {fieldError && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>

          <div className="text-center mt-6">
            <Link to="/login" className="text-pink-500 font-bold hover:text-pink-600 transition-colors">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}