

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

            var files = FolderDataAccess.GetAllFiles(documentsContentRootPath);

            foreach (var file in files)
            {
                var fileName = Path.GetFileName(file);
                documentNameList.Add(fileName);
            }

            return documentNameList;
        }
    }
}
