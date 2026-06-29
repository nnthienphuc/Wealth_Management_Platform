import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { formatDate } from "../../../utils/formatDate";
import { toast } from "react-toastify";
import {
  LineChart,
  Bitcoin,
  PieChart,
  ScrollText,
  CircleDollarSign,
  Pencil,
  Trash2,
  X,
  Loader2,
  ArchiveRestore,
  Trash,
  Search,
  ChevronDown,
  PiggyBank,
  Wallet,
  Landmark,
  CreditCard,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NumericFormat } from "react-number-format";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const USD_TO_VND = 27000;

// === FORMATTERS & HELPERS ===
const checkIsCrypto = (typeCode) => {
  const code = (typeCode || "").toUpperCase();
  return (
    code.includes("COIN") || code.includes("CRYPTO") || code.includes("TIỀN ẢO")
  );
};

const formatMoney = (value, isCrypto = false, isVndDisplay = false) => {
  if (value == null || isNaN(value)) return "0";
  const num = Number(value);
  if (isCrypto) {
    return (
      "$" +
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }).format(num)
    );
  }
  return (
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: isVndDisplay ? 0 : 2,
    }).format(num) + " ₫"
  );
};

const formatVndTotal = (value) => {
  if (value == null || isNaN(value)) return "0 VND";
  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Number(value),
    ) + " VND"
  );
};

const formatUsdTotal = (value) => {
  if (value == null || isNaN(value)) return "$0";
  return (
    "$" +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(Number(value))
  );
};

const formatQuantity = (value, isCrypto = false) => {
  if (value == null || isNaN(value)) return "0";
  const num = Number(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: isCrypto ? 8 : 4,
  }).format(num);
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
  if (
    id.includes("STOCK") ||
    id.includes("CHỨNG KHOÁN") ||
    id.includes("CỔ PHIẾU")
  )
    return <LineChart size={size} />;
  if (id.includes("CRYPTO") || id.includes("COIN") || id.includes("TIỀN ẢO"))
    return <Bitcoin size={size} />;
  if (id.includes("FUND") || id.includes("QUỸ"))
    return <PieChart size={size} />;
  if (id.includes("BOND") || id.includes("TRÁI PHIẾU"))
    return <ScrollText size={size} />;
  return <CircleDollarSign size={size} />;
};

