using MapService.Utility;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.DataAccess
{
    public static class JsonFileDataAccess
    {
        private const string LAYER_FILE = "layers.json";

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

        public static JsonDocument ReadLayerFileAsJsonDocument()
        {
            return ReadMapFileAsJsonDocument(LAYER_FILE);
        }

        public static JsonObject ReadLayerFileAsJsonObject()
        {
            return ReadMapFileAsJsonObject(LAYER_FILE);
        }

        /// <summary>
        /// Gets a map as a JsonObject.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        public static JsonObject ReadMapFileAsJsonObject(string mapFileName)
        {
            return ReadJsonFile<JsonObject>(GetPathToFile(mapFileName));
        }

        /// <summary>
        /// Gets a document as a JsonObject.
        /// </summary>
        /// <param name="documentName">The name of the document including the file ending. </param>
        /// <returns>Returns a document as a JsonObject. </returns>
        public static JsonObject ReadDocumentFileAsJsonObject(string documentName)
        {
            return ReadJsonFile<JsonObject>(GetPathToDocumentFile(documentName));
        }

        /// <summary>
        /// Deletes the map configuration.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        public static void DeleteMapFile(string mapFileName)
        {
            if (!mapFileName.EndsWith(".json"))
                mapFileName += ".json";

            string path = GetPathToFile(mapFileName);

            if (!File.Exists(path)) { throw new FileNotFoundException(); }

            File.Delete(path);
        }

        /// <summary>
        /// Updates the map configuration.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <param name="mapFile">The content of the map as a JsonObject. </param>
        public static void UpdateMapFile(string mapFileName, JsonObject mapFile)
        {
            if (!mapFileName.EndsWith(".json"))
                mapFileName += ".json";

            string path = GetPathToFile(mapFileName);

            if (!File.Exists(path)) { throw new FileNotFoundException(); }

            var jsonSerializerOptions = new JsonSerializerOptions
            {
                WriteIndented = true
            };

            File.WriteAllText(path, mapFile.ToJsonString(jsonSerializerOptions));
        }

        internal static void DuplicateMapFile(string mapFileNameFrom, string mapFileNameTo)
        {
            if (!mapFileNameFrom.EndsWith(".json"))
                mapFileNameFrom += ".json";

            if (!mapFileNameTo.EndsWith(".json"))
                mapFileNameTo += ".json";

            string sourcePath = GetPathToFile(mapFileNameFrom);
            string destinationPath = GetPathToFile(mapFileNameTo);

            if (!File.Exists(sourcePath)) { throw new FileNotFoundException(); }

            File.Copy(sourcePath, destinationPath);
        }

        /// <summary>
        /// Gets a map as a JsonObject.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonDocument. </returns>
        public static JsonDocument ReadMapFileAsJsonDocument(string mapFileName)
        {
            return ReadJsonFile<JsonDocument>(GetPathToFile(mapFileName));
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

        private static T ReadJsonFile<T>(string pathToFile)
        {
            T? answerObject;

            try
            {
                if (!pathToFile.EndsWith(".json"))
                    pathToFile = pathToFile + ".json";

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
            var appDataFolderPath = PathUtility.GetPath("DataContent:Path");

            if (appDataFolderPath == null)
                throw new DirectoryNotFoundException();

            return appDataFolderPath;
        }

        private static string GetPathToDocumentFile(string fileName)
        {
            return Path.Combine(GetPathToDocumentsFolder(), fileName).ToString();
        }

        private static string GetPathToDocumentsFolder() 
        {
            var documentsFolderPath = PathUtility.GetPath("Documents:Path");

            if (documentsFolderPath == null)
                throw new DirectoryNotFoundException();

            return documentsFolderPath;
        }

        public static JsonObject GetSpecification()
        {
            JsonObject jsonObject;

            var appDataFolderPath = PathUtility.GetPath("Swagger:Path");
            var swaggerFileName = ConfigurationUtility.GetSectionItem("Swagger:File");
            var pathToFile = Path.Combine(appDataFolderPath, swaggerFileName);

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