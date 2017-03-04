using MapService.DataAccess;
using MapService.Models.ToolOptions;
using System.Web.Http;

namespace MapService.Controllers
{
    public class LayerMenuController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public string Get(string operation, string mapFile)
        {
            string status = "Felaktig operation. Giltiga operationer är 'index' för att indexera lagemenyn.";
            if (operation == "index")
            {
                this.settingsDataContext.IndexLayerMenu(mapFile);
                status = "Indexering genomförd";
            }
            return status;
        }

        public void Put(LayerMenuOptions config, string mapFile)
        {
            this.settingsDataContext.UpdateLayerMenu(config, mapFile);
        }
    }
}
