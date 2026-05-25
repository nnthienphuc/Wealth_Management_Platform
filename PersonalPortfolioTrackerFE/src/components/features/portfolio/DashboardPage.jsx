import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { 
  Loader2, Wallet, TrendingUp, TrendingDown, Landmark, 
  Activity, PieChart, BarChart3, ArrowRightLeft, DollarSign
} from "lucide-react";

// === FORMATTERS ===
const formatMoney = (value, isVndDisplay = true) => {
  if (value == null || isNaN(value)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: isVndDisplay ? 0 : 2 }).format(Number(value)) + " ₫";
};

const formatPercent = (rate) => {
  if (rate == null || !Number.isFinite(rate)) return "0%";
  const sign = rate > 0 ? "+" : "";
  return `${sign}${Number(rate).toFixed(2)}%`;
};

const getPnLColor = (value) => (value >= 0 ? "text-emerald-500" : "text-rose-500");

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/Dashboard");
        setData(res.data?.result || res.data);
      } catch (err) {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-500" size={40} /></div>;
  if (!data) return null;

  const { zone1, accountsList, tickerList, topPerformers, recentTransactions } = data;

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50">
      {/* ZONE 1: OVERVIEW METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Portfolio Value", val: zone1.portfolioValue, icon: Landmark, color: "text-blue-500" },
          { label: "Cash Balance", val: zone1.cashBalance, icon: Wallet, color: "text-emerald-500" },
          { label: "Unrealized P&L", val: zone1.unrealizedPnL, rate: zone1.unrealizedPnLRate, icon: TrendingUp, color: "text-indigo-500" },
          { label: "Realized P&L", val: zone1.realizedPnL, icon: Activity, color: "text-orange-500" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`mb-3 ${item.color}`}><item.icon size={24} /></div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{formatMoney(item.val)}</div>
            {item.rate !== undefined && <div className={`text-xs font-bold mt-1 ${getPnLColor(item.rate)}`}>{formatPercent(item.rate)}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* ALLOCATION BY ACCOUNT */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><PieChart size={18} className="text-pink-500"/> Account Allocation</h4>
          <div className="space-y-4">
            {accountsList.map((acc, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{acc.name}</span>
                <span className="font-black text-gray-900">{formatMoney(acc.totalBalance)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ALLOCATION BY TICKER */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-purple-500"/> Top Ticker Allocation</h4>
          <div className="space-y-3">
            {tickerList.slice(0, 5).map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-900">{t.symbol}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{t.accountName}</span>
                </div>
                <span className="font-bold text-gray-800 text-sm">{formatMoney(t.totalMarketValue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP PERFORMERS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500"/> Top Performers</h4>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-xs">
               <thead><tr className="text-gray-400 border-b border-gray-100"><th className="pb-3">Ticker</th><th className="pb-3">Market Value</th><th className="pb-3">Yield</th></tr></thead>
               <tbody>
                 {topPerformers.slice(0, 5).map((t, i) => (
                   <tr key={i} className="border-b border-gray-50 last:border-0"><td className="py-3 font-bold">{t.symbol}</td><td className="py-3">{formatMoney(t.totalMarketValue)}</td><td className={`py-3 font-black ${getPnLColor(t.unrealizedPnLRate)}`}>{formatPercent(t.unrealizedPnLRate)}</td></tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><ArrowRightLeft size={18} className="text-blue-500"/> Recent Activity</h4>
          <div className="space-y-3">
             {recentTransactions.map((t, i) => (
               <div key={i} className="flex justify-between items-center p-3 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${t.transactionType === 'BUY' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{t.transactionType}</span>
                    <span className="font-bold text-gray-900">{t.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm">{formatMoney(t.netAmount)}</div>
                    <div className="text-[10px] text-gray-400 font-bold">{formatQuantity(t.quantity)} @ {formatMoney(t.price)}</div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}