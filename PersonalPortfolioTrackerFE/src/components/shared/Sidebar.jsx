import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, 
  Wallet,          
  Briefcase,       
  LineChart,       
  ArrowRightLeft,  
  LockKeyhole,     
  LogOut, 
  UserRound,
  Menu, // Icon mở menu
  X     // Icon đóng menu
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Quản lý trạng thái đóng/mở trên mobile
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const fullName = localStorage.getItem("fullName") || "Nhà đầu tư";

  // ---- PALETTE PINK UI 2025 ----
  const darkBg = "#0f172a"; 
  const sectionBg = "rgba(168, 85, 247, 0.15)"; 
  const sectionBorder = "rgba(168, 85, 247, 0.4)";
  const sectionText = "#f9a8d4"; 
  const activeGradient = "linear-gradient(135deg, #f9a8d4 0%, #fb7185 40%, #ff8fa3 100%)";
  const hoverBg = "rgba(248, 250, 252, 0.06)";
  const logoutBg = "#fb7185";
  
  const activeText = "#ffffff"; 
  const inactiveText = "#94a3b8"; 

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const sectionStyle = {
    backgroundColor: sectionBg,
    border: `1px solid ${sectionBorder}`,
    color: sectionText,
    padding: "6px 12px",
    marginTop: 22,
    marginBottom: 8,
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  };

  const menuSections = [
    {
      section: "Overview",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      section: "Portfolio",
      items: [
        { label: "Accounts", path: "/investor/accounts", icon: <Wallet size={18} /> },
        { label: "My Holdings", path: "/investor/holdings", icon: <Briefcase size={18} /> },
        { label: "Market Tickers", path: "/investor/tickers", icon: <LineChart size={18} /> },
      ],
    },
    {
      section: "Activity",
      items: [
        { label: "Transactions", path: "/investor/transactions", icon: <ArrowRightLeft size={18} /> },
      ],
    },
    {
      section: "Settings", 
      items: [
        { label: "Change Password", path: "/investor/change-password", icon: <LockKeyhole size={18} /> },
      ],
    },
  ];

  return (
    <>
      {/* === NÚT HAMBURGER (CHỈ HIỂN THỊ TRÊN MOBILE) === */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-md text-slate-800 border border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <Menu size={22} strokeWidth={2.5} />
      </button>

      {/* === BACKDROP LÀM MỜ NỀN KHI MỞ TRÊN MOBILE === */}
      {/* Bấm vào vùng mờ này sẽ tự động đóng Sidebar */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* === THÂN SIDEBAR CHÍNH === */}
      {/* Sử dụng Tailwind classes để xử lý Responsive: 
        - Mặc định (Mobile): -translate-x-full (Ẩn đi)
        - Khi mở (Mobile): translate-x-0 (Trượt ra)
        - Màn hình md trở lên: md:translate-x-0 (Luôn hiển thị đứng im)
      */}
      <div
        className={`fixed top-0 left-0 h-[100vh] w-[260px] flex flex-col justify-between overflow-y-auto custom-scrollbar z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: darkBg,
          color: "#e5e7eb",
          padding: "16px 16px 20px",
        }}
      >
        <div>
          {/* Nút tắt X nằm trong Sidebar (Chỉ hiện trên Mobile) */}
          <div className="flex md:hidden justify-end mb-4">
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* === TỐI ƯU USER CARD THEO CHUẨN GLASSMORPHISM === */}
          <div
            style={{
              background: "linear-gradient(135deg, #f9a8d4 0%, #fb7185 50%, #ff8fa3 100%)",
              borderRadius: 20,
              padding: "16px",
              marginBottom: 24,
              boxShadow: "0 14px 30px rgba(251, 113, 133, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                border: "2px solid rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0
              }}
            >
              <UserRound size={22} strokeWidth={2.5} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.9)", 
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 2,
                  fontWeight: 500,
                }}
              >
                <span role="img" aria-label="wave">👋</span>
                <span>Welcome,</span>
              </div>
              <div
                style={{
                  fontWeight: 800, 
                  fontSize: 16, 
                  color: "#ffffff", 
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
                title={fullName}
              >
                {fullName}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 10px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(255, 255, 255, 0.25)", 
                  color: "#ffffff", 
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                INVESTOR
              </div>
            </div>
          </div>

          {/* MENU */}
          <nav>
            {menuSections.map((section, idx) => (
              <div key={idx}>
                <div style={sectionStyle}>{section.section}</div>

                {section.items.map((item) => {
                  const isActive = item.path === "/investor"
                    ? pathname === "/investor" || pathname === "/investor/"
                    : pathname.startsWith(item.path);

                  return (
                    <div
                      key={item.label}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false); // Tự động đóng Sidebar trên mobile khi chọn xong menu
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        marginBottom: 4,
                        borderRadius: 14,
                        cursor: "pointer",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 14,
                        background: isActive ? activeGradient : "transparent",
                        color: isActive ? activeText : inactiveText,
                        boxShadow: isActive ? "0 8px 15px rgba(251, 113, 133, 0.4)" : "none",
                        textShadow: isActive ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center" }}>
                        {item.icon}
                      </span>
                      <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* BOTTOM: version + copyright + logout */}
        <div style={{ marginTop: 24 }}>
          <div style={{ 
            fontSize: 10, 
            color: "#94a3b8", 
            textAlign: "center", 
            marginBottom: 16,
            lineHeight: 1.6, 
            padding: "0 10px" 
          }}>
            <span style={{ fontWeight: 700, color: "#cbd5e1" }}>v2.0 • Personal Portfolio</span><br/>
            © 2026 Nguyễn Ngọc Thiên Phúc.<br/>
            <span style={{ fontSize: 9, opacity: 0.8 }}>Data is delayed. For informational purposes only.</span>
          </div>

          <div
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: logoutBg,
              color: "#ffffff",
              padding: "12px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 10px 24px rgba(251, 113, 133, 0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 14px 30px rgba(251, 113, 133, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 24px rgba(251, 113, 133, 0.4)";
            }}
          >
            <LogOut size={18} strokeWidth={2.5} />
            <span>Sign Out</span>
          </div>
        </div>
      </div>
    </>
  );
}