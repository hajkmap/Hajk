using System.Web.Http;
using MapService.DataAccess;
using MapService.Models.Config;

namespace MapService.Controllers
{
    public class VectorLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(VectorConfig config)
        {
            this.settingsDataContext.AddVectorLayer(config);
        }

        public void Delete(string id, string mapFile)
        {
            this.settingsDataContext.RemoveVectorLayer(id, mapFile);
        }

        public void Put(VectorConfig config)
        {
            this.settingsDataContext.UpdateVectorLayer(config);
        }
    }
}
