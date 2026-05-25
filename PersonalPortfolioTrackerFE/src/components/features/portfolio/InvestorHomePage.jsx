import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ---------------- Utils ---------------- */
function formatTradingDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function formatVnd(num) {
  if (num == null) return "0 VND";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(num)) + " VND";
}

function formatUsd(num) {
  if (num == null) return "$0.000";
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(num));
}

function formatPriceVnd(num) {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(num));
}

function formatPercent2(num) {
  if (num == null || Number.isNaN(num)) return "0.00%";
  return `${Number(num).toFixed(2)}%`;
}

function getPnLColor(rate) {
  if (rate > 0) return "text-emerald-500";
  if (rate < 0) return "text-rose-500";
  return "text-gray-500";
}

const checkIsCrypto = (typeCode) => {
  const code = (typeCode || "").toUpperCase();
  return code.includes("USD") || code.includes("COIN") || code.includes("CRYPTO") || code.includes("TIỀN ẢO");
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ================= Component ================= */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);

  const moneyMask = "********";
  const vnd = (num) => (hideAmounts ? moneyMask : formatVnd(num));
  const usd = (num) => (hideAmounts ? moneyMask : formatUsd(num));
  const priceVnd = (num) => (hideAmounts ? moneyMask : formatPriceVnd(num));

  // Refs for PDF Export
  const headerRef = useRef(null);
  const topCardsRef = useRef(null);
  const allocAccountRef = useRef(null);
  const allocTickerRef = useRef(null);
  const topPerformersRef = useRef(null);
  const recentTxRef = useRef(null);

  useEffect(() => {
    axiosInstance.get("/Dashboard")
      .then((res) => setData(res.data?.result || res.data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load dashboard data.");
      });
  }, []);

  const COLORS = ["#fb7185", "#f97316", "#fbbf24", "#22c55e", "#60a5fa", "#a855f7", "#ec4899", "#14b8a6", "#8b5cf6", "#f43f5e"];

  // Dữ liệu bóc tách từ BE
  const accountAllocation = data?.accountsList ?? [];
  const tickerAllocation = data?.tickerList ?? [];

  const accountList = useMemo(() => accountAllocation
    .map((a, idx) => ({ 
      label: a.name || "Unknown", 
      value: Number(a.totalBalance || 0), 
      color: COLORS[idx % COLORS.length] 
    }))
    .filter((x) => x.value > 0).sort((a, b) => b.value - a.value), [accountAllocation]);

  const tickerList = useMemo(() => tickerAllocation
    .map((t, idx) => ({ 
      label: `${t.symbol || "Unknown"}${t.accountName ? " - " + t.accountName : ""}`, 
      value: Number(t.totalMarketValue || 0), 
      color: COLORS[idx % COLORS.length] 
    }))
    .filter((x) => x.value > 0).sort((a, b) => b.value - a.value), [tickerAllocation]);

  const accountTotal = useMemo(() => accountList.reduce((s, x) => s + x.value, 0), [accountList]);
  const tickerTotal = useMemo(() => tickerList.reduce((s, x) => s + x.value, 0), [tickerList]);

  const accountChartData = { 
    labels: accountList.map(x => x.label), 
    datasets: [{ data: accountList.map(x => x.value), backgroundColor: accountList.map(x => x.color), hoverOffset: 6 }] 
  };
  
  const tickerChartData = { 
    labels: tickerList.map(x => x.label), 
    datasets: [{ data: tickerList.map(x => x.value), backgroundColor: tickerList.map(x => x.color), hoverOffset: 6 }] 
  };

  const commonPieOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = Number(ctx.raw || 0);
            const total = ctx.dataset.data.reduce((sum, val) => sum + Number(val || 0), 0);
            const percent = total > 0 ? ((raw / total) * 100).toFixed(2) : "0.00";
            return `${ctx.label}: ${hideAmounts ? moneyMask : formatVnd(raw)} (${percent}%)`;
          }
        }
      }
    }
  }), [hideAmounts]);

  if (!data) return <div className="p-10 text-center text-pink-500 font-bold animate-pulse">Loading dashboard...</div>;

  const { zone1, topPerformers, recentTransactions } = data;

  const handleExportPdf = async () => {
    try {
      toast.info("Exporting PDF...");
      setIsExporting(true);
      await nextFrame(); await nextFrame(); await sleep(250);
      if (document?.fonts?.ready) await document.fonts.ready;

      const pdf = new jsPDF("p", "mm", "a4");
      const marginX = 8, marginY = 8;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = marginY;

      const blocks = [headerRef.current, topCardsRef.current, allocAccountRef.current, allocTickerRef.current, topPerformersRef.current, recentTxRef.current];

      for (let el of blocks) {
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgWidth = pdf.internal.pageSize.getWidth() - marginX * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - marginY) { pdf.addPage(); currentY = marginY; }
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", marginX, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 4;
      }
      pdf.save(`Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Export PDF success!");
    } catch (err) { toast.error("Export PDF failed."); } 
    finally { setIsExporting(false); }
  };

  const AllocationBlock = ({ title, items, total, chartData }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-50 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-500 text-center mb-6">{title}</h3>
      {items.length === 0 ? <div className="text-sm text-gray-400 text-center">No data.</div> : (
        <div className="flex flex-col xl:flex-row gap-8 items-center xl:items-center flex-1">
          <div className="w-62 h-62 shrink-0">
            <Pie data={chartData} options={commonPieOptions} />
          </div>
          
          {/* Tăng chiều cao phần danh sách tương ứng để cân đối với biểu đồ */}
          <div className={`flex-1 min-w-[240px] bg-white rounded-xl border border-gray-100 p-3 ${isExporting ? "overflow-visible" : "max-h-72 overflow-y-auto custom-scrollbar pr-1"}`}>
            {items.map((x, idx) => (
              <div key={idx} className={`grid grid-cols-[12px_1fr_auto] gap-4 items-center p-3 text-xs ${idx !== items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: x.color }} />
                <div className="truncate">
                  <div className="font-bold text-gray-800 truncate">{x.label}</div>
                  <div className="text-gray-500 text-[11px] mt-0.5">{vnd(x.value)}</div>
                </div>
                <div className="font-extrabold text-gray-800 text-right">{hideAmounts ? "**" : formatPercent2(total > 0 ? (x.value / total) * 100 : 0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-6xl space-y-6">
        
        {/* HEADER */}
        <div ref={headerRef} className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">Dashboard</h1>
          <div className={`flex items-center gap-3 ${isExporting ? 'invisible' : 'visible'}`}>
            <button onClick={() => setHideAmounts(!hideAmounts)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-pink-500 transition-colors">
              {hideAmounts ? <FaEyeSlash /> : <FaEye />}
            </button>
            <button onClick={handleExportPdf} disabled={isExporting} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 text-white text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-70">
              Export PDF
            </button>
          </div>
        </div>

        {/* 4 CARDS (Từ DashboardZone1) */}
        <div ref={topCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: "Portfolio Value", badge: "Total", value: zone1?.portfolioValue || 0 },
            { title: "Cash Balance", badge: "Accounts", value: zone1?.cashBalance || 0 },
            { title: "Unrealized P&L", badge: "Open", value: zone1?.unrealizedPnL || 0, pnlRate: zone1?.unrealizedPnLRate || 0 },
            { title: "Realized P&L", badge: "Closed", value: zone1?.realizedPnL || 0 }
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
              <div className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                {c.title}
                <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-500 text-[10px] uppercase font-bold">{c.badge}</span>
              </div>
              <div className={`text-2xl font-extrabold mb-1 ${c.title.includes('P&L') && c.value !== 0 ? getPnLColor(c.value) : 'text-gray-900'}`}>
                {c.title.includes('Unrealized') && c.value > 0 ? '+' : ''}{vnd(c.value)}
              </div>
              {c.pnlRate != null ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${c.pnlRate >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {hideAmounts ? "**" : (c.pnlRate >= 0 ? '+' : '') + c.pnlRate.toFixed(2) + '%'}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* ALLOCATION PIE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div ref={allocAccountRef} className="flex"><AllocationBlock title="Allocation by Account" items={accountList} total={accountTotal} chartData={accountChartData} /></div>
          <div ref={allocTickerRef} className="flex"><AllocationBlock title="Allocation by Ticker" items={tickerList} total={tickerTotal} chartData={tickerChartData} /></div>
        </div>

        {/* TOP PERFORMERS & TRANSACTIONS (Fixed Height & Scrollable) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* TOP PERFORMERS */}
          <div ref={topPerformersRef} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 shrink-0">Top Performers</h3>
            {!topPerformers || topPerformers.length === 0 ? (
              <div className="text-sm text-gray-400 flex-1">No holdings yet.</div> 
            ) : (
              <div className={`overflow-auto custom-scrollbar pr-2 flex-1 ${isExporting ? "" : "max-h-[340px]"}`}>
                <table className="w-full text-sm text-left relative">
                  <thead className="text-xs text-gray-500 font-semibold sticky top-0 bg-white z-10">
                    <tr>
                      <th className="pb-2 pt-1 border-b border-gray-100">Ticker</th>
                      <th className="pb-2 pt-1 border-b border-gray-100">Account</th>
                      <th className="pb-2 pt-1 border-b border-gray-100">Market Value</th>
                      <th className="pb-2 pt-1 text-right border-b border-gray-100">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topPerformers.map((x, i) => {
                      const isCrypto = checkIsCrypto(x.currency);
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-2.5 font-bold text-gray-800">{x.symbol}</td>
                          <td className="py-2.5 text-gray-500 text-xs truncate max-w-[100px]">{x.accountName}</td>
                          <td className="py-2.5 text-gray-800 font-medium">{isCrypto ? usd(x.totalMarketValue) : vnd(x.totalMarketValue)}</td>
                          <td className={`py-2.5 text-right font-bold ${x.unrealizedPnLRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {hideAmounts ? "**" : (x.unrealizedPnLRate >= 0 ? '+' : '') + x.unrealizedPnLRate.toFixed(2) + '%'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RECENT TRANSACTIONS */}
          <div ref={recentTxRef} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 flex flex-col">
             <div className="shrink-0 mb-4">
               <h3 className="text-sm font-semibold text-gray-500 mb-1">Recent Transactions</h3>
               <p className="text-xs text-gray-400">Latest trading activity</p>
             </div>
             
             {!recentTransactions || recentTransactions.length === 0 ? (
               <div className="text-sm text-gray-400 flex-1">No transactions yet.</div> 
             ) : (
               <div className={`overflow-auto custom-scrollbar pr-2 flex-1 ${isExporting ? "" : "max-h-[340px]"}`}>
                 <table className="w-full text-sm">
                   <tbody className="divide-y divide-gray-50">
                     {recentTransactions.map((t, i) => {
                       const isCrypto = checkIsCrypto(t.currency);
                       const isInflow = ["SELL", "DIVIDEND_CASH", "DIVIDEND_TICKER"].includes(t.transactionType);
                       const absAmount = Math.abs(Number(t.netAmount || 0));
                       
                       return (
                         <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                           <td className="py-2.5">
                             <div className="font-medium"><span className={t.transactionType === 'SELL' ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>{t.transactionType}</span> — {t.symbol}</div>
                             <div className="text-xs text-gray-400 mt-0.5">{formatTradingDate(t.tradeDate)}</div>
                           </td>
                           <td className="py-2.5 text-right">
                             <div className="text-gray-700 font-medium">{t.quantity ? Number(t.quantity).toFixed(4) : '-'} - {isCrypto ? usd(t.price) : hideAmounts ? moneyMask : `${formatPriceVnd(t.price)} VND`}</div>
                             <div className={`text-xs font-bold mt-0.5 ${isInflow ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {isInflow ? '+' : '-'}{isCrypto ? usd(absAmount) : vnd(absAmount)}
                             </div>
                           </td>
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>
             )}
          </div>

        </div>

      </div>
    </div>
  );
}