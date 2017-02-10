using MapService.Components;
using System.IO;
using System.Web.Mvc;
using System.Xml;

namespace MapService.Controllers
{
    public class ImportController : Controller
    {

        public byte[] readFully(Stream input)
        {
            byte[] buffer = new byte[16 * 1024];
            using (MemoryStream ms = new MemoryStream())
            {
                int read;
                while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
                {
                    ms.Write(buffer, 0, read);
                }
                return ms.ToArray();
            }
        }
               
        public ContentResult KML()
        {
            var file = Request.Files[0];            
            byte[] bytes = this.readFully(file.InputStream);            
            string content = System.Text.Encoding.UTF8.GetString(bytes);
            return this.Content(content, "text/xml");
        }

        public string Image(Stream uploading)
        {
            return "";
        }
    }
}
