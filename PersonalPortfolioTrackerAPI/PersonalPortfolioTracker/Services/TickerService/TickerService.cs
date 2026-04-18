using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.TickerService
{
    public class TickerService : ITickerService
    {
        private readonly IUnitOfWork _uow;

        public TickerService(IUnitOfWork uow)
        {
            _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        }

        //public async Task<IEnumerable<TickerResponse>> GetAllAsync(Guid tickerTypeID)
        //{
        //    return await _uow.Repository<Tickers>().FindByCondition(tt => tt.TickerTypeId == tickerTypeID)
        //        .Select(tt => new TickerResponse(tt.ID, tt.TickerTypeId, tt.TickerType.Name, tt.Symbol, tt.Name, tt.MarketPrice, tt.Currency))
        //        .ToListAsync();
        //}

        public async Task<IEnumerable<TickerResponse>> FindByConditionAsync(Guid tickerTypeID, string? symbol)
        {
            var query = _uow.Repository<Tickers>().FindByCondition(tt => tt.TickerTypeId == tickerTypeID);

            if(string.IsNullOrWhiteSpace(symbol))
                return await query.Select(tt => new TickerResponse(tt.ID, tt.TickerTypeId, tt.TickerType.Name, tt.Symbol, tt.Name, tt.MarketPrice, tt.Currency))
                .ToListAsync();

            return await query.Where(tt => tt.Symbol.StartsWith(symbol))
                .Select(tt => new TickerResponse(tt.ID, tt.TickerTypeId, tt.TickerType.Name, tt.Symbol, tt.Name, tt.MarketPrice, tt.Currency))
                .ToListAsync();
        }

        public async Task<TickerResponse> GetByIdAsync(Guid id)
        {
            var existingTicker = await _uow.Repository<Tickers>()
                .FindByCondition(tt => tt.ID == id)
                .Select(tt => new TickerResponse(tt.ID, tt.TickerTypeId, tt.TickerType.Name, tt.Symbol, tt.Name, tt.MarketPrice, tt.Currency))
                .FirstOrDefaultAsync();

            if (existingTicker == null)
                throw new KeyNotFoundException("Ticker does not exist.");

            return existingTicker;
        }

        private async Task<TickerResponse?> CheckUniqueSymbol(string symbol)
        {
            return await _uow.Repository<Tickers>()
                .FindByCondition(tt => tt.Symbol == symbol)
                .IgnoreQueryFilters()
                .Select(tt => new TickerResponse(tt.ID, tt.TickerTypeId, tt.TickerType.Name, tt.Symbol, tt.Name, tt.MarketPrice, tt.Currency))
                .FirstOrDefaultAsync();
        }

        public async Task<bool> AddAsync(TickerCreate dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Symbol))
                throw new ArgumentException("Symbol is required.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Name is required.");

            if (string.IsNullOrWhiteSpace(dto.Currency))
                throw new ArgumentException("Currency is required.");

            if (await CheckUniqueSymbol(dto.Symbol) != null)
                throw new InvalidOperationException($"{dto.Symbol} already exists.");

            if (dto.MarketPrice <= 0)
                throw new ArgumentException("Market price has to greater than 0.");

            var newTicker = new Tickers
            {
                TickerTypeId = dto.TickerTypeID,
                Symbol = dto.Symbol.ToUpper(),
                Name = dto.Name,
                Currency = dto.Currency,
                MarketPrice = dto.MarketPrice,
                CreatedAt = VietnamTime.Now(),
                UpdatedAt = VietnamTime.Now(),
                IsDeleted = false
            };

            _uow.Repository<Tickers>().Create(newTicker);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> UpdateAsync(Guid id, TickerUpdate dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Symbol))
                throw new ArgumentException("Symbol is required.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Name is required.");

            if (string.IsNullOrWhiteSpace(dto.Currency))
                throw new ArgumentException("Currency is required.");

            if (dto.MarketPrice <= 0)
                throw new ArgumentException("Market price has to greater than 0.");

            var duplicateSymbol = await CheckUniqueSymbol(dto.Symbol);

            if ((duplicateSymbol != null) && (duplicateSymbol.ID != id))
                throw new InvalidOperationException($"{dto.Symbol} is used in another Ticker.");

            var existingTicker = await _uow.Repository<Tickers>()
                .FindByCondition(tt => tt.ID == id)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Ticker does not exist.");

            existingTicker.TickerTypeId = dto.TickerTypeID;
            existingTicker.Symbol = dto.Symbol.ToUpper();
            existingTicker.Name = dto.Name;
            existingTicker.Currency = dto.Currency;
            existingTicker.MarketPrice = dto.MarketPrice;
            existingTicker.UpdatedAt = VietnamTime.Now();
            existingTicker.IsDeleted = dto.IsDeleted;

            _uow.Repository<Tickers>().Update(existingTicker);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var existingTicker = await _uow.Repository<Tickers>()
                .FindByCondition(tt => tt.ID == id)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Ticker does not exist.");

            if (existingTicker.IsDeleted)
                throw new InvalidOperationException("This ticker has been deleted before.");

            _uow.Repository<Tickers>().Delete(existingTicker);

            return await _uow.SaveAsync() > 0;
        }
    }
}
