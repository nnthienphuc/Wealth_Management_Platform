import React, { useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    oldPassword: "",
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
    if (!form.oldPassword) errors.oldPassword = "Please enter your current password.";

    if (!form.newPassword) errors.newPassword = "Please enter your new password.";
    else if (form.newPassword.length < 6) errors.newPassword = "Password must be at least 6 characters long.";

    if (!form.newPasswordConfirmation) errors.newPasswordConfirmation = "Please confirm your new password.";
    else if (form.newPassword !== form.newPasswordConfirmation) errors.newPasswordConfirmation = "New password confirmation does not match.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/Auth/change-password", form);
      toast.success(res.data.message); 
      setForm({ oldPassword: "", newPassword: "", newPasswordConfirmation: "" });
    } catch (err) {
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex justify-center items-start min-h-screen bg-gray-50">
      <div className="w-full max-w-[420px] bg-white rounded-[1.5rem] shadow-[0_18px_40px_rgba(0,0,0,0.08)] p-8 mt-10 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-1">Change password</h3>
        <p className="text-sm text-gray-400 mb-6">Update your account security</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input
              type="password"
              name="oldPassword"
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.oldPassword ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:border-pink-400 focus:ring-pink-200"}`}
              value={form.oldPassword}
              onChange={handleChange}
            />
            {fieldErrors.oldPassword && <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.oldPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              name="newPassword"
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.newPassword ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:border-pink-400 focus:ring-pink-200"}`}
              value={form.newPassword}
              onChange={handleChange}
            />
            {fieldErrors.newPassword && <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.newPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password"
              name="newPasswordConfirmation"
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-all bg-gray-50 focus:ring-2 
                ${fieldErrors.newPasswordConfirmation ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:border-pink-400 focus:ring-pink-200"}`}
              value={form.newPasswordConfirmation}
              onChange={handleChange}
            />
            {fieldErrors.newPasswordConfirmation && <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.newPasswordConfirmation}</p>}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-bold shadow-lg shadow-pink-100 hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {loading ? "Updating..." : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}