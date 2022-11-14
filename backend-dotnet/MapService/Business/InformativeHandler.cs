

using MapService.DataAccess;

namespace MapService.Business.Informative
{
    public static class InformativeHandler
    {
        public static IEnumerable<string> GetDocumentList()
        {
            var documentNameList = new List<string>();
            var documentsContentRootPath = AppDomain.CurrentDomain.GetData("DocumentsContentRootPath") as string;

            if (documentsContentRootPath == null)
            {
                return documentNameList;
            }

            return GetDocumentList(documentsContentRootPath);
        }

        public static IEnumerable<string> GetDocumentList(string folderPath)
        {
            var documentNameList = new List<string>();
            
            if (folderPath == null)
            {
                return documentNameList;
            }

            if (Directory.Exists(folderPath) == false)
            {
                return documentNameList;
            }

            var files = FolderDataAccess.GetAllFiles(folderPath);

            foreach (var file in files)
            {
                var fileName = Path.GetFileNameWithoutExtension(file);
                documentNameList.Add(fileName);
            }

            return documentNameList;
        }
    }
}
