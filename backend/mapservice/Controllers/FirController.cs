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

        // TODO: Remove this
        [HttpGet]
        public string PropertyDoc(string id)
        {
            return RealEstateDoc(id);
        }

        [HttpGet]
        public string RealEstateDoc(string id)
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
                _log.FatalFormat("Can't get real estate document: {0}", e);
                throw e;
            }
        }

        /// <summary>
        /// Returnernar fastigheter från en adress.
        /// Problem med sökvillkoret.
        /// TODO: Används inte. Ta bort
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public string RealEstateFromAddress(string id)
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
                _log.FatalFormat("Can't get real estates from adress: {0}", e);
                throw e;
            }
        }

        // TODO: Remove this
        [HttpPost]
        public string PropertyOwnerList(string json)
        {
            return RealEstateOwnerList(json);
        }

        // Test: { "fnr": ["130121064","130129850","130132945","130139213"] }
        // Test: { "uuid": ["909a6a63-33aa-90ec-e040-ed8f66444c3f","909a6a63-55fc-90ec-e040-ed8f66444c3f","909a6a63-6213-90ec-e040-ed8f66444c3f","909a6a63-7a8f-90ec-e040-ed8f66444c3f"] }
        // Test: {"fnr":["130120236","130120237","130120238","130120239","130120240","130121103","130121104","130121105","130121106","130121107","130121108","130121109","130121110","130121112","130121113","130121114","130121115","130121116","130121117","130121118","130121119","130121120","130121121","130121122","130121123","130121124","130121125","130121126","130121127","130121128","130121129","130121130","130121132","130121133","130121134","130121150","130121151","130121152","130125494","130127053","130127054","130127055","130127056","130127057","130127058","130127059","130127060","130127063","130127064","130127065","130127066","130127067","130127068","130127069","130127070","130131493","130131494","130131495","130131496","130131497","130131498","130131499","130131500","130131504","130131505","130131506","130131507","130131508","130131509","130131510","130131511","130131512","130145263","130145264","130145265","130145266","130145267","130145268","130145269","130145270","130145273","130145274","130145275","130145276","130145277","130145278","130145279","130145280"]}
        // Test: {"fnr":["130125550","130125547","130125548","130125552","130125549"]}
        [HttpPost]
        public string RealEstateOwnerList(string json)
        {
            try
            {
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.ContentType = "text/html; charset=utf-8";
                Response.Headers.Add("Cache-Control", "private, no-cache");

                _log.DebugFormat("Received json: {0}", json);

                List<ExcelTemplate> xls = new List<ExcelTemplate>();
                // Fastighetförteckning
                xls.Add(GenFastighetSheet(json));
                // Marksamfälligheter
                xls.Add(GenMarksamfallighetSheet(json));
                // Gemensamhetsanläggningar
                xls.Add(GenGASheet(json));
                // Rättigheter
                xls.Add(GenRattighetSheet(json));

                return GenerateExcel(xls);
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get property owner list: {0}", e);
                throw e;
            }
        }

        /// <summary>
        /// Försökt använda WCF i .NET utan att lyckas. Enligt LM krävs att man redigerar i de genererade filerna för att det ska funka med WCF och .NET
        /// https://www.lantmateriet.se/sv/Kartor-och-geografisk-information/Geodatatjanster/Fragor-och-svar/Direktatkomsttjanster-/?faq=c31f
        /// Använder därför SOAP utan ramverk. När tjänsten finns som REST med JSON-format bör denna portas från SOAP till REST.
        /// </summary>
        /// <param name="json"></param>
        /// <returns></returns>
        private ExcelTemplate GenFastighetSheet(string json)
        {
            string fastighetsBeteckning = "";
            try
            {
                string soapEnvelope = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><GetInskrivningRequest xmlns=\"http://namespace.lantmateriet.se/distribution/produkter/inskrivning/v2.1\"><InskrivningRegisterenhetFilter>{0}</InskrivningRegisterenhetFilter><IncludeData><total>true</total></IncludeData></GetInskrivningRequest></soap:Body></soap:Envelope>";
                string uuidFormat = "<objektidentitet>{0}</objektidentitet>";
                string fnrFormat = "<fastighetsnyckel>{0}</fastighetsnyckel>";

                // TODO: Endast skicka 250 fastigheter åt gången
                List<string> fnrList, uuidList;
                string regEnhFilter = "";
                JToken jsonBody = JsonConvert.DeserializeObject<JToken>(json);
                if (jsonBody.SelectToken("fnr") != null)
                {
                    fnrList = GetList(jsonBody.SelectToken("fnr"));

                    regEnhFilter = GetInskrivningRegisterenhetFilter(fnrList, fnrFormat, 0);

                    //fnrList = new List<string>();
                    //var fnr = jsonBody.SelectToken("fnr").Values();
                    //foreach (var item in fnr)
                    //{
                    //    fnrList.Add(item.ToString());
                    //    //regEnhFilter += string.Format(fnrFormat, item.ToString());
                    //}
                }
                else if (jsonBody.SelectToken("uuid") != null)
                {
                    uuidList = GetList(jsonBody.SelectToken("uuid"));

                    regEnhFilter = GetInskrivningRegisterenhetFilter(uuidList, uuidFormat, 0);

                    //var uuid = jsonBody.SelectToken("uuid");
                    //foreach (var item in uuid)
                    //{
                    //    regEnhFilter += string.Format(uuidFormat, item.ToString());
                    //}
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
                        ExcelTemplate xls = new ExcelTemplate();
                        xls.TabName = "Fastighetsförteckning";
                        xls.Cols = new List<string>(new string[] { "Beteckning", "Andel", "Ägare/Innehavare", "c/o", "Adress", "Postnummer", "Postadress", "Notering" });
                        xls.Rows = new List<List<object>>();

                        // Hämta fastighetsbeteckning
                        var nodeListInskrivningsInfo = doc.SelectNodes("//env:Envelope/env:Body/ns4:InskrivningResponse/ns4:InskrivningMember/ns4:Inskrivningsinformation", nsmgr);
                        foreach (XmlNode nodeInskrivning in nodeListInskrivningsInfo)
                        {
                            var typ = nodeInskrivning["ns4:Registerenhetsreferens"]["ns4:typ"]; // TODO: Kontrollera vilka fler typer det finns (samfällighet?)
                            fastighetsBeteckning = nodeInskrivning["ns4:Registerenhetsreferens"]["ns4:beteckning"].InnerText;
                            _log.DebugFormat("Fastighet '{0}' med följande typ: '{1}'", fastighetsBeteckning, typ.InnerText);

                            // Ägare kan finnas både under Lagfart och under Tomträttsinnehav.
                            // TODO: Testa Tomträttsinnehavare
                            // Enligt dokumentation ska Lagfart och Tomtrattsinnehav ha samma egenskaper förutom Lagfartsanmarkning och Tomtrattsinnehavsanmarkning
                            var nodeList = nodeInskrivning.SelectNodes("ns4:Agande/ns4:Lagfart", nsmgr);
                            if (nodeList.Count == 0)
                                nodeList = nodeInskrivning.SelectNodes("ns4:Agande/ns4:Tomtrattsinnehav", nsmgr);

                            if (nodeList.Count > 0)
                            {
                                foreach (XmlNode node in nodeList)
                                {
                                    if (node["ns4:BeviljadAndel"] != null)
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
                                            if (agareOrg["ns4:Adress"] != null)
                                            {
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
                                        }
                                        else if (agarePerson != null)
                                        {
                                            agare = agarePerson["ns4:fornamn"].InnerText + " " + agarePerson["ns4:efternamn"].InnerText;
                                            coAdress = "";
                                            if (agarePerson["ns4:Adress"] != null)
                                            {
                                                if (agarePerson["ns4:Adress"]["ns4:coAdress"] != null)
                                                    coAdress = agarePerson["ns4:Adress"]["ns4:coAdress"].InnerText;
                                                adress = agarePerson["ns4:Adress"]["ns4:utdelningsadress2"].InnerText;
                                                if (agarePerson["ns4:Adress"]["ns4:utdelningsadress1"] != null)
                                                    adress += agarePerson["ns4:Adress"]["ns4:utdelningsadress1"].InnerText;
                                                postnr = agarePerson["ns4:Adress"]["ns4:postnummer"].InnerText;
                                                postort = agarePerson["ns4:Adress"]["ns4:postort"].InnerText;
                                            }
                                        }
                                        else
                                        {
                                            if (node["ns4:Agare"]["ns4:fornamn"] != null && node["ns4:Agare"]["ns4:efternamn"] != null)
                                                agare = node["ns4:Agare"]["ns4:fornamn"].InnerText + " " + node["ns4:Agare"]["ns4:efternamn"].InnerText;
                                            else if (node["ns4:Agare"]["ns4:organisationsnamn"] != null)
                                                agare = node["ns4:Agare"]["ns4:organisationsnamn"].InnerText;
                                        }

                                        xls.Rows.Add(new List<object>(new string [] { fastighetsBeteckning, andel, agare, coAdress, adress, postnr, postort, "Lagfart" }));
                                    }
                                }
                            }
                            else
                            {
                                // Kan finnas fastigheter utan ägande. Lägga med dem i fliken så får användaren ta bort dem manuellt
                                xls.Rows.Add(new List<object>(new string[] { fastighetsBeteckning, "", "", "", "", "", "", "Ingen ägare funnen" }));
                            }
                        }

                        return xls;
                    }
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get real estate owner list. Last real estate '{0}', {1}", fastighetsBeteckning, e);
                throw e;
            }
        }

        private string GetInskrivningRegisterenhetFilter(List<string> list, string format, int n)
        {
            string res = "";
            for (int i = n * 100; i < list.Count && i < (n + 1) * 100; i++)
            {
                res += string.Format(format, list[i]);
            }

            return res;
        }

        private List<string> GetList(JToken jToken)
        {
            var res = new List<string>();

            foreach (var item in jToken)
            {
                res.Add(item.ToString());
            }

            return res;
        }

        private ExcelTemplate GenMarksamfallighetSheet(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Osäker på vad som menas med marksamfälligheter. Är det någon form av samfällighetsförening kan dessa hittas i tjänsten nedan.
            // Värden för detta hittas i tjänsten Samfällighetsförening Direkt

            // Skapa fliken Marksamfälligheter
            ExcelTemplate xls = new ExcelTemplate();
            xls.TabName = "Marksamfälligheter";
            xls.Cols = new List<string>(new string[] { "Marksamfälligheter" });
            xls.Rows = new List<List<object>>();
            xls.Rows.Add(new List<object>(new string[] { "Not implemented" }));

            return xls;
        }

        private ExcelTemplate GenGASheet(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Värden för detta hittas i tjänsten Gemensamhetsanläggning Direkt

            // Skapa fliken Gemensamhetsanläggningar
            ExcelTemplate xls = new ExcelTemplate();
            xls.TabName = "Gemensamhetsanläggningar";
            xls.Cols = new List<string>(new string[] { "Gemensamhetsanläggningar" });
            xls.Rows = new List<List<object>>();
            xls.Rows.Add(new List<object>(new string[] { "Not implemented" }));

            return xls;
        }

        private ExcelTemplate GenRattighetSheet(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Värden för detta hittas i tjänsten Inskrivning Direkt

            // Skapa fliken Rättigheter
            ExcelTemplate xls = new ExcelTemplate();
            xls.TabName = "Rättigheter";
            xls.Cols = new List<string>(new string[] { "Avtalsrättighet", "Till förmån för", "Till last för", "Andel", "Ägare/Innehavare", "c/o", "Adress", "Postnummer", "Postadress" });
            xls.Rows = new List<List<object>>();
            xls.Rows.Add(new List<object>(new string[] { "Not implemented", "", "", "", "", "", "", "", "" }));

            return xls;
        }

        private string GenerateExcel(List<ExcelTemplate> xls)
        {
            try
            {
                System.Data.DataSet dataSet = Util.ToDataSet(xls);
                ExcelCreator excelCreator = new ExcelCreator();
                byte[] bytes = excelCreator.Create(dataSet);
                string[] fileInfo = byteArrayToFileInfo(bytes, "xls");

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

        private string[] byteArrayToFileInfo(byte[] bytes, string type)
        {
            string[] fileInfo = this.generateFileInfo("kartexport", type);
            System.IO.File.WriteAllBytes(fileInfo[0], bytes);

            return fileInfo;
        }
    }
}
