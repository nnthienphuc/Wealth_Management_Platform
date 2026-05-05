using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.HoldingService
{
    public interface IHoldingService
    {
        Task<IEnumerable<AccountTypeResponse>> GetInvestAccount();
        Task<PagedResponse<HoldingResponse>> FindByConditionAsync(Guid accountID, string? tickerSymbol, bool isDeleted = false, int pageNumber = 1, int pageSize = 10);
        Task<HoldingResponse> GetByIDAsync(Guid id);
        Task<bool> AddAsync(HoldingRequest dto);
        Task<bool> UpdateAsync(Guid id, HoldingRequest dto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> RestoreAsync(Guid id);
        Task<SummaryResponse> GetSummaryAsync(Guid accountID);
    }
}
