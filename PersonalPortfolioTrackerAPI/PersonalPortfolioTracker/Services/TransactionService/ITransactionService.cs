using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.TransactionService
{
    public interface ITransactionService
    {
        Task<IEnumerable<AccountTypeResponse>> GetInvestAccount();
        Task<PagedResponse<TransactionResponse>> FindByConditionAsync(Guid accountID, string transactionType, string? tickerSymbol, DateOnly? fromDate, DateOnly? toDate, int pageNumber = 1, int pageSize = 6);
        Task<TransactionResponse> GetByIdAsync(Guid id);
        Task<bool> AddAsync(TransactionCreateRequest dto);
        Task<bool> UpdateAsync(Guid id, TransactionUpdateRequest dto);
    }
}
