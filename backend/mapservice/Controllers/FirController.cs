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

// För att FIRController ska fungera måste följande läggas till Web.config under <appSettings>
//<add key = "firLMServiceUser" value="" />
//<add key = "firLMServicePassword" value="" />
//<add key = "firLMUrlServiceFastighet" value="http://services-ver.lantmateriet.se/distribution/produkter/fastighet/v2.1/" />
//<add key = "firLMUrlServiceInskrivning" value="http://services-ver.lantmateriet.se/distribution/produkter/inskrivning/v2.1/" />
//<add key = "firLMNamespaceInskrivning" value="http://namespace.lantmateriet.se/distribution/produkter/inskrivning/v2.1" />
//<add key = "firLMUrlServiceRattighet" value="http://services-ver.lantmateriet.se/distribution/produkter/rattighet/v1.4/" />
//<add key = "firLMNamespaceRattighet" value="http://namespace.lantmateriet.se/distribution/produkter/rattighet/v1.4" />
//<add key = "firUrlServicePropertyDoc" value="http://karta4.varberg.se:85/Report/Fastighet/pdf/{0}" />

namespace MapService.Controllers
{
    public class FirController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(FirController));

        private static HttpWebRequest GetWebRequestPost(string webConfigParameter, string urlPostfix)
        {
            CookieContainer myContainer = new CookieContainer();
            string url = ConfigurationManager.AppSettings[webConfigParameter] + urlPostfix;
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Credentials = new NetworkCredential(ConfigurationManager.AppSettings["firLMServiceUser"], ConfigurationManager.AppSettings["firLMServicePassword"]);
            request.CookieContainer = myContainer;
            request.PreAuthenticate = true;
            request.Method = "POST";
            request.Timeout = 20000;
            return request;
        }

        private void WritePostBody(HttpWebRequest request, string ContentType, string body, Encoding encoding)
        {
            byte[] bytes = encoding.GetBytes(body);

            request.ContentType = ContentType;
            request.ContentLength = bytes.Length;

            using (var reqStream = request.GetRequestStream())
            {
                reqStream.Write(bytes, 0, bytes.Length);
            }
        }

        private string ReadPostResponse(HttpWebRequest request)
        {
            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            {
                using (var stream = new StreamReader(response.GetResponseStream()))
                {
                    return stream.ReadToEnd();
                }
            }
        }

        [HttpGet]
        public string RealEstateDoc(string id)
        {
            try
            {
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.Headers.Add("Cache-Control", "private, no-cache");

                if(string.IsNullOrEmpty(id))
                    return string.Format("Inget FNR angivet. Kan inte visa fastighetsrapport!");

                HttpWebRequest request = GetWebRequestPost("firLMUrlServiceFastighet", "?includeData=basinformation");
                WritePostBody(request, "application/json", string.Format("[\"{0}\"]", id), new ASCIIEncoding());
                var res = ReadPostResponse(request);
                JToken fastighet = JsonConvert.DeserializeObject<JToken>(res);
                var uuid = fastighet.SelectToken("$.features[0].id");

                if (uuid != null)
                {
                    Response.Redirect(string.Format(ConfigurationManager.AppSettings["firUrlServicePropertyDoc"], uuid.ToString()), true);
                }

                return string.Format("Kan inte visa fastighetsrapport för {0}", id);
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get real estate document: {0}", e);
                throw e;
            }
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

                bool samfallighetParam = false, gaParam = false, rattighetParam = false, persnrParam = false, taxerad_agareParam = false;
                JToken jParam = JsonConvert.DeserializeObject<JToken>(json).SelectToken("param");
                if (jParam != null)
                {                    
                    samfallighetParam = jParam.SelectToken("samfallighet").Value<bool>();
                    gaParam = jParam.SelectToken("ga").Value<bool>();
                    rattighetParam = jParam.SelectToken("rattighet").Value<bool>();
                    persnrParam = jParam.SelectToken("persnr").Value<bool>();
                    taxerad_agareParam = jParam.SelectToken("taxerad_agare").Value<bool>();                    
                }

                // Skapa lista över begärda fastigheter, konvertera till uuid (då vissa tjänster kräver detta)
                var fastighetAndSamfallighetLista = GetFastighetAndSamfallighet(json);

                ExcelInfoLista excelInfoLista = new ExcelInfoLista();
                // Lägga på alla samfälligheter
                excelInfoLista.samfallighetLista.AddRange(fastighetAndSamfallighetLista.samfallighetLista);
                // Hämta fastigheter
                GetFastighet(fastighetAndSamfallighetLista.fastighetLista, true, persnrParam, ref excelInfoLista);
                // TODO: Taxerad ägare

                if (rattighetParam) // Hämta rättigheter
                {
                    GetRattighet(fastighetAndSamfallighetLista.fastighetLista, ref excelInfoLista);
                    // TODO: Hämta fastigheter som refereras i rättigheter
                    //GetFastighet(xx, false, persnrParam, ref excelInfoLista);
                }
                //if (gaParam) // TODO: Hämta GA
                //    GetRattighet(fastighetAndSamfallighetLista.fastighetLista, ref excelInfoLista);

                List<ExcelTemplate> xls = new List<ExcelTemplate>();
                // Fastighetförteckning
                xls.Add(GenFastighetFlik(excelInfoLista));
                if (samfallighetParam) // Samfälligheter
                    xls.Add(GenSamfallighetFlik(excelInfoLista));
                if (gaParam) // Gemensamhetsanläggningar
                    xls.Add(GenGAFlik(json));
                if (rattighetParam) // Rättigheter
                    xls.Add(GenRattighetFlik(json));

                return GenExcel(xls);
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
        /// Logik.
        /// 1. Hämta alla fastigheter som användaren har begärt. Lägg dessa i primär fastighetslista lägg samfälligheterna i särskild lista
        /// 2. Hämta alla rättigheter för fastigheter i primär lista
        /// 3. Hämta de fastigheter som refereras av rättigheter och som inte redan har hämtats. Dessa läggs i sekundär lista
        /// 4. Fyll på primär lista med taxerad ägare
        /// 5. Hämta alla GA mha primär fastighetslista
        /// 6. Skapa de olika flikarna i Excel med data ovan
        /// </summary>
        private void GetFastighet(List<FastighetArea> fastighetLista, bool primarFastighet, bool persnr, ref ExcelInfoLista excelInfoLista)
        {
            string fastighetsBeteckning = "";
            try
            {
                // Hämta information om ägande för fastigheten (anges i includeData)
                string soapEnvelope = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><GetInskrivningRequest xmlns=\"{0}\"><InskrivningRegisterenhetFilter>{1}</InskrivningRegisterenhetFilter><IncludeData><agare>true</agare></IncludeData></GetInskrivningRequest></soap:Body></soap:Envelope>";

                var maxFastighet = 100;// Endast skicka 100 fastigheter åt gången (för prestanda)
                for (int n = 0; n*maxFastighet < fastighetLista.Count; n++)
                {
                    string regEnhFilter = GetInskrivningRegisterenhetFilter(fastighetLista, n, maxFastighet);

                    string soapBody = string.Format(soapEnvelope, ConfigurationManager.AppSettings["firLMNamespaceInskrivning"], regEnhFilter);
                    var request = GetWebRequestPost("firLMUrlServiceInskrivning", "");
                    WritePostBody(request, "application/soap+xml", soapBody, new ASCIIEncoding());
                    var res = ReadPostResponse(request);
                    XmlDocument doc = new XmlDocument();
                    doc.LoadXml(res);

                    // Add the namespace.  
                    XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
                    nsmgr.AddNamespace("env", "http://www.w3.org/2003/05/soap-envelope");
                    nsmgr.AddNamespace("ns4", ConfigurationManager.AppSettings["firLMNamespaceInskrivning"]);

                    // Hämta fastighetsbeteckning
                    var nodeListInskrivningsInfo = doc.SelectNodes("//env:Envelope/env:Body/ns4:InskrivningResponse/ns4:InskrivningMember/ns4:Inskrivningsinformation", nsmgr);
                    foreach (XmlNode nodeInskrivning in nodeListInskrivningsInfo)
                    {
                        fastighetsBeteckning = nodeInskrivning["ns4:Registerenhetsreferens"]["ns4:beteckning"].InnerText;
                        var uuid = nodeInskrivning["ns4:Registerenhetsreferens"]["ns4:objektidentitet"].InnerText;

                        if (excelInfoLista.fastighetPrimarLista.Exists(item => item.uuid == uuid)) // Inte lägga till dubletter till primär fsatigheslista
                            continue;

                        var fastighetArea = fastighetLista.Find(item => item.uuid == uuid);
                        var resFastighetInfo = new FastighetInfo(fastighetArea, fastighetsBeteckning);

                        // Ägare kan finnas både under Lagfart och under Tomträttsinnehav.
                        var nodeLagfart = nodeInskrivning.SelectNodes("ns4:Agande/ns4:Lagfart", nsmgr);
                        var nodeTomtratt = nodeInskrivning.SelectNodes("ns4:Agande/ns4:Tomtrattsinnehav", nsmgr);

                        if (nodeLagfart.Count > 0 || nodeTomtratt.Count > 0)
                        {
                            foreach (XmlNode node in nodeLagfart)
                            {
                                var resOwner = GetAgareInfo(node, persnr, "Lagfart");
                                resFastighetInfo.lagfarenAgareLista.Add(resOwner);
                            }
                            foreach (XmlNode node in nodeTomtratt)
                            {
                                var resOwner = GetAgareInfo(node, persnr, "Tomträtt");
                                resFastighetInfo.lagfarenAgareLista.Add(resOwner);
                            }
                        }
                        else
                        {
                            // Kan finnas fastigheter utan ägande.
                            resFastighetInfo.lagfarenAgareLista.Add(new Agare("-"));
                        }

                        if(primarFastighet)
                            excelInfoLista.fastighetPrimarLista.Add(resFastighetInfo);
                        else
                            excelInfoLista.fastighetSekundarLista.Add(resFastighetInfo);
                    }
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get real estate owner list. Last real estate '{0}', {1}", fastighetsBeteckning, e);
                throw e;
            }
        }

        private Agare GetAgareInfo(XmlNode node, bool persnr, string notering)
        {
            var resOwner = new Agare("-", notering);
            if (node["ns4:BeviljadAndel"] != null)
            {
                resOwner.andel = node["ns4:BeviljadAndel"]["ns4:taljare"].InnerText + "/" + node["ns4:BeviljadAndel"]["ns4:namnare"].InnerText;

                var agareOrg = node["ns4:Agare"]["ns4:Organisation"];
                var agarePerson = node["ns4:Agare"]["ns4:Person"];
                if (agareOrg != null)
                {
                    resOwner.agare = agareOrg["ns4:organisationsnamn"].InnerText;
                    if (agareOrg["ns4:organisationsnummer"] != null && persnr)
                        resOwner.persnr = agareOrg["ns4:organisationsnummer"].InnerText;
                    if (agareOrg["ns4:Adress"] != null)
                    {
                        if (agareOrg["ns4:Adress"]["ns4:coAdress"] != null)
                            resOwner.coAdress = agareOrg["ns4:Adress"]["ns4:coAdress"].InnerText;
                        if (agareOrg["ns4:Adress"]["ns4:utdelningsadress2"] != null)
                            resOwner.adress = agareOrg["ns4:Adress"]["ns4:utdelningsadress2"].InnerText;
                        if (agareOrg["ns4:Adress"]["ns4:utdelningsadress1"] != null)
                            resOwner.adress += agareOrg["ns4:Adress"]["ns4:utdelningsadress1"].InnerText;
                        resOwner.postnr = agareOrg["ns4:Adress"]["ns4:postnummer"].InnerText;
                        resOwner.postort = agareOrg["ns4:Adress"]["ns4:postort"].InnerText;
                    }
                }
                else if (agarePerson != null)
                {
                    resOwner.agare = agarePerson["ns4:fornamn"].InnerText + " " + agarePerson["ns4:efternamn"].InnerText;
                    if (agarePerson["ns4:personnummer"] != null && persnr)
                        resOwner.persnr = agarePerson["ns4:personnummer"].InnerText;
                    if (agarePerson["ns4:Adress"] != null)
                    {
                        if (agarePerson["ns4:Adress"]["ns4:coAdress"] != null)
                            resOwner.coAdress = agarePerson["ns4:Adress"]["ns4:coAdress"].InnerText;
                        if (agarePerson["ns4:Adress"]["ns4:utdelningsadress2"] != null)
                            resOwner.adress = agarePerson["ns4:Adress"]["ns4:utdelningsadress2"].InnerText;
                        if (agarePerson["ns4:Adress"]["ns4:utdelningsadress1"] != null)
                            resOwner.adress += agarePerson["ns4:Adress"]["ns4:utdelningsadress1"].InnerText;
                        resOwner.postnr = agarePerson["ns4:Adress"]["ns4:postnummer"].InnerText;
                        resOwner.postort = agarePerson["ns4:Adress"]["ns4:postort"].InnerText;
                    }
                }
                else
                {
                    if (node["ns4:Agare"]["ns4:fornamn"] != null && node["ns4:Agare"]["ns4:efternamn"] != null)
                        resOwner.agare = node["ns4:Agare"]["ns4:fornamn"].InnerText + " " + node["ns4:Agare"]["ns4:efternamn"].InnerText;
                    else if (node["ns4:Agare"]["ns4:organisationsnamn"] != null)
                        resOwner.agare = node["ns4:Agare"]["ns4:organisationsnamn"].InnerText;
                }
            }

            return resOwner;
        }

        private List<string> GetRattighetsId(List<FastighetArea> fastighetLista)
        {
            List<string> resUuidList = new List<string>();

            // TODO: Kontrollera vilken information som ska hämtas
            // Hämta information om rättigheter för fastigheten (anges i includeData)
            string soapEnvelope = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><FindRattighetRequest xmlns=\"{0}\" ><RegisterenhetFilter>{1}</RegisterenhetFilter></FindRattighetRequest></soap:Body></soap:Envelope>";

            var maxFastighet = 1;// Endast skicka 100 fastigheter åt gången (för prestanda). Varberg får endast fråga efter en fastighet i taget
            for (int n = 0; n * maxFastighet < fastighetLista.Count; n++)
            {
                string regEnhFilter = GetInskrivningRegisterenhetFilter(fastighetLista, n, maxFastighet);

                string soapBody = string.Format(soapEnvelope, ConfigurationManager.AppSettings["firLMNamespaceRattighet"], regEnhFilter);
                //string soapBody = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><FindRattighetRequest xmlns=\"http://namespace.lantmateriet.se/distribution/produkter/rattighet/v1.4\"><RegisterenhetFilter><objektidentitet>909a6a63-30d7-90ec-e040-ed8f66444c3f</objektidentitet></RegisterenhetFilter></FindRattighetRequest></soap:Body></soap:Envelope>";
                var request = GetWebRequestPost("firLMUrlServiceRattighet", "");
                WritePostBody(request, "application/soap+xml", soapBody, new ASCIIEncoding());
                var res = ReadPostResponse(request);
                XmlDocument doc = new XmlDocument();
                doc.LoadXml(res);

                // Add the namespace.  
                XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
                nsmgr.AddNamespace("env", "http://www.w3.org/2003/05/soap-envelope");
                nsmgr.AddNamespace("app", ConfigurationManager.AppSettings["firLMNamespaceRattighet"]);

                var nodeListRattighetLast = doc.SelectNodes("//env:Envelope/env:Body/app:RattighetsreferensResponse/app:Last", nsmgr);
                var nodeListRattighetForman = doc.SelectNodes("//env:Envelope/env:Body/app:RattighetsreferensResponse/app:Forman", nsmgr);

                foreach (XmlNode node in nodeListRattighetLast)
                {
                    resUuidList.Add(node["app:Rattighetsreferens"]["app:objektidentitet"].InnerText);
                }
                foreach (XmlNode node in nodeListRattighetForman)
                {
                    // TODO: Kontrollera Förmån
                    resUuidList.Add(node["app:Rattighetsreferens"]["app:objektidentitet"].InnerText);
                }
            }

            return resUuidList;
        }

        private void GetRattighet(List<FastighetArea> fastighetLista, ref ExcelInfoLista excelInfoLista)
        {
            string rattighetsUuid = "";
            try
            {
                // Hämta alla rättigheter som finns för fastigheterna
                var rattighetLista = GetRattighetsId(fastighetLista);

                // TODO: Kontrollera vilken information som ska hämtas
                // Hämta information om rättigheter för fastigheten (anges i IncludeData). OBS! Stort I på IncludeData i denna tjänst
                string soapEnvelope = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><GetRattighetRequest xmlns=\"{0}\" ><objektidentitet>{1}</objektidentitet><IncludeData><total>true</total></IncludeData></GetRattighetRequest></soap:Body></soap:Envelope>";

                // Tjänsten stöder endast att man hämtar en rättighet åt gången
                for (int n = 0; n < rattighetLista.Count; n++)
                {
                    //string regEnhFilter = GetInskrivningRegisterenhetFilter(rattighetLista, n, 1);
                    rattighetsUuid = rattighetLista[n];
                    string soapBody = string.Format(soapEnvelope, ConfigurationManager.AppSettings["firLMNamespaceRattighet"], rattighetsUuid);
                    var request = GetWebRequestPost("firLMUrlServiceRattighet", "");
                    WritePostBody(request, "application/soap+xml", soapBody, new ASCIIEncoding());
                    var res = ReadPostResponse(request);
                    XmlDocument doc = new XmlDocument();
                    doc.LoadXml(res);

                    // Add the namespace.  
                    XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
                    nsmgr.AddNamespace("env", "http://www.w3.org/2003/05/soap-envelope");
                    nsmgr.AddNamespace("app", ConfigurationManager.AppSettings["firLMNamespaceRattighet"]);

                    // Hämta fastighetsbeteckning
                    var nodeRattighet = doc.SelectSingleNode("//env:Envelope/env:Body/app:RattighetResponse/app:RattighetMember", nsmgr);
                    if (nodeRattighet["app:Avtalsservitut"] != null)
                    {
                        var nodeAvtalsServitut = nodeRattighet["app:Avtalsservitut"];
                        string rattighetsbeteckning = nodeAvtalsServitut["app:rattighetsbeteckning"].InnerText;
                        var nodeFormanList = nodeAvtalsServitut.SelectNodes("app:Forman", nsmgr);
                        foreach (XmlNode node in nodeFormanList)
                        {
                        }
                    }
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get real estate owner list. GetRattighet '{0}', {1}", rattighetsUuid, e);
                throw e;
            }
        }

        private string GetInskrivningRegisterenhetFilter(List<FastighetArea> list, int n, int maxFastighet)
        {
            string res = "";
            string format = "<objektidentitet>{0}</objektidentitet>";

            for (int i = n * maxFastighet; i < list.Count && i < (n + 1) * maxFastighet; i++)
            {
                res += string.Format(format, list[i].uuid);
            }

            return res;
        }

        /// <summary>
        /// Returnerar listor med fastigheter och samfälligheter uuid. Konverterar fnr till uuid om det behövs och slår upp total area
        /// </summary>
        private FastighetSamfallighetLista GetFastighetAndSamfallighet(string json)
        {
            var res = new FastighetSamfallighetLista();

            JToken jsonBody = JsonConvert.DeserializeObject<JToken>(json);
            JToken jToken = jsonBody.SelectToken("fnr");
            if (jToken == null)
                jToken = jsonBody.SelectToken("uuid");
            if (jToken == null)
                throw new HttpException(500, "Invalid JSON body");
            var items = new List<string>(jToken.Values<string>());

            for (int i = 0; i < items.Count;)
            {
                string bodyContent = "";
                for (int j = 0; j < 1 && i < items.Count; j++, i++) // TODO: Öka detta till 250 när Varbergs konto har den rättigheten
                {
                    bodyContent += j > 0 ? "," + "\"" + items[i] + "\"" : "\"" + items[i] + "\"";
                }
                var request = GetWebRequestPost("firLMUrlServiceFastighet", "?includeData=basinformation");
                WritePostBody(request, "application/json", string.Format("[{0}]", bodyContent), new ASCIIEncoding());
                string resp = ReadPostResponse(request);

                JToken jsonFastigheter = JsonConvert.DeserializeObject<JToken>(resp).SelectToken("features");
                foreach (var item in jsonFastigheter)
                {
                    string totalArea = "";
                    var typ = item.SelectToken("$.properties.typ").ToString();
                    if (typ.Equals("Fastighet"))
                    {
                        string uuid = item.SelectToken("$.properties.objektidentitet").ToString();
                        if(item.SelectToken("$.properties.fastighetsattribut.totalRegisterarea") != null)
                            totalArea = item.SelectToken("$.properties.fastighetsattribut.totalRegisterarea").ToString();
                        res.fastighetLista.Add( new FastighetArea(uuid, totalArea));
                    }
                    else if (typ.Equals("Samfällighet"))
                    {
                        var jBeteckning = item.SelectToken("$.properties.registerbeteckning");
                        var beteckning = jBeteckning.SelectToken("$.registeromrade").ToString() + " " + jBeteckning.SelectToken("$.traktnamn").ToString() + " " + jBeteckning.SelectToken("$.block").ToString() + ":" + jBeteckning.SelectToken("$.enhet").ToString();
                        if(item.SelectToken("$.properties.samfallighetsattribut.totalRegisterarea") != null)
                            totalArea = item.SelectToken("$.properties.samfallighetsattribut.totalRegisterarea").ToString();
                        res.samfallighetLista.Add(new SamfallighetArea(beteckning, totalArea));
                    }
                }
            }

            return res;
        }

        private ExcelTemplate GenFastighetFlik(ExcelInfoLista excelInfoLista)
        {
            // Skapa fliken Fastighetsförteckning
            ExcelTemplate xls = new ExcelTemplate();
            xls.TabName = "Fastighetsförteckning";
            xls.Cols = new List<string>(new string[] { "Beteckning", "Total Area", "Ägandeform", "Andel", "Ägare/Innehavare", "Person-/Organisationsnummer", "c/o", "Adress", "Postnummer", "Postadress" });
            xls.Rows = new List<List<object>>();

            foreach(var realEstate in excelInfoLista.fastighetPrimarLista)
            {
                foreach (var lagfarenAgare in realEstate.lagfarenAgareLista)
                {
                    xls.Rows.Add(new List<object>(new string[] { realEstate.fastighetsBeteckning, realEstate.totalArea, lagfarenAgare.notering, lagfarenAgare.andel, lagfarenAgare.agare, lagfarenAgare.persnr, lagfarenAgare.coAdress, lagfarenAgare.adress, lagfarenAgare.postnr, lagfarenAgare.postort }));
                }
            }

            if (xls.Rows.Count == 0)
                xls.Rows.Add(new List<object>(new string[] { "", "", "", "", "", "", "", "", "", "" }));

            return xls;
        }

        private ExcelTemplate GenSamfallighetFlik(ExcelInfoLista excelInfoLista)
        {
            // Skapa fliken Marksamfälligheter
            ExcelTemplate xls = new ExcelTemplate();
            xls.TabName = "Samfälligheter";
            xls.Cols = new List<string>(new string[] { "Samfälligheter" });
            xls.Rows = new List<List<object>>();

            foreach (var samfallighet in excelInfoLista.samfallighetLista)
            {
                xls.Rows.Add(new List<object>(new string[] { samfallighet.beteckning }));
            }

            if(xls.Rows.Count==0)
                xls.Rows.Add(new List<object>(new string[] { "" }));

            return xls;
        }

        private ExcelTemplate GenGAFlik(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Värden för detta hittas i tjänsten Gemensamhetsanläggning Direkt

            // Skapa fliken Gemensamhetsanläggningar
            ExcelTemplate xls = new ExcelTemplate();
            xls.TabName = "Gemensamhetsanläggningar";
            xls.Cols = new List<string>(new string[] { "Gemensamhetsanläggningar" });
            xls.Rows = new List<List<object>>();
            xls.Rows.Add(new List<object>(new string[] { "Not implemented" }));

            if (xls.Rows.Count == 0)
                xls.Rows.Add(new List<object>(new string[] { "" }));

            return xls;
        }

        private ExcelTemplate GenRattighetFlik(string json)
        {
            // TODO: Hämta värden från LM Direkt
            // Värden för detta hittas i tjänsten Inskrivning Direkt

            // Skapa fliken Rättigheter
            ExcelTemplate xls = new ExcelTemplate();
            xls.TabName = "Rättigheter";
            xls.Cols = new List<string>(new string[] { "Avtalsrättighet", "Till förmån för", "Till last för", "Andel", "Ägare/Innehavare", "Person-/Organisationsnummer", "c/o", "Adress", "Postnummer", "Postadress" });
            xls.Rows = new List<List<object>>();
            xls.Rows.Add(new List<object>(new string[] { "Not implemented", "", "", "", "", "", "", "", "", "" }));

            if (xls.Rows.Count == 0)
                xls.Rows.Add(new List<object>(new string[] { "" }));

            return xls;
        }

        private string GenExcel(List<ExcelTemplate> xls)
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

    internal class FastighetSamfallighetLista
    {
        public List<FastighetArea> fastighetLista = new List<FastighetArea>();
        public List<SamfallighetArea> samfallighetLista = new List<SamfallighetArea>();
    }

    internal class FastighetArea
    {
        public string uuid;
        public string totalArea;

        public FastighetArea(string uuid, string totalArea)
        {
            this.uuid = uuid;
            this.totalArea = totalArea;
        }
    }

    internal class SamfallighetArea
    {
        public string beteckning;
        public string totalArea;

        public SamfallighetArea(string beteckning, string totalArea)
        {
            this.beteckning = beteckning;
            this.totalArea = totalArea;
        }
    }

    internal class ExcelInfoLista
    {
        public List<FastighetInfo> fastighetPrimarLista = new List<FastighetInfo>();
        public List<Rattighet> rattighetLista = new List<Rattighet>();
        public List<SamfallighetArea> samfallighetLista = new List<SamfallighetArea>();
        public List<FastighetInfo> fastighetSekundarLista = new List<FastighetInfo>();
        public List<string> gaLista = new List<string>();
    }

    internal class FastighetInfo
    {
        public string uuid = "";
        public string fastighetsBeteckning = "";
        public List<Agare> lagfarenAgareLista = new List<Agare>();
        public List<Agare> taxeradAgareLista = new List<Agare>();
        public string totalArea;

        public FastighetInfo(FastighetArea fastighetArea, string fastbet)
        {
            this.uuid = fastighetArea.uuid;
            fastighetsBeteckning = fastbet;
            totalArea = fastighetArea.totalArea;
        }
    }

    internal class Agare
    {
        public string andel, agare, persnr, coAdress, adress, postnr, postort, notering;
        public Agare(string init, string notering = "")
        {
            andel = agare = persnr = adress = postnr = postort = init;
            coAdress = "";
            this.notering = notering;
        }
    }

    internal class Rattighet
    {
        public string avtalsRattighet, formanFor, lastFor, andel, agare, persnr, coAdress, adress, postnr, postort;

        public Rattighet(string init)
        {
            avtalsRattighet = formanFor = lastFor = andel = agare = persnr = coAdress = adress = postnr = postort = init;
        }
    }
}

