using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.AccountService
{
    public interface IAccountService
    {
        Task<IEnumerable<TotalBalanceResponse>> GetTotalBalance();
        Task<PagedResponse<AccountResponse>> FindByConditionAsync(string? accountName, bool isDeleted = false, int pageNumber = 1, int pageSize = 10);
        Task<AccountResponse> GetByIdAsync(Guid id);
        Task<bool> AddAsync(AccountRequest dto);
        Task<bool> UpdateAsync(Guid id, AccountRequest dto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> RestoreAsync(Guid id);
    }
}
