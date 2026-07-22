import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface Stats {
  totalCustomers: number;
  totalProducts: number;
  leadsCount: number;
  activeCount: number;
  inactiveCount: number;
  totalItemsInStock: number;
  lowStockCount: number;
  totalSales: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation?: string;
}

interface RecentChallan {
  id: string;
  challanNumber: string;
  totalQuantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  customer: { name: string; businessName?: string };
}

interface RecentMovement {
  id: string;
  quantity: number;
  movementType: "IN" | "OUT";
  reason: string;
  createdAt: string;
  product: { name: string; sku: string };
  createdBy: { name: string };
}

interface RecentFollowUp {
  id: string;
  note: string;
  followUpDate: string;
  createdAt: string;
  customer: { name: string };
  createdBy: { name: string };
}

const statusBadgeClass = (s: string) => {
  if (s === "CONFIRMED") return "badge badge-green";
  if (s === "CANCELLED") return "badge badge-red";
  return "badge badge-yellow";
};

function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [challans, setChallans] = useState<RecentChallan[]>([]);
  const [movements, setMovements] = useState<RecentMovement[]>([]);
  const [followUps, setFollowUps] = useState<RecentFollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const h = { Authorization: `Bearer ${token}` };
        const [userRes, dashRes] = await Promise.all([
          axios.get("http://localhost:5000/api/auth/me", { headers: h }),
          axios.get("http://localhost:5000/api/dashboard/stats", { headers: h }),
        ]);
        setUser(userRes.data.user);
        setStats(dashRes.data.stats);
        setLowStock(dashRes.data.lowStockProducts);
        setChallans(dashRes.data.recentChallans);
        setMovements(dashRes.data.recentMovements);
        setFollowUps(dashRes.data.recentFollowUps);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page-root">
      <Sidebar />
      <div className="page-content">
        {/* Welcome banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "14px",
          padding: "22px 28px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f0f1f5", margin: 0 }}>
              Hello, {user?.name || "User"} 👋
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "4px", fontSize: "14px" }}>
              Welcome to Mini ERP &amp; CRM Portal
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <span className="badge badge-purple" style={{ padding: "5px 14px", fontSize: "13px" }}>
              {user?.role}
            </span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>
              {user?.email}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Customers</div>
                  <div className="stat-value">{stats.totalCustomers}</div>
                  <div className="stat-sub">{stats.activeCount} Active · {stats.leadsCount} Leads</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Product Catalog</div>
                  <div className="stat-value">{stats.totalProducts}</div>
                  <div className="stat-sub">SKUs managed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Inventory Stock</div>
                  <div className="stat-value">{stats.totalItemsInStock}</div>
                  <div className="stat-sub" style={{ color: stats.lowStockCount > 0 ? "#ef4444" : undefined }}>
                    {stats.lowStockCount} items low stock {stats.lowStockCount > 0 ? "⚠️" : "✅"}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Confirmed Sales</div>
                  <div className="stat-value" style={{ color: "#a5b4fc" }}>
                    ₹{Number(stats.totalSales).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="stat-sub">From dispatched challans</div>
                </div>
              </div>
            )}

            {/* Low stock alerts */}
            {lowStock.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: "24px", alignItems: "flex-start", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                  ⚠️ Low Stock Alerts ({lowStock.length} products)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {lowStock.map(p => (
                    <span key={p.id} style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "13px",
                      color: "#fcd34d",
                    }}>
                      <strong>{p.sku}</strong> — {p.currentStock} left (min: {p.minStockAlert})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent sections */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              {/* Recent Challans */}
              <div className="card">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f1f5", margin: 0 }}>Recent Challans</h3>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {challans.length === 0 ? (
                    <p style={{ padding: "20px", color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>No challans yet.</p>
                  ) : challans.map(ch => (
                    <div key={ch.id} style={itemRow}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#a5b4fc", fontFamily: "monospace" }}>{ch.challanNumber}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                          {ch.customer?.name} · {ch.totalQuantity} units
                        </div>
                      </div>
                      <span className={statusBadgeClass(ch.status)}>{ch.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Follow-ups */}
              <div className="card">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f1f5", margin: 0 }}>CRM Follow-ups</h3>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {followUps.length === 0 ? (
                    <p style={{ padding: "20px", color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>No follow-ups yet.</p>
                  ) : followUps.map(fu => (
                    <div key={fu.id} style={itemRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f0f1f5" }}>{fu.customer?.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px", fontStyle: "italic" }}>
                          "{fu.note}"
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                          by {fu.createdBy?.name} · {new Date(fu.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Stock Movements */}
              <div className="card">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f1f5", margin: 0 }}>Stock Movements</h3>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {movements.length === 0 ? (
                    <p style={{ padding: "20px", color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>No movements yet.</p>
                  ) : movements.map(mv => (
                    <div key={mv.id} style={itemRow}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f0f1f5" }}>{mv.product?.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{mv.product?.sku}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{mv.reason}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={mv.movementType === "IN" ? "badge badge-green" : "badge badge-red"}>
                          {mv.movementType}
                        </span>
                        <div style={{ fontSize: "13px", color: "#f0f1f5", fontWeight: 600, marginTop: "4px" }}>
                          {mv.quantity} units
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const itemRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 20px",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  gap: "12px",
};

export default Dashboard;