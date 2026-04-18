using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.TickerTypeService
{
    public interface ITickerTypeService
    {
        Task<IEnumerable<TickerTypeResponse>> GetAllAsync();
        Task<IEnumerable<TickerTypeResponse>> FindByConditionAsync(string? keyword);
        Task<TickerTypeResponse> GetByIdAsync(Guid id);
        Task<bool> AddAsync(TickerTypeCreate dto);
        Task<bool> UpdateAsync(Guid id, TickerTypeUpdate dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
