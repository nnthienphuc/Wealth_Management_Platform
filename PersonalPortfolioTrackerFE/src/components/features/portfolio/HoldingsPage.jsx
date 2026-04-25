import React, { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { formatDate } from "../../../utils/formatDate"; 
import { toast } from "react-toastify";
import { 
  LineChart, Bitcoin, PieChart, ScrollText, CircleDollarSign, 
  Pencil, Trash2, X, Loader2, ArchiveRestore, Trash, Eye,
  ChevronDown, PiggyBank, Wallet, Landmark, CreditCard, Search
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const USD_TO_VND = 27000;

// === FORMATTERS & HELPERS ===
const checkIsCrypto = (typeCode) => {
  const code = (typeCode || "").toUpperCase();
  return code.includes("COIN") || code.includes("CRYPTO");
};

const formatMoney = (value, isCrypto = false, isVndDisplay = false) => {
  if (value == null || isNaN(value)) return "0";
  const num = Number(value);
  if (isCrypto) {
    return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(num);
  }
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: isVndDisplay ? 0 : 2 }).format(num) + " ₫";
};

const formatPercent = (rate) => {
  if (rate == null || !Number.isFinite(rate)) return "0%";
  const percent = rate * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
};

const getPnLColor = (value) => {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-rose-500";
  return "text-gray-500";
};

const getRawIcon = (typeCode, size = 18) => {
  const id = (typeCode || "").toUpperCase();
  if (id.includes("STOCK") || id.includes("CHỨNG KHOÁN")) return <LineChart size={size} />;
  if (id.includes("CRYPTO") || id.includes("COIN")) return <Bitcoin size={size} />;
  if (id.includes("FUND") || id.includes("QUỸ")) return <PieChart size={size} />;
  if (id.includes("BOND") || id.includes("TRÁI PHIẾU")) return <ScrollText size={size} />;
  return <CircleDollarSign size={size} />;
};

const getAccountIcon = (type, size = 18) => {
  switch (type?.toUpperCase()) {
    case "SAVINGS": return <PiggyBank size={size} className="text-orange-500" />;
    case "CASH": return <Wallet size={size} className="text-green-500" />;
    case "SECURITIES": return <LineChart size={size} className="text-blue-500" />;
    case "CRYPTO": return <Bitcoin size={size} className="text-yellow-500" />;
    case "CREDIT": return <CreditCard size={size} className="text-emerald-500" />;
    case "BANK":
    default: return <Landmark size={size} className="text-emerald-500" />;
  }
};

