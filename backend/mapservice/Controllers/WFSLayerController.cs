using System.Web.Http;
using System.Web.Http.Cors;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*", exposedHeaders: "X-Custom-Header")]
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
