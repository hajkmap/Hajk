using MapService.DataAccess;
using MapService.Models.Config;
using System.Web.Http;

namespace MapService.Controllers
{
    public class ArcGISLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public string Get()
        {
            return "Hej";
        }

        public void Post(ArcGISConfig config)
        {
            this.settingsDataContext.AddArcGISLayer(config);           
        }

        public void Delete(string id, string mapFile)
        {
            this.settingsDataContext.RemoveArcGISLayer(id, mapFile);
        }

        public void Put(ArcGISConfig config)
        {            
            this.settingsDataContext.UpdateArcGISLayer(config);
        }        
    }
}
