using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.TransactionService
{
    public interface ITransactionService
    {
        Task<IEnumerable<AccountTypeResponse>> GetInvestAccount();
        Task<PagedResponse<TransactionResponse>> FindByConditionAsync(Guid accountID, string? tickerSymbol, string transactionType, DateOnly? tradeDate);
    }
}
