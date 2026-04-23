import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { 
  PiggyBank, Wallet, Landmark, LineChart, Bitcoin, 
  CreditCard, Pencil, Trash2, X, Loader2 
} from "lucide-react";

const USD_TO_VND = 27000;

const formatVnd = (value) => {
  if (value == null || isNaN(value)) return "0 VND";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value)) + " VND";
};

const formatUsd = (value) => {
  if (value == null || isNaN(value)) return "$0";
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
};

// Map Icon và Màu sắc dựa theo Type (Khớp với hình ảnh sếp)
const getIconByType = (type) => {
  switch (type?.toUpperCase()) {
    case "SAVINGS": return { icon: <PiggyBank size={20} />, bg: "bg-orange-50", text: "text-orange-500" };
    case "CASH": return { icon: <Wallet size={20} />, bg: "bg-green-50", text: "text-green-500" };
    case "SECURITIES": return { icon: <LineChart size={20} />, bg: "bg-blue-50", text: "text-blue-500" };
    case "CRYPTO": return { icon: <Bitcoin size={20} />, bg: "bg-yellow-50", text: "text-yellow-500" };
    case "CREDIT": return { icon: <CreditCard size={20} />, bg: "bg-emerald-50", text: "text-emerald-500" };
    case "BANK":
    default: return { icon: <Landmark size={20} />, bg: "bg-emerald-50", text: "text-emerald-500" };
  }
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);

  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "BANK",
    brokerAccountNo: "",
    currency: "VND",
    investedBalance: 0,
    currentBalance: 0,
    note: "",
    isDeleted: false,
  });

  // 1. Fetch Data
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const trimmed = keyword.trim();
      const res = await axiosInstance.get("/Accounts", {
        params: {
          accountName: trimmed || undefined,
          pageNumber,
          pageSize
        }
      });
      const data = res.data?.result || res.data;
      if (data && data.items) {
        setAccounts(data.items);
        setTotalPages(Math.ceil(data.totalRecords / pageSize));
      } else {
        setAccounts([]);
        setTotalPages(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không tải được danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }, [keyword, pageNumber, pageSize]);

  // Debounce search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (pageNumber !== 1) setPageNumber(1);
      else fetchAccounts();
    }, 500);
    return () => clearTimeout(delay);
  }, [keyword]);

  useEffect(() => {
    fetchAccounts();
  }, [pageNumber, fetchAccounts]);

  // 2. Tính Tổng (Chỉ tính trên trang hiện tại hoặc sếp có thể đổi logic tuỳ ý)
  const totalVnd = accounts.reduce((sum, acc) => acc.currency === "VND" ? sum + acc.totalBalance : sum, 0);
  const totalUsd = accounts.reduce((sum, acc) => acc.currency === "USD" ? sum + acc.totalBalance : sum, 0);
  const grandTotalVnd = totalVnd + (totalUsd * USD_TO_VND);

  // 3. Modal Handlers
  const openModal = (account = null) => {
    setFormError("");
    setFieldErrors({});
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name || "",
        type: account.type || "BANK",
        brokerAccountNo: account.brokerAccountNo !== "N/A" ? account.brokerAccountNo : "",
        currency: account.currency || "VND",
        investedBalance: account.investedBalance || 0,
        currentBalance: account.currentBalance || 0,
        note: account.note !== "N/A" ? account.note : "",
        isDeleted: !!account.isDeleted,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: "", type: "BANK", brokerAccountNo: "", currency: "VND",
        investedBalance: 0, currentBalance: 0, note: "", isDeleted: false,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Account Name is required.";
    if (Number(formData.investedBalance) < 0) errs.investedBalance = "Must be >= 0.";
    if (Number(formData.currentBalance) < 0) errs.currentBalance = "Must be >= 0.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 4. Submit Add/Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setFormError("");
    const payload = {
      ...formData,
      name: formData.name.trim(),
      brokerAccountNo: formData.brokerAccountNo.trim() || null,
      note: formData.note.trim() || null,
      investedBalance: Number(formData.investedBalance),
      currentBalance: Number(formData.currentBalance),
    };

    try {
      let res;
      if (editingAccount) {
        res = await axiosInstance.put(`/Accounts/${editingAccount.id}`, payload);
      } else {
        res = await axiosInstance.post("/Accounts", payload);
      }
      toast.success(res.data?.message || "Lưu tài khoản thành công.", { toastId: "acc-save" });
      closeModal();
      fetchAccounts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Có lỗi xảy ra khi lưu tài khoản.");
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Delete Account
  const handleDelete = async (account) => {
    if (!window.confirm(`Xóa tài khoản "${account.name}"?`)) return;
    try {
      const res = await axiosInstance.delete(`/Accounts/${account.id}`);
      toast.success(res.data?.message || "Xóa tài khoản thành công.", { toastId: "acc-del" });
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa tài khoản.", { toastId: "acc-del-err" });
    }
  };

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        
        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              Account Management
              {loading && <Loader2 className="animate-spin text-pink-500" size={22} />}
            </h3>
            <div className="text-sm text-gray-500 mt-2">
              Total Balance: <span className="font-bold text-gray-900">{formatVnd(totalVnd)}</span>
              {totalUsd > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-bold text-gray-900">{formatUsd(totalUsd)}</span>
                </>
              )}
              <span className="mx-2">≈</span>
              <span className="font-bold text-gray-900">{formatVnd(grandTotalVnd)}</span>
              <div className="text-[11px] text-gray-400 mt-1">
                Crypto values are in USD. 1 USD = {new Intl.NumberFormat("en-US").format(USD_TO_VND)} VND
              </div>
            </div>
          </div>

          {/* SEARCH & ADD */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full sm:w-64 px-5 py-3 rounded-full border border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white text-gray-800 text-sm shadow-[0_8px_18px_rgba(236,72,153,0.08)]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto whitespace-nowrap px-6 py-3 rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold text-sm shadow-[0_10px_20px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(236,72,153,0.4)] transition-all"
            >
              + ADD ACCOUNT
            </button>
          </div>
        </div>

        {/* CARDS GRID */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          {!loading && accounts.length === 0 && (
            <p className="text-gray-500 text-sm col-span-full text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                No accounts found. Try adjusting your search or add a new account.
            </p>
          )}

          {accounts.map((acc) => {
            const visual = getIconByType(acc.type);
            const createdText = acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("vi-VN") : "";
            const balanceText = acc.currency === "USD" ? formatUsd(acc.totalBalance) : formatVnd(acc.totalBalance);

            return (
              <div
                key={acc.id}
                className="bg-white rounded-[1.25rem] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(15,23,42,0.08)] transition-all border border-transparent hover:border-pink-50 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* ICON */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${visual.bg} ${visual.text}`}>
                    {visual.icon}
                  </div>
                  
                  {/* INFO */}
                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                      {acc.name}
                      {acc.isDeleted && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] rounded-full uppercase tracking-widest font-bold">Deleted</span>
                      )}
                    </div>
                    <div className="text-[15px] font-extrabold text-gray-900 mt-1 truncate">
                      {balanceText}
                    </div>
                    {createdText && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        Created: {createdText}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(acc)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(acc)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600">
              Page <span className="font-bold text-gray-900">{pageNumber}</span> of {totalPages}
            </span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
              
              <button onClick={closeModal} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-1 transition-colors">
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {editingAccount ? "Edit Account" : "Add Account"}
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                {editingAccount ? "Update the details of your account. Changes will be reflected in your portfolio overview." : "Create a new account to start tracking your investments. You can edit or delete it later."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">Account Name *</label>
                    <input 
                      name="name" value={formData.name} onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 bg-gray-50 ${fieldErrors.name ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-100'}`}
                      placeholder="e.g. TCBS, Binance..."
                    />
                    {fieldErrors.name && <p className="text-red-500 text-[11px] mt-1">{fieldErrors.name}</p>}
                  </div>

                  {/* Type */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 cursor-pointer">
                      <option value="BANK">Bank</option>
                      <option value="CASH">Cash</option>
                      <option value="SAVINGS">Savings</option>
                      <option value="SECURITIES">Securities</option>
                      <option value="CRYPTO">Crypto</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                  
                  {/* Currency */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">Currency *</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 cursor-pointer">
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  {/* Broker Account No */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">Broker Account No</label>
                    <input 
                      name="brokerAccountNo" value={formData.brokerAccountNo} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Invested Balance */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">Invested Balance *</label>
                    <input 
                      type="number" step="any" min="0"
                      name="investedBalance" value={formData.investedBalance} onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 bg-gray-50 ${fieldErrors.investedBalance ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-100'}`}
                    />
                  </div>

                  {/* Current Balance */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">Current Balance *</label>
                    <input 
                      type="number" step="any" min="0"
                      name="currentBalance" value={formData.currentBalance} onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 bg-gray-50 ${fieldErrors.currentBalance ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-100'}`}
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">Note</label>
                  <textarea 
                    name="note" value={formData.note} onChange={handleChange} rows={2}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 resize-none"
                    placeholder="Thêm ghi chú..."
                  />
                </div>

                {/* IsDeleted */}
                <label className="flex items-center gap-2 text-[13px] font-medium text-gray-600 cursor-pointer pt-2">
                  <input 
                    type="checkbox" name="isDeleted" checked={formData.isDeleted} onChange={handleChange}
                    className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-gray-300"
                  />
                  Đánh dấu tài khoản đã xóa (IsDeleted)
                </label>

                {formError && <p className="text-red-600 text-xs font-medium text-center">{formError}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-sm shadow-[0_8px_15px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-60">
                    {isSaving ? "Saving..." : (editingAccount ? "Save changes" : "Create account")}
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