using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Common.Enum;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.DashboardService
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _uow;
        private readonly Guid _investorID;
        const int USD_TO_VND = 27000;

        public DashboardService(IUnitOfWork uow, IHttpContextAccessor _httpcontext)
        {
            _uow = uow ?? throw new ArgumentNullException(nameof(uow));
            _investorID = CurrentUserHelper.GetInvestorId(_httpcontext.HttpContext.User);
        }

        public async Task<DashboardResponse> DashboardResponseAsync()
        {
            # region Queries
            var accounts = await _uow.Repository<Accounts>()
                .FindByCondition(tt => tt.InvestorId == _investorID && tt.IsDeleted == false)
                .Select(tt => new
                {
                    tt.Name,
                    tt.Type,
                    tt.InvestedBalance,
                    tt.CurrentBalance,
                    tt.TotalBalance,
                    tt.Currency
                }).ToListAsync();

            var holdings = await _uow.Repository<Holdings>()
                .FindByCondition(tt => tt.Account.InvestorId == _investorID && tt.Quantity > 0 && tt.IsDeleted == false)
                .Select(tt => new
                {
                    tt.Ticker.Symbol,
                    AccountName = tt.Account.Name,
                    tt.TotalInvestmentCost,
                    TotalMarketValue = tt.Quantity * tt.Ticker.MarketPrice,
                    UnrealizedPnL = (tt.Ticker.MarketPrice - tt.InvestmentCost) * tt.Quantity,
                    UnrealizedPnLRate = tt.InvestmentCost == 0 ? 0 : (tt.Ticker.MarketPrice - tt.InvestmentCost) / tt.InvestmentCost * 100,
                    tt.Ticker.Currency
                })
                .OrderByDescending(x => x.UnrealizedPnLRate)
                .ToListAsync();

            var realizedPnLs = await _uow.Repository<Transactions>()
                .FindByCondition(tt => tt.Account.InvestorId == _investorID && (tt.TransactionType == TransactionTypes.SELL || tt.TransactionType == TransactionTypes.DIVIDEND_CASH))
                .GroupBy(tt => tt.TransactionType)
                .Select(group => new{
                    group.Key,
                    NetAmount = group.Sum(tt => tt.NetAmount),
                    RealizedPnL = group.Sum(tt => tt.RealizedPnL),
                })
                .ToListAsync();

            var recentTransactions = await _uow.Repository<Transactions>()
                .FindByCondition(tt => tt.Account.InvestorId == _investorID && (tt.TransactionType == TransactionTypes.BUY || tt.TransactionType == TransactionTypes.SELL))
                .OrderByDescending(tt => tt.TradeDate)
                .ThenByDescending(tt => tt.CreatedAt)
                .Take(8)
                .Select(tt => new
                {
                    tt.Ticker.Symbol,
                    tt.Account.Name,
                    tt.TransactionType,
                    tt.Quantity,
                    tt.Price,
                    tt.NetAmount,
                    tt.TradeDate,
                    tt.Ticker.Currency
                })
                .ToListAsync();

            #endregion

            #region Zone 1: Summary Calculations
            decimal cashBalance = accounts.Sum(a => a.Currency.ToUpperInvariant() == CurrencyConstants.USD ? a.TotalBalance * USD_TO_VND : a.TotalBalance);

            decimal unrealizedPnL = holdings.Sum(h => h.Currency.ToUpperInvariant() == CurrencyConstants.USD ? h.UnrealizedPnL * USD_TO_VND : h.UnrealizedPnL);

            // Tính tổng vốn để ra được % PnL toàn danh mục
            decimal totalInvested = holdings.Sum(h => h.Currency.ToUpperInvariant() == CurrencyConstants.USD ? h.TotalInvestmentCost * USD_TO_VND : h.TotalInvestmentCost);
            decimal unrealizedPnLRate = totalInvested == 0 ? 0 : (unrealizedPnL / totalInvested) * 100;

            decimal totalRealizedPnL = realizedPnLs.Sum(r => r.Key == TransactionTypes.SELL ? (r.RealizedPnL ?? 0) : (r.NetAmount ?? 0));

            decimal totalPortfolio = accounts.Sum(a => a.Currency.ToUpperInvariant() == CurrencyConstants.USD ? a.CurrentBalance * USD_TO_VND : a.CurrentBalance)
                                   + holdings.Sum(h => h.Currency.ToUpperInvariant() == CurrencyConstants.USD ? h.TotalMarketValue * USD_TO_VND : h.TotalMarketValue);
            #endregion

            #region Allocation By Accounts ver1
            //List<DashboardAllocationByAccount> dashboardAllocationByAccounts = [];
            //foreach (var account in accounts)
            //{
            //    if (account.Type != AccountTypeConstants.CRYPTO && account.Type != AccountTypeConstants.SECURITIES)
            //        dashboardAllocationByAccounts.Add(new DashboardAllocationByAccount(account.Name, account.TotalBalance));

            //    else if(account.Currency == CurrencyConstants.USD)
            //    {
            //        var totalBalance = account.CurrentBalance;

            //        foreach(var holding in holdings)
            //        {
            //            if (holding.AccountName == account.Name)
            //            {
            //                totalBalance += holding.TotalMarketValue;
            //            }
            //        }

            //        totalBalance *= USD_TO_VND;

            //        dashboardAllocationByAccounts.Add(new DashboardAllocationByAccount(account.Name, totalBalance));
            //    }

            //    else if (account.Currency == CurrencyConstants.VND)
            //    {
            //        var totalBalance = account.CurrentBalance;

            //        foreach (var holding in holdings)
            //        {
            //            if (holding.AccountName == account.Name)
            //            {
            //                totalBalance += holding.TotalMarketValue;
            //            }
            //        }

            //        dashboardAllocationByAccounts.Add(new DashboardAllocationByAccount(account.Name, totalBalance));
            //    }
            //}

            #endregion

            #region Allocation By Accounts Ver2
            var dashboardAllocationByAccounts = new List<DashboardAllocationByAccount>();
            foreach (var account in accounts)
            {
                var accountMarketValue = holdings.Where(h => h.AccountName == account.Name).Sum(h => h.TotalMarketValue);

                var accountTotalVal = account.CurrentBalance + accountMarketValue;

                if (account.Currency.ToUpperInvariant() == CurrencyConstants.USD)
                {
                    accountTotalVal *= USD_TO_VND;
                }

                dashboardAllocationByAccounts.Add(new DashboardAllocationByAccount(account.Name, accountTotalVal));
            }
            #endregion

            #region Allocation By Tickers
            var tickerList = holdings.Select(t => new DashboardAllocationByTicker(
                t.Symbol,
                t.AccountName,
                t.Currency.ToUpperInvariant() == CurrencyConstants.USD ? t.TotalMarketValue * USD_TO_VND : t.TotalMarketValue
            )).ToList();
            #endregion

            #region Top Performers
            List<DashboardTopPerformers> topPerformers = [];

            foreach (var topPerformer in holdings)
                topPerformers.Add(new DashboardTopPerformers(topPerformer.Symbol, topPerformer.AccountName, topPerformer.TotalMarketValue, topPerformer.Currency, topPerformer.UnrealizedPnLRate));

            #endregion

            #region Recent Transactions
            List<DashboardRecentBuyAndSellTransactions> topRecentTransactions = [];

            foreach (var trans in recentTransactions)
                topRecentTransactions.Add(new DashboardRecentBuyAndSellTransactions(trans.Symbol, trans.Name, trans.TransactionType, trans.Quantity ?? 0, trans.Price ?? 0, trans.NetAmount ?? 0, trans.Currency, trans.TradeDate));

            #endregion

            return new DashboardResponse(
                new DashboardZone1(totalPortfolio, cashBalance, unrealizedPnL, Math.Round(unrealizedPnLRate, 2), totalRealizedPnL),
                    dashboardAllocationByAccounts,
                    tickerList,
                    topPerformers,
                    topRecentTransactions);
        }
    }
}
