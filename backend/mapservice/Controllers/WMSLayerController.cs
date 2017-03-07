using System.Web.Http;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
    public class WMSLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(WMSConfig config)
        {
            this.settingsDataContext.AddWMSLayer(config);
        }

        public void Delete(string id)
        {
            this.settingsDataContext.RemoveWMSLayer(id);
        }

        public void Put(WMSConfig config)
        {
            this.settingsDataContext.UpdateWMSLayer(config);
        }
    }
}
