using MapService.DataAccess;

namespace MapService.Utility
{
    public static class FileUtility
    {
        /// <summary>
        /// Adds a file extension if it is missing from the file name.
        /// </summary>
        /// <param name="fileName">The file name. </param>
        /// <param name="fileExtension">The file extension. </param>
        /// <returns>Returns a file name that always has a file extension. </returns>
        public static string AddMissingEnding(string fileName, string fileExtension)
        {
            if (!fileName.EndsWith(fileExtension))
                fileName = fileName + fileExtension;

            return fileName;
        }

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

        public static void CreateFile(string filePathAndName, string fileContents)
        {
            try
            {
                File.WriteAllText(filePathAndName, fileContents);
            }
            catch (Exception)
            {
                throw;
            }
        }

        public static void DeleteFile(string path)
        {
            if (!File.Exists(path)) { throw new FileNotFoundException(); }

            File.Delete(path);
        }
    }
}
