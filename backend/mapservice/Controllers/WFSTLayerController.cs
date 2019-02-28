using System.Web.Http;
using System.Web.Http.Cors;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*", exposedHeaders: "X-Custom-Header")]
    public class WFSTLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(WFSTConfig config)
        {
            this.settingsDataContext.AddWFSTLayer(config);
        }

        public void Delete(string id)
        {
            this.settingsDataContext.RemoveWFSTLayer(id);
        }

        public void Put(WFSTConfig config)
        {
            this.settingsDataContext.UpdateWFSTLayer(config);
        }
    }
}
