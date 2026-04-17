using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Services.TickerTypesService;

namespace PersonalPortfolioTracker.Controllers
{
    public class TickerTypesController : BaseController
    {
        private readonly ITickerTypeService _service;

        public TickerTypesController(ITickerTypeService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync()
        {
            return Ok (await _service.GetAllAsync());
        }

        [HttpGet("search")]
        public async Task<IActionResult> FindByConditionAsync([FromQuery] string? keyword)
        {
            return Ok (await _service.FindByConditionAsync(keyword));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetByIdAsync(Guid id)
        {
            return Ok(await _service.GetByIdAsync(id));
        }

        [HttpPost]
        public async Task<IActionResult> AddAsync([FromBody] TickerTypeCreate dto)
        {
            await _service.AddAsync(dto);

            return Ok(new {message = "Added ticker type successfully."});
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(Guid id,  [FromBody] TickerTypeUpdate dto)
        {
            await _service.UpdateAsync(id, dto);

            return Ok(new { message = "Updated ticker type successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsync(Guid id)
        {
            await _service.DeleteAsync(id);

            return Ok(new { message = "Soft deleted ticker type successfully." });
        }
    }
}
