using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.AccountService
{
    public interface IAccountService
    {
        Task<PagedResponse<AccountResponse>> FindByConditionAsync(Guid investorId, string? accountName);
        Task<AccountResponse> GetByIdAsync(Guid id);
        Task<bool> AddAsync(AccountCreate dto);
        Task<bool> UpdateAsync(Guid id, AccountUpdate dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
