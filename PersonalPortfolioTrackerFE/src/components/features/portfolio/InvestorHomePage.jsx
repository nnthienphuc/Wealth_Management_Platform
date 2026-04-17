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

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ================= Component ================= */
export default function InvestorHomePage() {
  const [data, setData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(true);

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
  const summaryRef = useRef(null);

  useEffect(() => {
    axiosInstance.get("/Dashboard/overview")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  const COLORS = ["#fb7185", "#f97316", "#fbbf24", "#22c55e", "#60a5fa", "#a855f7", "#ec4899", "#14b8a6", "#8b5cf6", "#f43f5e"];

  const accountAllocation = data?.accountAllocation ?? [];
  const tickerAllocation = data?.tickerAllocation ?? [];

  const accountList = useMemo(() => accountAllocation
    .map((a, idx) => ({ label: a.accountName || "Unknown", value: Number(a.totalValueVnd || 0), color: COLORS[idx % COLORS.length] }))
    .filter((x) => x.value > 0).sort((a, b) => b.value - a.value), [accountAllocation]);

  const tickerList = useMemo(() => tickerAllocation
    .map((t, idx) => ({ label: `${t.tickerCode || "Unknown"}${t.accountName ? " - " + t.accountName : ""}`, value: Number(t.valueVnd || 0), color: COLORS[idx % COLORS.length] }))
    .filter((x) => x.value > 0).sort((a, b) => b.value - a.value), [tickerAllocation]);

  const accountTotal = useMemo(() => accountList.reduce((s, x) => s + x.value, 0), [accountList]);
  const tickerTotal = useMemo(() => tickerList.reduce((s, x) => s + x.value, 0), [tickerList]);

  const accountChartData = { labels: accountList.map(x => x.label), datasets: [{ data: accountList.map(x => x.value), backgroundColor: accountList.map(x => x.color), hoverOffset: 6 }] };
  const tickerChartData = { labels: tickerList.map(x => x.label), datasets: [{ data: tickerList.map(x => x.value), backgroundColor: tickerList.map(x => x.color), hoverOffset: 6 }] };

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

  const { portfolioValue, unrealizedPnL, realizedPnL, cashBalance, topPerformers, recentTransactions, portfolioSummary } = data;

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

      const blocks = [headerRef.current, topCardsRef.current, allocAccountRef.current, allocTickerRef.current, topPerformersRef.current, recentTxRef.current, summaryRef.current];

      for (let el of blocks) {
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgWidth = pdf.internal.pageSize.getWidth() - marginX * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - marginY) { pdf.addPage(); currentY = marginY; }
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", marginX, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 4;
      }
      pdf.save(`dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Export PDF success!");
    } catch (err) { toast.error("Export PDF failed."); } 
    finally { setIsExporting(false); }
  };

  const AllocationBlock = ({ title, items, total, chartData }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
      <h3 className="text-sm font-semibold text-gray-500 text-center mb-4">{title}</h3>
      {items.length === 0 ? <div className="text-sm text-gray-400 text-center">No data.</div> : (
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch">
          <div className="w-52 h-52 shrink-0"><Pie data={chartData} options={commonPieOptions} /></div>
          <div className={`flex-1 min-w-[220px] bg-white rounded-xl border border-gray-100 p-2 ${isExporting ? "overflow-visible" : "max-h-52 overflow-y-auto"}`}>
            {items.map((x, idx) => (
              <div key={idx} className={`grid grid-cols-[12px_1fr_auto] gap-3 items-center p-2 text-xs ${idx !== items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: x.color }} />
                <div className="truncate">
                  <div className="font-bold text-gray-800 truncate">{x.label}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{vnd(x.value)}</div>
                </div>
                <div className="font-extrabold text-gray-800 text-right">{formatPercent2(total > 0 ? (x.value / total) * 100 : 0)}</div>
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
              {hideAmounts ? <FaEye /> : <FaEyeSlash />}
            </button>
            <button onClick={handleExportPdf} disabled={isExporting} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 text-white text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-70">
              Export PDF
            </button>
          </div>
        </div>

        {/* 4 CARDS */}
        <div ref={topCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: "Portfolio Value", badge: "Total", value: portfolioValue.totalInVnd, sub: `${vnd(portfolioValue.totalVnd)} • ${usd(portfolioValue.totalUsd)}` },
            { title: "Cash Balance", badge: "Accounts", value: cashBalance.totalInVnd, sub: `${vnd(cashBalance.vnd)} • ${usd(cashBalance.usd)}` },
            { title: "Unrealized P&L", badge: "Open", value: unrealizedPnL.totalInVnd, pnlRate: unrealizedPnL.ratePercent },
            { title: "Realized P&L", badge: "Closed", value: realizedPnL.totalInVnd, sub: "" }
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
              <div className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                {c.title}
                <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-500 text-[10px] uppercase font-bold">{c.badge}</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 mb-1">{vnd(c.value)}</div>
              {c.pnlRate != null ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${c.pnlRate >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {c.pnlRate >= 0 ? '+' : ''}{c.pnlRate.toFixed(2)}%
                </span>
              ) : <div className="text-xs text-gray-500 mt-1">{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* ALLOCATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div ref={allocAccountRef}><AllocationBlock title="Allocation by Account" items={accountList} total={accountTotal} chartData={accountChartData} /></div>
          <div ref={allocTickerRef}><AllocationBlock title="Allocation by Ticker" items={tickerList} total={tickerTotal} chartData={tickerChartData} /></div>
        </div>

        {/* TOP PERFORMERS & TRANSACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div ref={topPerformersRef} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Top Performers</h3>
            {topPerformers.length === 0 ? <div className="text-sm text-gray-400">No holdings yet.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 font-semibold border-b border-gray-100">
                    <tr><th className="pb-2">Ticker</th><th className="pb-2">Account</th><th className="pb-2">Market Value</th><th className="pb-2 text-right">P&L</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topPerformers.map(x => (
                      <tr key={x.tickerId}>
                        <td className="py-2 font-bold text-gray-800">{x.tickerCode}</td>
                        <td className="py-2 text-gray-500 text-xs">{x.accountName}</td>
                        <td className="py-2 text-gray-800 font-medium">{x.isCrypto ? usd(x.marketValue) : vnd(x.marketValue)}</td>
                        <td className={`py-2 text-right font-bold ${x.currentPnLRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {x.currentPnLRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div ref={recentTxRef} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
             <h3 className="text-sm font-semibold text-gray-500 mb-1">Recent Transactions</h3>
             <p className="text-xs text-gray-400 mb-4">Latest trading activity</p>
             {recentTransactions.length === 0 ? <div className="text-sm text-gray-400">No transactions yet.</div> : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <tbody className="divide-y divide-gray-50">
                     {recentTransactions.map(t => {
                       const isCrypto = (t.tickerTypeCode || "").toLowerCase().includes("coin") || (t.tickerTypeCode || "").toLowerCase().includes("crypto");
                       const isInflow = ["SELL", "DIVIDEND_CASH", "DIVIDEND_TICKER"].includes(t.type);
                       const absAmount = Math.abs(Number(t.netAmount || 0));
                       
                       return (
                         <tr key={t.id}>
                           <td className="py-2">
                             <div className="font-medium"><span className={t.type === 'SELL' ? 'text-red-600 font-bold' : 'text-blue-600 font-bold'}>{t.type}</span> — {t.tickerCode}</div>
                             <div className="text-xs text-gray-400 mt-0.5">{formatTradingDate(t.tradingDate)}</div>
                           </td>
                           <td className="py-2 text-right">
                             <div className="text-gray-700">{t.quantity ? Number(t.quantity).toFixed(4) : '-'} @ {isCrypto ? usd(t.price) : hideAmounts ? moneyMask : `${formatPriceVnd(t.price)} VND`}</div>
                             <div className={`text-xs font-bold mt-0.5 ${isInflow ? 'text-green-600' : 'text-red-600'}`}>
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

        {/* SUMMARY */}
        <div ref={summaryRef} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Portfolio Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { label: "Total Invested (VND)", val: vnd(portfolioSummary.totalInvestedVnd) },
              { label: "Total Invested (USD)", val: usd(portfolioSummary.totalInvestedUsd) },
              { label: "Market Value (VND)", val: vnd(portfolioSummary.marketValueVnd) },
              { label: "Market Value (USD)", val: usd(portfolioSummary.marketValueUsd) },
              { label: "Holdings", val: portfolioSummary.holdingsCount },
              { label: "Transactions", val: portfolioSummary.transactionsCount }
            ].map((s, i) => (
              <div key={i}>
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className="font-bold text-gray-800">{s.val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}