using MapService.DataAccess;
using MapService.Models;
using System.Text.Json;


namespace MapService.Business.Informative
{
    public static class InformativeHandler
    {
        public static IEnumerable<string> GetDocumentList()
        {
            var documentNameList = new List<string>();
            
            var files = FolderDataAccess.GetAllDocuments();

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

            var files = FolderDataAccess.GetAllDocuments().Select(f => Path.GetFullPath(f)).ToArray();

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
    }
}
