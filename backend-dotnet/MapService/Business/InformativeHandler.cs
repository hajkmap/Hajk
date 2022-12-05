using MapService.DataAccess;
using MapService.Utility;
using System.Text.Json.Nodes;

namespace MapService.Business.Informative
{
    public static class InformativeHandler
    {
        /// <summary>
        /// Returns list of file paths for all json files in 'DocumentsContentRootPath' folder
        /// </summary>
        /// <returns>List of all document paths</returns>
        public static IEnumerable<string> GetAllDocuments()
        {
            string documentPath = PathUtility.GetPath("Documents:Path");
            if (documentPath == null)
                return new List<string>();
            
            IEnumerable<string> allowedExtentions = new List<string>() { "json" };
            return FileUtility.GetFiles(documentPath, allowedExtentions);
        }

        /// <summary>
        /// Returns list of file names (without file extension) for all json files in 'DocumentsContentRootPath' folder
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
        /// Returns list of file names (without file extension) for json files in 'DocumentsContentRootPath' folder for the specified map
        /// </summary>
        /// <param name="name">Name of the map for which connected documents will be returned</param>
        /// <returns>List of document names</returns>
        public static IEnumerable<string> GetDocumentList(string name)
        {
            var documentNameList = new List<string>();

            var files = GetAllDocuments(); //.Select(f => Path.GetFullPath(f)).ToArray();

            foreach (var file in files)
            {
                var jsonObject = JsonFileDataAccess.ReadMapFileAsJsonObject(file);
                jsonObject.TryGetPropertyValue(JsonFileDataAccess.MAP_NODE_NAME, out var mapNodeValue);

                if (mapNodeValue != null && mapNodeValue.ToString() == name)
                {
                    documentNameList.Add(Path.GetFileNameWithoutExtension(file));
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

            var documentsContentRootPath = AppDomain.CurrentDomain.GetData("DocumentsContentRootPath") as string;

            if (documentsContentRootPath == null)
            {
                return document;
            }

            var filePath = Path.Combine(documentsContentRootPath, name + ".json");
            if (!File.Exists(filePath))
            {
                return document;
            }

            return JsonFileDataAccess.ReadMapFileAsJsonObject(filePath);
        }
    }
}