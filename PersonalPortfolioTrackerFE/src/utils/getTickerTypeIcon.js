import { LineChart, Bitcoin, PieChart, ScrollText, CircleDollarSign } from "lucide-react";

export const getTickerTypeIcon = (typeCode, size = 18) => {
  switch (typeCode?.toUpperCase()) {
    case "STOCK":
      return <LineChart size={size} className="text-blue-500" />; // Cổ phiếu: Biểu đồ đường
    case "CRYPTO":
      return <Bitcoin size={size} className="text-orange-500" />; // Coin: Biểu tượng Bitcoin
    case "FUND":
      return <PieChart size={size} className="text-emerald-500" />; // Quỹ: Biểu đồ tròn phân bổ
    case "BOND":
      return <ScrollText size={size} className="text-purple-500" />; // Trái phiếu: Cuộn giấy chứng nhận
    default:
      return <CircleDollarSign size={size} className="text-gray-500" />;
  }
};