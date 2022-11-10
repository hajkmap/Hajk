using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using MapService.Models;

namespace MapService.DataAccess
{
    public class JsonFilesConnector
    {
        protected const string APP_DATA_FOLDER_NAME = "App_Data";
        protected const string LAYER_FILE = "layers.json";

        protected List<string> excludedConfigFileNamnes;

        public JsonFilesConnector()
        {
            this.excludedConfigFileNamnes = new List<string>()
            {
                LAYER_FILE
            };
        }

        public List<string> GetMapConfigFiles()
        {
            List<string> mapConfigFiles = new List<string>();
            try
            {
                string pathToFolder = GetPathToAppFolder();
                IEnumerable<string> allFilesPaths = Directory.EnumerateFiles(pathToFolder, "*.json");
                foreach (string filePath in allFilesPaths)
                {
                    string? fileName = Path.GetFileName(filePath);

                    if (fileName == null)
                        continue;

                    if (this.excludedConfigFileNamnes.Contains(fileName))
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

        public JsonObject ReadLayerFile()
        {
            return ReadJsonFile<JsonObject>(LAYER_FILE);
            // return ReadJsonFile<Layera>(LAYER_FILE);
        }

        public JsonObject ReadMapFile(string configFileName)
        {
            return ReadJsonFile<JsonObject>(configFileName);
            //return ReadJsonFile<Map>(configFileName);
        }

        public T ReadJsonFile<T>(string fileName)
        {
            T? answerObject;
            try
            {
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

        public void SaveJsonFile(string pathToFile, JsonObject jsonObject)
        {
            JsonSerializerOptions jsonSerializerOptions = new JsonSerializerOptions()
            {
                WriteIndented = true,
            };
            string jsonObjectAsString = JsonSerializer.Serialize(jsonObject, jsonSerializerOptions);
            File.WriteAllText(pathToFile, jsonObjectAsString);
        }

        private string GetPathToFile(string fileNamne)
        {
            return GetPathToAppFolder() + fileNamne;
        }

        private string GetPathToAppFolder()
        {
            return AppDomain.CurrentDomain.BaseDirectory + APP_DATA_FOLDER_NAME + @"\";
        }
    }
}
