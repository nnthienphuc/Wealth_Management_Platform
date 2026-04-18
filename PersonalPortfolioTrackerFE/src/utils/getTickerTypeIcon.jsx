import React from "react";
import { LineChart, Bitcoin, PieChart, ScrollText, CircleDollarSign } from "lucide-react";

export const getTickerTypeIcon = (typeIdentifier, size = 28) => {
  // Chuyển text truyền vào thành in hoa để dễ check
  const id = (typeIdentifier || "").toUpperCase();

  // Bao thầu cả Code (English) và Name (Vietnamese)
  if (id.includes("STOCK") || id.includes("CHỨNG KHOÁN") || id.includes("CỔ PHIẾU")) {
    return <div className="text-blue-500 bg-blue-50 p-2.5 rounded-full flex shrink-0"><LineChart size={size} strokeWidth={2} /></div>;
  }
  if (id.includes("CRYPTO") || id.includes("COIN") || id.includes("TIỀN ẢO")) {
    return <div className="text-orange-500 bg-orange-50 p-2.5 rounded-full flex shrink-0"><Bitcoin size={size} strokeWidth={2} /></div>;
  }
  if (id.includes("FUND") || id.includes("QUỸ")) {
    return <div className="text-emerald-500 bg-emerald-50 p-2.5 rounded-full flex shrink-0"><PieChart size={size} strokeWidth={2} /></div>;
  }
  if (id.includes("BOND") || id.includes("TRÁI PHIẾU")) {
    return <div className="text-purple-500 bg-purple-50 p-2.5 rounded-full flex shrink-0"><ScrollText size={size} strokeWidth={2} /></div>;
  }

  // Nếu không khớp cái nào thì ra màu xám
  return <div className="text-gray-500 bg-gray-50 p-2.5 rounded-full flex shrink-0"><CircleDollarSign size={size} strokeWidth={2} /></div>;
};