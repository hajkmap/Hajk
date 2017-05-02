using System.Web.Http;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
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
