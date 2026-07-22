import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation?: string;
}

interface StockMovement {
  id: string;
  quantity: number;
  movementType: "IN" | "OUT";
  reason: string;
  createdAt: string;
  product: {
    name: string;
    sku: string;
  };
  createdBy: {
    name: string;
  };
}

function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [productsRes, movementsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/products", { headers }),
        axios.get("http://localhost:5000/api/inventory/movements", { headers }),
      ]);

      setProducts(productsRes.data.products);
      setMovements(movementsRes.data.movements);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = () => {
    setSelectedProductId(products[0]?.id || "");
    setMovementType("IN");
    setQuantity("");
    setReason("");
    setFormError("");
    setShowAdjustModal(true);
  };

  const handleRecordAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedProductId || !quantity || !movementType || !reason) {
      setFormError("Please fill in all fields.");
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError("Quantity must be a positive number.");
      return;
    }

    // Verify stock if OUT
    if (movementType === "OUT") {
      const prod = products.find((p) => p.id === selectedProductId);
      if (prod && prod.currentStock < qty) {
        setFormError(
          `Insufficient stock. Available: ${prod.currentStock}, Requested: ${qty}`
        );
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/inventory/movements",
        {
          productId: selectedProductId,
          quantity: qty,
          movementType,
          reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAdjustModal(false);
      fetchInventoryData();
    } catch (error: any) {
      console.error(error);
      setFormError(
        error.response?.data?.message || "Failed to save stock movement."
      );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "30px",
          textAlign: "left",
          color: "var(--text)",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", color: "var(--text-h)" }}>
              Inventory Management
            </h1>
            <p style={{ color: "var(--text)", marginTop: "5px" }}>
              Monitor stock levels, configure minimum thresholds, and log stock adjustments.
            </p>
          </div>

          <button
            style={{
              padding: "12px 24px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              boxShadow: "var(--shadow)",
            }}
            onClick={handleOpenAdjust}
          >
            Adjust Stock
          </button>
        </div>

        {loading ? (
          <h3 style={{ color: "var(--text-h)" }}>Loading inventory status...</h3>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            
            {/* Stock Levels Status Card */}
            <div>
              <h2 style={{ color: "var(--text-h)", marginBottom: "15px", fontSize: "20px" }}>
                Stock Level Status
              </h2>
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)",
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--code-bg)", position: "sticky", top: 0 }}>
                      <th style={tableHeader}>SKU</th>
                      <th style={tableHeader}>Product Name</th>
                      <th style={tableHeader}>Location</th>
                      <th style={tableHeader}>Alert Level</th>
                      <th style={tableHeader}>Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const isLowStock = prod.currentStock <= prod.minStockAlert;
                      return (
                        <tr
                          key={prod.id}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: isLowStock ? "rgba(220, 38, 38, 0.03)" : "transparent",
                          }}
                        >
                          <td style={{ ...tableCell, fontFamily: "var(--mono)" }}>{prod.sku}</td>
                          <td style={{ ...tableCell, color: "var(--text-h)", fontWeight: "500" }}>
                            {prod.name}
                          </td>
                          <td style={tableCell}>{prod.warehouseLocation || "—"}</td>
                          <td style={tableCell}>{prod.minStockAlert} units</td>
                          <td style={tableCell}>
                            <strong
                              style={{
                                color: isLowStock ? "#dc2626" : "#16a34a",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {prod.currentStock} {isLowStock && "⚠️ Low Stock"}
                            </strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stock Movement Audit Log */}
            <div>
              <h2 style={{ color: "var(--text-h)", marginBottom: "15px", fontSize: "20px" }}>
                Stock Movement Audit Log
              </h2>
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {movements.length === 0 ? (
                  <p style={{ padding: "20px", color: "var(--text)" }}>No movements logged yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--code-bg)", position: "sticky", top: 0 }}>
                        <th style={tableHeader}>Timestamp</th>
                        <th style={tableHeader}>SKU</th>
                        <th style={tableHeader}>Product</th>
                        <th style={tableHeader}>Type</th>
                        <th style={tableHeader}>Quantity</th>
                        <th style={tableHeader}>Reason</th>
                        <th style={tableHeader}>Logged By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((mov) => (
                        <tr key={mov.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={tableCell}>
                            {new Date(mov.createdAt).toLocaleString("en-IN")}
                          </td>
                          <td style={{ ...tableCell, fontFamily: "var(--mono)" }}>{mov.product?.sku}</td>
                          <td style={{ ...tableCell, color: "var(--text-h)", fontWeight: "500" }}>
                            {mov.product?.name}
                          </td>
                          <td style={tableCell}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontWeight: "600",
                                fontSize: "13px",
                                background: mov.movementType === "IN" ? "rgba(22, 163, 74, 0.15)" : "rgba(220, 38, 38, 0.15)",
                                color: mov.movementType === "IN" ? "#16a34a" : "#dc2626",
                              }}
                            >
                              {mov.movementType}
                            </span>
                          </td>
                          <td style={tableCell}>
                            <strong>{mov.quantity} units</strong>
                          </td>
                          <td style={tableCell}>{mov.reason}</td>
                          <td style={tableCell}>{mov.createdBy?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADJUST STOCK MODAL */}
        {showAdjustModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h2 style={{ color: "var(--text-h)", marginBottom: "20px" }}>Record Stock Adjustment</h2>
              {formError && <div style={errorBanner}>{formError}</div>}
              
              <form onSubmit={handleRecordAdjustment}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={labelStyle}>Select Product *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    style={inputStyle}
                    required
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.sku} - {prod.name} (Stock: {prod.currentStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={formRow}>
                  <div style={formGroupHalf}>
                    <label style={labelStyle}>Adjustment Type *</label>
                    <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                      <label style={radioLabel}>
                        <input
                          type="radio"
                          name="adjType"
                          checked={movementType === "IN"}
                          onChange={() => setMovementType("IN")}
                          style={{ marginRight: "6px" }}
                        />
                        IN (Add Stock)
                      </label>
                      <label style={radioLabel}>
                        <input
                          type="radio"
                          name="adjType"
                          checked={movementType === "OUT"}
                          onChange={() => setMovementType("OUT")}
                          style={{ marginRight: "6px" }}
                        />
                        OUT (Remove Stock)
                      </label>
                    </div>
                  </div>
                  
                  <div style={formGroupHalf}>
                    <label style={labelStyle}>Quantity (units) *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>Reason / Notes *</label>
                  <input
                    type="text"
                    placeholder="e.g. Received shipment, Damaged stock disposal, Audit correction"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "30px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    style={cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={submitButton}>
                    Apply Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline styles
const tableHeader: React.CSSProperties = {
  padding: "15px",
  borderBottom: "1px solid var(--border)",
  textAlign: "left",
  fontSize: "14px",
  color: "var(--text-h)",
  fontWeight: "600",
};

const tableCell: React.CSSProperties = {
  padding: "16px 15px",
  fontSize: "15px",
  color: "var(--text)",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const modalContent: React.CSSProperties = {
  background: "var(--bg)",
  padding: "30px",
  borderRadius: "8px",
  width: "550px",
  maxWidth: "90%",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
  boxSizing: "border-box",
};

const errorBanner: React.CSSProperties = {
  padding: "12px",
  background: "rgba(220, 38, 38, 0.15)",
  color: "#dc2626",
  borderRadius: "4px",
  border: "1px solid rgba(220, 38, 38, 0.3)",
  marginBottom: "15px",
  fontSize: "14px",
};

const formRow: React.CSSProperties = {
  display: "flex",
  gap: "15px",
  marginBottom: "15px",
};

const formGroupHalf: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};

const labelStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--text-h)",
  marginBottom: "6px",
  fontWeight: "500",
};

const radioLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--text-h)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  background: "var(--code-bg)",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
};

const inputStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--code-bg)",
  color: "var(--text-h)",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

const cancelButton: React.CSSProperties = {
  padding: "10px 18px",
  background: "var(--code-bg)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
};

const submitButton: React.CSSProperties = {
  padding: "10px 18px",
  background: "var(--accent)",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

export default Inventory;
