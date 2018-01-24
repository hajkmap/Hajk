using System.Web.Http;
using MapService.DataAccess;
using MapService.Models.Config;
using log4net;

namespace MapService.Controllers
{
    public class WMSLayerController : ApiController
    {
        ILog _log = LogManager.GetLogger(typeof(WMSLayerController));
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(WMSConfig config)
        {
            try
            {
                this.settingsDataContext.AddWMSLayer(config);
            }
            catch(System.Exception e)
            {
                _log.Fatal(e.Message);
                throw;
            }
            
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
