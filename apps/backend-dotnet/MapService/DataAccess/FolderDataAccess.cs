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
    }
}