using MapService.Business.Ad;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("ad")]
    [Produces("application/json")]
    [ApiController]
    public class AdController : ControllerBase
    {
        private readonly ILogger<ConfigController> _logger;

        public AdController(ILogger<ConfigController> logger)
        {
            _logger = logger;
        }
    }
}
