using System.Web.Http;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
    public class WFSLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(WFSConfig config)
        {
            this.settingsDataContext.AddWFSLayer(config);
        }

        public void Delete(string id)
        {
            this.settingsDataContext.RemoveWFSLayer(id);
        }

        public void Put(WFSConfig config)
        {
            this.settingsDataContext.UpdateWFSLayer(config);
        }
    }
}
