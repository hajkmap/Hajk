using MapService.DataAccess;
using MapService.Models.ToolOptions;
using System.Web.Http;
using System.Web.Http.Cors;

namespace MapService.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*", exposedHeaders: "X-Custom-Header")]
    public class LayerMenuController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public string Get(string operation)
        {
            string status = "Felaktig operation. Giltiga operationer är 'index' för att indexera lagemenyn.";
            if (operation == "index")
            {
                this.settingsDataContext.IndexLayerMenu();
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
