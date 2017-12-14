using System.Data;
using System.Web.Mvc;
using System.Collections.Generic;

using Newtonsoft.Json;

using MapService.Components;
using MapService.Components.MapExport;
using MapService.Models;
using System.Threading.Tasks;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System;
using ICSharpCode.SharpZipLib.Zip;
using ICSharpCode.SharpZipLib.Core;

using log4net;

using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Mail;
using System.Net;

namespace MapService.Controllers
{
    public class ExportController : AsyncController
    {
        ILog _log = LogManager.GetLogger(typeof(ExportController));
        /// <summary>
        /// Create filename with unique timestamp and guid.
        /// </summary>
        /// <param name="name"></param>
        /// <param name="extension"></param>
        /// <returns>Array<string></returns>
        private string[] generateFileInfo(string name, string extension, string folder = "/Temp")
        {
            string path = Server.MapPath(folder);
            string timestamp = DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss");
            string guid = Guid.NewGuid().ToString().Substring(0, 3);
            string filename = String.Format("{0}-{1}_{2}.{3}", name, timestamp, guid, extension);
            string filepath = path + "\\" + filename;
            return new string[] { filepath, filename };
        }

        /// <summary>
        /// Depth-first recursive delete, with handling for descendant 
        /// directories open in Windows Explorer.
        /// </summary>
        private static void DeleteDirectory(string path)
        {
            foreach (string directory in Directory.GetDirectories(path))
            {
                DeleteDirectory(directory);
            }

            try
            {
                Directory.Delete(path, true);
            }
            catch (IOException)
            {
                Directory.Delete(path, true);
            }
            catch (UnauthorizedAccessException)
            {
                Directory.Delete(path, true);
            }
        }

        [HttpPost]
        public string PDF(string json)
        {
            _log.DebugFormat("Received json: {0}", json);

            try
            {
                MapExportItem exportItem = JsonConvert.DeserializeObject<MapExportItem>(json);
                AsyncManager.OutstandingOperations.Increment();
                PDFCreator pdfCreator = new PDFCreator();
                _log.Debug("Inited pdfcreator");
                byte[] blob = pdfCreator.Create(exportItem);
                _log.Debug("created blob in pdfcreator");
                string[] fileInfo = byteArrayToFileInfo(blob, "pdf");
                _log.DebugFormat("Created fileinfo: {0}", fileInfo[1]);

                if (exportItem.proxyUrl != "")
                {
                    return exportItem.proxyUrl + "/Temp/" + fileInfo[1];
                }
                else
                {
                    return Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileInfo[1];
                }
                //return File(blob, "application/pdf", "kartutskrift.pdf");
            }
            catch (Exception e)
            {
                _log.Fatal(e.Message);
                throw;
            }
        }

        private byte[] imgToByteArray(Image img)
        {
            byte[] bytes = null;
            using (MemoryStream stream = new MemoryStream())
            {
                img.Save(stream, System.Drawing.Imaging.ImageFormat.Tiff);
                bytes = stream.ToArray();
            }            
            return bytes;
        }

        [HttpPost]
        public string TIFF(string json)
        {
            _log.DebugFormat("Received json: {0}", json);

            MapExportItem exportItem = JsonConvert.DeserializeObject<MapExportItem>(json);
                                    
            TIFFCreator tiffCreator = new TIFFCreator();
            Image img = tiffCreator.Create(exportItem);
            
            MemoryStream outStream = new MemoryStream();

            ZipOutputStream zipStream = new ZipOutputStream(outStream);
            zipStream.SetLevel(3);
            
            ZipEntry imageEntry = new ZipEntry(ZipEntry.CleanName("kartexport.tiff"));
            imageEntry.DateTime = DateTime.Now;

            zipStream.PutNextEntry(imageEntry);

            MemoryStream imageStream = new MemoryStream(imgToByteArray(img));       
            byte[] buffer = new byte[4096];                       

            StreamUtils.Copy(imageStream, zipStream, buffer);

            imageStream.Close();
            zipStream.CloseEntry();
            
            ZipEntry worldFileEntry = new ZipEntry(ZipEntry.CleanName("kartexport.tfw"));
            worldFileEntry.DateTime = DateTime.Now;

            zipStream.PutNextEntry(worldFileEntry);
            MemoryStream worldFileStream = new MemoryStream(MapImageCreator.CreateWorldFile(exportItem));
            
            byte[] buffer2 = new byte[4096];
            StreamUtils.Copy(worldFileStream, zipStream, buffer2);

            worldFileStream.Close();
            zipStream.CloseEntry();

            zipStream.IsStreamOwner = false;    // False stops the Close also Closing the underlying stream.
            zipStream.Close();                  // Must finish the ZipOutputStream before using outputMemStream.

            outStream.Position = 0;
            outStream.ToArray();

            string[] fileInfo = byteArrayToFileInfo(outStream.ToArray(), "zip");
            if (exportItem.proxyUrl != "") {
                return exportItem.proxyUrl + "/Temp/" + fileInfo[1];
            } else {
                return Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileInfo[1];
            }
        }


        [HttpPost]
        [ValidateInput(false)]
        public string KML(string json)
        {
            _log.DebugFormat("Received json: {0}", json);

            KMLCreator kmlCreator = new KMLCreator();
            byte[] bytes = kmlCreator.Create(json);
            string[] fileInfo = byteArrayToFileInfo(bytes, "kml");

            return Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileInfo[1];
        }

        private string[] byteArrayToFileInfo(byte[] bytes, string type)
        {
            string[] fileInfo = this.generateFileInfo("kartexport", type);
            System.IO.File.WriteAllBytes(fileInfo[0], bytes);

            return fileInfo;
        }

        private Stream ByteArrayToStream(byte[] bytes)
        {            
            MemoryStream stream = new MemoryStream();
            stream.Write(bytes, 0, bytes.Length);
            return stream;
        }

        [HttpPost]
        public string Excel(string json)
        {
            _log.DebugFormat("Received json: {0}", json);

            List<ExcelTemplate> data = JsonConvert.DeserializeObject<List<ExcelTemplate>>(json);
            DataSet dataSet = Util.ToDataSet(data);
            ExcelCreator excelCreator = new ExcelCreator();
            byte[] bytes = excelCreator.Create(dataSet);
            string[] fileInfo = byteArrayToFileInfo(bytes, "xls");
            
            return Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileInfo[1];
        }

        [HttpPost]
        public string Email(string json, string emailAddress)  
        {
            MapExportItem exportItem = JsonConvert.DeserializeObject<MapExportItem>(json);
            AsyncManager.OutstandingOperations.Increment();
            PDFCreator pdfCreator = new PDFCreator();
            _log.Debug("Inited pdfcreator");
            byte[] blob = pdfCreator.Create(exportItem);

            MailAddress toAddress = new MailAddress(emailAddress);
    
            var client = new SmtpClient()
            {
                EnableSsl = true
            };

            MailMessage message = new MailMessage(fromAddress, toAddress);
            message.Subject = "Din kartexport";
            message.IsBodyHtml = true;
            message.Body = "Här kommer din kartexport.";
            message.Attachments.Add(new Attachment(new MemoryStream(blob), "kartexport.pdf"));
            try
            {
                client.Send(message);
                return "Ditt epost-meddelande har skickats!";
            }
            catch (Exception e)
            {
                _log.Fatal(e.Message);
                throw;
            }
        }
    }
}
