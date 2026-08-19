import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Tags,
} from "lucide-react";

export default function TickerTypePage() {
  const [tickerTypes, setTickerTypes] = useState([]);
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  const fetchTickerTypes = useCallback(async () => {
    setLoading(true);

    try {
      const trimmed = keyword.trim();

      const res = await axiosInstance.get("/TickerTypes/search", {
        params: {
          keyword: trimmed || undefined,
        },
      });

      const data = res.data?.result || res.data || [];

      setTickerTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load ticker types.",
      );
      setTickerTypes([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTickerTypes();
    }, 350);

    return () => clearTimeout(delay);
  }, [fetchTickerTypes]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const openModal = (tickerType = null) => {
    setFormError("");

    if (tickerType) {
      setEditingType(tickerType);

      setFormData({
        code: tickerType.code || "",
        name: tickerType.name || "",
      });
    } else {
      setEditingType(null);

      setFormData({
        code: "",
        name: "",
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setFormError("");

    setFormData({
      code: "",
      name: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = formData.code.trim().toUpperCase();
    const name = formData.name.trim();

    if (!code || !name) {
      setFormError("Code and Name are required.");
      return;
    }

    if (code.length > 10) {
      setFormError("Code must not exceed 10 characters.");
      return;
    }

    if (name.length > 50) {
      setFormError("Name must not exceed 50 characters.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      let res;

      if (editingType) {
        res = await axiosInstance.put(
          `/TickerTypes/${editingType.id}`,
          {
            code,
            name,
            isDeleted: false,
          },
        );
      } else {
        res = await axiosInstance.post("/TickerTypes", {
          code,
          name,
        });
      }

      toast.success(
        res.data?.message ||
          (editingType
            ? "Ticker type updated successfully."
            : "Ticker type added successfully."),
      );

      closeModal();
      fetchTickerTypes();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to save ticker type.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tickerType) => {
    const confirmed = window.confirm(
      `Delete ticker type "${tickerType.code}"?\n\nThis type should not be deleted while active tickers are using it.`,
    );

    if (!confirmed) return;

    try {
      const res = await axiosInstance.delete(
        `/TickerTypes/${tickerType.id}`,
      );

      toast.success(
        res.data?.message || "Ticker type deleted successfully.",
      );

      fetchTickerTypes();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to delete ticker type.",
      );
    }
  };

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-6xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              Ticker Types

              {loading && (
                <Loader2
                  size={20}
                  className="animate-spin text-pink-500"
                />
              )}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage asset categories used by market tickers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="w-full md:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 text-white text-[13px] font-bold shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            ADD TICKER TYPE
          </button>
        </div>

        {/* SEARCH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400"
            />

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search code or name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-pink-200 bg-white outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 text-[16px] md:text-[13px] shadow-sm"
            />
          </div>

          {!loading && (
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {tickerTypes.length} items
            </span>
          )}
        </div>

        {/* LIST */}
        <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[160px_1fr_120px] px-6 py-3 bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest font-bold text-gray-400">
            <div>Code</div>
            <div>Name</div>
            <div className="text-right">Actions</div>
          </div>

          {!loading && tickerTypes.length === 0 && (
            <div className="py-14 text-center text-sm text-gray-400">
              No ticker types found.
            </div>
          )}

          {tickerTypes.map((type) => (
            <div
              key={type.id}
              className="grid grid-cols-1 md:grid-cols-[160px_1fr_120px] gap-3 md:gap-0 items-center px-5 md:px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-pink-50/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                  <Tags size={16} />
                </div>

                <span className="font-black text-gray-900 tracking-wide">
                  {type.code}
                </span>
              </div>

              <div>
                <span className="md:hidden text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1">
                  Name
                </span>

                <span className="text-sm font-medium text-gray-600">
                  {type.name}
                </span>
              </div>

              <div className="flex md:justify-end gap-2">
                <button
                  type="button"
                  title="Edit"
                  onClick={() => openModal(type)}
                  className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors"
                >
                  <Pencil size={13} />
                </button>

                <button
                  type="button"
                  title="Delete"
                  onClick={() => handleDelete(type)}
                  className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl font-black text-gray-900 mb-1">
                {editingType
                  ? "Edit Ticker Type"
                  : "Add Ticker Type"}
              </h2>

              <p className="text-sm text-gray-400 mb-7">
                {editingType
                  ? "Update this asset category."
                  : "Create a new asset category for market tickers."}
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Code *
                  </label>

                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="e.g. STOCK"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 text-[16px] md:text-sm font-bold uppercase"
                  />

                  <div className="text-right mt-1 text-[10px] text-gray-400">
                    {formData.code.length}/10
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="e.g. Stocks"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-gray-50 text-[16px] md:text-sm font-medium"
                  />

                  <div className="text-right mt-1 text-[10px] text-gray-400">
                    {formData.name.length}/50
                  </div>
                </div>

                {formError && (
                  <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingType
                        ? "Save Changes"
                        : "Add Type"}
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