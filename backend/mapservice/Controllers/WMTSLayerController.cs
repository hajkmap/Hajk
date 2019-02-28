using System.Web.Http;
using System.Web.Http.Cors;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*", exposedHeaders: "X-Custom-Header")]
    public class WMTSLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(WMTSConfig config)
        {
            this.settingsDataContext.AddWMTSLayer(config);
        }

        public void Delete(string id)
        {
            this.settingsDataContext.RemoveWMTSLayer(id);
        }

        public void Put(WMTSConfig config)
        {
            this.settingsDataContext.UpdateWMTSLayer(config);
        }
    }
}
