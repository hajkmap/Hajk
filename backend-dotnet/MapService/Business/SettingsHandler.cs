using MapService.DataAccess;
using System.Text.Json.Nodes;

namespace MapService.Business.Settings
{
    public static class SettingsHandler
    {
        internal static void UpdateMapSettings(string mapFileName, JsonObject mapSettings)
        {
            JsonObject mapFile = JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);

            try
            {
                mapFile.Remove("map");
                mapFile.Add("map", mapSettings);

                JsonFileDataAccess.UpdateMapFile(mapFileName, mapFile);
            }
            catch (Exception ex)
            {
                throw new Exception("Could not update map settings in the map configuration file.", ex);
            }
        }
    }
}