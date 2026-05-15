import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { formatDate } from "../../../utils/formatDate"; 
import { toast } from "react-toastify";
import { 
  Loader2, Pencil, X, Search, ChevronDown, 
  LineChart, Bitcoin, PieChart, ScrollText, CircleDollarSign,
  Clock, History, Receipt
} from "lucide-react";

// === FORMATTERS & HELPERS ===
const formatMoney = (value, isCrypto = false, isVndDisplay = false) => {
  if (value == null || isNaN(value)) return "0";
  const num = Number(value);
  if (isCrypto) {
    return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(num);
  }
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: isVndDisplay ? 0 : 2 }).format(num) + " ₫";
};

const formatQuantity = (value, isCrypto = false) => {
  if (value == null || isNaN(value)) return "0";
  const num = Number(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: isCrypto ? 8 : 4 }).format(num);
};

const formatPercent = (rate) => {
  if (rate == null || !Number.isFinite(rate)) return "0%";
  const percent = Number(rate); 
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
};

const getTransactionBadge = (type) => {
  switch (type?.toUpperCase()) {
    case "BUY": return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded uppercase tracking-widest border border-emerald-100">BUY</span>;
    case "SELL": return <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded uppercase tracking-widest border border-rose-100">SELL</span>;
    case "DIVIDEND_CASH": return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-widest border border-blue-100">CASH DIV</span>;
    case "DIVIDEND_TICKER": return <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black rounded uppercase tracking-widest border border-purple-100">TICKER DIV</span>;
    default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-black rounded uppercase tracking-widest">{type}</span>;
  }
};

