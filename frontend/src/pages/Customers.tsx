import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface FollowUp {
  id: string;
  note: string;
  followUpDate: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
}

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  customerType: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
}

const emptyForm = {
  name: "", mobile: "", email: "", businessName: "",
  gstNumber: "", customerType: "RETAIL" as Customer["customerType"],
  address: "", status: "LEAD" as Customer["status"], followUpDate: "", notes: "",
};

const statusBadge = (s: string) => {
  if (s === "ACTIVE")   return "badge badge-green";
  if (s === "INACTIVE") return "badge badge-red";
  return "badge badge-yellow";
};
const typeBadge = (t: string) => {
  if (t === "WHOLESALE")   return "badge badge-blue";
  if (t === "DISTRIBUTOR") return "badge badge-purple";
  return "badge badge-gray";
};

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/customers", { headers });
      setCustomers(res.data.customers);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(c => {
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.businessName || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchType   = typeFilter   === "ALL" || c.customerType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [customers, search, statusFilter, typeFilter]);

  const setField = (k: keyof typeof emptyForm, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(emptyForm); setFormError(""); setShowAdd(true); };
  const openEdit = (c: Customer) => {
    setForm({
      name: c.name, mobile: c.mobile, email: c.email || "",
      businessName: c.businessName || "", gstNumber: c.gstNumber || "",
      customerType: c.customerType, address: c.address, status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.split("T")[0] : "",
      notes: c.notes || "",
    });
    setFormError("");
    setSelected(c);
    setShowEdit(true);
  };
  const openDetail = async (id: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/customers/${id}`, { headers });
      setSelected(res.data.customer);
      setFollowUpNote(""); setFollowUpDate("");
      setShowDetail(true);
    } catch { alert("Failed to load customer details."); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!form.name || !form.mobile || !form.address) {
      setFormError("Name, Mobile, and Address are required."); return;
    }
    try {
      await axios.post("http://localhost:5000/api/customers", {
        ...form, email: form.email || null, businessName: form.businessName || null,
        gstNumber: form.gstNumber || null, followUpDate: form.followUpDate || null,
        notes: form.notes || null,
      }, { headers });
      setShowAdd(false); fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create customer.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!form.name || !form.mobile || !form.address || !selected) {
      setFormError("Name, Mobile, and Address are required."); return;
    }
    try {
      await axios.put(`http://localhost:5000/api/customers/${selected.id}`, {
        ...form, email: form.email || null, businessName: form.businessName || null,
        gstNumber: form.gstNumber || null, followUpDate: form.followUpDate || null,
        notes: form.notes || null,
      }, { headers });
      setShowEdit(false); fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to update customer.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/customers/${id}`, { headers });
      fetchCustomers();
      if (selected?.id === id) setShowDetail(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete customer.");
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNote || !selected) return;
    try {
      await axios.post(
        `http://localhost:5000/api/customers/${selected.id}/follow-ups`,
        { note: followUpNote, followUpDate: followUpDate || null },
        { headers },
      );
      openDetail(selected.id);
      fetchCustomers();
    } catch { alert("Failed to save follow-up."); }
  };

  const CustomerForm = ({ onSubmit, title, submitLabel }: { onSubmit: (e: React.FormEvent) => void, title: string, submitLabel: string }) => (
    <div className="modal-overlay" onClick={() => { setShowAdd(false); setShowEdit(false); }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={() => { setShowAdd(false); setShowEdit(false); }}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="form-grid">
              <div className="form-field">
                <label>Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setField("name", e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Mobile Number *</label>
                <input className="form-input" value={form.mobile} onChange={e => setField("mobile", e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setField("email", e.target.value)} />
              </div>
              <div className="form-field">
                <label>Customer Type *</label>
                <select className="form-select" value={form.customerType} onChange={e => setField("customerType", e.target.value as any)}>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
              </div>
              <div className="form-field">
                <label>Business Name</label>
                <input className="form-input" value={form.businessName} onChange={e => setField("businessName", e.target.value)} />
              </div>
              <div className="form-field">
                <label>GST Number</label>
                <input className="form-input" placeholder="07AAAAA1111A1Z1" value={form.gstNumber} onChange={e => setField("gstNumber", e.target.value)} />
              </div>
              <div className="form-field">
                <label>CRM Status</label>
                <select className="form-select" value={form.status} onChange={e => setField("status", e.target.value as any)}>
                  <option value="LEAD">Lead (Prospect)</option>
                  <option value="ACTIVE">Active (Deal Made)</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="form-field">
                <label>Next Follow-up Date</label>
                <input className="form-input" type="date" value={form.followUpDate} onChange={e => setField("followUpDate", e.target.value)} />
              </div>
            </div>
            <div className="form-field" style={{ marginTop: "16px" }}>
              <label>Address *</label>
              <input className="form-input" value={form.address} onChange={e => setField("address", e.target.value)} required />
            </div>
            <div className="form-field" style={{ marginTop: "16px" }}>
              <label>Notes / Internal Comments</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setField("notes", e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => { setShowAdd(false); setShowEdit(false); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="page-root">
      <Sidebar />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Customers CRM</h1>
            <p>Manage client relationships, record follow-ups, and track business prospects.</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Customer
          </button>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              className="search-input"
              placeholder="Search by name, mobile, business..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>
            {filtered.length} of {customers.length} customers
          </span>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="18" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p>{search || statusFilter !== "ALL" || typeFilter !== "ALL" ? "No customers match your search." : "No customers yet. Add your first customer."}</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => openDetail(c.id)}>
                    <td className="td-primary">{c.name}</td>
                    <td>{c.businessName || "—"}</td>
                    <td className="td-mono">{c.mobile}</td>
                    <td><span className={typeBadge(c.customerType)}>{c.customerType}</span></td>
                    <td><span className={statusBadge(c.status)}>{c.status}</span></td>
                    <td style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" style={{ marginRight: "6px" }} onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={e => handleDelete(c.id, e)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ADD MODAL */}
        {showAdd && <CustomerForm onSubmit={handleAdd} title="Add New Customer" submitLabel="Create Customer" />}

        {/* EDIT MODAL */}
        {showEdit && <CustomerForm onSubmit={handleEdit} title="Edit Customer" submitLabel="Save Changes" />}

        {/* DETAIL MODAL */}
        {showDetail && selected && (
          <div className="modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{selected.name}</h2>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Customer Profile &amp; CRM Follow-ups</span>
                </div>
                <button className="modal-close" onClick={() => setShowDetail(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" }}>
                  {/* Info panel */}
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "12px" }}>Customer Info</p>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px" }}>
                      {[
                        ["Business", selected.businessName || "—"],
                        ["Mobile", selected.mobile],
                        ["Email", selected.email || "—"],
                        ["GSTIN", selected.gstNumber || "—"],
                        ["Address", selected.address],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{k}</span>
                          <div style={{ color: "#f0f1f5", marginTop: "2px" }}>{v}</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <span className={typeBadge(selected.customerType)}>{selected.customerType}</span>
                        <span className={statusBadge(selected.status)}>{selected.status}</span>
                      </div>
                      {selected.notes && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "10px" }}>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Notes</span>
                          <div style={{ color: "rgba(255,255,255,0.6)", fontStyle: "italic", marginTop: "4px", fontSize: "13px" }}>{selected.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-up panel */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.7px", margin: 0 }}>CRM Follow-up History</p>

                    {/* Add note */}
                    <form onSubmit={handleAddFollowUp} style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input className="form-input" placeholder="Log a follow-up note..." value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} required />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input className="form-input" type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ flex: 1 }} />
                        <button type="submit" className="btn btn-primary btn-sm">+ Log Note</button>
                      </div>
                    </form>

                    {/* History */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto" }}>
                      {(selected.followUps || []).length === 0 ? (
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No follow-ups recorded yet.</p>
                      ) : [...(selected.followUps || [])].reverse().map(fu => (
                        <div key={fu.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px 14px" }}>
                          <div style={{ fontSize: "13.5px", color: "#f0f1f5" }}>{fu.note}</div>
                          <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.35)", marginTop: "6px", display: "flex", gap: "10px" }}>
                            <span>by {fu.createdBy?.name}</span>
                            <span>·</span>
                            <span>{new Date(fu.createdAt).toLocaleDateString("en-IN")}</span>
                            {fu.followUpDate && <><span>·</span><span>Next: {new Date(fu.followUpDate).toLocaleDateString("en-IN")}</span></>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => { setShowDetail(false); openEdit(selected); }}>Edit Customer</button>
                <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;