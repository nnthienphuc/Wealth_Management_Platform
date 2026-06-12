import React, { useEffect, useState, useCallback, useMemo } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { formatDate } from "../../../utils/formatDate"; 
import { toast } from "react-toastify";
import { 
  PiggyBank, Wallet, Landmark, LineChart, Bitcoin, 
  CreditCard, Pencil, Trash2, X, Loader2, 
  ArchiveRestore, Trash, Eye, Search 
} from "lucide-react";
import { NumericFormat } from 'react-number-format';

const USD_TO_VND = 27000;

const formatVnd = (value) => {
  if (value == null || isNaN(value)) return "0 VND";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value)) + " VND";
};

const formatUsd = (value) => {
  if (value == null || isNaN(value)) return "$0";
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
};

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
  const [totalRecords, setTotalRecords] = useState(0); 
  const [keyword, setKeyword] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(9);

  const [loading, setLoading] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);

  // States lưu tổng tiền thực tế từ DB
  const [totalVnd, setTotalVnd] = useState(0);
  const [totalUsd, setTotalUsd] = useState(0);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [detailAccount, setDetailAccount] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "BANK",
    brokerAccountNo: "",
    currency: "VND",
    currentBalance: 0,
    note: "",
  });

  const totalPages = useMemo(() => Math.ceil(totalRecords / pageSize) || 1, [totalRecords, pageSize]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFormModalOpen(false);
        setDetailAccount(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchAccounts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const trimmed = keyword.trim();

      // GỌI ĐỒNG THỜI 2 API BẰNG PROMISE.ALL
      const accountsPromise = axiosInstance.get("/Accounts", {
        params: {
          accountName: trimmed || undefined,
          isDeleted: isTrashView, 
          pageNumber,
          pageSize
        }
      });

      // Chỉ gọi lấy tổng tiền nếu không phải đang ở Trash View
      const balancePromise = !isTrashView 
        ? axiosInstance.get("/Accounts/total-balance") 
        : Promise.resolve({ data: [] });

      const [resAccounts, resBalance] = await Promise.all([accountsPromise, balancePromise]);

      // 1. Xử lý danh sách Accounts
      const data = resAccounts.data?.result || resAccounts.data;
      if (data && data.items) {
        setAccounts(data.items);
        setTotalRecords(data.totalRecords);
      } else {
        setAccounts([]);
        setTotalRecords(0);
      }

      // 2. Xử lý số dư Tổng (API backend mới)
      if (!isTrashView) {
        const balances = resBalance.data?.result || resBalance.data || [];
        let vnd = 0;
        let usd = 0;
        balances.forEach(b => {
          if (b.currency?.toUpperCase() === "VND") vnd = b.total;
          if (b.currency?.toUpperCase() === "USD") usd = b.total;
        });
        setTotalVnd(vnd);
        setTotalUsd(usd);
      } else {
        setTotalVnd(0);
        setTotalUsd(0);
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }, [keyword, isTrashView, pageNumber, pageSize]);

  useEffect(() => {
    fetchAccounts();
  }, [pageNumber, isTrashView, fetchAccounts]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (keyword.trim() !== "") {
        setPageNumber(1);
        fetchAccounts(true);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [keyword]);

  // Tính Grand Total bằng cách quy đổi USD sang VND
  const grandTotalVnd = totalVnd + (totalUsd * USD_TO_VND);

  const openFormModal = (account = null) => {
    setFormError("");
    setFieldErrors({});
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name || "",
        type: account.type || "BANK",
        brokerAccountNo: account.brokerAccountNo !== "N/A" ? account.brokerAccountNo : "",
        currency: account.currency || "VND",
        currentBalance: account.currentBalance || 0,
        note: account.note !== "N/A" ? account.note : "",
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: "", type: "BANK", brokerAccountNo: "", currency: "VND",
        currentBalance: 0, note: "",
      });
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingAccount(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Account Name is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setFormError("");
    
    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      brokerAccountNo: formData.brokerAccountNo.trim() || null,
      currency: formData.currency,
      currentBalance: Number(formData.currentBalance),
      note: formData.note.trim() || null,
    };

    try {
      let res;
      if (editingAccount) {
        res = await axiosInstance.put(`/Accounts/${editingAccount.id}`, payload);
      } else {
        res = await axiosInstance.post("/Accounts", payload);
      }
      toast.success(res.data?.message || "Account saved successfully.");
      closeFormModal();
      fetchAccounts();
    } catch (err) {
      setFormError(err.response?.data?.message || "An error occurred while saving the account.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (account, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Move account "${account.name}" to recycle bin?`)) return;
    try {
      const res = await axiosInstance.delete(`/Accounts/${account.id}`);
      toast.success(res.data?.message || "Account moved to recycle bin.");
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account.");
    }
  };

  const handleRestore = async (account, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await axiosInstance.put(`/Accounts/${account.id}/restore`);
      toast.success(res.data?.message || "Account restored successfully.");
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore account.");
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        
        {/* HEADER */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              {isTrashView ? "Recycle Bin (Accounts)" : "Account Management"}
              {loading && <Loader2 className="animate-spin text-pink-500" size={22} />}
            </h3>
            {!isTrashView ? (
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
            ) : (
              <div className="text-sm text-gray-500 mt-2">
                Deleted accounts. You can restore them at any time.
              </div>
            )}
          </div>

          {/* SEARCH & ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64 flex items-center">
              <Search size={14} className="absolute left-4 text-pink-400" />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-9 pr-5 py-3 rounded-full border border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white text-gray-800 text-sm shadow-[0_8px_18px_rgba(236,72,153,0.08)]"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {!isTrashView && !loading && (
              <div className="hidden md:flex items-center px-4 h-10 border-l border-gray-200 ml-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{totalRecords} items</span>
              </div>
            )}
            
            <button
              onClick={() => setIsTrashView(!isTrashView)}
              className={`w-full sm:w-auto whitespace-nowrap px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                isTrashView 
                  ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" 
                  : "bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
              }`}
            >
              {isTrashView ? (
                <>Back to Active</>
              ) : (
                <><Trash size={16} /> Recycle Bin</>
              )}
            </button>

            {!isTrashView && (
              <button
                onClick={() => openFormModal()}
                className="w-full sm:w-auto whitespace-nowrap px-6 py-3 rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold text-sm shadow-[0_10px_20px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(236,72,153,0.4)] transition-all"
              >
                + ADD ACCOUNT
              </button>
            )}
          </div>
        </div>

        {/* CARDS GRID */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          {!loading && accounts.length === 0 && (
            <p className="text-gray-500 text-sm col-span-full text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
              {isTrashView ? "Recycle bin is empty." : "No accounts found. Create one now!"}
            </p>
          )}

          {accounts.map((acc) => {
            const visual = getIconByType(acc.type);
            const balanceText = acc.currency === "USD" ? formatUsd(acc.totalBalance) : formatVnd(acc.totalBalance);
            const isInvestment = ["SECURITIES", "CRYPTO"].includes(acc.type?.toUpperCase());

            return (
              <div
                key={acc.id}
                className={`bg-white rounded-2xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all border border-transparent hover:border-pink-50 flex flex-col group cursor-pointer h-full ${isTrashView ? "opacity-75 hover:opacity-100 grayscale-[20%]" : ""}`}
                onClick={() => setDetailAccount(acc)}
              >
                <div className="flex items-start justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${visual.bg} ${visual.text}`}>
                      {React.cloneElement(visual.icon, { size: 16 })}
                    </div>
                    <div className="truncate">
                      <div className="text-[13px] font-bold text-gray-900 truncate flex items-center gap-1.5">
                        {acc.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{acc.type}</span>
                        {isTrashView && (
                          <span className="px-1 py-[1px] bg-red-100 text-red-600 text-[8px] rounded-sm uppercase tracking-widest font-bold">Deleted</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setDetailAccount(acc); }} title="View Details" className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-emerald-500 transition-colors">
                      <Eye size={12} />
                    </button>
                    
                    {isTrashView ? (
                      <button onClick={(e) => handleRestore(acc, e)} title="Restore" className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                        <ArchiveRestore size={12} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); openFormModal(acc); }} title="Edit" className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(acc, e); }} title="Delete" className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* KHỐI XÁM - NỚI CHIỀU CAO LÊN 104PX VÀ THÊM SHRINK-0 ĐỂ KHÔNG BỊ ẨN TEXT */}
                <div className="bg-gray-50/50 rounded-xl p-3 mb-2.5 border border-gray-100 h-[104px] flex flex-col justify-center shrink-0">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 shrink-0">{isInvestment ? "Total Balance" : "Balance"}</div>
                  <div className="text-[17px] font-black text-gray-900 truncate shrink-0">{balanceText}</div>
                  
                  {isInvestment && (
                    <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-gray-200/60 shrink-0">
                      <div>
                        <div className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Invested</div>
                        <div className="text-[11px] font-bold text-gray-800 truncate">{acc.currency === "USD" ? formatUsd(acc.investedBalance) : formatVnd(acc.investedBalance)}</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Available Cash</div>
                        <div className="text-[11px] font-bold text-gray-800 truncate">{acc.currency === "USD" ? formatUsd(acc.currentBalance) : formatVnd(acc.currentBalance)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* THÔNG TIN PHỤ */}
                <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium px-1 mt-auto shrink-0">
                  <div>{acc.brokerAccountNo && acc.brokerAccountNo !== "N/A" ? `Account No: ${acc.brokerAccountNo}` : "No Broker ID"}</div>
                  <div>Updated: {formatDate(acc.updatedAt)}</div>
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

        {/* ========================================================
            MODAL 1: FORM THÊM / SỬA TÀI KHOẢN (TRUNG TÂM)
        ======================================================== */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
              
              <button onClick={closeFormModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-1.5 transition-all">
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {editingAccount ? "Edit Account" : "Add Account"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter account details. Crypto wallets should default to USD currency.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Account Name *</label>
                    <input 
                      name="name" value={formData.name} onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 bg-gray-50 transition-all ${fieldErrors.name ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-100'}`}
                      placeholder="e.g. TCBS, Binance..."
                    />
                    {fieldErrors.name && <p className="text-red-500 text-[11px] mt-1.5">{fieldErrors.name}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 cursor-pointer transition-all">
                      <option value="BANK">Bank</option>
                      <option value="CASH">Cash</option>
                      <option value="SAVINGS">Savings</option>
                      <option value="SECURITIES">Securities</option>
                      <option value="CRYPTO">Crypto</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Currency *</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 cursor-pointer transition-all">
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Broker Account No</label>
                    <input 
                      name="brokerAccountNo" value={formData.brokerAccountNo} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 transition-all"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Current Balance *</label>
                    <NumericFormat
                      thousandSeparator=","  
                      decimalScale={2}       
                      allowNegative={false}  
                      value={formData.currentBalance}
                      name="currentBalance"
                      placeholder="0"
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 bg-gray-50 transition-all ${
                        fieldErrors.currentBalance ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-100'
                      }`}
                      onValueChange={(values) => {
                        const { value } = values; 
                        setFormData(prev => ({
                          ...prev,
                          currentBalance: value
                        }));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Note</label>
                  <textarea 
                    name="note" value={formData.note} onChange={handleChange} rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 resize-none transition-all"
                    placeholder="Add a note..."
                  />
                </div>

                {formError && <p className="text-red-600 text-xs font-medium text-center">{formError}</p>}

                <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                  <button type="button" onClick={closeFormModal} className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="px-7 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-sm shadow-[0_8px_15px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-60">
                    {isSaving ? "Saving..." : (editingAccount ? "Save changes" : "Create account")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 2: XEM CHI TIẾT TÀI KHOẢN (MODAL TRUNG TÂM LỚN)
        ======================================================== */}
        {detailAccount && (() => {
          const isInvestment = ["SECURITIES", "CRYPTO"].includes(detailAccount.type?.toUpperCase());
          
          return (
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
              onClick={() => setDetailAccount(null)}
            >
              <div 
                className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()} 
              >
                <button 
                  onClick={() => setDetailAccount(null)} 
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-1.5 transition-all"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-8 mt-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${getIconByType(detailAccount.type).bg} ${getIconByType(detailAccount.type).text}`}>
                    {getIconByType(detailAccount.type).icon}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 text-center">{detailAccount.name}</h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[11px] rounded-full uppercase tracking-widest font-bold mt-3">
                    {detailAccount.type}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200 mb-8 text-center shadow-sm">
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">{isInvestment ? "Total Balance" : "Balance"}</div>
                  <div className="text-3xl font-black text-gray-900">
                    {detailAccount.currency === "USD" ? formatUsd(detailAccount.totalBalance) : formatVnd(detailAccount.totalBalance)}
                  </div>
                </div>

                <div className="space-y-4 text-sm mb-6 px-2">
                  {isInvestment && (
                    <>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Invested Balance</span>
                        <span className="font-bold text-gray-900">{detailAccount.currency === "USD" ? formatUsd(detailAccount.investedBalance) : formatVnd(detailAccount.investedBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Available Cash</span>
                        <span className="font-bold text-gray-900">{detailAccount.currency === "USD" ? formatUsd(detailAccount.currentBalance) : formatVnd(detailAccount.currentBalance)}</span>
                      </div>
                    </>
                  )}
                  {detailAccount.brokerAccountNo && detailAccount.brokerAccountNo !== "N/A" && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Broker Account</span>
                      <span className="font-bold text-gray-900">{detailAccount.brokerAccountNo}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Created On</span>
                    <span className="font-bold text-gray-900">{formatDate(detailAccount.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Last Updated</span>
                    <span className="font-bold text-gray-900">{formatDate(detailAccount.updatedAt)}</span>
                  </div>
                </div>

                {detailAccount.note && detailAccount.note !== "N/A" && (
                  <div className="px-2 mt-2">
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Notes</div>
                    <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-yellow-800 text-sm italic leading-relaxed">
                      "{detailAccount.note}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}