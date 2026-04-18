using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.TickerService
{
    public interface ITickerService
    {
        //Task<IEnumerable<TickerResponse>> GetAllAsync(Guid tickerTypeID);
        Task<PagedResponse<TickerResponse>> FindByConditionAsync(Guid tickerTypeID, string? symbol, int pageNumber, int pageSize);
        Task<TickerResponse> GetByIdAsync(Guid id);
        Task<bool> AddAsync(TickerCreate dto);
        Task<bool> UpdateAsync(Guid id, TickerUpdate dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
