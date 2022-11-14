using MapService.DataAccess;
using System.Text.Json.Nodes;

namespace MapService.Business.MapConfig
{
    public static class MapConfigHandler
    {
        public static JsonObject GetLayers()
        {
            return JsonFileDataAccess.ReadLayerFile();
        }

        /// <summary>
        /// Gets a map as a JsonObject. 
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        public static JsonObject GetMap(string mapFileName)
        {
            return JsonFileDataAccess.ReadMapFile(mapFileName);
        }

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

        public static IEnumerable<string> GetListOfAudioFiles()
        {
            var audioFileNameList = new List<string>();

            var uploadContentRootPath = AppDomain.CurrentDomain.GetData("UploadContentRootPath") as string;

            if (uploadContentRootPath == null)
            {
                return audioFileNameList;
            }

            var files = FolderDataAccess.GetAllFiles(uploadContentRootPath);

            foreach (string file in files)
            {
                if (Path.GetExtension(file).ToLower() == ".mp3" || Path.GetExtension(file).ToLower() == ".wav" || Path.GetExtension(file).ToLower() == ".ogg")
                {
                    var fileName = Path.GetFileName(file);
                    audioFileNameList.Add(fileName);
                }
            }

            return audioFileNameList;
        }
    }
}