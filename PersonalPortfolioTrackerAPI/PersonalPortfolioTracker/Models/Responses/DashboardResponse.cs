using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using Newtonsoft.Json.Linq;

namespace PersonalPortfolioTracker.Models.Responses
{
    public record DashboardZone1(decimal PortfolioValue, decimal CashBalance, decimal UnrealizedPnL, decimal UnrealizedPnLRate, decimal RealizedPnL);
    public record DashboardAllocationByAccount(string Name, decimal TotalBalance);
    public record DashboardAllocationByTicker(string Symbol, string AccountName, decimal TotalMarketValue);    
    public record DashboardTopPerformers(string Symbol, string AccountName, decimal TotalMarketValue, string Currency, decimal UnrealizedPnLRate);
    public record DashboardRecentBuyAndSellTransactions(string Symbol, string AccountName, string TransactionType, decimal Quantity, decimal Price, decimal NetAmount, string Currency, DateOnly TradeDate);
    public record DashboardResponse(DashboardZone1 Zone1,
        List<DashboardAllocationByAccount> AccountsList,
        List<DashboardAllocationByTicker> TickerList,
        List<DashboardTopPerformers> TopPerformers,
        List<DashboardRecentBuyAndSellTransactions> RecentTransactions);

}
