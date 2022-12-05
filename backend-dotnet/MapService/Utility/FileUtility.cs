using MapService.DataAccess;

namespace MapService.Utility
{
    public static class FileUtility
    {
        /// <summary>
        /// Gets all media files from a folder. 
        /// </summary>
        /// <param name="path">The path to the media folder</param>
        /// <param name="allowedExtentions">The allowed extensions to search for. </param>
        /// <returns></returns>
        public static IEnumerable<string> GetFiles(string path, IEnumerable<string> allowedExtentions)
        {
            IEnumerable<string> files = FolderDataAccess.GetAllFiles(path);
            IList<string> fileNameList = new List<string>();
            foreach (string file in files)
            {
                foreach (string extention in allowedExtentions)
                {
                    string allowedExtention = extention;
                    if (allowedExtention.First() != '.')
                        allowedExtention = "." + allowedExtention;

                    if (Path.GetExtension(file).ToLower() != allowedExtention.ToLower())
                        continue;

                    var fileName = Path.GetFileName(file);
                    fileNameList.Add(fileName);
                }
            }

            return fileNameList;
        }
    }
}
