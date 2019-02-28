using System.Web.Http;
using System.Web.Http.Cors;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*", exposedHeaders: "X-Custom-Header")]
    public class VectorLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(VectorConfig config)
        {
            this.settingsDataContext.AddVectorLayer(config);
        }

        public void Delete(string id)
        {
            this.settingsDataContext.RemoveVectorLayer(id);
        }

        public void Put(VectorConfig config)
        {
            this.settingsDataContext.UpdateVectorLayer(config);
        }
    }
}
