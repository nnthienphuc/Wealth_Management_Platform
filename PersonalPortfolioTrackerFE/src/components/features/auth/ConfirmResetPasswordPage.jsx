import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";

export default function ConfirmResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");

  const [form, setForm] = useState({
    newPassword: "",
    newPasswordConfirmation: "", 
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.newPassword) errors.newPassword = "Please enter your new password.";
    else if (form.newPassword.length < 6) errors.newPassword = "Password must be at least 6 characters long.";

    if (!form.newPasswordConfirmation) errors.newPasswordConfirmation = "Please confirm your new password.";
    else if (form.newPassword !== form.newPasswordConfirmation) errors.newPasswordConfirmation = "New password confirmation does not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Reset token is invalid or has expired.");
      return;
    }
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post(
        "/Auth/confirm-reset-password",
        {
          newPassword: form.newPassword,
          newPasswordConfirmation: form.newPasswordConfirmation,
        },
        { params: { token } }
      );
      
      toast.success(res.data.message); 
      navigate("/login");
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
          Reset password
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          Enter your new password below
        </p>

        {!token && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-xl text-center font-medium">
            Reset token is invalid or has expired.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              name="newPassword"
              placeholder="New password"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.newPassword ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              value={form.newPassword}
              onChange={handleChange}
            />
            {fieldErrors.newPassword && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.newPassword}</p>}
          </div>

          <div>
            <input
              type="password"
              name="newPasswordConfirmation"
              placeholder="Confirm new password"
              className={`w-full px-5 py-3 rounded-xl border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.newPasswordConfirmation ? "border-red-400 focus:ring-red-200" : "border-pink-100 focus:border-pink-400 focus:ring-pink-200"}`}
              value={form.newPasswordConfirmation}
              onChange={handleChange}
            />
            {fieldErrors.newPasswordConfirmation && <p className="text-red-500 text-xs font-medium mt-1 ml-2">{fieldErrors.newPasswordConfirmation}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "UPDATING..." : "CONFIRM"}
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