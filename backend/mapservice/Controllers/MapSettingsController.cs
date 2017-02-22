using MapService.DataAccess;
using MapService.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace MapService.Controllers
{
    public class MapSettingsController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Put(MapSetting settings)
        {
            this.settingsDataContext.UpdateMapSettings(settings);
        }
    }
}
