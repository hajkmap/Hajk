using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.DataAccess
{
    public static class JsonFileDataAccess
    {
        private const string LAYER_FILE = "layers.json";

        public const string MAP_NODE_NAME = "map";

        public static IList<string> GetMapConfigFiles()
        {
            List<string> mapConfigFiles = new List<string>();

            var excludedConfigFileNamnes = new List<string>()
            {
                LAYER_FILE
            };

            try
            {
                string appDataFolderPath = GetPathToAppFolder();

                IEnumerable<string> allFilesPaths = Directory.EnumerateFiles(appDataFolderPath, "*.json");

                foreach (string filePath in allFilesPaths)
                {
                    string? fileName = Path.GetFileName(filePath);

                    if (fileName == null)
                        continue;

                    if (excludedConfigFileNamnes.Contains(fileName))
                        continue;

                    mapConfigFiles.Add(fileName);
                }
            }
            catch (Exception)
            {
                throw;
            }

            return mapConfigFiles;
        }

        public static JsonObject ReadLayerFile()
        {
            return ReadJsonFile<JsonObject>(LAYER_FILE);
        }

        /// <summary>
        /// Gets a map as a JsonObject.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        public static JsonObject ReadMapFileAsJsonObject(string mapFileName)
        {
            return ReadJsonFile<JsonObject>(mapFileName);
        }

        /// <summary>
        /// Gets a map as a JsonObject.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonDocument. </returns>
        public static JsonDocument ReadMapFileAsJsonDocument(string mapFileName)
        {
            return ReadJsonFile<JsonDocument>(mapFileName);
        }

        public static void SaveJsonFile(string pathToFile, JsonObject jsonObject)
        {
            JsonSerializerOptions jsonSerializerOptions = new JsonSerializerOptions()
            {
                WriteIndented = true,
            };

            string jsonObjectAsString = JsonSerializer.Serialize(jsonObject, jsonSerializerOptions);

            File.WriteAllText(pathToFile, jsonObjectAsString);
        }

        private static T ReadJsonFile<T>(string fileName)
        {
            T? answerObject;

            try
            {
                if (!fileName.EndsWith(".json"))
                    fileName = fileName + ".json";

                string pathToFile = GetPathToFile(fileName);
                string jsonString = File.ReadAllText(pathToFile);

                answerObject = JsonSerializer.Deserialize<T>(jsonString);

                if (answerObject == null)
                    throw new NullReferenceException();
            }
            catch (Exception)
            {
                throw;
            }

            return answerObject;
        }

        private static string GetPathToFile(string fileNamne)
        {
            return Path.Combine(GetPathToAppFolder(), fileNamne).ToString();
        }

        private static string GetPathToAppFolder()
        {
            var appDataFolderPath = AppDomain.CurrentDomain.GetData("AppDataContentRootPath") as string;

            if (appDataFolderPath == null)
                throw new DirectoryNotFoundException();

            return appDataFolderPath;
        }

        public static JsonObject GetSpecification()
        {
            JsonObject jsonObject;

            var appDataFolderPath = AppDomain.CurrentDomain.GetData("SwaggerContentRootPath") as string;
            var pathToFile = Path.Combine(appDataFolderPath, "swagger.json");

            try
            {
                var jsonString = File.ReadAllText(pathToFile);

                jsonObject = JsonSerializer.Deserialize<JsonObject>(jsonString);
            }
            catch (Exception)
            {
                throw;
            }

            return jsonObject;
        }
    }
}