import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation?: string;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: "", sku: "", category: "", unitPrice: "",
  initialStock: "", minStockAlert: "", warehouseLocation: "",
};

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/products", { headers });
      setProducts(res.data.products);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))].sort();
    return ["All", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchCat = categoryFilter === "All" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const setField = (k: keyof typeof emptyForm, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(emptyForm); setFormError(""); setShowAdd(true); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, sku: p.sku, category: p.category,
      unitPrice: String(p.unitPrice), initialStock: String(p.currentStock),
      minStockAlert: String(p.minStockAlert), warehouseLocation: p.warehouseLocation || "",
    });
    setFormError(""); setCurrent(p); setShowEdit(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!form.name || !form.sku || !form.category || !form.unitPrice) {
      setFormError("Name, SKU, Category, and Unit Price are required."); return;
    }
    try {
      await axios.post("http://localhost:5000/api/products", {
        name: form.name, sku: form.sku, category: form.category,
        unitPrice: parseFloat(form.unitPrice), initialStock: parseInt(form.initialStock) || 0,
        minStockAlert: parseInt(form.minStockAlert) || 0,
        warehouseLocation: form.warehouseLocation || null,
      }, { headers });
      setShowAdd(false); fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create product.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!form.name || !form.sku || !form.category || !form.unitPrice || !current) {
      setFormError("Name, SKU, Category, and Unit Price are required."); return;
    }
    try {
      await axios.put(`http://localhost:5000/api/products/${current.id}`, {
        name: form.name, sku: form.sku, category: form.category,
        unitPrice: parseFloat(form.unitPrice),
        minStockAlert: parseInt(form.minStockAlert) || 0,
        warehouseLocation: form.warehouseLocation || null,
      }, { headers });
      setShowEdit(false); fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to update product.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, { headers });
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const ProductForm = ({ onSubmit, title, submitLabel, isEdit }: {
    onSubmit: (e: React.FormEvent) => void;
    title: string; submitLabel: string; isEdit?: boolean;
  }) => (
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
                <label>Product Name *</label>
                <input className="form-input" value={form.name} onChange={e => setField("name", e.target.value)} required />
              </div>
              <div className="form-field">
                <label>SKU / Code *</label>
                <input className="form-input" value={form.sku} onChange={e => setField("sku", e.target.value)} disabled={isEdit} required />
              </div>
              <div className="form-field">
                <label>Category *</label>
                <input className="form-input" placeholder="e.g. Electronics, Accessories" value={form.category} onChange={e => setField("category", e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Unit Price (₹) *</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.unitPrice} onChange={e => setField("unitPrice", e.target.value)} required />
              </div>
              {!isEdit && (
                <div className="form-field">
                  <label>Initial Stock</label>
                  <input className="form-input" type="number" min="0" value={form.initialStock} onChange={e => setField("initialStock", e.target.value)} />
                </div>
              )}
              <div className="form-field">
                <label>Min Stock Alert</label>
                <input className="form-input" type="number" min="0" value={form.minStockAlert} onChange={e => setField("minStockAlert", e.target.value)} />
              </div>
            </div>
            <div className="form-field" style={{ marginTop: "16px" }}>
              <label>Warehouse Location</label>
              <input className="form-input" placeholder="e.g. Aisle B, Shelf 2" value={form.warehouseLocation} onChange={e => setField("warehouseLocation", e.target.value)} />
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
            <h1>Products</h1>
            <p>Manage your product catalog, pricing, and stock alert thresholds.</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Product
          </button>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input className="search-input" placeholder="Search by name, SKU, category..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>
            {filtered.length} of {products.length} products
          </span>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><p>No products found.</p></div></div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Min Alert</th>
                  <th>Location</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id} style={{ cursor: "default" }}>
                      <td className="td-mono">{p.sku}</td>
                      <td className="td-primary">{p.name}</td>
                      <td><span className="badge badge-gray">{p.category}</span></td>
                      <td style={{ color: "#a5b4fc", fontWeight: 600 }}>
                        ₹{Number(p.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: isLow ? "#ef4444" : "#22c55e" }}>
                          {p.currentStock} {isLow && "⚠️"}
                        </span>
                      </td>
                      <td style={{ color: "rgba(255,255,255,0.45)" }}>{p.minStockAlert}</td>
                      <td style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>{p.warehouseLocation || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost btn-sm" style={{ marginRight: "6px" }} onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showAdd && <ProductForm onSubmit={handleAdd} title="Add New Product" submitLabel="Create Product" />}
        {showEdit && <ProductForm onSubmit={handleEdit} title="Edit Product" submitLabel="Save Changes" isEdit />}
      </div>
    </div>
  );
}

export default Products;
