import React from "react";
import Sidebar from "./Sidebar"; // Sửa đường dẫn ở đây
import { Outlet } from "react-router-dom";

export default function InvestorLayout() {
  return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-[240px] shrink-0 shadow-[2px_0_15px_rgba(236,72,153,0.08)] z-10 bg-[#0f172a]">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}