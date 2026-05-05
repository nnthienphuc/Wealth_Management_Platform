using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Services.HoldingService;

namespace PersonalPortfolioTracker.Controllers
{
    public class HoldingsController : BaseController
    {
        private readonly IHoldingService _service;

        public HoldingsController(IHoldingService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        [HttpGet("invest-account")]
        public async Task<IActionResult> GetInvestAccount()
        {
            return Ok(await _service.GetInvestAccount());
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummaryAsync([FromQuery] Guid accountId)
        {
            return Ok(await _service.GetSummaryAsync(accountId));
        }

        [HttpGet]
        public async Task<IActionResult> FindByConditionAsync([FromQuery] Guid accountID, [FromQuery] string? tickerSymbol, 
            [FromQuery] bool isDeleted = false, [FromQuery] bool isOwned = false, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            return Ok(await _service.FindByConditionAsync(accountID, tickerSymbol, isDeleted, isOwned, pageNumber, pageSize));
        }

        [HttpPost]
        public async Task<IActionResult> AddAsync([FromBody] HoldingRequest dto)
        {
            await _service.AddAsync(dto);

            return Ok(new {message = "Holding added successfully."});
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] HoldingRequest dto)
        {
            await _service.UpdateAsync(id, dto);

            return Ok(new { message = "Holding updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsync(Guid id)
        {
            await _service.DeleteAsync(id);

            return Ok(new { message = "Holding soft deleted successfully." });
        }

        [HttpPut("{id}/restore")]
        public async Task<IActionResult> RestoreAsync(Guid id)
        {
            await _service.RestoreAsync(id);

            return Ok(new { message = "Holding restored successfully." });
        }
    }
}
