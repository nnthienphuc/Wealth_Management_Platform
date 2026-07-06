import React, { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import {
  LineChart,
  Bitcoin,
  PieChart,
  ScrollText,
  CircleDollarSign,
  ChevronDown,
  Loader2,
  Pencil,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { NumericFormat } from "react-number-format";

// === FORMATTERS ===
const formatPrice = (price, currency) => {
  if (price == null || isNaN(price)) return "-";
  const num = Number(price);
  if (currency?.toUpperCase() === "USD") {
    return (
      "$" +
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }).format(num)
    );
  }
  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num) +
    " ₫"
  );
};

const getEnglishTypeCode = (name) => {
  const n = (name || "").toUpperCase();
  if (
    n.includes("CHỨNG KHOÁN") ||
    n.includes("STOCK") ||
    n.includes("CỔ PHIẾU")
  )
    return "STOCK";
  if (n.includes("TIỀN ẢO") || n.includes("CRYPTO") || n.includes("COIN"))
    return "CRYPTO";
  if (n.includes("QUỸ") || n.includes("FUND")) return "FUND";
  if (n.includes("TRÁI PHIẾU") || n.includes("BOND")) return "BOND";
  return n;
};

const getRawIcon = (code, size = 16) => {
  const id = (code || "").toUpperCase();
  if (id.includes("STOCK"))
    return <LineChart size={size} className="text-blue-500" />;
  if (id.includes("CRYPTO"))
    return <Bitcoin size={size} className="text-orange-500" />;
  if (id.includes("FUND"))
    return <PieChart size={size} className="text-emerald-500" />;
  if (id.includes("BOND"))
    return <ScrollText size={size} className="text-purple-500" />;
  return <CircleDollarSign size={size} className="text-gray-500" />;
};

