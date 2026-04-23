using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Services.AccountService;

namespace PersonalPortfolioTracker.Controllers
{
    public class AccountsController : BaseController
    {
        private readonly IAccountService _service;

        public AccountsController(IAccountService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        [HttpGet]
        public async Task<IActionResult> FindByConditionAsync([FromQuery] string? accountName,
            [FromQuery] bool isDeleted = false,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            return Ok(await _service.FindByConditionAsync(accountName, isDeleted, pageNumber, pageSize));
        }

        [HttpPost]
        public async Task<IActionResult> AddAsync([FromBody] AccountRequest dto)
        {
            await _service.AddAsync(dto);

            return Ok(new { message = "Account added successfully." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(Guid id, AccountRequest dto)
        {
            await _service.UpdateAsync(id, dto);

            return Ok(new { message = "Account updated successfully." });
        }

        [HttpPut("{id}/restore")]
        public async Task<IActionResult> RestoreAsync(Guid id)
        {
            await _service.RestoreAsync(id);
            return Ok(new { message = "Account restored successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsync(Guid id)
        {
            await _service.DeleteAsync(id);

            return Ok(new { message = "Account soft deleted successfully." });
        }
    }
}
