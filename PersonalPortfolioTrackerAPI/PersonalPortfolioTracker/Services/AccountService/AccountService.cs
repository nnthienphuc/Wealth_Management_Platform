using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.AccountService
{
    public class AccountService : IAccountService
    {
        private readonly IUnitOfWork _uow;
        private readonly Guid _investorID;

        public AccountService(IUnitOfWork uow, IHttpContextAccessor httpContextAccessor)
        {
            _uow = uow;
            _investorID = CurrentUserHelper.GetInvestorId(httpContextAccessor.HttpContext.User);
        }

        public async Task<PagedResponse<AccountResponse>> FindByConditionAsync(string? accountName, int pageNumber = 1, int pageSize = 10)
        {
            var query = _uow.Repository<Accounts>().FindByCondition(tt => tt.InvestorId == _investorID);

            if (!string.IsNullOrWhiteSpace(accountName))
            {
                query = query.Where(tt => tt.Name.StartsWith(accountName));
            }

            var totalRecords = await query.CountAsync();

            pageNumber = pageNumber < 1 ? 1 : pageNumber;
            pageSize = pageSize > 20 ? 20 : pageSize;

            var items = await query.OrderBy(tt => tt.Name)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(tt => new AccountResponse
                (tt.ID,
                tt.Name,
                tt.Type,
                tt.BrokerAccountNo ?? "N/A",
                tt.Currency,
                tt.InvestedBalance,
                tt.CurrentBalance,
                tt.TotalBalance,
                tt.CreatedAt,
                tt.UpdatedAt,
                tt.Note ?? "N/A"
                ))
                .ToListAsync();

            return new PagedResponse<AccountResponse>(items, totalRecords, pageNumber, pageSize);
        }

        public async Task<AccountResponse> GetByIdAsync(Guid id)
        {
            return await _uow.Repository<Accounts>().FindByCondition(tt => tt.ID == id)
                .Select(tt => new AccountResponse
                (tt.ID,
                tt.Name,
                tt.Type,
                tt.BrokerAccountNo ?? "N/A",
                tt.Currency,
                tt.InvestedBalance,
                tt.CurrentBalance,
                tt.TotalBalance,
                tt.CreatedAt,
                tt.UpdatedAt,
                tt.Note ?? "N/A"))
                .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Account does not exist.");
        }

        private async Task<bool> CheckUniqueName(string name, Guid? excludeId = null)
        {
            var query = _uow.Repository<Accounts>()
                .FindByCondition(tt => tt.InvestorId == _investorID && tt.Name == name)
                .IgnoreQueryFilters();

            if (excludeId.HasValue)
                query = query.Where(tt => tt.ID != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<bool> AddAsync(AccountRequest dto)
        {
            CheckDTO(dto);

            if (await CheckUniqueName(dto.Name))
                throw new InvalidOperationException($"{dto.Name} already exists.");

            var newAccount = new Accounts
            {
                InvestorId = _investorID,
                Name = dto.Name,
                Type = dto.Type,
                BrokerAccountNo = dto.BrokerAccountNo ?? null,
                Currency = dto.Currency,
                InvestedBalance = dto.InvestedBalance,
                CurrentBalance = dto.CurrentBalance,
                TotalBalance = dto.InvestedBalance + dto.CurrentBalance,
                CreatedAt = VietnamTime.Now(),
                UpdatedAt = VietnamTime.Now(),
                Note = dto.Note ?? null,
                IsDeleted = false
            };

            _uow.Repository<Accounts>().Create(newAccount);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> UpdateAsync(Guid id, AccountRequest dto)
        {
            CheckDTO(dto);

            var exsitingAccount = await _uow.Repository<Accounts>()
                .FindByCondition(tt => tt.ID == id)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync() 
                ?? throw new KeyNotFoundException("Account does not exist.");

            if (await CheckUniqueName(dto.Name, id))
                throw new InvalidOperationException($"{dto.Name} is used in another Account.");

            exsitingAccount.InvestorId = _investorID;
            exsitingAccount.Name = dto.Name,;
            exsitingAccount.Type = dto.Type;
            exsitingAccount.BrokerAccountNo = dto.BrokerAccountNo ?? null;
            exsitingAccount.Currency = dto.Currency;
            exsitingAccount.InvestedBalance = dto.InvestedBalance;
            exsitingAccount.CurrentBalance = dto.CurrentBalance;
            exsitingAccount.TotalBalance = dto.InvestedBalance + dto.CurrentBalance;
            exsitingAccount.UpdatedAt = VietnamTime.Now();
            exsitingAccount.Note = dto.Note ?? null;
            exsitingAccount.IsDeleted = dto.IsDeleted;

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool>DeleteAsync(Guid id)
        {
            var exsitingAccount = await _uow.Repository<Accounts>()
                .FindByCondition(tt => tt.ID == id)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Account does not exist.");

            if (exsitingAccount.IsDeleted)
                throw new InvalidOperationException("This ticker has been deleted before.");

            _uow.Repository<Accounts>().Delete(exsitingAccount);

            return await _uow.SaveAsync() > 0;
        }

        private static void CheckDTO(AccountRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Account name is required.");
            if (string.IsNullOrWhiteSpace(dto.Type))
                throw new ArgumentException("Type is required.");
            if (string.IsNullOrWhiteSpace(dto.Currency))
                throw new ArgumentException("Currency is required.");
            if (dto.InvestedBalance < 0)
                throw new ArgumentException("Invested balance has to greater or equal than 0.");
            if (dto.CurrentBalance < 0)
                throw new ArgumentException("Current balance has to greater or equal than 0.");
        }

    }
}