export default function TickerPage() {
  const [tickers, setTickers] = useState([]);
  const [tickerTypes, setTickerTypes] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0); // THÊM STATE TOTAL RECORDS

  const [keyword, setKeyword] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // === STATES CHO FORM MODAL ===
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    tickerTypeId: "",
    symbol: "",
    name: "",
    marketPrice: "",
    currency: "VND",
  });

  // Fetch Tickers
  const fetchTickers = useCallback(
    async (isBackground = false) => {
      if (!selectedType) return;

      // Chỉ bật loading nếu KHÔNG PHẢI là chạy ngầm
      if (!isBackground) {
        setLoading(true);
        setError("");
      }

      try {
        const trimmed = keyword.trim();
        const res = await axiosInstance.get("/Tickers", {
          params: {
            tickerTypeId: selectedType,
            symbol: trimmed || undefined,
            pageNumber,
            pageSize,
          },
        });

        const data = res.data?.result || res.data;
        if (data && data.items) {
          setTickers(data.items);
          setTotalPages(Math.ceil(data.totalRecords / pageSize));
          setTotalRecords(data.totalRecords);
        } else {
          setTickers([]);
          setTotalPages(1);
          setTotalRecords(0);
        }
      } catch (err) {
        if (!isBackground)
          setError("Cannot load market assets from the server.");
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [selectedType, keyword, pageNumber, pageSize],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFormModalOpen) {
        fetchTickers(true);
      }
    }, 60000); // 60000ms = 1min

    return () => clearInterval(interval);
  }, [fetchTickers, isFormModalOpen]);

  // Click Outside cho Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Phím ESC đóng Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeFormModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch Ticker Types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axiosInstance.get("/TickerTypes");
        const data = res.data?.result || res.data || [];
        setTickerTypes(Array.isArray(data) ? data : []);

        const stockType = data.find((t) => t.code.toUpperCase() === "STOCK");
        if (stockType) setSelectedType(stockType.id);
        else if (data.length > 0) setSelectedType(data[0].id);
      } catch (err) {}
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (pageNumber !== 1) setPageNumber(1);
      else fetchTickers();
    }, 500);
    return () => clearTimeout(delay);
  }, [keyword, selectedType]);

  useEffect(() => {
    fetchTickers();
  }, [pageNumber, fetchTickers]);

  const currentSelectedTypeObj = tickerTypes.find((t) => t.id === selectedType);

  // === MODAL HANDLERS ===
  const openFormModal = (ticker = null) => {
    setFormError("");
    if (ticker) {
      setEditingTicker(ticker);
      setFormData({
        tickerTypeId: ticker.tickerTypeId || selectedType,
        symbol: ticker.symbol || "",
        name: ticker.name || "",
        marketPrice:
          ticker.marketPrice != null ? String(ticker.marketPrice) : "",
        currency: ticker.currency || "VND",
      });
    } else {
      setEditingTicker(null);
      // Khi Add, tự detect currency dựa theo loại tab đang mở
      const defaultCurrency =
        currentSelectedTypeObj?.code?.toUpperCase().includes("COIN") ||
        currentSelectedTypeObj?.code?.toUpperCase().includes("CRYPTO")
          ? "USD"
          : "VND";
      setFormData({
        tickerTypeId: selectedType || (tickerTypes[0] ? tickerTypes[0].id : ""),
        symbol: "",
        name: "",
        marketPrice: "",
        currency: defaultCurrency,
      });
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingTicker(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormTypeChange = (e) => {
    const typeId = e.target.value;
    const typeObj = tickerTypes.find((t) => t.id === typeId);
    let autoCurrency = formData.currency;
    if (typeObj) {
      const code = typeObj.code.toUpperCase();
      if (code.includes("COIN") || code.includes("CRYPTO"))
        autoCurrency = "USD";
      else autoCurrency = "VND";
    }
    setFormData((prev) => ({
      ...prev,
      tickerTypeId: typeId,
      currency: autoCurrency,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.tickerTypeId ||
      !formData.symbol.trim() ||
      !formData.name.trim()
    ) {
      setFormError("Type, Symbol, and Name are required.");
      return;
    }
    if (formData.marketPrice && Number(formData.marketPrice) < 0) {
      setFormError("Market price must be >= 0.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const payload = {
      tickerTypeId: formData.tickerTypeId,
      symbol: formData.symbol.trim().toUpperCase(),
      name: formData.name.trim(),
      marketPrice:
        formData.marketPrice === "" ? null : Number(formData.marketPrice),
      currency: formData.currency,
    };

    try {
      let res;
      if (editingTicker) {
        res = await axiosInstance.put(`/Tickers/${editingTicker.id}`, payload);
      } else {
        res = await axiosInstance.post("/Tickers", payload);
      }
      toast.success(res.data?.message || "Ticker saved successfully.");
      closeFormModal();
      fetchTickers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save ticker.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ticker, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete ticker "${ticker.symbol}"? This action cannot be undone.`,
      )
    )
      return;
    try {
      const res = await axiosInstance.delete(`/Tickers/${ticker.id}`);
      toast.success(res.data?.message || "Ticker deleted successfully.");
      fetchTickers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete ticker.");
    }
  };

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        {/* HEADER AREA */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3 mb-1">
              Market Tickers
              {loading && (
                <Loader2 className="animate-spin text-pink-500" size={20} />
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              View supported assets and near real-time market prices (4-minute
              delay).
            </p>
          </div>

          {/* FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative">
            <div
              className="relative w-full sm:min-w-[160px] sm:w-auto"
              ref={dropdownRef}
            >
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center justify-between w-full px-5 py-2.5 rounded-full border transition-all bg-white text-gray-800 font-semibold text-[13px] shadow-sm cursor-pointer ${
                  isDropdownOpen
                    ? "border-pink-500 ring-2 ring-pink-200"
                    : "border-pink-200 hover:border-pink-400"
                }`}
              >
                {currentSelectedTypeObj ? (
                  <div className="flex items-center gap-2.5">
                    {getRawIcon(
                      getEnglishTypeCode(currentSelectedTypeObj.code),
                      16,
                    )}
                    <span>{currentSelectedTypeObj.code}</span>
                  </div>
                ) : (
                  <span>Select type...</span>
                )}
                <ChevronDown
                  size={16}
                  className={`text-gray-400 ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-full sm:min-w-[200px] bg-white border border-gray-100 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] py-2 z-50 overflow-hidden">
                  {tickerTypes.map((t) => {
                    const engCode = getEnglishTypeCode(t.code);
                    const isSelected = selectedType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedType(t.id);
                          setPageNumber(1);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-pink-50 text-pink-600"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {getRawIcon(engCode, 16)}
                        <span
                          className={`text-sm ${isSelected ? "font-bold" : "font-medium"}`}
                        >
                          {t.code}{" "}
                          <span className="text-gray-400 font-normal text-xs ml-1">
                            ({t.name})
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative w-full sm:w-60 flex items-center">
              <Search size={14} className="absolute left-4 text-pink-400" />
              <input
                type="text"
                placeholder="Search symbol or name..."
                className="w-full pl-9 pr-5 py-2.5 rounded-full border border-pink-200 focus:border-pink-500 outline-none transition-all bg-white text-gray-800 text-[16px] md:text-[13px] shadow-[0_8px_18px_rgba(236,72,153,0.08)]"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="hidden md:flex items-center px-4 h-10 border-l border-gray-200 ml-1 min-w-[90px]">
              <span
                className={`text-[11px] font-bold text-gray-400 uppercase tracking-widest transition-opacity duration-200 ${
                  loading ? "opacity-40" : "opacity-100"
                }`}
              >
                {totalRecords} items
              </span>
            </div>
            {/* <button
              onClick={() => openFormModal()}
              className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold text-[13px] shadow-md hover:-translate-y-0.5 transition-all"
            >
              + ADD TICKER
            </button> */}
          </div>
        </div>

        {error && (
          <p className="text-rose-600 text-sm font-medium mb-4 text-center">
            {error}
          </p>
        )}

        {/* CARDS GRID (COMPACT MODE) */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}
        >
          {!loading && tickers.length === 0 && !error && (
            <p className="text-gray-500 text-sm col-span-full text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
              Can't find any matching assets.
            </p>
          )}

          {tickers.map((t) => {
            const displayTypeCode = getEnglishTypeCode(t.tickerTypeName);

            return (
              <div
                key={t.id}
                className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] transition-all duration-200 border border-transparent hover:border-pink-100 flex flex-col justify-between h-full group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    {getRawIcon(displayTypeCode, 18)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-lg font-black text-gray-900 tracking-tight uppercase truncate">
                        {t.symbol}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase tracking-wider">
                        {displayTypeCode}
                      </span>
                    </div>

                    <div className="relative group/tooltip cursor-help w-full">
                      <p className="text-[11px] font-medium text-gray-500 truncate leading-snug">
                        {t.name}
                      </p>

                      <div className="absolute left-0 top-5 hidden group-hover/tooltip:block w-max max-w-[240px] bg-gray-800 text-white text-[11px] rounded-lg py-2 px-3 z-50 whitespace-normal shadow-xl leading-relaxed">
                        {t.name}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-end justify-between">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">
                      Market Price
                    </span>
                    <span className="text-[15px] font-black text-gray-900 leading-none">
                      {formatPrice(t.marketPrice, t.currency)}
                    </span>
                  </div>

                  {/* <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFormModal(t);
                      }}
                      title="Edit"
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(t, e)}
                      title="Delete"
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div> */}
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6 mb-4">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600">
              Page <span className="font-bold text-gray-900">{pageNumber}</span>{" "}
              of {totalPages}
            </span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* ========================================================
            MODAL: FORM ADD / EDIT TICKER
        ======================================================== */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={closeFormModal}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-1.5 transition-all"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black text-gray-900 mb-6">
                {editingTicker ? "Edit Market Ticker" : "Add Market Ticker"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Asset Type *
                    </label>
                    <select
                      name="tickerTypeId"
                      value={formData.tickerTypeId}
                      onChange={handleFormTypeChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 cursor-pointer font-medium text-[16px] md:text-sm transition-all"
                    >
                      <option value="">-- Select --</option>
                      {tickerTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {getEnglishTypeCode(t.code)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Currency *
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 cursor-pointer font-medium text-[16px] md:text-sm transition-all"
                    >
                      <option value="VND">VND (₫)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleChange}
                      placeholder="e.g., TCB, BTC"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 text-[16px] md:text-sm font-bold uppercase transition-all"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Market Price{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <NumericFormat
                      thousandSeparator=","
                      decimalScale={8}
                      allowNegative={false}
                      name="marketPrice"
                      value={formData.marketPrice}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 text-[16px] md:text-sm font-semibold transition-all"
                      onValueChange={(values) => {
                        const { value } = values;
                        setFormData((prev) => ({
                          ...prev,
                          marketPrice: value,
                        }));
                      }}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Company / Token Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Techcombank"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 text-[16px] md:text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-rose-600 text-xs font-bold text-center pt-2">
                    {formError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-7 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-sm shadow-[0_8px_15px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save Ticker"}
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
