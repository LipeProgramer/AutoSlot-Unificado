using AutoSlot.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    // GET api/dashboard/summary
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        try
        {
            var resumo = await _dashboardService.ObterResumo();
            return Ok(resumo);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensagem = ex.Message });
        }
    }

    // GET api/dashboard/alerts
    [HttpGet("alerts")]
    public async Task<IActionResult> Alerts()
    {
        try
        {
            var alertas = await _dashboardService.ObterAlertas();
            return Ok(alertas);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensagem = ex.Message });
        }
    }
}