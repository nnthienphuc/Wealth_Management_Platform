using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.TickerTypesService
{
    public class TickerTypeService : ITickerTypeService
    {
        private readonly IUnitOfWork _uow;

        public TickerTypeService(IUnitOfWork uow)
        {
            _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        }
            
        public async Task<IEnumerable<TickerTypeResponse>> GetAllAsync()
        {
            var responses = await _uow.Repository<TickerTypes>().FindAll()
                .OrderBy(tt => tt.Code)
                .Select(tt => new TickerTypeResponse(
                    tt.ID,
                    tt.Code,
                    tt.Name))
                .ToListAsync();

            return responses;
        }

        public async Task<IEnumerable<TickerTypeResponse>> FindByConditionAsync(string? keyword)
        {
            var query = _uow.Repository<TickerTypes>().FindAll();

            if (!string.IsNullOrWhiteSpace(keyword))
                query = query.Where(tt => tt.Code.StartsWith(keyword) || tt.Name.Contains(keyword));

            return await query
                .OrderBy(tt => tt.Code)
                .Select(tt => new TickerTypeResponse
                (tt.ID, tt.Code, tt.Name)).ToListAsync();
        }

        public async Task<TickerTypeResponse> GetByIdAsync(Guid id)
        {
            var existingTickerType = await _uow.Repository<TickerTypes>().FindByCondition(tt => tt.ID == id)
                .Select(tt => new TickerTypeResponse(tt.ID, tt.Code, tt.Name))
                .FirstOrDefaultAsync();

            if (existingTickerType == null)
                throw new KeyNotFoundException("Ticker type does not exist.");

            return existingTickerType;
        }

        private async Task<TickerTypeResponse?> CheckUniqueCode(string code)
        {
            return await _uow.Repository<TickerTypes>()
                .FindByCondition(tt => tt.Code == code)
                .IgnoreQueryFilters()
                .Select(tt => new TickerTypeResponse(tt.ID, tt.Code, tt.Name))
                .FirstOrDefaultAsync();
        }

        public async Task<bool> AddAsync(TickerTypeCreate dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code))
                throw new ArgumentException("Code is required.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Name is required.");

            if (await CheckUniqueCode(dto.Code) != null)
                throw new InvalidOperationException($"{dto.Code} is already in use.");

            var tickerType = new TickerTypes
            {
                Code = dto.Code,
                Name = dto.Name,
                UpdatedAt = VietnamTime.Now(),
                CreatedAt = VietnamTime.Now(),
                IsDeleted = false
            };

            _uow.Repository<TickerTypes>().Create(tickerType);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> UpdateAsync(Guid id, TickerTypeUpdate dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code))
                throw new ArgumentException("Code is required.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Name is required.");

            var isCodeTaken = await CheckUniqueCode(dto.Code);

            if (isCodeTaken != null && isCodeTaken.ID != id)
                throw new InvalidOperationException($"{dto.Code} is already in use.");

            var existingTickerType = await _uow.Repository<TickerTypes>()
                .FindByCondition(tt => tt.ID == id)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync();

            if (existingTickerType == null)
                throw new KeyNotFoundException("Ticker type not found.");

            existingTickerType.Code = dto.Code;
            existingTickerType.Name = dto.Name;
            existingTickerType.IsDeleted = dto.IsDeleted;
            existingTickerType.UpdatedAt = VietnamTime.Now();

            _uow.Repository<TickerTypes>().Update(existingTickerType);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var existingTickerType = await _uow.Repository<TickerTypes>()
                .FindByCondition(tt => tt.ID == id)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync();

            if (existingTickerType == null)
                throw new KeyNotFoundException("Ticker type not found.");

            if (existingTickerType.IsDeleted)
                throw new InvalidOperationException("This ticker type has been deleted.");

            _uow.Repository<TickerTypes>().Delete(existingTickerType);

            return await _uow.SaveAsync() > 0;
        }
    }
}
