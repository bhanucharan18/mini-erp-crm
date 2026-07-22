import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    path: "/customers",
    label: "Customers",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 8c1.657 0 3 1.343 3 3s-1.343 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: "/products",
    label: "Products",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1L16 5v8L9 17 2 13V5L9 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 1v16M2 5l7 4 7-4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    path: "/inventory",
    label: "Inventory",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="10" width="16" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="6" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="2" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    path: "/challans",
    label: "Challans",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="1" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const roleColor: Record<string, string> = {
    ADMIN: "#a855f7",
    SALES: "#6366f1",
    WAREHOUSE: "#22c55e",
    ACCOUNTS: "#f59e0b",
  };
  const rColor = roleColor[user?.role] || "#6366f1";

  return (
    <aside style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandLogo}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6" fill="url(#sb-grad)" />
            <path d="M4 11h3.5l2-5.5 3 11 2-5.5H18" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="sb-grad" x1="0" y1="0" x2="22" y2="22">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <div style={styles.brandName}>Mini ERP</div>
          <div style={styles.brandSub}>Operations Portal</div>
        </div>
      </div>

      {/* Nav label */}
      <div style={styles.navLabel}>NAVIGATION</div>

      {/* Nav items */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
              title={item.label}
            >
              <span style={{ color: active ? "#a5b4fc" : "rgba(255,255,255,0.4)", flexShrink: 0, display: "flex" }}>
                {item.icon}
              </span>
              <span style={{ color: active ? "#f0f1f5" : "rgba(255,255,255,0.6)", fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
              {active && <span style={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User info + logout */}
      <div style={styles.footer}>
        <div style={styles.userRow}>
          <div style={{ ...styles.avatar, background: rColor + "22", border: `1px solid ${rColor}44` }}>
            <span style={{ color: rColor, fontSize: "12px", fontWeight: 700 }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{user?.name || "User"}</div>
            <div style={{ ...styles.userRole, color: rColor }}>{user?.role || "SALES"}</div>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "240px",
    minWidth: "240px",
    height: "100vh",
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    background: "#0f1120",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    padding: "0",
    boxSizing: "border-box",
    zIndex: 100,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "20px 20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  brandLogo: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(99,102,241,0.12)",
    flexShrink: 0,
  },
  brandName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#f0f1f5",
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.35)",
    marginTop: "1px",
  },
  navLabel: {
    fontSize: "10.5px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "1px",
    padding: "20px 20px 8px",
    textTransform: "uppercase",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "0 10px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    fontSize: "14px",
    position: "relative",
    transition: "background 0.15s",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  navItemActive: {
    background: "rgba(99,102,241,0.14)",
  },
  activeIndicator: {
    position: "absolute",
    right: "10px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#6366f1",
    boxShadow: "0 0 6px rgba(99,102,241,0.8)",
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 8px",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#f0f1f5",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userRole: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: "1px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "9px 12px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.18)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: "13.5px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
};

export default Sidebar;