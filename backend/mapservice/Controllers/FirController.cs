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

namespace MapService.Controllers
{
    public class FirController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(FirController));

        // Test: { "fnr": ["130121064","130129850","130132945","130139213"] }
        // Test: { "uuid": ["909a6a63-33aa-90ec-e040-ed8f66444c3f","909a6a63-55fc-90ec-e040-ed8f66444c3f","909a6a63-6213-90ec-e040-ed8f66444c3f","909a6a63-7a8f-90ec-e040-ed8f66444c3f"] }
        // Test: {"fnr":["130120236","130120237","130120238","130120239","130120240","130121103","130121104","130121105","130121106","130121107","130121108","130121109","130121110","130121112","130121113","130121114","130121115","130121116","130121117","130121118","130121119","130121120","130121121","130121122","130121123","130121124","130121125","130121126","130121127","130121128","130121129","130121130","130121132","130121133","130121134","130121150","130121151","130121152","130125494","130127053","130127054","130127055","130127056","130127057","130127058","130127059","130127060","130127063","130127064","130127065","130127066","130127067","130127068","130127069","130127070","130131493","130131494","130131495","130131496","130131497","130131498","130131499","130131500","130131504","130131505","130131506","130131507","130131508","130131509","130131510","130131511","130131512","130145263","130145264","130145265","130145266","130145267","130145268","130145269","130145270","130145273","130145274","130145275","130145276","130145277","130145278","130145279","130145280"]}
        // Test: {"fnr":["130125550","130125547","130125548","130125552","130125549"]}
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

