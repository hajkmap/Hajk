using MapService.DataAccess;
using System.Text.Json.Nodes;

namespace MapService.Business.Ad
{
    public static class AdHandler
    {
        /// <summary>
        /// Gets a map as a JsonObject. 
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        public static JsonObject GetMap(string mapFileName)
        {
            return JsonFileDataAccess.ReadMapFile(mapFileName);
        }
    }
}