const getAccountIcon = (type, size = 18) => {
  switch (type?.toUpperCase()) {
    case "SAVINGS":
      return <PiggyBank size={size} className="text-orange-500" />;
    case "CASH":
      return <Wallet size={size} className="text-green-500" />;
    case "SECURITIES":
      return <LineChart size={size} className="text-blue-500" />;
    case "CRYPTO":
      return <Bitcoin size={size} className="text-yellow-500" />;
    case "CREDIT":
      return <CreditCard size={size} className="text-emerald-500" />;
    case "BANK":
    default:
      return <Landmark size={size} className="text-emerald-500" />;
  }
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5034";

const markdownComponents = {
  h1: (props) => <h1 className="text-base font-bold mt-4 mb-2" {...props} />,
  h2: (props) => <h2 className="text-sm font-bold mt-3 mb-1" {...props} />,
  p: (props) => <p className="my-2 leading-relaxed" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
  strong: (props) => <strong className="font-bold text-gray-900" {...props} />,
  img: ({ node, ...props }) => {
    const imageSrc = props.src?.startsWith("/")
      ? `${API_BASE_URL}${props.src}`
      : props.src;

    return (
      <Zoom>
        <img
          {...props}
          src={imageSrc}
          className="max-w-full h-auto rounded-xl my-4 border border-gray-200 shadow-sm mx-auto block"
          alt="markdown-img"
        />
      </Zoom>
    );
  },
  code: ({ inline, children, ...props }) =>
    inline ? (
      <code
        className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-semibold"
        {...props}
      >
        {children}
      </code>
    ) : (
      <pre className="bg-slate-800 text-gray-50 p-4 rounded-xl overflow-x-auto text-xs my-3 shadow-inner custom-scrollbar">
        <code {...props}>{String(children).replace(/\n$/, "")}</code>
      </pre>
    ),
};

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(6);

  const [loading, setLoading] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);
  const [isOwned, setIsOwned] = useState(false);

  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false);
  const accDropdownRef = useRef(null);
  const [isFormAccDropdownOpen, setIsFormAccDropdownOpen] = useState(false);
  const formAccDropdownRef = useRef(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [noteMode, setNoteMode] = useState("edit");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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
    quantity: "",
    investmentCost: "",
    targetBuy: "",
    targetSell: "",
    note: "",
  });

  const currentAccount = useMemo(
    () =>
      accounts.find((a) => (a.accountID || a.accountId) === selectedAccountId),
    [accounts, selectedAccountId],
  );
  const isGlobalCryptoAccount =
    currentAccount?.accountType?.toUpperCase() === "CRYPTO";
  const totalPages = useMemo(
    () => Math.ceil(totalRecords / pageSize) || 1,
    [totalRecords, pageSize],
  );

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const textareaRef = useRef(null);

  const processImageUpload = async (file) => {
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await axiosInstance.post(
        "/UploadImage/ticker-note-image",
        uploadData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const imageUrl = res.data.url;
      const imageMarkdown = `\n![Uploaded Image](${imageUrl})\n`;

      // Logic chèn ảnh vào ĐÚNG vị trí con trỏ chuột
      const textarea = textareaRef.current;
      if (textarea) {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const currentNote = formData.note || "";

        const newNote =
          currentNote.substring(0, startPos) +
          imageMarkdown +
          currentNote.substring(endPos);

        setFormData((prev) => ({ ...prev, note: newNote }));

        // Đưa con trỏ chuột về sau bức ảnh vừa chèn
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            startPos + imageMarkdown.length;
          textarea.focus();
        }, 0);
      } else {
        // Fallback nếu không tìm thấy ref
        setFormData((prev) => ({
          ...prev,
          note: (prev.note || "") + imageMarkdown,
        }));
      }

      toast.success("Image uploaded!");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm bắt sự kiện Ctrl+V
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault(); // Chặn việc paste text mặc định
        const file = items[i].getAsFile();
        processImageUpload(file);
        break; // Chỉ xử lý 1 ảnh mỗi lần paste
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Đẩy file vào hàm xử lý chung mà bạn đã viết
    processImageUpload(file);

    // Reset lại value của input để user có thể chọn lại chính ảnh đó lần 2 nếu muốn
    e.target.value = null;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accDropdownRef.current &&
        !accDropdownRef.current.contains(event.target)
      )
        setIsAccDropdownOpen(false);
      if (
        formAccDropdownRef.current &&
        !formAccDropdownRef.current.contains(event.target)
      )
        setIsFormAccDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axiosInstance.get("/Holdings/invest-account");
        const data = res.data?.result || res.data || [];
        setAccounts(data);
        if (data.length > 0)
          setSelectedAccountId(data[0].accountID || data[0].accountId);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axiosInstance.get("/TickerTypes");
        const data = res.data?.result || res.data || [];
        setTickerTypes(data);
        const stockType = data.find((t) => t.code.toUpperCase() === "STOCK");
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

  const handleOwnedToggle = (e) => {
    setIsOwned(e.target.checked);
    setPageNumber(1);
  };

  const fetchSummary = useCallback(async () => {
    if (!selectedAccountId || isTrashView) return;
    try {
      const res = await axiosInstance.get("/Holdings/summary", {
        params: { accountId: selectedAccountId },
      });
      setSummary(res.data?.result || res.data);
    } catch (err) {
      console.error("Summary load failed", err);
    }
  }, [selectedAccountId, isTrashView]);

  const fetchHoldings = useCallback(
    async (isSilent = false) => {
      if (!selectedAccountId) return;
      if (!isSilent) setLoading(true);
      try {
        const res = await axiosInstance.get("/Holdings", {
          params: {
            accountID: selectedAccountId,
            tickerSymbol: keyword.trim() || undefined,
            isDeleted: isTrashView,
            isOwned: isOwned,
            pageNumber,
            pageSize,
          },
        });
        const data = res.data?.result || res.data;
        if (data && data.items) {
          setHoldings(data.items);
          setTotalRecords(data.totalRecords);
        } else {
          setHoldings([]);
          setTotalRecords(0);
        }
      } catch (err) {
        toast.error("Failed to load holdings.");
      } finally {
        setLoading(false);
      }
    },
    [selectedAccountId, keyword, isTrashView, isOwned, pageNumber, pageSize],
  );

  useEffect(() => {
    fetchHoldings();
    fetchSummary();
  }, [
    selectedAccountId,
    isTrashView,
    isOwned,
    pageNumber,
    fetchSummary,
    fetchHoldings,
  ]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (keyword.trim() !== "") {
        setPageNumber(1);
        fetchHoldings(true);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [keyword]);

  useEffect(() => {
    if (!isTickerModalOpen || !tickerSearchType) return;
    const delay = setTimeout(async () => {
      setIsSearchingTickers(true);
      try {
        const trimmed = tickerSearchKeyword.trim();
        const res = await axiosInstance.get("/Tickers", {
          params: {
            tickerTypeId: tickerSearchType,
            symbol: trimmed || undefined,
            pageNumber: 1,
            pageSize: 50,
          },
        });
        const data = res.data?.result || res.data;
        setTickerSearchResults(data && data.items ? data.items : []);
      } catch (err) {
        setTickerSearchResults([]);
      } finally {
        setIsSearchingTickers(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [tickerSearchType, tickerSearchKeyword, isTickerModalOpen]);

  const openFormModal = (holding = null) => {
    setFormError("");
    setNoteMode("edit");
    if (holding) {
      setEditingHolding(holding);
      setFormData({
        accountId: holding.accountID || holding.accountId,
        tickerId: holding.tickerID || holding.tickerId,
        quantity: String(holding.quantity),
        investmentCost: String(holding.investmentCost),
        targetBuy: holding.targetBuy ? String(holding.targetBuy) : "",
        targetSell: holding.targetSell ? String(holding.targetSell) : "",
        note: holding.note && holding.note !== "N/A" ? holding.note : "",
      });
      setSelectedTickerInfo({
        symbol: holding.tickerSymbol,
        typeCode: holding.tickerTypeCode,
        name: holding.tickerName,
      });
    } else {
      setEditingHolding(null);
      setFormData({
        accountId: selectedAccountId || accounts[0]?.accountID || "",
        tickerId: "",
        quantity: "",
        investmentCost: "",
        targetBuy: "",
        targetSell: "",
        note: "",
      });
      setSelectedTickerInfo(null);
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingHolding(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingHolding && (!formData.accountId || !formData.tickerId)) {
      setFormError("Account and Ticker are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingHolding) {
        const updatePayload = {
          TargetBuy:
            formData.targetBuy === "" ? null : Number(formData.targetBuy),
          TargetSell:
            formData.targetSell === "" ? null : Number(formData.targetSell),
          Note: formData.note.trim() || null,
        };
        await axiosInstance.put(
          `/Holdings/${editingHolding.id || editingHolding.ID}`,
          updatePayload,
        );
      } else {
        const addPayload = {
          AccountID: formData.accountId,
          TickerID: formData.tickerId,
          TargetBuy:
            formData.targetBuy === "" ? null : Number(formData.targetBuy),
          TargetSell:
            formData.targetSell === "" ? null : Number(formData.targetSell),
          Note: formData.note.trim() || null,
        };
        await axiosInstance.post("/Holdings", addPayload);
      }
      toast.success("Success!");
      closeFormModal();
      fetchHoldings();
      fetchSummary();
    } catch (err) {
      setFormError(err.response?.data?.message || "Submit failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (holding, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${holding.tickerSymbol}?`)) return;
    try {
      await axiosInstance.delete(`/Holdings/${holding.id || holding.ID}`);
      toast.success("Moved to recycle bin.");
      fetchHoldings();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleRestore = async (holding, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.put(`/Holdings/${holding.id || holding.ID}/restore`);
      toast.success("Restored!");
      fetchHoldings();
      fetchSummary();
    } catch (err) {
      toast.error("Restore failed.");
    }
  };

  const selectedFormAccount = accounts.find(
    (a) => (a.accountID || a.accountId) === formData.accountId,
  );

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        {/* HEADER AREA */}
        <div className="mb-5">
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            Ticker Management
            {loading && (
              <Loader2 className="animate-spin text-pink-500" size={20} />
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage your investments and track P&L performance
          </p>
        </div>

        {/* SUMMARY CARDS */}
        {!isTrashView && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-[150px]">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Invested by type
                </div>
                <div className="text-[12px] text-gray-600 flex flex-col gap-1">
                  {Object.entries(summary.summaryByTypeList).map(
                    ([type, data]) => (
                      <div key={type}>
                        {type}:{" "}
                        <strong className="text-gray-900 font-semibold">
                          {checkIsCrypto(type)
                            ? formatUsdTotal(data.totalInvested)
                            : formatVndTotal(data.totalInvested)}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="text-[12px] text-gray-500 pt-2 border-t border-gray-50 flex justify-between items-center mt-auto">
                <span>Total ({isGlobalCryptoAccount ? "USD" : "VND"}):</span>
                <strong className="text-gray-900 text-[15px] font-black">
                  {isGlobalCryptoAccount
                    ? formatUsdTotal(summary.totalInvestedList)
                    : formatVndTotal(summary.totalInvestedList)}
                </strong>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-[150px]">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Market value by type
                </div>
                <div className="text-[12px] text-gray-600 flex flex-col gap-1">
                  {Object.entries(summary.summaryByTypeList).map(
                    ([type, data]) => (
                      <div key={type}>
                        {type}:{" "}
                        <strong className="text-gray-900 font-semibold">
                          {checkIsCrypto(type)
                            ? formatUsdTotal(data.totalMarketValue)
                            : formatVndTotal(data.totalMarketValue)}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="text-[12px] text-gray-500 pt-2 border-t border-gray-50 flex justify-between items-center mt-auto">
                <span>Total ({isGlobalCryptoAccount ? "USD" : "VND"}):</span>
                <strong className="text-gray-900 text-[15px] font-black">
                  {isGlobalCryptoAccount
                    ? formatUsdTotal(summary.totalMarketValueList)
                    : formatVndTotal(summary.totalMarketValueList)}
                </strong>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col h-[150px]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Tickers by type
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 custom-scrollbar">
                {Object.entries(summary.summaryByTypeList).map(
                  ([type, data]) => (
                    <div key={type} className="text-[12px] text-gray-600">
                      <strong className="text-gray-900 font-bold uppercase">
                        {type}:
                      </strong>{" "}
                      {data.totalTicker} ticker{data.totalTicker > 1 ? "s" : ""}{" "}
                      -{" "}
                      <span className="font-semibold text-gray-800">
                        {formatQuantity(
                          data.totalQuantity,
                          checkIsCrypto(type),
                        )}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full mb-6">
          <div
            className="relative w-full sm:w-auto min-w-[140px]"
            ref={accDropdownRef}
          >
            <div
              onClick={() => setIsAccDropdownOpen(!isAccDropdownOpen)}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-full border transition-all bg-white text-gray-800 font-semibold text-[13px] shadow-sm cursor-pointer ${isAccDropdownOpen ? "border-pink-500 ring-2 ring-pink-200" : "border-pink-200 hover:border-pink-400"}`}
            >
              {currentAccount ? (
                <div className="flex items-center gap-2">
                  {getAccountIcon(currentAccount.accountType, 16)}
                  <span className="truncate max-w-[100px]">
                    {currentAccount.accountName}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400">Account</span>
              )}
              <ChevronDown
                size={14}
                className={`text-gray-400 ml-2 transition-transform ${isAccDropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
            {isAccDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full sm:min-w-[200px] bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-30 overflow-hidden">
                {accounts.map((acc) => (
                  <div
                    key={acc.accountID || acc.accountId}
                    onClick={() =>
                      handleAccountChange(acc.accountID || acc.accountId)
                    }
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${selectedAccountId === (acc.accountID || acc.accountId) ? "bg-pink-50 text-pink-600" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    {getAccountIcon(acc.accountType, 16)}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] truncate font-medium">
                        {acc.accountName}
                      </span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                        {acc.accountType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-60">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400"
            />
            <input
              type="text"
              placeholder="Search Symbol..."
              className="w-full pl-9 pr-5 py-2.5 rounded-full border border-pink-200 outline-none bg-white text-gray-800 text-[16px] md:text-[13px] shadow-sm focus:border-pink-500"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {!isTrashView && (
            <button
              disabled={accounts.length === 0}
              onClick={() => openFormModal()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white font-bold text-[13px] shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              + ADD HOLDING
            </button>
          )}

          {!isTrashView && (
            <label className="flex items-center gap-2 text-[12px] font-medium text-gray-600 cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={isOwned}
                onChange={handleOwnedToggle}
                className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-gray-300"
              />
              The ticket holders currently own
            </label>
          )}

          {!isTrashView && !loading && (
            <div className="hidden md:flex items-center px-4 h-10 border-l border-gray-200 ml-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {totalRecords} items
              </span>
            </div>
          )}

          <div className="ml-auto w-full sm:w-auto">
            <button
              onClick={() => setIsTrashView(!isTrashView)}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-full font-bold text-[13px] flex items-center justify-center border transition-all ${isTrashView ? "bg-gray-800 text-white border-gray-800 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500 shadow-sm"}`}
            >
              {isTrashView ? "Active List" : <Trash size={16} />}
            </button>
          </div>
        </div>

        {/* CARDS GRID */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-300 ${loading ? "opacity-30" : "opacity-100"}`}
        >
          {holdings.map((h) => {
            const isCrypto = checkIsCrypto(h.tickerTypeCode);
            const totalInvested = h.totalInvestmentCost;
            const marketValue = h.marketPrice * h.quantity;
            const unrealizedPnL = marketValue - totalInvested;
            return (
              <div
                key={h.id || h.ID}
                className="bg-white rounded-[1rem] p-5 shadow-sm hover:-translate-y-0.5 transition-all border border-transparent hover:border-pink-100 flex flex-col group cursor-pointer"
                onClick={() => setDetailHolding(h)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      {getRawIcon(h.tickerTypeCode, 16)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-black text-gray-900 leading-none truncate">
                        {h.tickerSymbol}
                      </div>
                      <div className="relative group/tooltip cursor-help w-max max-w-full mt-0.5">
                        <div className="text-[11px] font-medium text-gray-500 truncate w-[100px] lg:w-[130px]">
                          {h.tickerName}
                        </div>
                        <div className="absolute left-0 top-5 hidden group-hover/tooltip:block w-max max-w-[220px] bg-gray-800 text-white text-[11px] rounded-lg py-2 px-3 z-50 shadow-xl leading-relaxed">
                          {h.tickerName}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <div className="text-[15px] font-black text-gray-900 leading-tight">
                      {formatMoney(h.marketPrice, isCrypto, true)}
                    </div>
                    <div
                      className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${unrealizedPnL >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      {formatPercent(
                        totalInvested > 0 ? unrealizedPnL / totalInvested : 0,
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-sm mt-1 border-b border-gray-50 pb-3">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">
                      Quantity
                    </span>
                    <span className="font-bold text-gray-800 text-[12px]">
                      {formatQuantity(h.quantity, isCrypto)}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 flex items-center gap-1 text-[9px] uppercase font-bold mb-0.5">
                      Avg. Price
                      <div className="relative group/info cursor-help">
                        <Info
                          size={10}
                          className="text-gray-400 hover:text-pink-500 transition-colors"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden w-48 group-hover/info:block bg-gray-800 text-white text-[10px] normal-case tracking-normal rounded-lg p-2 z-50 text-center shadow-xl">
                          Average price is rounded. Minor discrepancies may
                          occur: Avg. Price * Quantity ≠ Total Invested.
                        </div>
                      </div>
                    </span>
                    <span className="font-bold text-gray-800 text-[12px]">
                      {formatMoney(h.investmentCost, isCrypto, true)}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">
                      Total Invested
                    </span>
                    <span className="font-bold text-gray-800 text-[12px]">
                      {formatMoney(totalInvested, isCrypto, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold mb-0.5">
                      Unrealized P&L
                    </span>
                    <span
                      className={`font-bold text-[12px] ${getPnLColor(unrealizedPnL)}`}
                    >
                      {formatMoney(unrealizedPnL, isCrypto, true)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 mt-auto">
                  <span className="text-[10px] text-gray-400 font-medium italic">
                    Click for details
                  </span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isTrashView ? (
                      <button
                        onClick={(e) => handleRestore(h, e)}
                        className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"
                      >
                        <ArchiveRestore size={12} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openFormModal(h);
                          }}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:text-blue-500 flex items-center justify-center"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(h, e)}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:text-red-500 flex items-center justify-center"
                        >
                          <Trash2 size={12} />
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
          <div className="flex justify-center items-center gap-3 mt-6">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber((p) => p - 1)}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-[13px] hover:text-pink-500 disabled:opacity-50 transition-all shadow-sm"
            >
              Prev
            </button>
            <span className="text-[13px] font-medium text-gray-600">
              Page <span className="font-bold text-gray-900">{pageNumber}</span>{" "}
              of {totalPages}
            </span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber((p) => p + 1)}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-[13px] hover:text-pink-500 disabled:opacity-50 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* MODAL 1: FORM ADD / EDIT */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 transition-opacity">
            <div className="bg-white w-full max-w-5xl rounded-[2rem] p-8 md:p-10 relative animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <button
                onClick={closeFormModal}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-2 transition-all z-10"
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-black text-gray-900 mb-6 shrink-0">
                {editingHolding ? "Edit Holding" : "Add Holding"}
              </h2>
              <form
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 min-h-0">
                  <div className="md:col-span-5 space-y-5 overflow-y-auto pr-2 pb-4 [&::-webkit-scrollbar]:hidden">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                        Account *
                      </label>
                      <div className="relative w-full" ref={formAccDropdownRef}>
                        <div
                          onClick={() =>
                            !editingHolding &&
                            setIsFormAccDropdownOpen(!isFormAccDropdownOpen)
                          }
                          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 ${editingHolding ? "bg-gray-100 cursor-not-allowed opacity-70" : "focus:border-pink-400 bg-gray-50 cursor-pointer"}`}
                        >
                          {selectedFormAccount ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                              {getAccountIcon(
                                selectedFormAccount.accountType,
                                18,
                              )}
                              <span className="truncate text-sm font-semibold">
                                {selectedFormAccount.accountName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Select Account...
                            </span>
                          )}
                          <ChevronDown
                            size={16}
                            className="text-gray-400 shrink-0"
                          />
                        </div>
                        {!editingHolding && isFormAccDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                            {accounts.map((acc) => (
                              <div
                                key={acc.accountID || acc.accountId}
                                onClick={() => {
                                  setFormData((p) => ({
                                    ...p,
                                    accountId: acc.accountID || acc.accountId,
                                  }));
                                  setIsFormAccDropdownOpen(false);
                                }}
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-pink-50"
                              >
                                {getAccountIcon(acc.accountType, 16)}
                                <span className="text-sm font-medium text-gray-700 truncate">
                                  {acc.accountName}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                        Ticker *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          !editingHolding && setIsTickerModalOpen(true)
                        }
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${editingHolding ? "bg-gray-100 cursor-not-allowed opacity-70 border-gray-200" : selectedTickerInfo ? "border-pink-400 ring-2 ring-pink-100 bg-gray-50" : "border-gray-200 hover:border-pink-300 bg-gray-50"}`}
                        disabled={!!editingHolding}
                      >
                        {selectedTickerInfo ? (
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="text-pink-500">
                              {getRawIcon(selectedTickerInfo.typeCode, 20)}
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="font-black text-gray-900 text-base truncate">
                                {selectedTickerInfo.symbol}
                              </span>
                              <span className="text-[10px] font-semibold text-gray-500 truncate max-w-full">
                                {selectedTickerInfo.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">
                            Click to Search Symbol
                          </span>
                        )}
                        <Search size={16} className="text-gray-400" />
                      </button>
                    </div>

                    {/* HIỂN THỊ KHI UPDATE, ẨN KHI ADD */}
                    {editingHolding && (
                      <>
                        <div>
                          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                            Quantity (Auto-calculated)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            name="quantity"
                            value={formData.quantity}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                            Average Cost (Auto-calculated)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            name="investmentCost"
                            value={formData.investmentCost}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                          Target Buy
                        </label>
                        <NumericFormat
                          thousandSeparator=","
                          decimalScale={8}
                          allowNegative={false}
                          name="targetBuy"
                          value={formData.targetBuy}
                          placeholder="(Optional)"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-base md:text-sm font-semibold text-blue-600 transition-all"
                          onValueChange={(values) => {
                            const { value } = values;
                            setFormData((prev) => ({
                              ...prev,
                              targetBuy: value,
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                          Target Sell
                        </label>
                        <NumericFormat
                          thousandSeparator=","
                          decimalScale={8}
                          allowNegative={false}
                          name="targetSell"
                          value={formData.targetSell}
                          placeholder="(Optional)"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-base md:text-sm font-semibold text-orange-600 transition-all"
                          onValueChange={(values) => {
                            const { value } = values;
                            setFormData((prev) => ({
                              ...prev,
                              targetSell: value,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-7 flex flex-col min-h-0 bg-gray-50 rounded-2xl border border-gray-200 p-1">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl shrink-0">
                      <label className="block text-sm font-bold text-gray-800">
                        Trading Notes (Markdown)
                      </label>

                      {noteMode === "edit" && (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                          />
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current.click()}
                            className="text-[11px] px-2 py-1 bg-pink-50 text-pink-600 rounded hover:bg-pink-100 font-semibold flex items-center gap-1 transition-colors"
                          >
                            {isUploading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "📷 Attach Image"
                            )}
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setNoteMode("edit")}
                          className={`text-[11px] px-3 py-1.5 rounded-md font-bold transition-all ${noteMode === "edit" ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteMode("preview")}
                          className={`text-[11px] px-3 py-1.5 rounded-md font-bold transition-all ${noteMode === "preview" ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden p-3 flex flex-col bg-white rounded-b-2xl">
                      {noteMode === "edit" ? (
                        <textarea
                          ref={textareaRef}
                          onPaste={handlePaste}
                          name="note"
                          value={formData.note}
                          onChange={handleChange}
                          className="flex-1 w-full outline-none resize-none font-mono text-[16px] md:text-[13px] leading-relaxed text-gray-700 p-2 custom-scrollbar"
                          placeholder="## Plan... (You can Ctrl+V to paste images here)"
                        />
                      ) : (
                        <div className="flex-1 w-full overflow-y-auto text-[13px] text-gray-800 p-2 custom-scrollbar prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {formData.note || "*No note provided*"}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {formError && (
                  <p className="text-rose-600 text-sm font-bold text-center mt-2 shrink-0">
                    {formError}
                  </p>
                )}
                <div className="shrink-0 flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-sm shadow-[0_8px_15px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save Holding"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 1.5: TICKER PICKER */}
        {isTickerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-opacity">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 md:p-8 relative animate-in fade-in zoom-in duration-200 flex flex-col h-[500px]">
              <button
                onClick={() => setIsTickerModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 bg-gray-50 rounded-full p-1.5"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-black text-gray-900 mb-6">
                Select Ticker
              </h2>
              <div className="flex gap-3 mb-6">
                <select
                  className="w-1/3 px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-base md:text-sm font-bold bg-gray-50"
                  value={tickerSearchType}
                  onChange={(e) => setTickerSearchType(e.target.value)}
                >
                  {tickerTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code}
                    </option>
                  ))}
                </select>
                <div className="relative w-2/3">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-[16px] md:text-sm font-medium bg-gray-50"
                    value={tickerSearchKeyword}
                    onChange={(e) => setTickerSearchKeyword(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {isSearchingTickers && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="animate-spin text-pink-500" />
                  </div>
                )}
                {tickerSearchResults.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setFormData((p) => ({ ...p, tickerId: t.id }));
                      setSelectedTickerInfo({
                        id: t.id,
                        symbol: t.symbol,
                        typeCode: t.tickerTypeName,
                        name: t.name,
                      });
                      setIsTickerModalOpen(false);
                    }}
                    className="flex items-center gap-4 p-3.5 rounded-2xl border border-gray-100 hover:border-pink-400 hover:bg-pink-50 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white shadow-sm">
                      {getRawIcon(t.tickerTypeName, 22)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900 text-base">
                        {t.symbol}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {t.name}
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 py-1 bg-gray-100 rounded-lg group-hover:bg-white group-hover:text-pink-50">
                      {t.tickerTypeName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: VIEW DETAILS */}
        {detailHolding && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
            onClick={() => setDetailHolding(null)}
          >
            <div
              className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDetailHolding(null)}
                className="absolute top-6 right-6 z-20 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-full p-2 transition-all"
              >
                <X size={24} />
              </button>
              <div className="p-8 pb-6 shrink-0 bg-white z-10 border-b border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pr-8">
                  <div className="flex items-center gap-5 w-full">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                      {getRawIcon(detailHolding.tickerTypeCode, 28)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-end gap-3 mb-1">
                          <h2 className="text-4xl font-black text-gray-900 leading-none truncate">
                            {detailHolding.tickerSymbol}
                          </h2>
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] rounded-full uppercase tracking-widest font-bold mb-0.5">
                            {detailHolding.accountName}
                          </span>
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] rounded-full uppercase tracking-widest font-bold mb-0.5">
                            {detailHolding.tickerTypeCode}
                          </span>
                        </div>
                        <div className="hidden md:flex items-center gap-3 text-[11px] font-medium text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <span>
                            Created:{" "}
                            <strong className="text-gray-600">
                              {formatDate(detailHolding.createdAt)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Updated:{" "}
                            <strong className="text-gray-600">
                              {formatDate(detailHolding.updatedAt)}
                            </strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-500 mt-1.5 truncate max-w-md">
                        {detailHolding.tickerName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 text-sm mt-2">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                      Quantity
                    </span>
                    <span className="font-bold text-gray-900 text-[15px]">
                      {formatQuantity(
                        detailHolding.quantity,
                        checkIsCrypto(detailHolding.tickerTypeCode),
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold mb-1">
                      Avg. Price
                      <div className="relative group/info cursor-help">
                        <Info
                          size={12}
                          className="text-gray-400 hover:text-pink-500 transition-colors"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden w-48 group-hover/info:block bg-gray-800 text-white text-[10px] normal-case tracking-normal rounded-lg p-2 z-50 text-center shadow-xl font-medium">
                          Average price is rounded. Minor discrepancies may
                          occur: Avg. Price * Quantity ≠ Total Invested.
                        </div>
                      </div>
                    </span>
                    <span className="font-bold text-gray-900 text-[15px]">
                      {formatMoney(
                        detailHolding.investmentCost,
                        checkIsCrypto(detailHolding.tickerTypeCode),
                        true,
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                      Market Price
                    </span>
                    <span className="font-bold text-gray-900 text-[15px]">
                      {formatMoney(
                        detailHolding.marketPrice,
                        checkIsCrypto(detailHolding.tickerTypeCode),
                        true,
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                      Total Invested
                    </span>
                    <span className="font-bold text-gray-900 text-[15px]">
                      {formatMoney(
                        detailHolding.totalInvestmentCost,
                        checkIsCrypto(detailHolding.tickerTypeCode),
                        true,
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                      Market Value
                    </span>
                    <span className="font-black text-gray-900 text-[15px]">
                      {formatMoney(
                        detailHolding.marketPrice * detailHolding.quantity,
                        checkIsCrypto(detailHolding.tickerTypeCode),
                        true,
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                      Unrealized P&L
                    </span>
                    <span
                      className={`font-black text-[15px] flex flex-wrap items-center gap-1.5 ${getPnLColor(detailHolding.marketPrice * detailHolding.quantity - detailHolding.totalInvestmentCost)}`}
                    >
                      {formatMoney(
                        detailHolding.marketPrice * detailHolding.quantity -
                          detailHolding.totalInvestmentCost,
                        checkIsCrypto(detailHolding.tickerTypeCode),
                        true,
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${detailHolding.marketPrice * detailHolding.quantity - detailHolding.totalInvestmentCost >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                      >
                        {formatPercent(
                          detailHolding.totalInvestmentCost > 0
                            ? (detailHolding.marketPrice *
                                detailHolding.quantity -
                                detailHolding.totalInvestmentCost) /
                                detailHolding.totalInvestmentCost
                            : 0,
                        )}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                      Target Buy
                    </span>
                    {detailHolding.targetBuy ? (
                      <span className="font-bold text-blue-600 text-[15px] flex flex-wrap items-center gap-1.5">
                        {formatMoney(
                          detailHolding.targetBuy,
                          checkIsCrypto(detailHolding.tickerTypeCode),
                          true,
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${detailHolding.investmentCost > 0 && detailHolding.targetBuy >= detailHolding.investmentCost ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}
                        >
                          {formatPercent(
                            detailHolding.investmentCost > 0
                              ? (detailHolding.targetBuy -
                                  detailHolding.investmentCost) /
                                  detailHolding.investmentCost
                              : 0,
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="font-bold text-gray-500 text-[15px]">
                        -
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                      Target Sell
                    </span>
                    {detailHolding.targetSell ? (
                      <span className="font-bold text-orange-600 text-[15px] flex flex-wrap items-center gap-1.5">
                        {formatMoney(
                          detailHolding.targetSell,
                          checkIsCrypto(detailHolding.tickerTypeCode),
                          true,
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${detailHolding.investmentCost > 0 && detailHolding.targetSell >= detailHolding.investmentCost ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
                        >
                          {formatPercent(
                            detailHolding.investmentCost > 0
                              ? (detailHolding.targetSell -
                                  detailHolding.investmentCost) /
                                  detailHolding.investmentCost
                              : 0,
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="font-bold text-gray-500 text-[15px]">
                        -
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 custom-scrollbar border-t border-gray-100">
                <span className="text-gray-400 block text-[11px] uppercase tracking-widest font-bold mb-4 pl-1">
                  Trading Notes & Analysis
                </span>
                {detailHolding.note && detailHolding.note !== "N/A" ? (
                  <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm text-sm text-gray-800 min-h-[200px] prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {detailHolding.note}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm italic min-h-[200px] flex items-center justify-center">
                    No notes recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