const markdownComponents = {
  h1: (props) => <h1 className="text-base font-bold mt-4 mb-2" {...props} />,
  h2: (props) => <h2 className="text-sm font-bold mt-3 mb-1" {...props} />,
  p: (props) => <p className="my-2 leading-relaxed" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
  strong: (props) => <strong className="font-bold text-gray-900" {...props} />,
  img: ({ node, ...props }) => (
    <img {...props} className="max-w-full h-auto rounded-xl my-4 border border-gray-200 shadow-sm mx-auto block" alt="markdown-img" />
  ),
  code: ({ inline, children, ...props }) => 
    inline 
      ? <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-semibold" {...props}>{children}</code> 
      : <pre className="bg-slate-800 text-gray-50 p-4 rounded-xl overflow-x-auto text-xs my-3 shadow-inner custom-scrollbar"><code {...props}>{String(children).replace(/\n$/, "")}</code></pre>
};

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState([]);
  const [accounts, setAccounts] = useState([]); 
  
  const [keyword, setKeyword] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(""); 
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);

  const [loading, setLoading] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);

  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false);
  const accDropdownRef = useRef(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [noteMode, setNoteMode] = useState("edit"); 
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isFormAccDropdownOpen, setIsFormAccDropdownOpen] = useState(false);
  const formAccDropdownRef = useRef(null);

  const [detailHolding, setDetailHolding] = useState(null);

  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);
  const [tickerTypes, setTickerTypes] = useState([]);
  const [tickerSearchType, setTickerSearchType] = useState("");
  const [tickerSearchKeyword, setTickerSearchKeyword] = useState("");
  const [tickerSearchResults, setTickerSearchResults] = useState([]);
  const [isSearchingTickers, setIsSearchingTickers] = useState(false);
  const [selectedTickerInfo, setSelectedTickerInfo] = useState(null);

  const [formData, setFormData] = useState({
    accountId: "",
    tickerId: "",
    quantity: 0,
    investmentCost: 0,
    targetBuy: "",
    targetSell: "",
    note: "",
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accDropdownRef.current && !accDropdownRef.current.contains(event.target)) setIsAccDropdownOpen(false);
      if (formAccDropdownRef.current && !formAccDropdownRef.current.contains(event.target)) setIsFormAccDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isTickerModalOpen) setIsTickerModalOpen(false);
        else { setIsFormModalOpen(false); setDetailHolding(null); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTickerModalOpen]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axiosInstance.get("/Holdings/invest-account");
        const data = res.data?.result || res.data || [];
        const accs = Array.isArray(data) ? data : [];
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccountId(accs[0].accountID || accs[0].accountId);
      } catch (err) { console.error(err); }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axiosInstance.get("/TickerTypes");
        const data = res.data?.result || res.data || [];
        setTickerTypes(Array.isArray(data) ? data : []);
        const stockType = data.find(t => t.code.toUpperCase() === "STOCK");
        if (stockType) setTickerSearchType(stockType.id);
        else if (data.length > 0) setTickerSearchType(data[0].id);
      } catch (err) {}
    };
    fetchTypes();
  }, []);

  const handleAccountChange = (accId) => {
    setSelectedAccountId(accId);
    setKeyword(""); 
    setPageNumber(1);
    setIsAccDropdownOpen(false);
  };

  const fetchHoldings = useCallback(async () => {
    if (!selectedAccountId) return; 
    setLoading(true);
    try {
      const trimmed = keyword.trim();
      const res = await axiosInstance.get("/Holdings", {
        params: {
          accountID: selectedAccountId,
          tickerSymbol: trimmed || undefined,
          isDeleted: isTrashView, 
          pageNumber,
          pageSize
        }
      });
      const data = res.data?.result || res.data;
      if (data && data.items) {
        setHoldings(data.items);
        setTotalPages(Math.ceil(data.totalRecords / pageSize));
      } else {
        setHoldings([]);
        setTotalPages(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load holdings.");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, keyword, isTrashView, pageNumber, pageSize]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (pageNumber !== 1) setPageNumber(1);
      else fetchHoldings();
    }, 500);
    return () => clearTimeout(delay);
  }, [keyword, isTrashView, selectedAccountId]);

  useEffect(() => { fetchHoldings(); }, [pageNumber, fetchHoldings]);

  useEffect(() => {
    if (!isTickerModalOpen || !tickerSearchType) return;
    const delay = setTimeout(async () => {
      setIsSearchingTickers(true);
      try {
        const trimmed = tickerSearchKeyword.trim();
        const res = await axiosInstance.get("/Tickers", {
          params: { tickerTypeId: tickerSearchType, symbol: trimmed || undefined, pageNumber: 1, pageSize: 50 }
        });
        const data = res.data?.result || res.data;
        setTickerSearchResults((data && data.items) ? data.items : []);
      } catch (err) {
        setTickerSearchResults([]);
      } finally {
        setIsSearchingTickers(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [tickerSearchType, tickerSearchKeyword, isTickerModalOpen]);

  const currentAccount = accounts.find(a => (a.accountID || a.accountId) === selectedAccountId);
  const isGlobalCryptoAccount = currentAccount?.accountType?.toUpperCase() === "CRYPTO";

  const totalInvestedSummary = holdings.reduce((sum, h) => sum + (h.investmentCost * h.quantity), 0);
  const totalMarketSummary = holdings.reduce((sum, h) => sum + ((h.marketPrice || h.investmentCost) * h.quantity), 0);
  const unrealizedPnLSummary = totalMarketSummary - totalInvestedSummary;
  const unrealizedRateSummary = totalInvestedSummary > 0 ? unrealizedPnLSummary / totalInvestedSummary : 0;

  const openFormModal = (holding = null) => {
    setFormError("");
    setNoteMode("edit");
    if (holding) {
      setEditingHolding(holding);
      setFormData({
        accountId: holding.accountID || holding.accountId,
        tickerId: holding.tickerID || holding.tickerId,
        quantity: holding.quantity,
        investmentCost: holding.investmentCost,
        targetBuy: holding.targetBuy ?? "",
        targetSell: holding.targetSell ?? "",
        note: holding.note || "",
      });
      setSelectedTickerInfo({ symbol: holding.tickerSymbol, typeCode: holding.tickerTypeCode, name: holding.tickerName });
    } else {
      setEditingHolding(null);
      setFormData({
        accountId: selectedAccountId || (accounts[0] ? (accounts[0].accountID || accounts[0].accountId) : ""),
        tickerId: "", quantity: 0, investmentCost: 0, targetBuy: "", targetSell: "", note: "",
      });
      setSelectedTickerInfo(null);
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => { setIsFormModalOpen(false); setEditingHolding(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.tickerId) { setFormError("Account and Ticker are required."); return; }
    if (formData.quantity < 0 || formData.investmentCost < 0) { setFormError("Quantity and Cost must be >= 0."); return; }

    setIsSaving(true);
    setFormError("");
    
    const payload = {
      accountID: formData.accountId,
      tickerID: formData.tickerId,
      investmentCost: Number(formData.investmentCost),
      quantity: Number(formData.quantity),
      targetBuy: formData.targetBuy === "" ? null : Number(formData.targetBuy),
      targetSell: formData.targetSell === "" ? null : Number(formData.targetSell),
      note: formData.note.trim() || null,
    };

    try {
      let res;
      if (editingHolding) res = await axiosInstance.put(`/Holdings/${editingHolding.id || editingHolding.ID}`, payload);
      else res = await axiosInstance.post("/Holdings", payload);
      
      toast.success(res.data?.message || "Holding saved successfully.", { toastId: "hold-save" });
      closeFormModal();
      fetchHoldings();
    } catch (err) {
      setFormError(err.response?.data?.message || "Error saving holding.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (holding, e) => {
    e.stopPropagation();
    if (!window.confirm(`Move holding "${holding.tickerSymbol}" to recycle bin?`)) return;
    try {
      const res = await axiosInstance.delete(`/Holdings/${holding.id || holding.ID}`);
      toast.success(res.data?.message || "Holding moved to recycle bin.", { toastId: "hold-del" });
      fetchHoldings();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete holding."); }
  };

  const handleRestore = async (holding, e) => {
    e.stopPropagation();
    try {
      const res = await axiosInstance.put(`/Holdings/${holding.id || holding.ID}/restore`);
      toast.success(res.data?.message || "Holding restored successfully.", { toastId: "hold-res" });
      fetchHoldings();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to restore holding."); }
  };

  const selectedFormAccount = accounts.find(a => (a.accountID || a.accountId) === formData.accountId);

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        
        {/* HEADER & SUMMARY WIDGET */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                {isTrashView ? "Recycle Bin (Holdings)" : "My Holdings"}
                {loading && <Loader2 className="animate-spin text-pink-500" size={22} />}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isTrashView ? "Deleted assets. You can restore them anytime." : "Manage your investments and track P&L"}
              </p>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              
              {/* Account Dropdown */}
              <div className="relative w-full sm:min-w-[140px] sm:w-auto" ref={accDropdownRef}>
                <div
                  onClick={() => setIsAccDropdownOpen(!isAccDropdownOpen)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-full border transition-all bg-white text-gray-800 font-semibold text-sm shadow-sm cursor-pointer ${
                    isAccDropdownOpen ? "border-pink-500 ring-2 ring-pink-200" : "border-pink-200 hover:border-pink-400"
                  }`}
                >
                  {currentAccount ? (
                    <div className="flex items-center gap-2">
                      {getAccountIcon(currentAccount.accountType, 16)}
                      <span className="truncate max-w-[120px]">{currentAccount.accountName}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No Account</span>
                  )}
                  <ChevronDown size={16} className={`text-gray-400 ml-2 transition-transform ${isAccDropdownOpen ? "rotate-180" : ""}`} />
                </div>

                {isAccDropdownOpen && accounts.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-full sm:min-w-[200px] bg-white border border-gray-100 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] py-2 z-30 overflow-hidden">
                    {accounts.map((acc) => {
                      const accId = acc.accountID || acc.accountId;
                      const isSelected = selectedAccountId === accId;
                      return (
                        <div
                          key={accId}
                          onClick={() => handleAccountChange(accId)}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            isSelected ? "bg-pink-50 text-pink-600" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {getAccountIcon(acc.accountType, 16)}
                          <div className="flex flex-col min-w-0">
                            <span className={`text-sm truncate ${isSelected ? "font-bold" : "font-medium"}`}>{acc.accountName}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{acc.accountType}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Search symbol..."
                className="w-full sm:w-48 px-5 py-2.5 rounded-full border border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white text-gray-800 text-sm shadow-sm"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              
              <button
                onClick={() => setIsTrashView(!isTrashView)}
                className={`w-full sm:w-auto whitespace-nowrap px-4 py-2.5 rounded-full font-bold text-sm transition-all flex items-center justify-center border ${
                  isTrashView ? "bg-gray-800 text-white border-gray-800 shadow-lg" : "bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500 shadow-sm"
                }`}
              >
                {isTrashView ? "Back to Active" : <Trash size={18} />}
              </button>

              {!isTrashView && (
                <button
                  disabled={accounts.length === 0}
                  onClick={() => openFormModal()}
                  className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  + ADD HOLDING
                </button>
              )}
            </div>
          </div>

          {/* SUMMARY SECTION */}
          {!isTrashView && holdings.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="px-2">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Invested</div>
                <div className="text-2xl font-black text-gray-900">{formatMoney(totalInvestedSummary, isGlobalCryptoAccount)}</div>
              </div>
              <div className="px-2 md:px-6">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Market Value</div>
                <div className="text-2xl font-black text-gray-900">{formatMoney(totalMarketSummary, isGlobalCryptoAccount)}</div>
              </div>
              <div className="px-2 md:px-6">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Unrealized P&L</div>
                <div className={`text-2xl font-black flex items-center gap-2 ${getPnLColor(unrealizedPnLSummary)}`}>
                  {formatMoney(Math.abs(unrealizedPnLSummary), isGlobalCryptoAccount)}
                  <span className="text-sm px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                    {formatPercent(unrealizedRateSummary)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CARDS GRID */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          {!loading && holdings.length === 0 && (
            <p className="text-gray-500 text-sm col-span-full text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
              {isTrashView ? "Recycle bin is empty." : "No assets in this account. Add one now!"}
            </p>
          )}

          {holdings.map((h) => {
            const isCrypto = checkIsCrypto(h.tickerTypeCode);
            const totalInvested = h.investmentCost * h.quantity;
            const marketValue = (h.marketPrice || h.investmentCost) * h.quantity; 
            const unrealizedPnL = marketValue - totalInvested;
            const unrealizedRate = totalInvested > 0 ? unrealizedPnL / totalInvested : 0;
            const pnlColor = getPnLColor(unrealizedPnL);

            return (
              <div
                key={h.id || h.ID}
                className={`bg-white rounded-[1.25rem] p-6 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_25px_rgba(15,23,42,0.08)] transition-all border border-transparent hover:border-pink-50 flex flex-col group cursor-pointer ${isTrashView ? "opacity-75 grayscale-[20%]" : ""}`}
                onClick={() => setDetailHolding(h)}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      {getRawIcon(h.tickerTypeCode, 20)}
                    </div>
                    <div>
                      <div className="text-lg font-black text-gray-900 leading-none">{h.tickerSymbol}</div>
                      <div className="text-[11px] font-semibold text-gray-500 mt-0.5 truncate max-w-[150px] md:max-w-[200px]" title={h.tickerName}>{h.tickerName}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">{h.accountName}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-[17px] font-black text-gray-900 leading-tight">
                      {formatMoney(h.marketPrice, isCrypto, true)}
                    </div>
                    <div className={`mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${unrealizedRate >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {formatPercent(unrealizedRate)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm mt-2 border-b border-gray-100 pb-5">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold mb-0.5">Quantity</span>
                    <span className="font-bold text-gray-800">{formatMoney(h.quantity, isCrypto, true)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold mb-0.5">Avg. Price</span>
                    <span className="font-bold text-gray-800">{formatMoney(h.investmentCost, isCrypto, true)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold mb-0.5">Total Invested</span>
                    <span className="font-bold text-gray-800">{formatMoney(totalInvested, isCrypto, true)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold mb-0.5">Unrealized P&L</span>
                    <span className={`font-bold ${pnlColor}`}>{formatMoney(unrealizedPnL, isCrypto, true)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-[11px] text-gray-400 font-medium">Click to view details</span>
                  <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {isTrashView ? (
                      <button onClick={(e) => handleRestore(h, e)} title="Restore" className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all">
                        <ArchiveRestore size={14} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); openFormModal(h); }} title="Edit" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => handleDelete(h, e)} title="Delete" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
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
            MODAL 1: FORM ADD / EDIT (SPLIT LAYOUT KHỔNG LỒ)
        ======================================================== */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 transition-opacity">
            <div className="bg-white w-full max-w-5xl rounded-[2rem] p-8 md:p-10 relative animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <button onClick={closeFormModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-2 transition-all z-10">
                <X size={24} />
              </button>

              <h2 className="text-3xl font-black text-gray-900 mb-6 shrink-0">
                {editingHolding ? "Edit Holding" : "Add Holding"}
              </h2>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 min-h-0">
                  
                  {/* CỘT TRÁI: NHẬP SỐ LIỆU */}
                  <div className="md:col-span-5 space-y-5 overflow-y-auto pr-2 pb-4 [&::-webkit-scrollbar]:hidden">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Account *</label>
                      <div className="relative w-full" ref={formAccDropdownRef}>
                        <div
                          onClick={() => setIsFormAccDropdownOpen(!isFormAccDropdownOpen)}
                          className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-gray-50 cursor-pointer"
                        >
                          {selectedFormAccount ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                              {getAccountIcon(selectedFormAccount.accountType, 18)}
                              <span className="truncate text-sm font-semibold">{selectedFormAccount.accountName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Select Account...</span>
                          )}
                          <ChevronDown size={16} className="text-gray-400 shrink-0" />
                        </div>

                        {isFormAccDropdownOpen && accounts.length > 0 && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                            {accounts.map((acc) => (
                              <div
                                key={acc.accountID || acc.accountId}
                                onClick={() => { setFormData(p => ({ ...p, accountId: acc.accountID || acc.accountId })); setIsFormAccDropdownOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-pink-50"
                              >
                                {getAccountIcon(acc.accountType, 16)}
                                <span className="text-sm font-medium text-gray-700 truncate">{acc.accountName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Ticker *</label>
                      <button 
                        type="button" 
                        onClick={() => setIsTickerModalOpen(true)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border outline-none bg-gray-50 transition-colors ${
                          selectedTickerInfo ? "border-pink-400 ring-2 ring-pink-100 bg-pink-50/30" : "border-gray-200 hover:border-pink-300"
                        }`}
                      >
                        {selectedTickerInfo ? (
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="text-pink-500">{getRawIcon(selectedTickerInfo.typeCode, 20)}</div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="font-black text-gray-900 text-base truncate">{selectedTickerInfo.symbol}</span>
                              <span className="text-[10px] font-semibold text-gray-500 truncate max-w-full">{selectedTickerInfo.name}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">Click to Search Symbol</span>
                        )}
                        <Search size={16} className="text-gray-400 shrink-0" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Quantity *</label>
                      <input type="number" step="any" min="0" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-sm font-semibold" />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Average Cost *</label>
                      <input type="number" step="any" min="0" name="investmentCost" value={formData.investmentCost} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-sm font-semibold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Target Buy</label>
                        <input type="number" step="any" min="0" name="targetBuy" value={formData.targetBuy} onChange={handleChange} placeholder="(Optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-sm font-semibold text-blue-600" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Target Sell</label>
                        <input type="number" step="any" min="0" name="targetSell" value={formData.targetSell} onChange={handleChange} placeholder="(Optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-sm font-semibold text-rose-600" />
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI: EDITOR MARKDOWN */}
                  <div className="md:col-span-7 flex flex-col min-h-0 bg-gray-50 rounded-2xl border border-gray-200 p-1">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl shrink-0">
                      <label className="block text-sm font-bold text-gray-800">Trading Notes (Markdown)</label>
                      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button type="button" onClick={() => setNoteMode("edit")} className={`text-[11px] px-3 py-1.5 rounded-md font-bold transition-all ${noteMode === 'edit' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Edit</button>
                        <button type="button" onClick={() => setNoteMode("preview")} className={`text-[11px] px-3 py-1.5 rounded-md font-bold transition-all ${noteMode === 'preview' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Preview</button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-hidden p-3 flex flex-col bg-white rounded-b-2xl">
                      {noteMode === "edit" ? (
                        <textarea 
                          name="note" 
                          value={formData.note} 
                          onChange={handleChange} 
                          className="flex-1 w-full outline-none resize-none font-mono text-[13px] leading-relaxed text-gray-700 p-2 custom-scrollbar" 
                          placeholder="## Trading Plan&#10;&#10;**Strategy:** Buy the dip...&#10;![Chart Analysis](/TickerNotes/chart.png)" 
                        />
                      ) : (
                        <div className="flex-1 w-full overflow-y-auto text-[13px] text-gray-800 p-2 custom-scrollbar prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{formData.note || "*No note provided*"}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formError && <p className="text-rose-600 text-sm font-bold text-center mt-2 shrink-0">{formError}</p>}

                {/* FOOTER */}
                <div className="shrink-0 flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                  <button type="button" onClick={closeFormModal} className="px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-8 py-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-sm shadow-[0_8px_15px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-60">
                    {isSaving ? "Saving..." : "Save Holding"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-MODAL 1.5: TICKER PICKER
        ======================================================== */}
        {isTickerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-opacity">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 md:p-8 relative animate-in fade-in zoom-in duration-200 flex flex-col h-[500px]">
              
              <button onClick={() => setIsTickerModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-1.5 transition-all">
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black text-gray-900 mb-6">Select Ticker</h2>

              <div className="flex gap-3 mb-6">
                <select 
                  className="w-1/3 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm font-bold text-gray-700 cursor-pointer bg-gray-50"
                  value={tickerSearchType}
                  onChange={(e) => setTickerSearchType(e.target.value)}
                >
                  {tickerTypes.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
                </select>
                <div className="relative w-2/3">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search symbol..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm font-medium bg-gray-50"
                    value={tickerSearchKeyword}
                    onChange={(e) => setTickerSearchKeyword(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2 relative custom-scrollbar">
                {isSearchingTickers && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                    <Loader2 className="animate-spin text-pink-500" size={28} />
                  </div>
                )}
                {!isSearchingTickers && tickerSearchResults.length === 0 && (
                  <div className="text-center text-sm font-medium text-gray-400 mt-10">No tickers found.</div>
                )}
                {tickerSearchResults.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => {
                      setFormData(p => ({ ...p, tickerId: t.id }));
                      setSelectedTickerInfo({ id: t.id, symbol: t.symbol, typeCode: t.tickerTypeName, name: t.name });
                      setIsTickerModalOpen(false);
                    }}
                    className="flex items-center gap-4 p-3.5 rounded-2xl border border-gray-100 hover:border-pink-400 hover:bg-pink-50 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white text-gray-500 group-hover:text-pink-500 transition-colors shadow-sm">
                      {getRawIcon(t.tickerTypeName, 22)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900 text-base">{t.symbol}</div>
                      <div className="text-xs font-medium text-gray-500 truncate" title={t.name}>{t.name}</div>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 py-1 bg-gray-100 rounded-lg group-hover:bg-white group-hover:text-pink-500">
                      {t.tickerTypeName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 2: VIEW DETAILS (Khóa Header & Stats, Chỉ Cuộn Note)
        ======================================================== */}
        {detailHolding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity" onClick={() => setDetailHolding(null)}>
            <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              <button onClick={() => setDetailHolding(null)} className="absolute top-6 right-6 z-20 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-2 transition-all">
                <X size={24} />
              </button>

              {/* PHẦN TRÊN BỊ KHÓA CỨNG (LOCKED HEADER & STATS) */}
              <div className="p-8 pb-6 shrink-0 bg-white z-10 border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                      {getRawIcon(detailHolding.tickerTypeCode, 28)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-end gap-3 mb-1">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-none truncate">{detailHolding.tickerSymbol}</h2>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] md:text-xs rounded-full uppercase tracking-widest font-bold mb-0.5 shrink-0">
                          {detailHolding.accountName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{detailHolding.tickerTypeCode}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm font-semibold text-gray-500 truncate max-w-md">{detailHolding.tickerName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-y-6 gap-x-6 text-sm bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Quantity</span>
                    <span className="font-bold text-gray-800 text-lg">{formatMoney(detailHolding.quantity, checkIsCrypto(detailHolding.tickerTypeCode), true)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Avg. Price</span>
                    <span className="font-bold text-gray-800 text-lg">{formatMoney(detailHolding.investmentCost, checkIsCrypto(detailHolding.tickerTypeCode), true)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Market Price</span>
                    <span className="font-bold text-gray-800 text-lg">{formatMoney(detailHolding.marketPrice, checkIsCrypto(detailHolding.tickerTypeCode), true)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Total Invested</span>
                    <span className="font-bold text-gray-800 text-lg">{formatMoney(detailHolding.investmentCost * detailHolding.quantity, checkIsCrypto(detailHolding.tickerTypeCode), true)}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Market Value</span>
                    <span className="font-black text-gray-900 text-xl">{formatMoney(detailHolding.marketPrice * detailHolding.quantity, checkIsCrypto(detailHolding.tickerTypeCode), true)}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Unrealized P&L</span>
                    <span className={`font-black text-xl flex flex-col items-start gap-1 ${getPnLColor((detailHolding.marketPrice * detailHolding.quantity) - (detailHolding.investmentCost * detailHolding.quantity))}`}>
                      {formatMoney((detailHolding.marketPrice * detailHolding.quantity) - (detailHolding.investmentCost * detailHolding.quantity), checkIsCrypto(detailHolding.tickerTypeCode), true)}
                      <span className="text-[11px] px-1.5 py-0.5 bg-white rounded-md border border-gray-100 shadow-sm leading-none">
                        {formatPercent(detailHolding.investmentCost > 0 ? ((detailHolding.marketPrice * detailHolding.quantity) - (detailHolding.investmentCost * detailHolding.quantity)) / (detailHolding.investmentCost * detailHolding.quantity) : 0)}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Target Buy</span>
                    <span className="font-bold text-blue-600 text-lg">{detailHolding.targetBuy ? formatMoney(detailHolding.targetBuy, checkIsCrypto(detailHolding.tickerTypeCode), true) : "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-1.5">Target Sell</span>
                    <span className="font-bold text-rose-600 text-lg">{detailHolding.targetSell ? formatMoney(detailHolding.targetSell, checkIsCrypto(detailHolding.tickerTypeCode), true) : "-"}</span>
                  </div>
                  
                  {/* SHOW DATE TRONG LƯỚI KHÓA */}
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold mb-1.5">Created On</span>
                    <span className="font-semibold text-gray-600 text-sm">{formatDate(detailHolding.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold mb-1.5">Last Updated</span>
                    <span className="font-semibold text-gray-600 text-sm">{formatDate(detailHolding.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* PHẦN DƯỚI SCROLL MƯỢT MÀ (SCROLLABLE NOTE) */}
              <div className="flex-1 overflow-y-auto bg-gray-50/30 p-8 pt-6 custom-scrollbar">
                {detailHolding.note && detailHolding.note !== "N/A" ? (
                  <div>
                    <span className="text-gray-400 block text-xs uppercase tracking-widest font-bold mb-3 pl-1">Trading Notes & Analysis</span>
                    <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 text-sm text-gray-800 shadow-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{detailHolding.note}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm italic">No trading notes recorded for this holding.</div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}