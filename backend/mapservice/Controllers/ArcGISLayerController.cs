using MapService.DataAccess;
using MapService.Models.Config;
using System.Web.Http;
using System.Web.Http.Cors;

namespace MapService.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*", exposedHeaders: "X-Custom-Header")]
    public class ArcGISLayerController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(ArcGISConfig config)
        {
            this.settingsDataContext.AddArcGISLayer(config);           
        }

        public void Delete(string id)
        {
            this.settingsDataContext.RemoveArcGISLayer(id);
        }

        public void Put(ArcGISConfig config)
        {            
            this.settingsDataContext.UpdateArcGISLayer(config);
        }        
    }
}
