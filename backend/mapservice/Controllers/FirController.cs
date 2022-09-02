using System;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Collections.Generic;
using Newtonsoft.Json;
using MapService.Models;
using log4net;
using MapService.Components;
using System.Configuration;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Xml;

/// <summary>
/// This Controller handles the communication with an application that creates Real Estates reports.
/// It also creates the Excel file for "Boendeförteckning".
///
/// One has to add the following to Web.config in section <appSettings>
/// <add key="firUrlServiceFastighetsforteckning" value="" />
/// </summary>

namespace MapService.Controllers
{
    public class FirController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(FirController));

        // Test: { "fnr": ["130121064","130129850","130132945","130139213"] }
        // Test: { "uuid": ["909a6a63-33aa-90ec-e040-ed8f66444c3f","909a6a63-55fc-90ec-e040-ed8f66444c3f","909a6a63-6213-90ec-e040-ed8f66444c3f","909a6a63-7a8f-90ec-e040-ed8f66444c3f"] }
        [HttpPost]
        public async System.Threading.Tasks.Task<string> RealEstateOwnerList(string json)
        {
            try
            {
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.ContentType = "text/html; charset=utf-8";
                Response.Headers.Add("Cache-Control", "private, no-cache");

                _log.DebugFormat("Received json: {0}", json);

                var client = new System.Net.Http.HttpClient(new System.Net.Http.HttpClientHandler { UseDefaultCredentials = true });
                client.Timeout = TimeSpan.FromMilliseconds(600000); // Set timeout to 10 min

                var content = new System.Net.Http.StringContent(json, Encoding.UTF8, "application/json");
                var res = client.PostAsync(ConfigurationManager.AppSettings["firUrlServiceFastighetsforteckning"], content).Result;

                var streamContent = res.Content as System.Net.Http.StreamContent;

                var fileInfo = generateFileInfo("fastighetsforteckning", "xlsx");

                using (var fileStream = System.IO.File.Create(fileInfo[0]))
                {
                    await streamContent.CopyToAsync(fileStream);
                }
                return Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileInfo[1];
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get RealEstateOwnerList: {0}", e);
                throw e;
            }
        }

        [HttpPost]
        public string ResidentList(string json)
        {
            try
            {
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.ContentType = "text/html; charset=utf-8";
                Response.Headers.Add("Cache-Control", "private, no-cache");

                JToken data = JsonConvert.DeserializeObject<JToken>(json);
                if (data != null)
                {
                    var columns = data.SelectToken("columns");
                    var rows = data.SelectToken("rows");

                    List<ExcelTemplate> xls = new List<ExcelTemplate>();
                    xls.Add(new ExcelTemplate
                    {
                        TabName = "Boendeförteckning",
                        Cols = columns.ToObject<List<string>>(),
                        Rows = rows.ToObject<List<List<object>>>()
                    });

                    return GenExcel("boendeforteckning", xls);
                } else
                {
                    return null;
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get ResidentList: {0}", e);
                throw e;
            }
        }

        private string GenExcel(string name, List<ExcelTemplate> xls)
        {
            try
            {
                System.Data.DataSet dataSet = Util.ToDataSet(xls);
                ExcelCreator excelCreator = new ExcelCreator();
                byte[] bytes = excelCreator.Create(dataSet);
                string[] fileInfo = byteArrayToFileInfo(name, bytes, "xls");

                return Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileInfo[1];
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't generate excel file: {0}", e);
                throw e;
            }
        }

        private string[] generateFileInfo(string name, string extension, string folder = "/Temp")
        {
            string path = Server.MapPath(folder);
            string timestamp = DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss");
            string guid = Guid.NewGuid().ToString().Substring(0, 3);
            string filename = String.Format("{0}-{1}_{2}.{3}", name, timestamp, guid, extension);
            string filepath = path + "\\" + filename;
            return new string[] { filepath, filename };
        }

        private string[] byteArrayToFileInfo(string name, byte[] bytes, string type)
        {
            string[] fileInfo = this.generateFileInfo(name, type);
            System.IO.File.WriteAllBytes(fileInfo[0], bytes);

            return fileInfo;
        }
    }
}

