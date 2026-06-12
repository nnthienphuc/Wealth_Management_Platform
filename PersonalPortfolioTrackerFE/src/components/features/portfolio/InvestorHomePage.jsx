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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ================= Component ================= */
export default function Dashboard() {
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
    responsive: true, 
    maintainAspectRatio: false, 
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false, // Tắt tooltip mặc định bị giới hạn bởi Canvas
        external: (context) => {
          const { chart, tooltip } = context;
          let tooltipEl = document.getElementById('custom-chartjs-tooltip');

          // Tạo thẻ div tooltip nếu chưa có
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'custom-chartjs-tooltip';
            tooltipEl.style.background = 'rgba(31, 41, 55, 0.9)'; // Màu nền xám đen
            tooltipEl.style.borderRadius = '8px';
            tooltipEl.style.color = 'white';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.transform = 'translate(-50%, -100%)'; // Đẩy lên trên con trỏ chuột
            tooltipEl.style.transition = 'all .1s ease';
            tooltipEl.style.zIndex = '99999'; // Đảm bảo nổi lên trên tất cả mọi thứ
            document.body.appendChild(tooltipEl);
          }

          // Ẩn tooltip nếu không hover vào chart
          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }

          // Render nội dung Tooltip (Bao gồm ô vuông màu và text)
          if (tooltip.body) {
            const text = tooltip.body[0].lines[0];
            const colors = tooltip.labelColors[0];
            const colorSquare = `<span style="display:inline-block; width:10px; height:10px; margin-right:6px; background-color:${colors.backgroundColor}; border-radius:2px; flex-shrink:0;"></span>`;
            
            tooltipEl.innerHTML = `<div style="padding: 6px 10px; font-size: 11px; font-weight: 500; font-family: inherit; white-space: nowrap; display: flex; align-items: center;">${colorSquare}<span>${text}</span></div>`;
          }

          // Cập nhật vị trí trôi nổi dựa trên vị trí chuột trên trang web
          const position = chart.canvas.getBoundingClientRect();
          tooltipEl.style.opacity = 1;
          tooltipEl.style.left = position.left + window.scrollX + tooltip.caretX + 'px';
          tooltipEl.style.top = position.top + window.scrollY + tooltip.caretY - 8 + 'px';
        },
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

  // HÀM EXPORT PDF ĐÃ ĐƯỢC FIX LỖI TRIỆT ĐỂ
  const handleExportPdf = async () => {
    try {
      toast.info("Exporting PDF...");
      setIsExporting(true);
      
      // Chờ giao diện render lại (Mở rộng toàn bộ scrollbar thành overflow-visible)
      await sleep(500); 

      try {
        if (document?.fonts?.ready) await document.fonts.ready;
      } catch (fontErr) {
        console.warn("Skipped fonts check", fontErr);
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const marginX = 8, marginY = 8;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = marginY;

      const blocks = [
        headerRef.current, 
        topCardsRef.current, 
        allocAccountRef.current, 
        allocTickerRef.current, 
        topPerformersRef.current, 
        recentTxRef.current
      ].filter(Boolean); // Đảm bảo ref không bị null

      for (let el of blocks) {
        if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;

        const canvas = await html2canvas(el, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: "#ffffff",
          logging: false // Tắt log html2canvas để tránh nặng trình duyệt
        });
        
        const imgWidth = pdf.internal.pageSize.getWidth() - marginX * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - marginY) { 
          pdf.addPage(); 
          currentY = marginY; 
        }
        
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", marginX, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 4;
      }
      pdf.save(`Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Export PDF success!");
    } catch (err) { 
      console.error("PDF Export failed:", err);
      toast.error("Export PDF failed: " + (err.message || "Unknown error")); 
    } finally { 
      setIsExporting(false); 
    }
  };

  const AllocationBlock = ({ title, items, total, chartData }) => (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-pink-50 flex flex-col h-full relative">
      <h3 className="text-sm font-semibold text-gray-500 text-center mb-3 shrink-0">{title}</h3>
      {items.length === 0 ? <div className="text-sm text-gray-400 text-center">No data.</div> : (
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-stretch flex-1">
          
          <div className="w-48 h-48 shrink-0 flex items-center justify-center relative">
            <Pie data={chartData} options={commonPieOptions} />
          </div>
          
          <div className={`flex-1 min-w-[220px] bg-white rounded-xl border border-gray-100 p-2 ${isExporting ? "overflow-visible h-auto" : "max-h-[200px] overflow-y-auto custom-scrollbar pr-1"}`}>
            {items.map((x, idx) => (
              <div key={idx} className={`grid grid-cols-[12px_1fr_auto] gap-3 items-center p-2 text-xs ${idx !== items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: x.color }} />
                <div className="truncate">
                  <div className="font-bold text-gray-800 truncate">{x.label}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{vnd(x.value)}</div>
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
    <div className="py-6 px-6 md:px-10 lg:px-12 flex justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-6xl space-y-5">
        
        {/* HEADER */}
        <div ref={headerRef} className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-extrabold text-gray-800">Dashboard</h1>
          <div className={`flex items-center gap-3 ${isExporting ? 'invisible' : 'visible'}`}>
            <button onClick={() => setHideAmounts(!hideAmounts)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-pink-500 transition-colors">
              {hideAmounts ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div ref={topCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: "Portfolio Value", badge: "Total", value: zone1?.portfolioValue || 0 },
            { title: "Cash Balance", badge: "Accounts", value: zone1?.cashBalance || 0 },
            { title: "Unrealized P&L", badge: "Open", value: zone1?.unrealizedPnL || 0, pnlRate: zone1?.unrealizedPnLRate || 0 },
            { title: "Realized P&L", badge: "Closed", value: zone1?.realizedPnL || 0 }
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div ref={allocAccountRef} className="h-full"><AllocationBlock title="Allocation by Account" items={accountList} total={accountTotal} chartData={accountChartData} /></div>
          <div ref={allocTickerRef} className="h-full"><AllocationBlock title="Allocation by Ticker" items={tickerList} total={tickerTotal} chartData={tickerChartData} /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* TOP PERFORMERS */}
          <div ref={topPerformersRef} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-pink-50 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 shrink-0">Top Performers</h3>
            {!topPerformers || topPerformers.length === 0 ? (
              <div className="text-sm text-gray-400 flex-1">No holdings yet.</div> 
            ) : (
              <div className={`custom-scrollbar pr-2 flex-1 ${isExporting ? "overflow-visible h-auto" : "overflow-y-auto max-h-[320px]"}`}>
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
          <div ref={recentTxRef} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-pink-50 flex flex-col">
             <div className="shrink-0 mb-4">
               <h3 className="text-sm font-semibold text-gray-500 mb-1">8 Recent BUY/SELL Transactions</h3>
               <p className="text-xs text-gray-400">Latest trading activity</p>
             </div>
             
             {!recentTransactions || recentTransactions.length === 0 ? (
               <div className="text-sm text-gray-400 flex-1">No transactions yet.</div> 
             ) : (
               <div className={`custom-scrollbar pr-2 flex-1 ${isExporting ? "overflow-visible h-auto" : "overflow-y-auto max-h-[320px]"}`}>
                 <table className="w-full text-sm">
                   <tbody className="divide-y divide-gray-50">
                     {recentTransactions.map((t, i) => {
                       const isCrypto = checkIsCrypto(t.currency);
                       const isInflow = ["SELL", "DIVIDEND_CASH", "DIVIDEND_TICKER"].includes(t.transactionType);
                       const absAmount = Math.abs(Number(t.netAmount || 0));
                       
                       return (
                         <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                           <td className="py-2.5">
                             <div className="font-medium"><span className={t.transactionType === 'SELL' ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>{t.transactionType}</span> - {t.accountName} : {t.symbol}</div>
                             <div className="text-xs text-gray-400 mt-0.5">{formatTradingDate(t.tradeDate)}</div>
                           </td>
                           <td className="py-2.5 text-right">
                             <div className="text-gray-700 font-medium">{t.quantity ? Number(t.quantity).toFixed(4) : '-'} @ {isCrypto ? usd(t.price) : hideAmounts ? moneyMask : `${formatPriceVnd(t.price)} VND`}</div>
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