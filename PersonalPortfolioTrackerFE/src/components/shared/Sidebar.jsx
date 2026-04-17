// Sidebar.jsx - Investor
import { useLocation, useNavigate } from "react-router-dom";
import { colors } from "../../theme";
import {
  LayoutDashboard, // Dashboard
  Wallet, // Accounts
  Tag, // Types
  TrendingUp, // Tickers
  Receipt, // Transactions
  Lock, // Change password
  LogOut, // Logout
  UserRound, // Avatar
  ChartColumn, // Analytics
} from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const fullName = localStorage.getItem("fullName") || "Nhà đầu tư";

  // ---- PALETTE PINK UI 2025 ----
  const darkBg = "#0f172a"; // slate-900
  const sectionBg = "rgba(168, 85, 247, 0.25)"; // tím nhạt trong suốt
  const sectionBorder = "rgba(168, 85, 247, 0.6)";
  const sectionText = "#f9a8d4"; // hồng nhạt
  const activeGradient =
    "linear-gradient(135deg, #f9a8d4 0%, #fb7185 40%, #ff8fa3 100%)";
  const hoverBg = "rgba(248, 250, 252, 0.04)";
  const logoutBg = "#fb7185";

  // fallback nếu file theme có định nghĩa thêm màu
  const darkText = colors?.darkText || "#0f172a";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const sectionStyle = {
    backgroundColor: sectionBg,
    border: `1px solid ${sectionBorder}`,
    color: sectionText,
    padding: "6px 12px",
    marginTop: 18,
    marginBottom: 6,
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  };

  // MENU CHO INVESTOR
  const menuSections = [
    {
      section: "Overview",
      items: [
        {
          label: "Home",
          path: "/investor",
          icon: <LayoutDashboard size={18} />,
        },
      ],
    },
    {
      section: "Portfolio",
      items: [
        {
          label: "Ticker",
          path: "/investor/tickers",
          icon: <TrendingUp size={18} />,
        },
        {
          label: "Type",
          path: "/investor/ticker-types",
          icon: <Tag size={18} />,
        },
        {
          label: "Account",
          path: "/investor/accounts",
          icon: <Wallet size={18} />,
        },
      ],
    },
    {
      section: "Transactions",
      items: [
        {
          label: "Transactions",
          path: "/investor/transactions",
          icon: <Receipt size={18} />,
        },
      ],
    },
    {
      section: "Account",
      items: [
        {
          label: "Change Password",
          path: "/investor/change-password",
          icon: <Lock size={18} />,
        },
      ],
    },
  ];

  return (
    <div
      style={{
        width: 260, // cho tên dài hơn 1 chút
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
      }}
    >
      {/* TOP: USER CARD + MENU */}
      <div>
        {/* USER CARD */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #f9a8d4 0%, #fb7185 45%, #ff8fa3 100%)",
            borderRadius: 20,
            padding: "14px 16px",
            marginBottom: 20,
            boxShadow: "0 14px 30px rgba(251, 113, 133, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "999px",
              backgroundColor: "rgba(248, 250, 252, 0.2)",
              border: "2px solid rgba(248, 250, 252, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f9fafb",
            }}
          >
            <UserRound size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: "#fefce8",
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 2,
              }}
            >
              <span role="img" aria-label="wave">
                👋
              </span>
              <span>Welcome,</span>
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#f9fafb",
                whiteSpace: "normal",
                overflow: "visible",
                wordBreak: "break-word",
                marginBottom: 4,
                lineHeight: "1.3",
              }}
              title={fullName}
            >
              {fullName}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 10px",
                borderRadius: 9999,
                backgroundColor: "rgba(15, 23, 42, 0.25)",
                color: "#fef9c3",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
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
                const isActive =
                  item.path === "/investor"
                    ? pathname === "/investor"
                    : pathname.startsWith(item.path);

                return (
                  <div
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      marginBottom: 6,
                      borderRadius: 9999,
                      cursor: "pointer",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 14,
                      background: isActive ? activeGradient : "transparent",
                      color: isActive ? darkText : "#e5e7eb",
                      boxShadow: isActive
                        ? "0 8px 20px rgba(251, 113, 133, 0.45)"
                        : "none",
                      transition:
                        "background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
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
      <div
        style={{
          marginTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            textAlign: "center",
            marginBottom: 2,
          }}
        >
          v2.0 • Personal Portfolio Tracker
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#475569",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          © 2026 Nguyễn Ngọc Thiên Phúc. All rights reserved.
        </div>

        <div
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: logoutBg,
            color: "#f9fafb",
            padding: "10px 14px",
            borderRadius: 9999,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 10px 24px rgba(251, 113, 133, 0.5)",
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "0 14px 30px rgba(251, 113, 133, 0.65)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 10px 24px rgba(251, 113, 133, 0.5)";
          }}
        >
          <LogOut size={18} />
          <span>LogOut</span>
        </div>
      </div>
    </div>
  );
}
