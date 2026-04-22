using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.AccountService
{
    public interface IAccountService
    {
        Task<PagedResponse<AccountResponse>> FindByConditionAsync(string? accountName, int pageNumber = 1, int pageSize = 10);
        Task<AccountResponse> GetByIdAsync(Guid id);
        Task<bool> AddAsync(AccountRequest dto);
        Task<bool> UpdateAsync(Guid id, AccountRequest dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
