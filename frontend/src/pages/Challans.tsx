import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface Customer {
  id: string;
  name: string;
  businessName?: string;
  gstNumber?: string;
  address: string;
  mobile: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface ChallanItem {
  id: string;
  productId: string;
  quantity: number;
  productName: string;
  productSku: string;
  productUnitPrice: number;
  product?: {
    currentStock: number;
  };
}

interface Challan {
  id: string;
  challanNumber: string;
  totalQuantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  createdBy: {
    name: string;
  };
  items?: ChallanItem[];
}

function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  // Create Form State
  const [customerId, setCustomerId] = useState("");
  const [challanStatus, setChallanStatus] = useState<"DRAFT" | "CONFIRMED">("DRAFT");
  const [challanItems, setChallanItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [challansRes, customersRes, productsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/challans", { headers }),
        axios.get("http://localhost:5000/api/customers", { headers }),
        axios.get("http://localhost:5000/api/products", { headers }),
      ]);

      setChallans(challansRes.data.challans);
      setCustomers(customersRes.data.customers);
      setProducts(productsRes.data.products);
    } catch (error) {
      console.error("Error fetching challan data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCustomerId(customers[0]?.id || "");
    setChallanStatus("DRAFT");
    setChallanItems([{ productId: products[0]?.id || "", quantity: 1 }]);
    setFormError("");
    setShowCreateModal(true);
  };

  const handleAddItemRow = () => {
    setChallanItems([...challanItems, { productId: products[0]?.id || "", quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    const items = [...challanItems];
    items.splice(index, 1);
    setChallanItems(items);
  };

  const handleItemChange = (index: number, field: "productId" | "quantity", value: any) => {
    const items = [...challanItems];
    if (field === "productId") {
      items[index].productId = value;
    } else {
      items[index].quantity = Math.max(1, parseInt(value) || 1);
    }
    setChallanItems(items);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!customerId || challanItems.length === 0) {
      setFormError("A customer and at least one item are required.");
      return;
    }

    // Verify stock availability on confirm
    if (challanStatus === "CONFIRMED") {
      for (const item of challanItems) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.currentStock < item.quantity) {
          setFormError(
            `Insufficient stock for ${prod.name}. Available: ${prod.currentStock}, Requested: ${item.quantity}`
          );
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/challans",
        {
          customerId,
          status: challanStatus,
          items: challanItems,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCreateModal(false);
      fetchInitialData();
    } catch (error: any) {
      console.error(error);
      setFormError(
        error.response?.data?.message || "Failed to create challan."
      );
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/challans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedChallan(res.data.challan);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to fetch challan details", error);
      alert("Failed to load details.");
    }
  };

  const handleConfirmChallan = async (challanId: string) => {
    if (!window.confirm("Confirming this challan will deduct products from warehouse stock. Proceed?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/challans/${challanId}`,
        { status: "CONFIRMED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh details and list
      setShowDetailModal(false);
      fetchInitialData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to confirm challan.");
    }
  };

  const handleCancelChallan = async (challanId: string) => {
    if (!window.confirm("Cancelling this confirmed challan will revert quantities back to stock. Proceed?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/challans/${challanId}`,
        { status: "CANCELLED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowDetailModal(false);
      fetchInitialData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to cancel challan.");
    }
  };

  const handleDeleteChallan = async (challanId: string) => {
    if (!window.confirm("Are you sure you want to delete this challan?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/challans/${challanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowDetailModal(false);
      fetchInitialData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete challan.");
    }
  };

  // Calculate dynamic subtotals for challan forms
  const getFormValuation = () => {
    return challanItems.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      return sum + (prod ? Number(prod.unitPrice) * item.quantity : 0);
    }, 0);
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
              Delivery Challans
            </h1>
            <p style={{ color: "var(--text)", marginTop: "5px" }}>
              Generate shipping challans, manage dispatch states, and track inventory releases.
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
            onClick={handleOpenCreate}
          >
            + Create Challan
          </button>
        </div>

        {loading ? (
          <h3 style={{ color: "var(--text-h)" }}>Loading challans...</h3>
        ) : challans.length === 0 ? (
          <div
            style={{
              padding: "40px",
              background: "var(--code-bg)",
              borderRadius: "8px",
              textAlign: "center",
              border: "1px dashed var(--border)",
            }}
          >
            <p style={{ fontSize: "16px", color: "var(--text)" }}>No delivery challans recorded yet.</p>
          </div>
        ) : (
          <div
            style={{
              background: "var(--bg)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--code-bg)" }}>
                  <th style={tableHeader}>Challan Number</th>
                  <th style={tableHeader}>Date Created</th>
                  <th style={tableHeader}>Customer</th>
                  <th style={tableHeader}>Business</th>
                  <th style={tableHeader}>Total Quantity</th>
                  <th style={tableHeader}>Status</th>
                  <th style={{ ...tableHeader, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((challan) => (
                  <tr
                    key={challan.id}
                    style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => handleOpenDetail(challan.id)}
                  >
                    <td style={{ ...tableCell, fontWeight: "600", fontFamily: "var(--mono)" }}>
                      {challan.challanNumber}
                    </td>
                    <td style={tableCell}>
                      {new Date(challan.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ ...tableCell, color: "var(--text-h)", fontWeight: "500" }}>
                      {challan.customer?.name}
                    </td>
                    <td style={tableCell}>{challan.customer?.businessName || "—"}</td>
                    <td style={tableCell}>{challan.totalQuantity} units</td>
                    <td style={tableCell}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: "600",
                          fontSize: "13px",
                          background:
                            challan.status === "CONFIRMED"
                              ? "rgba(22, 163, 74, 0.15)"
                              : challan.status === "CANCELLED"
                              ? "rgba(220, 38, 38, 0.15)"
                              : "rgba(107, 99, 117, 0.15)",
                          color:
                            challan.status === "CONFIRMED"
                              ? "#16a34a"
                              : challan.status === "CANCELLED"
                              ? "#dc2626"
                              : "#6b6375",
                        }}
                      >
                        {challan.status}
                      </span>
                    </td>
                    <td style={{ ...tableCell, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        style={actionButtonEdit}
                        onClick={() => handleOpenDetail(challan.id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CREATE CHALLAN MODAL */}
        {showCreateModal && (
          <div style={modalOverlay}>
            <div style={{ ...modalContent, width: "700px" }}>
              <h2 style={{ color: "var(--text-h)", marginBottom: "20px" }}>Create Delivery Challan</h2>
              {formError && <div style={errorBanner}>{formError}</div>}

              <form onSubmit={handleCreateChallan}>
                <div style={formRow}>
                  <div style={formGroupHalf}>
                    <label style={labelStyle}>Select Customer *</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      style={inputStyle}
                      required
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.businessName ? `(${c.businessName})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={formGroupHalf}>
                    <label style={labelStyle}>Status *</label>
                    <select
                      value={challanStatus}
                      onChange={(e) => setChallanStatus(e.target.value as any)}
                      style={inputStyle}
                      required
                    >
                      <option value="DRAFT">DRAFT (Saves items only)</option>
                      <option value="CONFIRMED">CONFIRMED (Releases inventory)</option>
                    </select>
                  </div>
                </div>

                <div style={{ margin: "20px 0 10px" }}>
                  <label style={{ ...labelStyle, fontWeight: "600" }}>Challan Items</label>
                </div>

                {/* Items grid */}
                <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "15px" }}>
                  {challanItems.map((item, idx) => {
                    const selectedProd = products.find((p) => p.id === item.productId);
                    const subtotal = selectedProd ? Number(selectedProd.unitPrice) * item.quantity : 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                          style={{ ...inputStyle, flex: 3 }}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.name} (${Number(p.unitPrice).toFixed(2)}) (Stock: {p.currentStock})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />

                        <div style={{ flex: 1.2, textAlign: "right", fontSize: "14px", color: "var(--text-h)" }}>
                          ${subtotal.toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={challanItems.length <= 1}
                          style={{
                            padding: "8px",
                            background: "rgba(220, 38, 38, 0.1)",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={handleAddItemRow} style={cancelButton}>
                  + Add Item
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "20px",
                    padding: "15px",
                    background: "var(--code-bg)",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "var(--text-h)" }}>Total Valuation:</span>
                  <span style={{ fontWeight: "700", color: "var(--accent)" }}>
                    ${getFormValuation().toFixed(2)}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "30px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={submitButton}>
                    Generate Challan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CHALLAN DETAIL / INVOICE MODAL */}
        {showDetailModal && selectedChallan && (
          <div style={modalOverlay}>
            <div style={{ ...modalContent, width: "650px", textAlign: "left" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "15px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "var(--text-h)", fontFamily: "var(--mono)" }}>
                    {selectedChallan.challanNumber}
                  </h2>
                  <span style={{ fontSize: "14px", color: "var(--text)" }}>
                    Created by {selectedChallan.createdBy?.name} on{" "}
                    {new Date(selectedChallan.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontWeight: "600",
                    background:
                      selectedChallan.status === "CONFIRMED"
                        ? "rgba(22, 163, 74, 0.15)"
                        : selectedChallan.status === "CANCELLED"
                        ? "rgba(220, 38, 38, 0.15)"
                        : "rgba(107, 99, 117, 0.15)",
                    color:
                      selectedChallan.status === "CONFIRMED"
                        ? "#16a34a"
                        : selectedChallan.status === "CANCELLED"
                        ? "#dc2626"
                        : "#6b6375",
                  }}
                >
                  {selectedChallan.status}
                </span>
              </div>

              {/* Invoice Layout */}
              <div style={{ marginBottom: "25px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--text-h)", fontSize: "15px" }}>
                  Billed To / Ship To:
                </h4>
                <div style={{ padding: "12px", background: "var(--code-bg)", borderRadius: "6px" }}>
                  <strong style={{ color: "var(--text-h)" }}>{selectedChallan.customer?.name}</strong>
                  {selectedChallan.customer?.businessName && (
                    <div style={{ fontSize: "14px" }}>Business: {selectedChallan.customer.businessName}</div>
                  )}
                  {selectedChallan.customer?.gstNumber && (
                    <div style={{ fontSize: "14px" }}>GSTIN: {selectedChallan.customer.gstNumber}</div>
                  )}
                  <div style={{ fontSize: "14px" }}>Mobile: {selectedChallan.customer?.mobile}</div>
                  <div style={{ fontSize: "14px", marginTop: "4px" }}>
                    Address: {selectedChallan.customer?.address}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: "25px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--code-bg)", borderBottom: "1px solid var(--border)" }}>
                      <th style={itemTableHeader}>SKU</th>
                      <th style={itemTableHeader}>Product Name</th>
                      <th style={itemTableHeader}>Quantity</th>
                      <th style={itemTableHeader}>Unit Price</th>
                      <th style={{ ...itemTableHeader, textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.items?.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ ...itemTableCell, fontFamily: "var(--mono)" }}>{item.productSku}</td>
                        <td style={{ ...itemTableCell, color: "var(--text-h)", fontWeight: "500" }}>
                          {item.productName}
                        </td>
                        <td style={itemTableCell}>{item.quantity} units</td>
                        <td style={itemTableCell}>${Number(item.productUnitPrice).toFixed(2)}</td>
                        <td style={{ ...itemTableCell, textAlign: "right", fontWeight: "600", color: "var(--text-h)" }}>
                          ${(item.quantity * Number(item.productUnitPrice)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "6px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "15px",
                }}
              >
                <div style={{ fontSize: "14px" }}>
                  Total Quantity: <strong>{selectedChallan.totalQuantity} units</strong>
                </div>
                <div style={{ fontSize: "18px", color: "var(--text-h)" }}>
                  Grand Total:{" "}
                  <strong style={{ color: "var(--accent)" }}>
                    $
                    {selectedChallan.items
                      ?.reduce((sum, item) => sum + item.quantity * Number(item.productUnitPrice), 0)
                      .toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "30px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "20px",
                }}
              >
                <div>
                  {(selectedChallan.status === "DRAFT" || selectedChallan.status === "CANCELLED") && (
                    <button
                      onClick={() => handleDeleteChallan(selectedChallan.id)}
                      style={actionButtonDelete}
                    >
                      Delete Challan
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setShowDetailModal(false)} style={cancelButton}>
                    Close
                  </button>

                  {selectedChallan.status === "DRAFT" && (
                    <button
                      onClick={() => handleConfirmChallan(selectedChallan.id)}
                      style={{ ...submitButton, background: "#16a34a" }}
                    >
                      Confirm Dispatch
                    </button>
                  )}

                  {selectedChallan.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleCancelChallan(selectedChallan.id)}
                      style={{ ...submitButton, background: "#dc2626" }}
                    >
                      Cancel Delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
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

const itemTableHeader: React.CSSProperties = {
  padding: "10px",
  fontSize: "13px",
  color: "var(--text-h)",
  fontWeight: "600",
  textAlign: "left",
};

const itemTableCell: React.CSSProperties = {
  padding: "10px",
  fontSize: "14px",
  color: "var(--text)",
};

const actionButtonEdit: React.CSSProperties = {
  padding: "6px 12px",
  background: "var(--accent-bg)",
  color: "var(--accent)",
  border: "1px solid var(--accent-border)",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "500",
};

const actionButtonDelete: React.CSSProperties = {
  padding: "8px 16px",
  background: "rgba(220, 38, 38, 0.1)",
  color: "#dc2626",
  border: "1px solid rgba(220, 38, 38, 0.3)",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
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

export default Challans;
