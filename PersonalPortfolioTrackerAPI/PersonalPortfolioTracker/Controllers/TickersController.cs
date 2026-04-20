using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Services.TickerService;

namespace PersonalPortfolioTracker.Controllers
{
    public class TickersController : BaseController
    {
        private readonly ITickerService _service;

        public TickersController(ITickerService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        //[HttpGet]
        //public async Task<IActionResult> GetAllAsync([FromQuery] Guid tickerTypeId)
        //{
        //    return Ok(await _service.GetAllAsync(tickerTypeId));
        //}

        [HttpGet]
        public async Task<IActionResult> GetAsync(
            [FromQuery] Guid tickerTypeId,
            [FromQuery] string? symbol,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            return Ok(await _service.FindByConditionAsync(tickerTypeId, symbol, pageNumber, pageSize));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetByIdAsync(Guid id)
        {
            return Ok(await _service.GetByIdAsync(id));
        }

        [HttpPost]
        public async Task<IActionResult> AddAsync([FromBody] TickerCreate dto)
        {
            await _service.AddAsync(dto);

            return Ok(new { message = "Added new Ticker successfully." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] TickerUpdate dto)
        {
            await _service.UpdateAsync(id, dto);

            return Ok(new { message = "Updated Ticker successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsync(Guid id)
        {
            await _service.DeleteAsync(id);

            return Ok(new { message = "Soft deleted Ticker successfully." });
        }
    }
}
