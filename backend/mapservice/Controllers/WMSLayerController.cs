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
                _log.ErrorFormat("Exception in WMSLayerController.Post", e.Message);
                throw;
            }            
        }

        public void Delete(string id)
        {
            try
            {
                this.settingsDataContext.RemoveWMSLayer(id);
            }
            catch (System.Exception e)
            {
                _log.ErrorFormat("Exception in WMSLayerController.Delete", e.Message);
                throw;
            }
        }

        public void Put(WMSConfig config)
        {
            try
            {
                this.settingsDataContext.UpdateWMSLayer(config);
            }
            catch (System.Exception e)
            {
                _log.ErrorFormat("Exception in WMSLayerController.Put", e.Message);
                throw;
            }
        }
    }
}
