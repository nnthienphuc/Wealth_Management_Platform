using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Common.Enum;
using PersonalPortfolioTracker.Common.Exceptions;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.HoldingService
{
    public class HoldingService : IHoldingService
    {
        private readonly IUnitOfWork _uow;
        private readonly Guid _investorID;

        public HoldingService(IUnitOfWork uow, IHttpContextAccessor httpContext)
        {
            _uow = uow ?? throw new ArgumentNullException(nameof(uow));
            _investorID = CurrentUserHelper.GetInvestorId(httpContext.HttpContext.User);
        }

        public async Task<IEnumerable<AccountTypeResponse>> GetInvestAccount()
        {
            return await _uow.Repository<Accounts>().FindByCondition(tt => tt.InvestorId == _investorID && (tt.Type == AccountTypeConstants.SECURITIES || tt.Type == AccountTypeConstants.CRYPTO))
                .OrderBy(tt => tt.Name)
                .Select(tt => new AccountTypeResponse(tt.ID, tt.Type, tt.Name))
                .ToListAsync();
        }

        public async Task<SummaryResponse> GetSummaryAsync(Guid accountId)
        {
            await VerifyAccountOwnershipAsync(accountId);

            var summaryData = await _uow.Repository<Holdings>()
                .FindByCondition(tt => tt.AccountId == accountId && tt.Quantity > 0)
                .GroupBy(tt => tt.Ticker.TickerType.Code)
                .Select(group => new
                {
                    TypeCode = group.Key,
                    Invested = group.Sum(tt => tt.TotalInvestmentCost),
                    MarketValue = group.Sum(tt => tt.Quantity * tt.Ticker.MarketPrice),
                    TickerCount = group.Count(),
                    TotalQty = group.Sum(tt => tt.Quantity)
                })
                .ToListAsync();

            var summaryDict = summaryData.ToDictionary(
                x => x.TypeCode,
                x => new SummaryByType(x.Invested, x.MarketValue, x.TickerCount, x.TotalQty)
            );

            decimal totalInvestedAll = summaryData.Sum(x => x.Invested);
            decimal totalMarketValueAll = summaryData.Sum(x => x.MarketValue);

            return new SummaryResponse(summaryDict, totalInvestedAll, totalMarketValueAll);
        }

        public async Task<PagedResponse<HoldingResponse>> FindByConditionAsync
            (Guid accountID, 
            string? tickerSymbol, 
            bool isDeleted = false, 
            int pageNumber = 1, 
            int pageSize = 6)
        {
            var query = _uow.Repository<Holdings>().FindByCondition(tt => tt.Account.InvestorId == _investorID && tt.AccountId == accountID);

            if (isDeleted)
                query = query.IgnoreQueryFilters().Where(tt => tt.IsDeleted == isDeleted);

            if (!string.IsNullOrWhiteSpace(tickerSymbol))
                query = query.Where(tt => tt.Ticker.Symbol.StartsWith(tickerSymbol));

            var totalRecords = await query.CountAsync();

            pageNumber = pageNumber < 1 ? 1 : pageNumber;

            pageSize = pageSize > 20 ? 20 : pageSize;

            var items =  await query.OrderBy(tt => tt.Ticker.Symbol)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(tt => new HoldingResponse(
                    tt.ID,
                    tt.AccountId,
                    tt.Account.Name,
                    tt.TickerId,
                    tt.Ticker.Symbol,
                    tt.Ticker.Name,
                    tt.Ticker.TickerType.Code,
                    tt.InvestmentCost,
                    tt.Ticker.MarketPrice,
                    tt.Quantity,
                    tt.TargetBuy,
                    tt.TargetSell,
                    tt.CreatedAt,
                    tt.UpdatedAt,
                    tt.Note))
                .ToListAsync();

            return new PagedResponse<HoldingResponse>(items, totalRecords, pageNumber, pageSize);
        }

        public async Task<HoldingResponse> GetByIDAsync(Guid id)
        {
            return await _uow.Repository<Holdings>().FindByCondition(tt => tt.Account.InvestorId == _investorID && tt.ID == id)
                .Select(tt => new HoldingResponse
                (tt.ID,
                    tt.AccountId,
                    tt.Account.Name,
                    tt.TickerId,
                    tt.Ticker.Symbol,
                    tt.Ticker.Name,
                    tt.Ticker.TickerType.Code,
                    tt.InvestmentCost,
                    tt.Ticker.MarketPrice,
                    tt.Quantity,
                    tt.TargetBuy,
                    tt.TargetSell,
                    tt.CreatedAt,
                    tt.UpdatedAt,
                    tt.Note
                ))
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Holding does not exist.");
        }

        private async Task<bool> CheckUnique(Guid accountId, Guid tickerId, Guid? excludedId = null)
        {
            var query = _uow.Repository<Holdings>().FindByCondition(tt => tt.AccountId == accountId && tt.TickerId == tickerId)
                .IgnoreQueryFilters();

            if(excludedId.HasValue)
                query = query.Where(tt => tt.ID != excludedId.Value);

            return await query.AnyAsync();
        }

        private void CheckDTO (HoldingRequest dto)
        {
            if (dto.InvestmentCost < 0)
                throw new ArgumentException("Investment cost must be greater than or equal to 0.");

            if (dto.Quantity < 0)
                throw new ArgumentException("Quantity must be greater than or equal to 0.");

            if (dto.TargetBuy.HasValue && dto.TargetBuy < 0)
                throw new ArgumentException("Target buy must be greater than or equal to 0.");

            if (dto.TargetSell.HasValue && dto.TargetSell < 0)
                throw new ArgumentException("Target sell must be greater than or equal to 0.");
        }

        public async Task<bool> AddAsync(HoldingRequest dto)
        {
            await VerifyAccountOwnershipAsync(dto.AccountID);

            CheckDTO(dto);

            if (await CheckUnique(dto.AccountID, dto.TickerID))
                throw new InvalidOperationException("Holding with this account and ticker already exists.");

            var newHolding = new Holdings
            {
                AccountId = dto.AccountID,
                TickerId = dto.TickerID,
                TargetBuy = dto.TargetBuy,
                TargetSell = dto.TargetSell,
                InvestmentCost = dto.InvestmentCost,
                Quantity = dto.Quantity,
                TotalInvestmentCost = dto.InvestmentCost * dto.Quantity,
                CreatedAt = VietnamTime.Now(),
                UpdatedAt = VietnamTime.Now(),
                Note = dto.Note,
                IsDeleted = false
            };

            _uow.Repository<Holdings>().Create(newHolding);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> UpdateAsync(Guid id, HoldingRequest dto)
        {
            await VerifyAccountOwnershipAsync(dto.AccountID);

            var existingHolding = await _uow.Repository<Holdings>().FindByCondition(tt => tt.Account.InvestorId == _investorID && tt.ID == id, true).FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Holding does not exist.");

            CheckDTO(dto);

            if (await CheckUnique(dto.AccountID, dto.TickerID, id))
                throw new InvalidOperationException("Holding with this account and ticker already exists.");

            existingHolding.AccountId = dto.AccountID;
            existingHolding.TickerId = dto.TickerID;
            existingHolding.TargetBuy = dto.TargetBuy;
            existingHolding.TargetSell = dto.TargetSell;
            existingHolding.InvestmentCost = dto.InvestmentCost;
            existingHolding.Quantity = dto.Quantity;
            existingHolding.TotalInvestmentCost = dto.InvestmentCost * dto.Quantity;
            existingHolding.UpdatedAt = VietnamTime.Now();
            existingHolding.Note = dto.Note;

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var existingHolding = await _uow.Repository<Holdings>().FindByCondition(tt => tt.Account.InvestorId == _investorID && tt.ID == id, true)
                .IgnoreQueryFilters().FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Holding does not exist.");

            if (existingHolding.IsDeleted)
                throw new InvalidOperationException("This holding has been deleted before.");

            _uow.Repository<Holdings>().Delete(existingHolding);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> RestoreAsync(Guid id)
        {
            var existingHolding = await _uow.Repository<Holdings>().FindByCondition(tt => tt.Account.InvestorId == _investorID && tt.ID == id, true)
                .IgnoreQueryFilters().FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Holding does not exist.");

            if(!existingHolding.IsDeleted)
                throw new InvalidOperationException("This holding is already active.");

            existingHolding.IsDeleted = false;
            existingHolding.UpdatedAt = VietnamTime.Now();

            return await _uow.SaveAsync() > 0;
        }

        private async Task VerifyAccountOwnershipAsync(Guid id)
        {
            var isOwner = await _uow.Repository<Accounts>().FindByCondition(tt => tt.ID == id && tt.InvestorId == _investorID).AnyAsync();

            if (!isOwner)
                throw new ForbiddenException("You do not own this account.");
        }
    }
}
