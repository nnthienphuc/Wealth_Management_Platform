import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("activating"); // activating, success, error

  useEffect(() => {
    const activate = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        return;
      }
      try {
        await axiosInstance.get(`/Auth/activate?token=${token}`);
        setStatus("success");
        setTimeout(() => navigate("/login?activated=true"), 3000);
      } catch (err) {
        setStatus("error");
      }
    };
    activate();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl text-center">
        {status === "activating" && <p>Activating account...</p>}
        {status === "success" && (
          <p className="text-green-600 font-bold">Account activated successfully! Redirecting...</p>
        )}
        {status === "error" && (
          <p className="text-red-600 font-bold">Activation link is invalid or has expired.</p>
        )}
      </div>
    </div>
  );
}