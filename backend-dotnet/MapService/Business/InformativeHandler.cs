using MapService.DataAccess;
using MapService.Models;
using MapService.Utility;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.Business.Informative
{
    public static class InformativeHandler
    {
        /// <summary>
        /// Returns list of file paths for all json files in the documents folder
        /// </summary>
        /// <returns>List of all document paths</returns>
        public static IEnumerable<string> GetAllDocuments()
        {
            string documentPath = PathUtility.GetPath("Informative:Documents:Path");
            if (documentPath == null)
                return new List<string>();

            IEnumerable<string> allowedExtentions = new List<string>() { "json" };
            return FileUtility.GetFiles(documentPath, allowedExtentions);
        }

        /// <summary>
        /// Returns list of file names (without file extension) for all json files in the documents folder
        /// </summary>
        /// <returns>List of all document names</returns>
        public static IEnumerable<string> GetDocumentList()
        {
            var documentNameList = new List<string>();

            var files = GetAllDocuments();

            foreach (var file in files)
            {
                var fileName = Path.GetFileNameWithoutExtension(file);
                documentNameList.Add(fileName);
            }

            return documentNameList;
        }

        /// <summary>
        /// Returns list of file names (without file extension) for json files in the documents folder for the specified map
        /// </summary>
        /// <param name="name">Name of the map for which connected documents will be returned</param>
        /// <returns>List of document names</returns>
        public static IEnumerable<string> GetDocumentList(string name)
        {
            var documentNameList = new List<string>();

            var documentNames = GetAllDocuments();

            foreach (var documentName in documentNames)
            {
                var jsonObject = JsonFileDataAccess.ReadDocumentFileAsJsonObject(documentName);
                jsonObject.TryGetPropertyValue(PropertyName.MAP, out var mapNodeValue);

                if (mapNodeValue != null && mapNodeValue.ToString() == name)
                {
                    documentNameList.Add(Path.GetFileNameWithoutExtension(documentName));
                }
            }

            return documentNameList;
        }

        /// <summary>
        /// Returns the specified document
        /// </summary>
        /// <param name="name">Name of the document to be fetched</param>
        /// <returns>JsonObject</returns>
        public static JsonObject GetDocument(string name)
        {
            var document = new JsonObject();

            if (!JsonFileDataAccess.DocumentFileExists(name))
            {
                return document;
            }

            return JsonFileDataAccess.ReadDocumentFileAsJsonObject(name);
        }

        public static void CreateDocument(JsonObject documentNameAndMapName)
        {
            JsonValue? document = documentNameAndMapName["documentName"]?.AsValue();
            if (document == null)
                throw new Exception("Internal server error, no document name in body");

            JsonValue? map = documentNameAndMapName["mapName"]?.AsValue();
            if (map == null)
                throw new Exception("Internal server error, no map name in body");

            string? documentName = string.Empty;
            document.TryGetValue(out documentName);
            if (documentName == null)
                throw new Exception("Internal server error, no document name value in body");

            string? mapName = string.Empty;
            map.TryGetValue(out mapName);
            if (mapName == null)
                throw new Exception("Internal server error, no map name value in body");

            CreateDocumentWriteToFile(documentName, mapName);
        }

        private static void CreateDocumentWriteToFile(string documentName, string mapName)
        {
            string fileName = documentName;
            fileName = FileUtility.AddMissingEnding(fileName, ".json");

            string documentPath = PathUtility.GetPath("Informative:Documents:Path");
            if (documentPath == null)
                throw new Exception("Internal server error, path settings to documents not found");
            string path = Path.Combine(documentPath, fileName);

            Document newDocument = new Document(mapName);
            string stringDocument = JsonUtility.ConvertToJsonObject(newDocument).ToJsonString(
                new JsonSerializerOptions()
                {
                    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                    WriteIndented = true
                }
            );

            FileUtility.CreateFile(path, stringDocument);
        }

        public static void SaveDocument(string name, JsonObject jsonObject)
        {
            JsonFileDataAccess.SaveDocumentFile(name, jsonObject);
        }

        internal static void DeleteDocument(string documentName)
        {
            JsonFileDataAccess.DeleteDocumentFile(documentName);
        }
    }
}