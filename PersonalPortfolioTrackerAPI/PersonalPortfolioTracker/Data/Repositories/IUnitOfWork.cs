using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IRepositoryBase<Investors> Investors { get; }
        IRepositoryBase<Accounts> Accounts { get; }
        IRepositoryBase<Holdings> Holdings { get; }
        IRepositoryBase<Transactions> Transactions { get; }
        IRepositoryBase<Tickers> Tickers { get; }
        IRepositoryBase<TickerTypes> TickerTypes { get; }
        IRepositoryBase<AccountSnapshots> AccountSnapshots { get; }

        Task<int> SaveAsync();
        Task BeginTransactionAsync();
        Task CommitAsync();
        Task RollbackAsync();
    }
}
