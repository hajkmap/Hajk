using MapService.Attributes;
using MapService.DataAccess;
using MapService.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;

namespace MapService.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*", exposedHeaders: "X-Custom-Header")]
    public class ToolSettingsController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();
        
        public void Put(List<Tool> toolSettings, string mapFile)
        {            
            this.settingsDataContext.UpdateToolSettings(toolSettings, mapFile);
        }
    }
}
