import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function InvestorLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      
      <Sidebar />
      <main className="w-full min-h-screen md:pl-[260px] pt-16 md:pt-0 transition-all duration-300 ease-in-out flex flex-col overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
}