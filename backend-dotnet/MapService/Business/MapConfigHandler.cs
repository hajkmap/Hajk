using MapService.DataAccess;

namespace MapService.Business.MapConfig
{
    public static class MapConfigHandler
    {
        public static IEnumerable<string> GetListOfImages()
        {
            var imageFileNameList = new List<string>();

            var uploadContentRootPath = AppDomain.CurrentDomain.GetData("UploadContentRootPath") as string;

            if (uploadContentRootPath == null)
            {
                return imageFileNameList;
            }

            var files = FolderDataAccess.GetAllFiles(uploadContentRootPath);

            foreach (string file in files)
            {
                if (Path.GetExtension(file).ToLower() == ".png" || Path.GetExtension(file).ToLower() == ".jpeg" || Path.GetExtension(file).ToLower() == ".jpg")
                {
                    var fileName = Path.GetFileName(file);
                    imageFileNameList.Add(fileName);
                }
            }

            return imageFileNameList;
        }

        public static IEnumerable<string> GetListOfVideos()
        {
            var videoFileNameList = new List<string>();

            var uploadContentRootPath = AppDomain.CurrentDomain.GetData("UploadContentRootPath") as string;

            if (uploadContentRootPath == null)
            {
                return videoFileNameList;
            }

            var files = FolderDataAccess.GetAllFiles(uploadContentRootPath);

            foreach (string file in files)
            {
                if (Path.GetExtension(file).ToLower() == ".mp4" || Path.GetExtension(file).ToLower() == ".mov" || Path.GetExtension(file).ToLower() == ".ogg")
                {
                    var fileName = Path.GetFileName(file);
                    videoFileNameList.Add(fileName);
                }
            }

            return videoFileNameList;
        }
    }
}