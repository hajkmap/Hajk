using System.Web.Http;
using MapService.DataAccess;
using MapService.Models.Config;
using log4net;

namespace MapService.Controllers
{
    public class WFSTLayerController : ApiController
    {
        ILog _log = LogManager.GetLogger(typeof(WFSTLayerController));
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Post(WFSTConfig config)
        {
            try
            {
                this.settingsDataContext.AddWFSTLayer(config);
            }
            catch (System.Exception e)
            {
                _log.ErrorFormat("Exception in WFSTLayerController.Post", e.Message);
                throw;
            }
        }

        public void Delete(string id)
        {
            try
            {
                this.settingsDataContext.RemoveWFSTLayer(id);
            }
            catch (System.Exception e)
            {
                _log.ErrorFormat("Exception in WFSTLayerController.Delete", e.Message);
                throw;
            }
        }

        public void Put(WFSTConfig config)
        {
            try
            {
                this.settingsDataContext.UpdateWFSTLayer(config);
            }
            catch (System.Exception e)
            {
                _log.ErrorFormat("Exception in WFSTLayerController.Put", e.Message);
                throw;
            }
        }
    }
}
