namespace MapService.DataAccess
{
    public static class FolderDataAccess
    {
        public static IEnumerable<string> GetAllFiles(string folderPath)
        {
            var fileList = new List<string>();

            if (!Directory.Exists(folderPath))
            {
                return fileList;
            }

            fileList = Directory.GetFiles(folderPath).ToList();

            return fileList;
        }

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
    }
}