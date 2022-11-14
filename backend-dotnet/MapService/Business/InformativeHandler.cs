using MapService.DataAccess;
using System.Text.Json.Nodes;


namespace MapService.Business.Informative
{
    public static class InformativeHandler
    {
        public static IEnumerable<string> GetAllDocuments()
        {
            var documentList = new List<string>();
            var documentsContentRootPath = AppDomain.CurrentDomain.GetData("DocumentsContentRootPath") as string;

            if (documentsContentRootPath == null)
            {
                return documentList;
            }

            var files = FolderDataAccess.GetAllFiles(documentsContentRootPath);

            foreach (var file in files)
            {
                if (Path.GetExtension(file).ToLower() == ".json")
                {
                    documentList.Add(file);
                }
            }

            return documentList;
        }

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

        public static IEnumerable<string> GetDocumentList(string name)
        {
            var documentNameList = new List<string>();

            var files = GetAllDocuments().Select(f => Path.GetFullPath(f)).ToArray();

            foreach (var file in files)
            {
                var jsonObject = JsonFileDataAccess.ReadMapFile(file);
                jsonObject.TryGetPropertyValue(JsonFileDataAccess.MAP_NODE_NAME, out var mapNodeValue);

                if(mapNodeValue != null && mapNodeValue.ToString() == name)
                {
                    documentNameList.Add(Path.GetFileNameWithoutExtension(file));
                }
            }

            return documentNameList;
        }

        public static JsonObject GetDocument(string fileName)
        {
            var document = new JsonObject();

            var documentsContentRootPath = AppDomain.CurrentDomain.GetData("DocumentsContentRootPath") as string;

            if (documentsContentRootPath == null)
            {
                return document;
            }

            var filePath = Path.Combine(documentsContentRootPath, fileName + ".json");
            return JsonFileDataAccess.ReadMapFile(filePath);
        }
    }
}
