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
                .FindByCondition(tt => tt.Account.InvestorId == _investorID && tt.IsDeleted == false)
                .OrderByDescending(tt => (tt.Ticker.MarketPrice - tt.InvestmentCost) / tt.InvestmentCost * 100)
                .Select(tt => new
                {
                    tt.Ticker.Symbol,
                    AccountName = tt.Account.Name,
                    //tt.TotalInvestmentCost,
                    TotalMarketValue = tt.Quantity * tt.Ticker.MarketPrice,
                    UnrealizedPnL = (tt.Ticker.MarketPrice - tt.InvestmentCost) * tt.Quantity,
                    UnrealizedPnLRate = (tt.Ticker.MarketPrice - tt.InvestmentCost) / tt.InvestmentCost * 100,
                    tt.Ticker.Currency
                })
                .ToListAsync();

            var realizedPnLs = await _uow.Repository<Transactions>()
                .FindByCondition(tt => tt.Account.InvestorId == _investorID && (tt.TransactionType == TransactionTypes.SELL || tt.TransactionType == TransactionTypes.DIVIDEND_CASH))
                .GroupBy(tt => tt.TransactionType)
                .Select(group => new{
                    group.Key,
                    NetAmount = group.Sum(tt => tt.NetAmount),
                    RealizedPnL = group.Sum(tt => tt.RealizedPnL)
                })
                .ToListAsync();

            var recentTransactions = await _uow.Repository<Transactions>()
                .FindByCondition(tt => tt.Account.InvestorId == _investorID && (tt.TransactionType == TransactionTypes.BUY || tt.TransactionType == TransactionTypes.SELL))
                .OrderByDescending(tt => tt.TradeDate)
                .ThenByDescending(tt => tt.CreatedAt)
                .Take(10)
                .Select(tt => new
                {
                    tt.Ticker.Symbol,
                    tt.TransactionType,
                    tt.Quantity,
                    tt.Price,
                    tt.NetAmount,
                    tt.Ticker.Currency
                })
                .ToListAsync();

            #endregion

            #region Zone1
            decimal cashBalance = 0;

            foreach (var account in accounts)
            {
                if (account.Currency == CurrencyConstants.USD)
                    cashBalance += (account.TotalBalance * USD_TO_VND);

                else
                    cashBalance += account.TotalBalance;
            }

            decimal unrealizedPnL = 0;

            foreach (var holding in holdings)
            {
                if (holding.Currency == CurrencyConstants.USD)
                    unrealizedPnL += (holding.UnrealizedPnL * USD_TO_VND);
                else
                    unrealizedPnL += holding.UnrealizedPnL;
            }

            decimal totalRealizedPnL = 0;

            foreach (var realizedPnL in realizedPnLs)
            {
                if (realizedPnL.Key == TransactionTypes.SELL)
                    totalRealizedPnL += (realizedPnL.NetAmount ?? 0);

                else
                    totalRealizedPnL += (realizedPnL.RealizedPnL ?? 0);
            }

            decimal totalPortfolio = 0;
            foreach (var account in accounts)
            {
                if (account.Currency == CurrencyConstants.VND)
                    totalPortfolio += account.CurrentBalance;
                else
                    totalPortfolio += (account.CurrentBalance * USD_TO_VND);

            }
                
            foreach (var holding in holdings)
            {
                if (holding.Currency == CurrencyConstants.USD)
                    totalPortfolio += (holding.TotalMarketValue * USD_TO_VND);
                else
                    totalPortfolio += holding.TotalMarketValue;
            }

            #endregion

            #region Allocation By Accounts
            List<DashboardAllocationByAccount> dashboardAllocationByAccounts = [];
            foreach (var account in accounts)
            {
                if (account.Type != AccountTypeConstants.CRYPTO && account.Type != AccountTypeConstants.SECURITIES)
                    dashboardAllocationByAccounts.Add(new DashboardAllocationByAccount(account.Name, account.TotalBalance));

                else if(account.Type == AccountTypeConstants.CRYPTO)
                {
                    var totalBalance = account.CurrentBalance;

                    foreach(var holding in holdings)
                    {
                        if (holding.AccountName == account.Name)
                        {
                            totalBalance += holding.TotalMarketValue;
                        }
                    }

                    totalBalance *= USD_TO_VND;

                    dashboardAllocationByAccounts.Add(new DashboardAllocationByAccount(account.Name, totalBalance));
                }

                else if (account.Type == AccountTypeConstants.SECURITIES)
                {
                    var totalBalance = account.CurrentBalance;

                    foreach (var holding in holdings)
                    {
                        if (holding.AccountName == account.Name)
                        {
                            totalBalance += holding.TotalMarketValue;
                        }
                    }

                    dashboardAllocationByAccounts.Add(new DashboardAllocationByAccount(account.Name, totalBalance));
                }
            }

            #endregion

            #region Allocation By Tickers
            List<DashboardAllocationByTicker> tickerList = [];

            foreach (var ticker in holdings)
            {
                if (ticker.Currency == CurrencyConstants.USD)
                    tickerList.Add(new DashboardAllocationByTicker(ticker.Symbol, ticker.AccountName, ticker.TotalMarketValue * USD_TO_VND));
                else
                    tickerList.Add(new DashboardAllocationByTicker(ticker.Symbol, ticker.AccountName, ticker.TotalMarketValue));
            }

            #endregion

            #region Top Performers
            List<DashboardTopPerformers> topPerformers = [];

            foreach (var topPerformer in holdings)
                topPerformers.Add(new DashboardTopPerformers(topPerformer.Symbol, topPerformer.AccountName, topPerformer.TotalMarketValue, topPerformer.Currency, topPerformer.UnrealizedPnLRate));

            #endregion

            #region Recent Transactions
            List<DashboardRecentBuyAndSellTransactions> topRecentTransactions = [];

            foreach (var trans in recentTransactions)
                topRecentTransactions.Add(new DashboardRecentBuyAndSellTransactions(trans.Symbol, trans.TransactionType, trans.Quantity ?? 0, trans.Price ?? 0, trans.NetAmount ?? 0, trans.Currency));

            #endregion

            return new DashboardResponse(new DashboardZone1(totalPortfolio, cashBalance, unrealizedPnL, totalRealizedPnL), dashboardAllocationByAccounts, tickerList, topPerformers, topRecentTransactions);
        }
    }
}
