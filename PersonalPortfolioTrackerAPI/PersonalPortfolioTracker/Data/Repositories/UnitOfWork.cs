using Microsoft.EntityFrameworkCore.Storage;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly PortfolioTrackerContext _context;
        private IDbContextTransaction _transaction;

        // Lazy loading repositories
        private IRepositoryBase<Investors> _investors;
        private IRepositoryBase<Accounts> _accounts;
        private IRepositoryBase<Holdings> _holdings;
        private IRepositoryBase<Transactions> _transactions;
        private IRepositoryBase<Tickers> _tickers;
        private IRepositoryBase<TickerTypes> _tickerTypes;
        private IRepositoryBase<AccountSnapshots> _snapshots;

        public UnitOfWork(PortfolioTrackerContext context)
        {
            _context = context;
        }

        // Khởi tạo Repository khi cần dùng (Singleton trong phạm vi 1 request)
        public IRepositoryBase<Investors> Investors => _investors ??= new RepositoryBase<Investors>(_context);
        public IRepositoryBase<Accounts> Accounts => _accounts ??= new RepositoryBase<Accounts>(_context);
        public IRepositoryBase<Holdings> Holdings => _holdings ??= new RepositoryBase<Holdings>(_context);
        public IRepositoryBase<Transactions> Transactions => _transactions ??= new RepositoryBase<Transactions>(_context);
        public IRepositoryBase<Tickers> Tickers => _tickers ??= new RepositoryBase<Tickers>(_context);
        public IRepositoryBase<TickerTypes> TickerTypes => _tickerTypes ??= new RepositoryBase<TickerTypes>(_context);
        public IRepositoryBase<AccountSnapshots> AccountSnapshots => _snapshots ??= new RepositoryBase<AccountSnapshots>(_context);

        public async Task<int> SaveAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
                await _transaction.CommitAsync();
            }
            catch
            {
                await RollbackAsync();
                throw;
            }
            finally
            {
                if (_transaction != null)
                {
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
