using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Services.TransactionService;

namespace PersonalPortfolioTracker.Controllers
{
    public class TransactionController : BaseController
    {
        private readonly ITransactionService _service;

        public TransactionController(ITransactionService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        [HttpGet("invest-account")]
        public async Task<IActionResult> GetInvestAccount()
        {
            return Ok(await _service.GetInvestmentAccount());
        }

        [HttpGet("summary")]
        public async Task<IActionResult> SummaryTransactionAsync([FromQuery] Guid accountID, [FromQuery] string? tickerSymbol, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
        {
            return Ok(await _service.SummaryTransactionAsync(accountID, tickerSymbol, fromDate, toDate));
        }

        [HttpGet]
        public async Task<IActionResult> FindByConditionAsync([FromQuery]Guid accountID, [FromQuery] string transactionType, [FromQuery] string? tickerSymbol, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            return Ok(await _service.FindByConditionAsync(accountID, transactionType, tickerSymbol, fromDate, toDate, pageNumber, pageSize));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetByIdAsync(Guid id)
        {
            return Ok(await _service.GetByIdAsync(id));
        }

        [HttpPost]
        public async Task<IActionResult> AddAsync([FromBody] TransactionCreateRequest dto)
        {
            await _service.AddAsync(dto);

            return Ok(new { message = "Transaction created successfully." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] TransactionUpdateRequest dto)
        {
            await _service.UpdateAsync(id, dto);

            return Ok(new { message = "Transaction updated successfully." });
        }
    }
}
