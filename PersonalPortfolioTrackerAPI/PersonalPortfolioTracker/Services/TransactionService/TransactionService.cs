using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using PersonalPortfolioTracker.Common.Enum;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.TransactionService
{
    public class TransactionService : ITransactionService
    {
        private readonly IUnitOfWork _uow;
        private readonly Guid _investorID;

        public TransactionService(IUnitOfWork uow, IHttpContextAccessor _httpcontext)
        {
            _uow = uow ?? throw new ArgumentNullException(nameof(uow));
            _investorID = CurrentUserHelper.GetInvestorId(_httpcontext.HttpContext.User);
        }

        public async Task<IEnumerable<AccountTypeResponse>> GetInvestmentAccount()
        {
            return await _uow.Repository<Accounts>()
                .FindByCondition(tt => tt.InvestorId == _investorID && (tt.Type == AccountTypeConstants.SECURITIES || tt.Type == AccountTypeConstants.CRYPTO))
                .OrderBy(tt => tt.Type)
                .Select(tt => new AccountTypeResponse(tt.ID, tt.Type, tt.Name))
                .ToListAsync();
        }

        private async Task<bool> CheckOwnerAccount(Guid accountID)
        {
            var existingAccount = await _uow.Repository<Accounts>().FindByCondition(tt => tt.ID == accountID && tt.InvestorId == _investorID).AnyAsync();

            if (!existingAccount)
                throw new UnauthorizedAccessException("This account is not yours.");

            return existingAccount;
        }

        public async Task<PagedResponse<TransactionResponse>> FindByConditionAsync(Guid accountID, string transactionType, string? tickerSymbol, DateOnly? fromDate, DateOnly? toDate, int pageNumber = 1, int pageSize = 10)
        {
            await CheckOwnerAccount(accountID);

            var query = _uow.Repository<Transactions>().FindByCondition(tt => tt.AccountId == accountID);

            if (transactionType.ToUpperInvariant() != TransactionTypes.ALL_TYPE)
                query = query.Where(tt => tt.TransactionType == transactionType);

            if (!string.IsNullOrWhiteSpace(tickerSymbol))
                query = query.Where(tt => tt.Ticker.Symbol.StartsWith(tickerSymbol));
                
            if (fromDate.HasValue && toDate.HasValue)
                query = query.Where(tt => tt.TradeDate >= fromDate.Value &&  tt.TradeDate <= toDate.Value);

            var totalRecords = query.Count();

            pageNumber = pageNumber < 1 ? 1 : pageNumber;

            pageSize = pageSize > 10 ? 10 : pageSize;

            var items = await query.OrderByDescending(tt => tt.TradeDate).ThenByDescending(tt => tt.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(tt => new TransactionResponse(tt.ID, tt.AccountId, tt.Account.Name, tt.TickerId, tt.Ticker.Symbol, tt.TransactionType, tt.Price, tt.Quantity, tt.GrossAmount, tt.Fee, tt.FeeRate, tt.PIT, tt.PITRate, tt.NetAmount, tt.TradeDate, tt.RealizedPnL, tt.RealizedPnLRate, tt.PreQuantity, tt.PreInvestmentCost, tt.PreTotalInvestmentCost, tt.Note, tt.CreatedAt))
                .ToListAsync();

            return new PagedResponse<TransactionResponse>(items, totalRecords, pageNumber, pageSize);
        }

        public async Task<TransactionResponse> GetByIdAsync(Guid id)
        {
            var existingTransaction = await _uow.Repository<Transactions>().FindByCondition(tt => tt.ID == id).FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Invalid transaction.");

            if (existingTransaction.Account.InvestorId != _investorID)
                throw new UnauthorizedAccessException("This transaction is not yours.");

            return new TransactionResponse(existingTransaction.ID, existingTransaction.AccountId, existingTransaction.Account.Name, existingTransaction.TickerId, existingTransaction.Ticker.Symbol, existingTransaction.TransactionType, existingTransaction.Price, existingTransaction.Quantity, existingTransaction.GrossAmount, existingTransaction.Fee, existingTransaction.FeeRate, existingTransaction.PIT, existingTransaction.PITRate, existingTransaction.NetAmount, existingTransaction.TradeDate, existingTransaction.RealizedPnL, existingTransaction.RealizedPnLRate, existingTransaction.PreQuantity, existingTransaction.PreInvestmentCost, existingTransaction.PreTotalInvestmentCost, existingTransaction.Note, existingTransaction.CreatedAt);
        }

        public async Task<bool> AddAsync(TransactionCreateRequest dto)
        {
            await CheckOwnerAccount(dto.AccountID);

            if (string.IsNullOrWhiteSpace(dto.AccountID.ToString()))
                throw new ArgumentException("Please select your investment account");

            if (string.IsNullOrWhiteSpace(dto.TickerID.ToString()))
                throw new ArgumentException("Please select invested ticker");

            if (string.IsNullOrWhiteSpace(dto.TransactionType))
                throw new ArgumentException("Please select the transaction type");

            var existingHolding = await _uow.Repository<Holdings>()
                .FindByCondition(tt => tt.AccountId == dto.AccountID && tt.TickerId == dto.TickerID, true)
                .FirstOrDefaultAsync();

            var existingAccount = await _uow.Repository<Accounts>().FindByCondition(tt => tt.ID == dto.AccountID, true)
                .FirstOrDefaultAsync();

            if (dto.TransactionType.ToUpperInvariant() == TransactionTypes.BUY)
            {
                await _uow.BeginTransactionAsync();

                var grossAmount = dto.Price * dto.Quantity;
                var fee = (dto.FeeRate / 100) * grossAmount;
                var netAmount = grossAmount + fee;

                var newTrans = new Transactions
                {
                    AccountId = dto.AccountID,
                    TickerId = dto.TickerID,
                    TransactionType = TransactionTypes.BUY,
                    Price = dto.Price,
                    Quantity = dto.Quantity,
                    GrossAmount = grossAmount,
                    Fee = fee,
                    FeeRate = dto.FeeRate,
                    PITRate = 0,
                    PIT = 0,
                    NetAmount = netAmount,
                    TradeDate = dto.TradeDate,
                    RealizedPnL = 0,
                    RealizedPnLRate = 0,
                    PreQuantity = existingHolding?.Quantity,
                    PreInvestmentCost = existingHolding?.InvestmentCost,
                    PreTotalInvestmentCost = existingHolding?.TotalInvestmentCost,
                    Note = dto.Note,
                    CreatedAt = VietnamTime.Now(),
                    IsDeleted = false,
                };

                _uow.Repository<Transactions>().Create(newTrans);

                if (existingHolding != null)
                {
                    //var preQuantity = existingTicker.Quantity;
                    //var preInvestmentCost = existingTicker.InvestmentCost;
                    //var preTotalInvestmentCost = existingTicker.TotalInvestmentCost;

                    var oldTotalInvestmentCost = existingHolding.TotalInvestmentCost;

                    var newQuantity = existingHolding.Quantity + (decimal)dto.Quantity;
                    var newInvestmentCost = Math.Round((oldTotalInvestmentCost + (decimal)netAmount) / newQuantity);
                    var newTotalInvestmentCost = newInvestmentCost * newQuantity;

                    existingHolding.Quantity = newQuantity;
                    existingHolding.InvestmentCost = newInvestmentCost;
                    existingHolding.TotalInvestmentCost = newTotalInvestmentCost;

                    existingAccount.InvestedBalance += (newTotalInvestmentCost - oldTotalInvestmentCost);
                    existingAccount.TotalBalance += (newTotalInvestmentCost - oldTotalInvestmentCost);
                }
                else
                {
                    var investmentCost = Math.Round((decimal)netAmount / (decimal)dto.Quantity);
                    var totalInvestmentCost = investmentCost * dto.Quantity;

                    var newHolding = new Holdings
                    {
                        AccountId = dto.AccountID,
                        TickerId = dto.TickerID,
                        InvestmentCost = investmentCost,
                        Quantity = (decimal)dto.Quantity,
                        TotalInvestmentCost = (decimal)totalInvestmentCost,
                        CreatedAt = VietnamTime.Now(),
                        UpdatedAt = VietnamTime.Now(),
                        IsDeleted = false
                    };

                    existingAccount.InvestedBalance += (decimal)totalInvestmentCost;
                    existingAccount.TotalBalance += (decimal)totalInvestmentCost;
                }
                
                existingAccount.UpdatedAt = VietnamTime.Now();

                await _uow.CommitAsync();
            }
            else if (dto.TransactionType.ToUpperInvariant() == TransactionTypes.SELL)
            {
                if (dto.Quantity > existingHolding?.Quantity)
                    throw new InvalidOperationException("The quantity sold must not exceed the quantity currently held.");

                await _uow.BeginTransactionAsync();

                var grossAmount = dto.Price * dto.Quantity;
                var fee = grossAmount * (dto.FeeRate / 100);
                var pit = grossAmount * (dto.PITRate / 100);
                var netAmount = grossAmount - fee - pit;

                //var realizedPnLPerUnit = dto.Price - (dto.Price * (dto.FeeRate / 100)) - (dto.Price * (dto.PITRate / 100)) - existingHolding?.InvestmentCost;

                // shorten
                var realizedPnLPerUnit = ((dto.Price * (100 - dto.FeeRate - dto.PITRate)) / 100) - existingHolding?.InvestmentCost;

                var realizedPnL = realizedPnLPerUnit * dto.Quantity;
                var realizedPnLRate = realizedPnLPerUnit / existingHolding?.InvestmentCost * 100;

                var newTrans = new Transactions
                {
                    AccountId = dto.AccountID,
                    TickerId = dto.TickerID,
                    TransactionType = TransactionTypes.SELL,
                    Price = dto.Price,
                    Quantity = dto.Quantity,
                    GrossAmount = grossAmount,
                    Fee = fee,
                    FeeRate = dto.FeeRate,
                    PITRate = dto.PITRate,
                    PIT = pit,
                    NetAmount = netAmount,
                    TradeDate = dto.TradeDate,
                    RealizedPnL = realizedPnL,
                    RealizedPnLRate = realizedPnLRate,
                    PreQuantity = existingHolding?.Quantity,
                    PreInvestmentCost = existingHolding?.InvestmentCost,
                    PreTotalInvestmentCost = existingHolding?.TotalInvestmentCost,
                    Note = dto.Note,
                    CreatedAt = VietnamTime.Now(),
                    IsDeleted = false,
                };

                _uow.Repository<Transactions>().Create(newTrans);

                if (existingHolding.Quantity == dto.Quantity)
                {
                    existingHolding.Quantity = 0;
                    existingHolding.InvestmentCost = 0;
                    existingHolding.TotalInvestmentCost = 0;
                }
                else
                {
                    var newQuantity = existingHolding.Quantity - (decimal)dto.Quantity;
                    existingHolding.Quantity = newQuantity;
                    existingHolding.TotalInvestmentCost = existingHolding.InvestmentCost * newQuantity;
                }

                existingHolding.UpdatedAt = VietnamTime.Now();

                existingAccount.InvestedBalance -= (existingHolding.InvestmentCost * (decimal)dto.Quantity);
                existingAccount.TotalBalance -= (existingHolding.InvestmentCost * (decimal)dto.Quantity);
                existingAccount.UpdatedAt = VietnamTime.Now();

                await _uow.CommitAsync();
            }
            else if (dto.TransactionType.ToUpperInvariant() == TransactionTypes.DIVIDEND_TICKER)
            {
                await _uow.BeginTransactionAsync();

                var newTrans = new Transactions
                {
                    AccountId = dto.AccountID,
                    TickerId = dto.TickerID,
                    TransactionType = TransactionTypes.DIVIDEND_TICKER,
                    Price = 0,
                    Quantity = dto.Quantity,
                    GrossAmount = 0,
                    Fee = 0,
                    FeeRate = 0,
                    PITRate = 0,
                    PIT = 0,
                    NetAmount = 0,
                    TradeDate = dto.TradeDate,
                    RealizedPnL = 0,
                    RealizedPnLRate = 0,
                    PreQuantity = existingHolding?.Quantity,
                    PreInvestmentCost = existingHolding?.InvestmentCost,
                    PreTotalInvestmentCost = existingHolding?.TotalInvestmentCost,
                    Note = dto.Note,
                    CreatedAt = VietnamTime.Now(),
                    IsDeleted = false,
                };

                _uow.Repository<Transactions>().Create(newTrans);

                var newQuantity = existingHolding.Quantity + dto.Quantity;
                existingHolding.Quantity = (decimal)newQuantity;
                existingHolding.InvestmentCost = Math.Round((decimal)existingHolding?.TotalInvestmentCost / (decimal)newQuantity);

                await _uow.CommitAsync();
            }
            else if (dto.TransactionType.ToUpperInvariant() == TransactionTypes.DIVIDEND_CASH)
            {
                await _uow.BeginTransactionAsync();


                await _uow.CommitAsync();
            }
        }
    }
}
