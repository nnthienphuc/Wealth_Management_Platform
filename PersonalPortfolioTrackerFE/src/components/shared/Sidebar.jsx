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
} from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const fullName = localStorage.getItem("fullName") || "Nhà đầu tư";

  // ---- PALETTE PINK UI 2025 ----
  const darkBg = "#0f172a"; 
  const sectionBg = "rgba(168, 85, 247, 0.15)"; // Giảm opacity một chút cho dịu mắt
  const sectionBorder = "rgba(168, 85, 247, 0.4)";
  const sectionText = "#f9a8d4"; 
  const activeGradient = "linear-gradient(135deg, #f9a8d4 0%, #fb7185 40%, #ff8fa3 100%)";
  const hoverBg = "rgba(248, 250, 252, 0.06)";
  const logoutBg = "#fb7185";
  
  // Sửa lại màu chữ khi Active thành Trắng tinh
  const activeText = "#ffffff"; 
  const inactiveText = "#94a3b8"; // Xám xanh dịu hơn

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
    fontWeight: 800, // Đậm hẳn lên
    textTransform: "uppercase",
    letterSpacing: 1.2,
  };

  const menuSections = [
    {
      section: "Overview",
      items: [
        { label: "Dashboard", path: "/investor", icon: <LayoutDashboard size={18} /> },
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
        { label: "Investor Profile", path: "/investor/investor-profile", icon: <UserRound size={18} /> },
        { label: "Change Password", path: "/investor/change-password", icon: <LockKeyhole size={18} /> },
      ],
    },
  ];

  return (
    <div
      style={{
        width: 260,
        height: "100vh",
        backgroundColor: darkBg,
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        padding: "16px 16px 20px",
        overflowY: "auto",
        zIndex: 50
      }}
    >
      <div>
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
                color: "rgba(255, 255, 255, 0.9)", // Trắng mờ
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
                fontWeight: 800, // Tên đậm hẳn
                fontSize: 16, // To hơn 1 chút
                color: "#ffffff", // Trắng tinh
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
                backgroundColor: "rgba(255, 255, 255, 0.25)", // Nền kính mờ
                color: "#ffffff", // Chữ trắng
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
                    onClick={() => navigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      marginBottom: 4,
                      borderRadius: 14,
                      cursor: "pointer",
                      // === TỐI ƯU FONT WEIGHT VÀ MÀU CHỮ ===
                      fontWeight: isActive ? 700 : 500, // Active thì đậm (Bold), Inactive thì vừa (Medium)
                      fontSize: 14,
                      background: isActive ? activeGradient : "transparent",
                      color: isActive ? activeText : inactiveText, // Trắng vs Xám xanh
                      boxShadow: isActive ? "0 8px 15px rgba(251, 113, 133, 0.4)" : "none",
                      textShadow: isActive ? "0 1px 2px rgba(0,0,0,0.1)" : "none", // Thêm bóng chữ nhẹ cho dễ đọc
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
        <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginBottom: 2 }}>
          v2.0 • Personal Portfolio
        </div>
        <div style={{ fontSize: 10, color: "#475569", textAlign: "center", marginBottom: 16 }}>
          © 2026 Nguyễn Ngọc Thiên Phúc
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
  );
}