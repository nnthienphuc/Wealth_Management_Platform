import React, { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { getTickerTypeIcon } from "../../../utils/getTickerTypeIcon";
import { LineChart, Bitcoin, PieChart, ScrollText, CircleDollarSign, ChevronDown, Loader2 } from "lucide-react";

const formatPrice = (price, currency) => {
  if (price == null || isNaN(price)) return "-";
  const num = Number(price);
  if (currency?.toUpperCase() === "USD") {
    return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(num);
  }
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(num) + " ₫";
};

const getEnglishTypeCode = (name) => {
  const n = (name || "").toUpperCase();
  if (n.includes("CHỨNG KHOÁN") || n.includes("STOCK") || n.includes("CỔ PHIẾU")) return "STOCK";
  if (n.includes("TIỀN ẢO") || n.includes("CRYPTO") || n.includes("COIN")) return "CRYPTO";
  if (n.includes("QUỸ") || n.includes("FUND")) return "FUND";
  if (n.includes("TRÁI PHIẾU") || n.includes("BOND")) return "BOND";
  return n;
};

const getRawIcon = (code, size = 16) => {
  const id = (code || "").toUpperCase();
  if (id.includes("STOCK")) return <LineChart size={size} className="text-blue-500" />;
  if (id.includes("CRYPTO")) return <Bitcoin size={size} className="text-orange-500" />;
  if (id.includes("FUND")) return <PieChart size={size} className="text-emerald-500" />;
  if (id.includes("BOND")) return <ScrollText size={size} className="text-purple-500" />;
  return <CircleDollarSign size={size} className="text-gray-500" />;
};

export default function TickerPage() {
  const [tickers, setTickers] = useState([]);
  const [tickerTypes, setTickerTypes] = useState([]);
  
  const [keyword, setKeyword] = useState("");
  const [selectedType, setSelectedType] = useState(""); 
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axiosInstance.get("/TickerTypes");
        const data = res.data?.result || res.data || [];
        setTickerTypes(Array.isArray(data) ? data : []);
        
        const stockType = data.find(t => t.code.toUpperCase() === "STOCK");
        if (stockType) setSelectedType(stockType.id);
        else if (data.length > 0) setSelectedType(data[0].id);
      } catch (err) {
        console.error("Failed to load ticker types", err);
      }
    };
    fetchTypes();
  }, []);

  const fetchTickers = useCallback(async () => {
    if (!selectedType) return; 

    setLoading(true);
    setError("");
    try {
      const trimmed = keyword.trim();
      const res = await axiosInstance.get("/Tickers", {
        params: {
          tickerTypeId: selectedType,
          symbol: trimmed || undefined, 
          pageNumber,
          pageSize
        }
      });
      
      const data = res.data?.result || res.data;
      if (data && data.items) {
        setTickers(data.items);
        setTotalPages(Math.ceil(data.totalRecords / pageSize));
      } else {
        setTickers([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError("Không thể tải danh sách tài sản từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [selectedType, keyword, pageNumber, pageSize]);

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

  const currentSelectedTypeObj = tickerTypes.find(t => t.id === selectedType);

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        
        {/* HEADER AREA */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              Market Tickers
              {/* Spinner xoay mượt mà khi Loading */}
              {loading && <Loader2 className="animate-spin text-pink-500" size={22} />}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Browse supported assets and real-time market prices
            </p>
          </div>

          {/* FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative">
            
            <div className="relative w-full sm:w-[240px]" ref={dropdownRef}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center justify-between w-full px-5 py-3 rounded-2xl border transition-all bg-white text-gray-800 font-semibold text-sm shadow-[0_8px_18px_rgba(236,72,153,0.08)] cursor-pointer ${
                  isDropdownOpen ? "border-pink-500 ring-2 ring-pink-200" : "border-pink-200 hover:border-pink-400"
                }`}
              >
                {currentSelectedTypeObj ? (
                  <div className="flex items-center gap-2.5">
                    {getRawIcon(getEnglishTypeCode(currentSelectedTypeObj.code), 18)}
                    <span>{currentSelectedTypeObj.code} ({currentSelectedTypeObj.name})</span>
                  </div>
                ) : (
                  <span>Select type...</span>
                )}
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] py-2 z-50 overflow-hidden">
                  {tickerTypes.map((t) => {
                    const engCode = getEnglishTypeCode(t.code);
                    const isSelected = selectedType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedType(t.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-pink-50 text-pink-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {getRawIcon(engCode, 18)}
                        <span className={`text-sm ${isSelected ? "font-bold" : "font-medium"}`}>
                          {t.code} <span className="text-gray-400 font-normal">({t.name})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Search symbol or name..."
              className="w-full sm:w-64 px-5 py-3 rounded-2xl border border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white text-gray-800 text-sm shadow-[0_8px_18px_rgba(236,72,153,0.08)]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm font-medium mb-4">{error}</p>}

        {/* CARDS GRID - Thêm hiệu ứng làm mờ khi Loading để chống giật Layout */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
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
                className="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-200 border border-transparent hover:border-pink-100 flex flex-col justify-between h-full"
              >
                <div className="flex items-start gap-4">
                  {getTickerTypeIcon(displayTypeCode, 28)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-extrabold text-gray-900 tracking-tight uppercase truncate">
                        {t.symbol}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase tracking-wider">
                        {displayTypeCode}
                      </span>
                    </div>

                    <div className="relative group cursor-help w-max max-w-full">
                      <p className="text-xs text-gray-500 truncate leading-snug">
                        {t.name}
                      </p>
                      
                      <div className="absolute left-0 top-5 hidden group-hover:block w-max max-w-[220px] bg-gray-800 text-white text-[11px] rounded-lg py-2 px-3 z-10 whitespace-normal shadow-lg leading-relaxed">
                        {t.name}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-end justify-between">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Market Price</span>
                  <span className="text-base font-bold text-gray-800">
                    {formatPrice(t.marketPrice, t.currency)}
                  </span>
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
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600">
              Page <span className="font-bold text-gray-900">{pageNumber}</span> of {totalPages}
            </span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}