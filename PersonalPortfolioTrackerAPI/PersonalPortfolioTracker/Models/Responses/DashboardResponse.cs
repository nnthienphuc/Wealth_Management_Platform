using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using Newtonsoft.Json.Linq;

namespace PersonalPortfolioTracker.Models.Responses
{
    public record DashboardZone1(decimal PortfolioValue, decimal CashBalance, decimal UnrealizedPnL, decimal RealizedPnL);

    public record DashboardAllocationByTicker(string Symbol, string AccountName, decimal TotalMarketValue);
    public record DashboardTopPerformers(string Symbol, string AccountName, decimal TotalMarketValue, string Currency, decimal UnrealizedPnLRate);
    public record DashboardRecentBuyAndSellTransactions(string Symbol, string TransactionType, decimal Quantity, decimal Price, decimal NetAmount, string Currency);
    public record DashboardResponse(DashboardZone1 Zone1, List<DashboardAllocationByTicker> TickerList, List<DashboardTopPerformers> TopPerformers, List<DashboardRecentBuyAndSellTransactions> RecentTransactions);

}