const getRawIcon = (typeCode, size = 18) => {
  const id = (typeCode || "").toUpperCase();
  if (id.includes("STOCK") || id.includes("CHỨNG KHOÁN") || id.includes("CỔ PHIẾU")) return <LineChart size={size} />;
  if (id.includes("CRYPTO") || id.includes("COIN") || id.includes("TIỀN ẢO")) return <Bitcoin size={size} />;
  if (id.includes("FUND") || id.includes("QUỸ")) return <PieChart size={size} />;
  if (id.includes("BOND") || id.includes("TRÁI PHIẾU")) return <ScrollText size={size} />;
  return <CircleDollarSign size={size} />;
};

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [filterType, setFilterType] = useState("ALL_TYPE");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(4); // SẾP YÊU CẦU SET PAGE SIZE = 4
  const [loading, setLoading] = useState(false);

  // Dropdowns UI
  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false);
  const accDropdownRef = useRef(null);

  // Form & Detail Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [detailTransaction, setDetailTransaction] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Sub-modal Picker
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);
  const [tickerTypes, setTickerTypes] = useState([]);
  const [tickerSearchType, setTickerSearchType] = useState("");
  const [tickerSearchKeyword, setTickerSearchKeyword] = useState("");
  const [tickerSearchResults, setTickerSearchResults] = useState([]);
  const [isSearchingTickers, setIsSearchingTickers] = useState(false);
  const [selectedTickerInfo, setSelectedTickerInfo] = useState(null);

  const [formData, setFormData] = useState({
    accountId: "", tickerId: "", transactionType: "BUY", price: "", quantity: "",
    grossAmount: "", feeRate: 0.03, pitRate: 0, tradeDate: new Date().toISOString().split("T")[0], note: "",
  });

  const totalPages = useMemo(() => Math.ceil(totalRecords / pageSize) || 1, [totalRecords, pageSize]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accDropdownRef.current && !accDropdownRef.current.contains(event.target)) setIsAccDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // INIT DATA
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [accRes, typeRes] = await Promise.all([
          axiosInstance.get("/Transaction/invest-account"),
          axiosInstance.get("/TickerTypes")
        ]);
        const accData = accRes.data?.result || accRes.data || [];
        setAccounts(accData);
        if (accData.length > 0) setSelectedAccountId(accData[0].accountID || accData[0].accountId);

        const tTypes = typeRes.data?.result || typeRes.data || [];
        setTickerTypes(tTypes);
        if (tTypes.length > 0) setTickerSearchType(tTypes.find(t => t.code.toUpperCase() === "STOCK")?.id || tTypes[0].id);
      } catch (err) { console.error(err); }
    };
    fetchInitData();
  }, []);

  const handleAccountChange = (accId) => {
    setSelectedAccountId(accId); setKeyword(""); setFilterType("ALL_TYPE");
    setFromDate(""); setToDate(""); setPageNumber(1); setIsAccDropdownOpen(false);
  };

  const fetchTransactionsData = useCallback(async (isSilent = false) => {
    if (!selectedAccountId) return;
    if (!isSilent) setLoading(true);

    try {
      const trimmed = keyword.trim();
      
      const summaryPromise = axiosInstance.get("/Transaction/summary", {
        params: { accountID: selectedAccountId, transactionType: filterType, tickerSymbol: trimmed || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined }
      });

      const listPromise = axiosInstance.get("/Transaction", {
        params: { accountID: selectedAccountId, transactionType: filterType, tickerSymbol: trimmed || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined, pageNumber, pageSize }
      });

      const [summaryRes, listRes] = await Promise.all([summaryPromise, listPromise]);
      
      setSummary(summaryRes.data?.result || summaryRes.data || []);
      
      const listData = listRes.data?.result || listRes.data;
      if (listData && listData.items) {
        setTransactions(listData.items);
        setTotalRecords(listData.totalRecords);
      } else {
        setTransactions([]); setTotalRecords(0);
      }
    } catch (err) {
      toast.error("Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, keyword, filterType, fromDate, toDate, pageNumber, pageSize]);

  useEffect(() => {
    fetchTransactionsData();
  }, [selectedAccountId, pageNumber, filterType, fromDate, toDate, fetchTransactionsData]);

  // Search Debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      setPageNumber(1);
      fetchTransactionsData(true);
    }, 500);
    return () => clearTimeout(delay);
  }, [keyword]);

  // TICKER SEARCH LOGIC
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
      } catch (err) { setTickerSearchResults([]); } finally { setIsSearchingTickers(false); }
    }, 400);
    return () => clearTimeout(delay);
  }, [tickerSearchType, tickerSearchKeyword, isTickerModalOpen]);

  // SUMMARIES CALCULATION
  const currentAccount = accounts.find(a => (a.accountID || a.accountId) === selectedAccountId);
  const isGlobalCryptoAccount = currentAccount?.accountType?.toUpperCase() === "CRYPTO";

  const totalBoughtStats = useMemo(() => {
    if (!Array.isArray(summary)) return { value: 0, count: 0 };
    const buys = summary.find(s => s.type === "BUY");
    return { value: buys?.totalValue || 0, count: buys?.numberOfTransactions || 0 };
  }, [summary]);

  const totalSoldStats = useMemo(() => {
    if (!Array.isArray(summary)) return { value: 0, count: 0 };
    const sells = summary.find(s => s.type === "SELL");
    return { value: sells?.totalValue || 0, count: sells?.numberOfTransactions || 0 };
  }, [summary]);

  const clearDates = () => { setFromDate(""); setToDate(""); setPageNumber(1); };

  // MODAL HANDLERS
  const openFormModal = (trans = null) => {
    setFormError("");
    if (trans) {
      setEditingTransaction(trans);
      setFormData({
        accountId: trans.accountID || trans.accountId,
        tickerId: trans.tickerID || trans.tickerId,
        transactionType: trans.transactionType,
        price: trans.price || "",
        quantity: trans.quantity || "",
        grossAmount: trans.grossAmount || "",
        feeRate: trans.feeRate || 0,
        pitRate: trans.pitRate || 0,
        tradeDate: trans.tradeDate,
        note: trans.note && trans.note !== "N/A" ? trans.note : "",
      });
      setSelectedTickerInfo({ symbol: trans.tickerSymbol, name: "" });
    } else {
      setEditingTransaction(null);
      setFormData({
        accountId: selectedAccountId || (accounts[0]?.accountID || ""),
        tickerId: "", transactionType: "BUY", price: "", quantity: "", grossAmount: "",
        feeRate: 0.03, pitRate: 0, tradeDate: new Date().toISOString().split("T")[0], note: "",
      });
      setSelectedTickerInfo(null);
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => { setIsFormModalOpen(false); setEditingTransaction(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingTransaction && (!formData.accountId || !formData.tickerId)) {
      setFormError("Account and Ticker are required."); return;
    }
    
    setIsSaving(true);
    setFormError("");
    try {
      if (editingTransaction) {
        const updatePayload = {
          AccountID: formData.accountId,
          TickerID: formData.tickerId,
          Note: formData.note.trim() || null,
        };
        await axiosInstance.put(`/Transaction/${editingTransaction.id || editingTransaction.ID}`, updatePayload);
        toast.success("Transaction note updated.");
      } else {
        const addPayload = {
          AccountID: formData.accountId,
          TickerID: formData.tickerId,
          TransactionType: formData.transactionType,
          Price: formData.price === "" ? null : Number(formData.price),
          Quantity: formData.quantity === "" ? null : Number(formData.quantity),
          GrossAmount: formData.grossAmount === "" ? null : Number(formData.grossAmount),
          FeeRate: formData.feeRate === "" ? 0 : Number(formData.feeRate),
          PITRate: formData.pitRate === "" ? 0 : Number(formData.pitRate),
          TradeDate: formData.tradeDate,
          Note: formData.note.trim() || null,
        };
        await axiosInstance.post("/Transaction", addPayload);
        toast.success("Transaction created successfully.");
      }
      closeFormModal();
      fetchTransactionsData();
    } catch (err) { 
      setFormError(err.response?.data?.message || "Submit failed."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        
        {/* HEADER */}
        <div className="mb-4 flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              Transaction Management
              {loading && <Loader2 className="animate-spin text-pink-500" size={18} />}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Record your BUY/SELL and dividend transactions.</p>
          </div>
        </div>

        {/* SUMMARY CARDS (COMPACT STYLE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
            <span className="text-xs font-bold text-gray-800 mb-1 pl-2">Total Bought</span>
            <span className="text-2xl font-black text-rose-600 leading-none pl-2">
              {isGlobalCryptoAccount ? formatMoney(totalBoughtStats.value, true) : formatMoney(totalBoughtStats.value, false, true)}
            </span>
            <span className="text-[10px] text-gray-400 mt-1.5 font-medium pl-2">{totalBoughtStats.count} buy transaction(s)</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-gray-800 mb-1 pl-2">Total Sold</span>
            <span className="text-2xl font-black text-emerald-600 leading-none pl-2">
              {isGlobalCryptoAccount ? formatMoney(totalSoldStats.value, true) : formatMoney(totalSoldStats.value, false, true)}
            </span>
            <span className="text-[10px] text-gray-400 mt-1.5 font-medium pl-2">{totalSoldStats.count} sell transaction(s)</span>
          </div>
        </div>

        {/* FILTER BAR (COMPACT) */}
        <div className="flex flex-col xl:flex-row flex-wrap items-center gap-3 w-full mb-5">
          
          <div className="relative min-w-[140px] w-full xl:w-auto" ref={accDropdownRef}>
            <div onClick={() => setIsAccDropdownOpen(!isAccDropdownOpen)} className="flex items-center justify-between px-4 py-2 rounded-full border bg-white text-gray-800 font-semibold text-[13px] shadow-sm cursor-pointer border-pink-200 hover:border-pink-400 transition-colors">
              {currentAccount ? <span className="truncate max-w-[100px]">{currentAccount.accountName}</span> : <span className="text-gray-400">Account</span>}
              <ChevronDown size={14} className="text-gray-400 ml-2" />
            </div>
            {isAccDropdownOpen && accounts.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white border border-gray-100 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] py-2 z-30 overflow-hidden">
                {accounts.map((acc) => (
                  <div key={acc.accountID || acc.accountId} onClick={() => handleAccountChange(acc.accountID || acc.accountId)} className={`flex items-center px-4 py-2 cursor-pointer text-[13px] ${selectedAccountId === (acc.accountID || acc.accountId) ? "bg-pink-50 text-pink-600 font-bold" : "hover:bg-gray-50 font-medium text-gray-700"}`}>
                    {acc.accountName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <select 
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPageNumber(1); }}
            className="w-full xl:w-auto px-4 py-2 rounded-full border border-pink-200 outline-none bg-white text-gray-800 text-[13px] font-semibold shadow-sm focus:border-pink-500 transition-colors cursor-pointer"
          >
            <option value="ALL_TYPE">All Types</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
            <option value="DIVIDEND_CASH">Dividend (Cash)</option>
            <option value="DIVIDEND_TICKER">Dividend (Ticker)</option>
          </select>

          <div className="relative w-full xl:flex-1 xl:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
            <input type="text" placeholder="Search ticker..." className="w-full pl-8 pr-3 py-2 rounded-full border border-pink-200 outline-none bg-white text-gray-800 text-[13px] shadow-sm focus:border-pink-500 transition-colors" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>

          <div className="flex items-center w-full xl:w-auto bg-white border border-pink-200 rounded-full px-3 py-1.5 shadow-sm focus-within:border-pink-500 transition-colors">
            <input type="date" value={fromDate} max={toDate || undefined} onChange={e => { setFromDate(e.target.value); setPageNumber(1); }} className="outline-none text-[12px] text-gray-600 bg-transparent w-[105px] cursor-pointer" title="From Date" />
            <span className="text-gray-300 mx-1">-</span>
            <input type="date" value={toDate} min={fromDate || undefined} onChange={e => { setToDate(e.target.value); setPageNumber(1); }} className="outline-none text-[12px] text-gray-600 bg-transparent w-[105px] cursor-pointer" title="To Date" />
            {(fromDate || toDate) && (
              <button onClick={clearDates} className="ml-1 text-rose-400 hover:text-rose-600 transition-colors flex items-center justify-center p-0.5 rounded-full hover:bg-rose-50" title="Clear dates">
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>

          <div className="ml-auto w-full xl:w-auto">
            <button onClick={() => openFormModal()} className="w-full whitespace-nowrap px-5 py-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-[12px] shadow-sm hover:-translate-y-0.5 transition-all">
              + ADD TRANSACTION
            </button>
          </div>
        </div>

        {/* TRANSACTIONS LIST (COMPACT HORIZONTAL CARDS) */}
        <div className={`space-y-3 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          {!loading && transactions.length === 0 && (
             <p className="text-gray-400 text-[13px] font-bold uppercase tracking-widest text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
               No transactions found.
             </p>
          )}

          {transactions.map((t) => {
            const isCrypto = isGlobalCryptoAccount;
            return (
              <div 
                key={t.id || t.ID} 
                onClick={() => setDetailTransaction(t)}
                className="bg-white rounded-[1rem] p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-100 transition-all cursor-pointer group relative"
              >
                
                {/* Edit Button in corner */}
                <button 
                  onClick={(e) => { e.stopPropagation(); openFormModal(t); }} 
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-500 border border-gray-200"
                >
                  <Pencil size={12} />
                </button>

                {/* Top Info */}
                <div className="flex justify-between items-start mb-3 pr-10 border-b border-gray-50 pb-3">
                  <div>
                    <div className="font-black text-gray-900 text-[15px]">{t.tickerSymbol} <span className="text-gray-300 font-normal mx-1.5">•</span> {t.accountName}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">Trading date: {formatDate(t.tradeDate)}</div>
                  </div>
                  <div>
                    {getTransactionBadge(t.transactionType)}
                  </div>
                </div>

                {/* Dynamic Grid Info (Khác 0 mới hiện) */}
                <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-[12px]">
                  {t.transactionType === "DIVIDEND_CASH" ? (
                    <>
                      <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Gross Amount</span><span className="font-black text-gray-900">{formatMoney(t.grossAmount, isCrypto, true)}</span></div>
                      {t.pitRate > 0 && <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">PIT / PIT Rate</span><span className="font-bold text-gray-900">{formatMoney(t.pit, isCrypto, true)} <span className="text-gray-400 font-medium">({t.pitRate}%)</span></span></div>}
                      <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Net Amount</span><span className="font-black text-emerald-600">{formatMoney(t.netAmount, isCrypto, true)}</span></div>
                    </>
                  ) : t.transactionType === "DIVIDEND_TICKER" ? (
                    <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Quantity Added</span><span className="font-black text-emerald-600">+{formatQuantity(t.quantity, isCrypto)}</span></div>
                  ) : (
                    <>
                      <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Quantity</span><span className="font-bold text-gray-900">{formatQuantity(t.quantity, isCrypto)}</span></div>
                      <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Price</span><span className="font-bold text-gray-900">{formatMoney(t.price, isCrypto, true)}</span></div>
                      <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Gross Amount</span><span className="font-bold text-gray-900">{formatMoney(t.grossAmount, isCrypto, true)}</span></div>
                      
                      {(t.fee > 0 || t.feeRate > 0) && (
                        <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Fee / Fee Rate</span><span className="font-bold text-gray-900">{formatMoney(t.fee, isCrypto, true)} <span className="text-gray-400 font-medium">({t.feeRate}%)</span></span></div>
                      )}
                      
                      {(t.pit > 0 || t.pitRate > 0) && (
                        <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">PIT / PIT Rate</span><span className="font-bold text-gray-900">{formatMoney(t.pit, isCrypto, true)} <span className="text-gray-400 font-medium">({t.pitRate}%)</span></span></div>
                      )}

                      <div><span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Net Amount</span><span className="font-black text-gray-900">{formatMoney(t.netAmount, isCrypto, true)}</span></div>
                      
                      {t.transactionType === "SELL" && (
                        <div>
                          <span className="block text-[9px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Realized P&L</span>
                          <span className={`font-black flex items-center gap-1.5 ${t.realizedPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {formatMoney(t.realizedPnL, isCrypto, true)} 
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.realizedPnL >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>({formatPercent(t.realizedPnLRate || 0)})</span>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-5 mb-2">
            <button disabled={pageNumber === 1} onClick={() => setPageNumber(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">Previous</button>
            <span className="text-[13px] font-medium text-gray-500">Page <span className="font-bold text-gray-900">{pageNumber}</span> of {totalPages}</span>
            <button disabled={pageNumber === totalPages} onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">Next</button>
          </div>
        )}

        {/* ========================================================
            MODAL 1: VIEW DETAILS (Với Audit Track)
        ======================================================== */}
        {detailTransaction && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity" onClick={() => setDetailTransaction(null)}>
            <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setDetailTransaction(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-2 transition-all z-10"><X size={20} /></button>
              
              <div className="p-8 pb-4 shrink-0 bg-white border-b border-gray-100 z-10">
                <h2 className="text-3xl font-black text-gray-900 leading-none pr-8">{detailTransaction.tickerSymbol}</h2>
                <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{detailTransaction.transactionType.replace("_", " ")} TRANSACTION</p>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30">
                {/* 1. Basic Info */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4"><Clock size={12}/> Basic Info</div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Date</span><span className="font-bold text-gray-800">{formatDate(detailTransaction.tradeDate)}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Account</span><span className="font-bold text-gray-800">{detailTransaction.accountName}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Transaction Type</span><span className="font-bold text-gray-800">{detailTransaction.transactionType}</span></div>
                  </div>
                </div>

                {/* 2. Financial Details */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4"><Receipt size={12}/> Financial Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Quantity</span><span className="font-bold text-gray-800">{formatQuantity(detailTransaction.quantity, isGlobalCryptoAccount)}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Price</span><span className="font-bold text-gray-800">{formatMoney(detailTransaction.price, isGlobalCryptoAccount, true)}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Gross Amount</span><span className="font-bold text-gray-800">{formatMoney(detailTransaction.grossAmount, isGlobalCryptoAccount, true)}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Fee Rate / Fee</span><span className="font-bold text-gray-800">{detailTransaction.feeRate}% / {formatMoney(detailTransaction.fee, isGlobalCryptoAccount, true)}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">PIT Rate / PIT</span><span className="font-bold text-gray-800">{detailTransaction.pitRate}% / {formatMoney(detailTransaction.pit, isGlobalCryptoAccount, true)}</span></div>
                    <div className="flex justify-between text-[13px] col-span-1 sm:col-span-2 pt-2 border-t border-gray-50"><span className="text-gray-500 font-bold">Net Amount</span><span className="font-black text-pink-600">{formatMoney(detailTransaction.netAmount, isGlobalCryptoAccount, true)}</span></div>
                    
                    {detailTransaction.transactionType === "SELL" && (
                      <div className="flex justify-between text-[13px] col-span-1 sm:col-span-2 mt-1">
                        <span className="text-gray-500 font-bold">Realized P&L</span>
                        <span className={`font-black ${detailTransaction.realizedPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {formatMoney(detailTransaction.realizedPnL, isGlobalCryptoAccount, true)} <span className="font-medium">({formatPercent(detailTransaction.realizedPnLRate)})</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Audit Track */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4"><History size={12}/> Audit Track (Pre-Transaction)</div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Pre-Quantity</span><span className="font-bold text-gray-800">{formatQuantity(detailTransaction.preQuantity, isGlobalCryptoAccount)}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-gray-500 font-medium">Pre-Average Cost</span><span className="font-bold text-gray-800">{formatMoney(detailTransaction.preInvestmentCost, isGlobalCryptoAccount, true)}</span></div>
                    <div className="flex justify-between text-[13px] pt-2 border-t border-gray-50"><span className="text-gray-500 font-bold">Pre-Total Invested</span><span className="font-bold text-gray-800">{formatMoney(detailTransaction.preTotalInvestmentCost, isGlobalCryptoAccount, true)}</span></div>
                  </div>
                </div>

                {detailTransaction.note && detailTransaction.note !== "N/A" && (
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Trading Note</div>
                    <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-sm text-yellow-800 italic">"{detailTransaction.note}"</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 2: FORM ADD / EDIT (DYNAMIC)
        ======================================================== */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
              <button onClick={closeFormModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 transition-all z-10"><X size={20} /></button>
              
              <h2 className="text-2xl font-black text-gray-900 mb-6 shrink-0">
                {editingTransaction ? "Edit Transaction Note" : "New Transaction"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Account *</label>
                    <select 
                      name="accountId" value={formData.accountId} onChange={handleChange} 
                      disabled={!!editingTransaction}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium ${editingTransaction ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:border-pink-400'}`}
                    >
                      <option value="">-- Select --</option>
                      {accounts.map(acc => <option key={acc.accountID || acc.accountId} value={acc.accountID || acc.accountId}>{acc.accountName}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Ticker *</label>
                    <button 
                      type="button" 
                      onClick={() => !editingTransaction && setIsTickerModalOpen(true)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium ${editingTransaction ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-gray-50 border-gray-200 hover:border-pink-300'}`}
                      disabled={!!editingTransaction}
                    >
                      <span className="truncate">{selectedTickerInfo ? selectedTickerInfo.symbol : "Search Symbol..."}</span>
                      {!editingTransaction && <Search size={14} className="text-gray-400 shrink-0" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Transaction Type *</label>
                    <select 
                      name="transactionType" value={formData.transactionType} onChange={handleChange}
                      disabled={!!editingTransaction}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium ${editingTransaction ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:border-pink-400'}`}
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                      <option value="DIVIDEND_CASH">CASH DIVIDEND</option>
                      <option value="DIVIDEND_TICKER">TICKER DIVIDEND</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Trade Date *</label>
                    <input 
                      type="date" name="tradeDate" value={formData.tradeDate} onChange={handleChange}
                      disabled={!!editingTransaction}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium ${editingTransaction ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:border-pink-400 cursor-pointer'}`}
                    />
                  </div>
                </div>

                {/* FIELDS DYNAMIC THEO TYPE (CHỈ HIỆN KHI ADD) */}
                {!editingTransaction && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    
                    {(formData.transactionType === "BUY" || formData.transactionType === "SELL") && (
                      <>
                        <div><label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Price *</label><input type="number" step="any" min="0" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm" /></div>
                        <div><label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Quantity *</label><input type="number" step="any" min="0" name="quantity" value={formData.quantity} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm" /></div>
                        <div><label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Fee Rate (%)</label><input type="number" step="any" min="0" name="feeRate" value={formData.feeRate} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm" /></div>
                        {formData.transactionType === "SELL" && (
                          <div><label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">PIT Rate (%)</label><input type="number" step="any" min="0" name="pitRate" value={formData.pitRate} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm" /></div>
                        )}
                      </>
                    )}

                    {formData.transactionType === "DIVIDEND_CASH" && (
                      <>
                        <div><label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Gross Amount *</label><input type="number" step="any" min="0" name="grossAmount" value={formData.grossAmount} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm" /></div>
                        <div><label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">PIT Rate (%)</label><input type="number" step="any" min="0" name="pitRate" value={formData.pitRate} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm" /></div>
                      </>
                    )}

                    {formData.transactionType === "DIVIDEND_TICKER" && (
                      <div className="col-span-2"><label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Quantity Added *</label><input type="number" step="any" min="0" name="quantity" value={formData.quantity} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-400 outline-none text-sm" /></div>
                    )}
                  </div>
                )}

                {/* NOTE (Cho phép sửa) */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Note</label>
                  <textarea 
                    name="note" value={formData.note} onChange={handleChange} rows="2"
                    placeholder="Optional details..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-sm resize-none"
                  />
                </div>

                {formError && <p className="text-rose-600 text-xs font-bold text-center pt-1">{formError}</p>}

                <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100">
                  <button type="button" onClick={closeFormModal} className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 font-bold text-[13px] hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-7 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-[13px] shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60">{isSaving ? "Saving..." : "Save Transaction"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL: TICKER SEARCH */}
        {isTickerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-opacity">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 md:p-8 relative animate-in fade-in zoom-in duration-200 flex flex-col h-[500px]">
              <button onClick={() => setIsTickerModalOpen(false)} className="absolute top-5 right-5 text-gray-400 bg-gray-50 rounded-full p-1.5"><X size={20} /></button>
              <h2 className="text-xl font-black text-gray-900 mb-6">Select Ticker</h2>
              <div className="flex gap-2 mb-4">
                <select className="w-1/3 px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm font-bold bg-gray-50" value={tickerSearchType} onChange={(e) => setTickerSearchType(e.target.value)}>
                  {tickerTypes.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
                </select>
                <div className="relative w-2/3"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50" value={tickerSearchKeyword} onChange={(e) => setTickerSearchKeyword(e.target.value)} autoFocus /></div>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {isSearchingTickers ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-500" /></div> : tickerSearchResults.length === 0 ? <div className="text-center text-sm text-gray-400 mt-10">No tickers found.</div> : tickerSearchResults.map(t => (
                  <div key={t.id} onClick={() => { setFormData(p => ({ ...p, tickerId: t.id })); setSelectedTickerInfo({ symbol: t.symbol, name: t.name }); setIsTickerModalOpen(false); }} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-pink-400 hover:bg-pink-50 cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex justify-center items-center group-hover:bg-white">{getRawIcon(t.tickerTypeName, 18)}</div>
                    <div className="flex-1 min-w-0"><div className="font-bold text-gray-900 text-sm">{t.symbol}</div><div className="text-[10px] text-gray-500 truncate">{t.name}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}