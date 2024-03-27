using MapService.Utility;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.DataAccess
{
    public static class JsonFileDataAccess
    {
        public const string LAYER_FILE = "layers.json";

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
        /// <param name="documentName">The name of the document including the file ending.</param>
        /// <returns>Returns a document as a JsonObject. </returns>
        public static JsonObject ReadDocumentFileAsJsonObject(string documentName)
        {
            return ReadJsonFile<JsonObject>(GetPathToDocumentFile(documentName));
        }

        /// <summary>
        /// Checks if the specified document file exists.
        /// </summary>
        /// <param name="documentName">The name of the document file.</param>
        /// <returns>True if the file exists. False if the file does not exist.</returns>
        public static bool DocumentFileExists(string documentName)
        {
            documentName = FileUtility.AddMissingEnding(documentName, ".json");

            return File.Exists(GetPathToDocumentFile(documentName));
        }

        /// <summary>
        /// Deletes the specified document file
        /// </summary>
        /// <param name="documentFileName">The name of the document. </param>
        public static void DeleteDocumentFile(string documentFileName)
        {
            documentFileName = FileUtility.AddMissingEnding(documentFileName, ".json");
            string path = GetPathToDocumentFile(documentFileName);
            FileUtility.DeleteFile(path);
        }

        /// <summary>
        /// Deletes the map configuration.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        public static void DeleteMapFile(string mapFileName)
        {
            mapFileName = FileUtility.AddMissingEnding(mapFileName, ".json");
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
            UpdateFile(mapFileName, mapFile);
        }

        /// <summary>
        /// Updates the layers configuration.
        /// </summary>
        /// <param name="layerFile">The content of the layers as a JsonObject. </param>
        public static void UpdateLayerFile(JsonObject layerFile)
        {
            UpdateFile(LAYER_FILE, layerFile);
        }

        public static void UpdateFile(string mapFileName, JsonObject mapFile)
        {
            mapFileName = FileUtility.AddMissingEnding(mapFileName, ".json");
            string path = GetPathToFile(mapFileName);

            if (!File.Exists(path)) { throw new FileNotFoundException(); }

            var jsonSerializerOptions = new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                WriteIndented = true
            };

            File.WriteAllText(path, mapFile.ToJsonString(jsonSerializerOptions));
        }

        public static void SaveDocumentFile(string fileName, JsonObject jsonObject)
        {
            fileName = FileUtility.AddMissingEnding(fileName, ".json");
            string path = GetPathToDocumentFile(fileName);

            if (!File.Exists(path)) { throw new FileNotFoundException(); }

            var jsonSerializerOptions = new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                WriteIndented = true
            };

            File.WriteAllText(path, jsonObject.ToJsonString(jsonSerializerOptions));
        }

        internal static void DuplicateMapFile(string mapFileNameFrom, string mapFileNameTo)
        {
            mapFileNameFrom = FileUtility.AddMissingEnding(mapFileNameFrom, ".json");
            mapFileNameTo = FileUtility.AddMissingEnding(mapFileNameTo, ".json");

            string sourcePath = GetPathToFile(mapFileNameFrom);
            string destinationPath = GetPathToFile(mapFileNameTo);

            if (!File.Exists(sourcePath)) { throw new FileNotFoundException(); }

            File.Copy(sourcePath, destinationPath, true);
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
            var jsonSerializerOptions = new JsonSerializerOptions()
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
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
                pathToFile = FileUtility.AddMissingEnding(pathToFile, ".json");

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

            if (!Directory.Exists(appDataFolderPath))
                throw new DirectoryNotFoundException();

            return appDataFolderPath;
        }

        private static string GetPathToDocumentFile(string fileName)
        {
            return Path.Combine(GetPathToDocumentsFolder(), fileName).ToString();
        }

        private static string GetPathToDocumentsFolder()
        {
            var documentsFolderPath = PathUtility.GetPath("Informative:Documents:Path");

            if (documentsFolderPath == null)
                throw new DirectoryNotFoundException();

            return documentsFolderPath;
        }

        internal static string GetOpenApiSpecification()
        {
            string openAPISpecification;

            var appDataFolderPath = PathUtility.GetPath("OpenAPISpecification:Path");
            var openAPISpecificationFileName = ConfigurationUtility.GetSectionItem("OpenAPISpecification:File");
            var pathToFile = Path.Combine(appDataFolderPath, openAPISpecificationFileName);

            try
            {
                openAPISpecification = File.ReadAllText(pathToFile);
            }
            catch (Exception)
            {
                throw;
            }

            return openAPISpecification;
        }
    }
}