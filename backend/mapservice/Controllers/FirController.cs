using System;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using System.Collections.Generic;
using Newtonsoft.Json;
using MapService.Models;
using MapService.Models.ToolOptions;
using log4net;
using MapService.Components;
using System.Configuration;
using Newtonsoft.Json.Linq;
using MapService.DataAccess;
using System.Collections;
using System.Security.Principal;
using System.Net;
using System.Xml;

namespace MapService.Controllers
{
    public class FirController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(FirController));

        private static HttpWebRequest GetWebRequest(string id, string webConfigParameter, string urlPostfix)
        {
            CookieContainer myContainer = new CookieContainer();
            string url = string.Format(ConfigurationManager.AppSettings[webConfigParameter] + urlPostfix, id);
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Credentials = new NetworkCredential(ConfigurationManager.AppSettings["firLMServiceUser"], ConfigurationManager.AppSettings["firLMServicePassword"]);
            request.CookieContainer = myContainer;
            request.PreAuthenticate = true;
            request.Method = "GET";
            request.Timeout = 20000;
            return request;
        }

        [HttpGet]
        public string PropertyDoc(string id)
        {
            try
            {
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.Headers.Add("Cache-Control", "private, no-cache");

                HttpWebRequest request = GetWebRequest(id, "firLMUrlServiceFastighet", "{0}?includeData=basinformation&srid=3007");

                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    using (var stream = new StreamReader(response.GetResponseStream()))
                    {
                        JToken fastighet = JsonConvert.DeserializeObject<JToken>(stream.ReadToEnd());
                        var uuid = fastighet.SelectToken("$.features[0].id");

                        if (uuid != null)
                        {
                            Response.Redirect(string.Format(ConfigurationManager.AppSettings["firUrlServicePropertyDoc"], uuid.ToString()), true);
                        }

                        return string.Format("Kan inte visa fastighetsrapport för {0}", id);
                    }
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get property document: {0}", e);
                throw e;
            }
        }

        [HttpGet]
        public string PropertyFromAddress(string id)
        {
            try
            {
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.ContentType = "application/json; charset=utf-8";
                Response.Headers.Add("Cache-Control", "private, no-cache");

                HttpWebRequest request = GetWebRequest(id, "firLMUrlServiceUppslagAdress", "{0}");

                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    using (var stream = new StreamReader(response.GetResponseStream()))
                    {
                        var res = stream.ReadToEnd();
                        return res;
                    }
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get properties from adress: {0}", e);
                throw e;
            }
        }

        // Test: { "fnr": ["130121064","130129850","130132945","130139213"] }
        // Test: { "uuid": ["909a6a63-33aa-90ec-e040-ed8f66444c3f","909a6a63-55fc-90ec-e040-ed8f66444c3f","909a6a63-6213-90ec-e040-ed8f66444c3f","909a6a63-7a8f-90ec-e040-ed8f66444c3f"] }
        [HttpPost]
        public string PropertyOwnerList(string json)
        {
            try
            {
                string a = Request.ContentType;
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.ContentType = "text/html; charset=utf-8";
                Response.Headers.Add("Cache-Control", "private, no-cache");

                _log.DebugFormat("Received json: {0}", json);

                // Fastighetförteckning
                string jsonExcel = GenFastighetSheet(json);
                // Marksamfälligheter
                jsonExcel += GenMarksamfallighetSheet(json);
                // Gemensamhetsanläggningar
                jsonExcel += GenGASheet(json);
                // Rättigheter
                jsonExcel += GenRattighetSheet(json);

                return GenerateExcel(jsonExcel);
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get property owner list: {0}", e);
                throw e;
            }
        }

        private string GenFastighetSheet(string json)
        {
            try
            {
                string soapEnvelope = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><GetInskrivningRequest xmlns=\"http://namespace.lantmateriet.se/distribution/produkter/inskrivning/v2.1\"><InskrivningRegisterenhetFilter>{0}</InskrivningRegisterenhetFilter><IncludeData><total>true</total></IncludeData></GetInskrivningRequest></soap:Body></soap:Envelope>";
                string uuidFormat = "<objektidentitet>{0}</objektidentitet>";
                string fnrFormat = "<fastighetsnyckel>{0}</fastighetsnyckel>";

                string regEnhFilter = "";
                JToken jsonBody = JsonConvert.DeserializeObject<JToken>(json);
                if (jsonBody.SelectToken("fnr") != null)
                {
                    var fnr = jsonBody.SelectToken("fnr");
                    foreach (var item in fnr)
                    {
                        regEnhFilter += string.Format(fnrFormat, item.ToString());
                    }
                }
                else if (jsonBody.SelectToken("uuid") != null)
                {
                    var uuid = jsonBody.SelectToken("uuid");
                    foreach (var item in uuid)
                    {
                        regEnhFilter += string.Format(uuidFormat, item.ToString());
                    }
                }
                else
                {
                    throw new HttpException(500, "Invalid JSON body");
                }

                string soapBody = string.Format(soapEnvelope, regEnhFilter);

                CookieContainer myContainer = new CookieContainer();
                var request = (HttpWebRequest)WebRequest.Create("http://services-ver.lantmateriet.se/distribution/produkter/inskrivning/v2.1");
                request.Credentials = new NetworkCredential(ConfigurationManager.AppSettings["firLMServiceUser"], ConfigurationManager.AppSettings["firLMServicePassword"]);
                request.CookieContainer = myContainer;
                request.PreAuthenticate = true;
                request.Method = "POST";
                request.Timeout = 20000;

                var encoding = new ASCIIEncoding();
                byte[] bytes = encoding.GetBytes(soapBody);

                request.ContentType = "application/soap+xml";
                request.ContentLength = bytes.Length;

                using (var reqStream = request.GetRequestStream())
                {
                    reqStream.Write(bytes, 0, bytes.Length);
                }

                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    using (var stream = new StreamReader(response.GetResponseStream()))
                    {
                        var res = stream.ReadToEnd();
                        XmlDocument doc = new XmlDocument();
                        doc.LoadXml(res);

                        // Add the namespace.  
                        XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
                        nsmgr.AddNamespace("env", "http://www.w3.org/2003/05/soap-envelope");
                        nsmgr.AddNamespace("ns4", "http://namespace.lantmateriet.se/distribution/produkter/inskrivning/v2.1");

                        // Skapa JSON för fliken Fastighetförteckning
                        var jsonExcel = "[{ \"TabName\":\"Fastighetförteckning\",\"Cols\":[\"Beteckning\",\"Andel\",\"Ägare/Innehavare\",\"c/o\",\"Adress\",\"Postnummer\",\"Postadress\",\"Notering\"],\"Rows\":[";
                        bool firstRow = true;

                        // Hämta fastighetsbeteckning
                        var nodeListInskrivningsInfo = doc.SelectNodes("//env:Envelope/env:Body/ns4:InskrivningResponse/ns4:InskrivningMember/ns4:Inskrivningsinformation", nsmgr);
                        foreach (XmlNode nodeInskrivning in nodeListInskrivningsInfo)
                        {
                            var fastighetsBeteckning = nodeInskrivning["ns4:Registerenhetsreferens"]["ns4:beteckning"].InnerText;

                            // Ägare kan finnas både under Lagfart och under Tomträttsinnehav. Vi tittar endast på Lagfart i piloten
                            // TODO: Även ta med Tomträttsinnehavare
                            var nodeList = nodeInskrivning.SelectNodes("ns4:Agande/ns4:Lagfart", nsmgr);

                            if (nodeList.Count > 0)
                            {
                                foreach (XmlNode node in nodeList)
                                {
                                    var andel = node["ns4:BeviljadAndel"]["ns4:taljare"].InnerText + "/" + node["ns4:BeviljadAndel"]["ns4:namnare"].InnerText;

                                    string agare, coAdress, adress, postnr, postort;
                                    agare = coAdress = adress = postnr = postort = "Not Found";
                                    var agareOrg = node["ns4:Agare"]["ns4:Organisation"];
                                    var agarePerson = node["ns4:Agare"]["ns4:Person"];
                                    if (agareOrg != null)
                                    {
                                        agare = agareOrg["ns4:organisationsnamn"].InnerText;
                                        coAdress = "";
                                        if (agareOrg["ns4:Adress"]["ns4:coAdress"] != null)
                                            coAdress = agareOrg["ns4:Adress"]["ns4:coAdress"].InnerText;
                                        adress = "";
                                        if (agareOrg["ns4:Adress"]["ns4:utdelningsadress2"] != null)
                                            adress = agareOrg["ns4:Adress"]["ns4:utdelningsadress2"].InnerText;
                                        if (agareOrg["ns4:Adress"]["ns4:utdelningsadress1"] != null)
                                            adress += agareOrg["ns4:Adress"]["ns4:utdelningsadress1"].InnerText;
                                        postnr = agareOrg["ns4:Adress"]["ns4:postnummer"].InnerText;
                                        postort = agareOrg["ns4:Adress"]["ns4:postort"].InnerText;
                                    }
                                    else if (agarePerson != null)
                                    {
                                        agare = agarePerson["ns4:fornamn"].InnerText + " " + agarePerson["ns4:efternamn"].InnerText;
                                        coAdress = "";
                                        if (agarePerson["ns4:Adress"]["ns4:coAdress"] != null)
                                            coAdress = agarePerson["ns4:Adress"]["ns4:coAdress"].InnerText;
                                        adress = agarePerson["ns4:Adress"]["ns4:utdelningsadress2"].InnerText;
                                        if (agarePerson["ns4:Adress"]["ns4:utdelningsadress1"] != null)
                                            adress += agarePerson["ns4:Adress"]["ns4:utdelningsadress1"].InnerText;
                                        postnr = agarePerson["ns4:Adress"]["ns4:postnummer"].InnerText;
                                        postort = agarePerson["ns4:Adress"]["ns4:postort"].InnerText;
                                    }

                                    jsonExcel = jsonExcel + (firstRow ? "":",") + "[\"" + fastighetsBeteckning + "\",\"" + andel + "\",\"" + agare + "\",\"" + coAdress + "\",\"" + adress + "\",\"" + postnr + "\",\"" + postort + "\",\"Lagfart\"]";
                                }
                            }
                            else
                            {
                                jsonExcel = jsonExcel + (firstRow ? "" : ",") + "[\"Ingen lagfart funnen\",\"\",\"\",\"\",\"\",\"\",\"\",\"Troligen Tomträtt\"]";
                            }
                            firstRow = false;
                        }

                        return jsonExcel + "]},";
                    }
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get property owner list: {0}", e);
                throw e;
            }
        }

        private string GenMarksamfallighetSheet(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Osäker på vad som menas med marksamfälligheter. Är det någon form av samfällighetsförening kan dessa hittas i tjänsten nedan.
            // Värden för detta hittas i tjänsten Samfällighetsförening Direkt

            // Skapa JSON för fliken Marksamfälligheter
            var jsonExcel = "{ \"TabName\":\"Marksamfälligheter\",\"Cols\":[\"Marksamfälligheter\"],\"Rows\":[";
            jsonExcel = jsonExcel + "[\"\"]";
            return jsonExcel + "]},";
        }

        private string GenGASheet(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Värden för detta hittas i tjänsten Gemensamhetsanläggning Direkt

            // Skapa JSON för fliken Gemensamhetsanläggningar
            var jsonExcel = "{ \"TabName\":\"Gemensamhetsanläggningar\",\"Cols\":[\"Gemensamhetsanläggningar\"],\"Rows\":[";
            jsonExcel = jsonExcel + "[\"\"]";
            return jsonExcel + "]},";
        }

        private string GenRattighetSheet(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Värden för detta hittas i tjänsten Inskrivning Direkt

            // Skapa JSON för fliken Rättigheter
            var jsonExcel = "{ \"TabName\":\"Rättigheter\",\"Cols\":[\"Avtalsrättighet\",\"Till förmån för\",\"Till last för \",\"Andel\",\"Ägare/Innehavare\",\"c/o\",\"Adress\",\"Postnummer\",\"Postadress\"],\"Rows\":[";
            jsonExcel = jsonExcel + "[\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\",\"\"]";
            return jsonExcel + "]}]";
        }

        private string GenerateExcel(string json)
        {
            try
            {
                //// Hårdkodat exempel, används inte
                //json = "[{ \"TabName\":\"Fastighetförteckning\",\"Cols\":[\"Beteckning\",\"Andel\",\"Ägare/Innehavare\",\"c/o\",\"Adress\",\"Postnummer\",\"Postadress\",\"Notering\"],\"Rows\":[";
                ////string json = "[{ \"TabName\":\"Fastighetförteckning\",\"Cols\":[\"Beteckning\",\"Andel\",\"Ägare/Innehavare\",\"c/o\",\"Adress\",\"Postnummer\",\"Postadress\",\"Notering\"],\"Rows\":[[\"Beteckning\",\"Andel\",\"Ägare/Innehavare\",\"c/o\",\"Adress\",\"Postnummer\",\"Postadress\",\"Notering\"]]}]";
                ////json = json + "[\"Beteckning\",\"Andel\",\"Ägare/Innehavare\",\"c/o\",\"Adress\",\"Postnummer\",\"Postadress\",\"Notering\"]";
                //json = json + "[\"Getakärr 1:1\",\"1/1\",\"Varbergs kommun\",\"\",\"BOX XXX\",\"43280\",\"Varberg\",\"\"],";
                //json = json + "[\"Breared 3\",\"1/3\",\"Anders Andersson\",\"\",\"Stora Storgatan 1\",\"43281\",\"Varberg\",\"\"],";
                //json = json + "[\"Breared 3\",\"1/3\",\"Anders 2 Andersson\",\"\",\"Stora Storgatan 2\",\"43281\",\"Varberg\",\"\"],";
                //json = json + "[\"Breared 3\",\"1/3\",\"Anders 3 Andersson\",\"\",\"Stora Storgatan 3\",\"43281\",\"Varberg\",\"\"],";
                //json = json + "[\"Ferien 6\",\"1/1\",\"BRF XXX\",\"c/o BRF XXX\",\"Lillgatan 1\",\"43284\",\"Varberg\",\"\"]";
                //json = json + "]}]";

                List<ExcelTemplate> data = JsonConvert.DeserializeObject<List<ExcelTemplate>>(json);
                System.Data.DataSet dataSet = Util.ToDataSet(data);
                ExcelCreator excelCreator = new ExcelCreator();
                byte[] bytes = excelCreator.Create(dataSet);
                string[] fileInfo = byteArrayToFileInfo(bytes, "xls");

                return Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileInfo[1];
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get property owner list: {0}", e);
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

        private string[] byteArrayToFileInfo(byte[] bytes, string type)
        {
            string[] fileInfo = this.generateFileInfo("kartexport", type);
            System.IO.File.WriteAllBytes(fileInfo[0], bytes);

            return fileInfo;
        }
    }
}
