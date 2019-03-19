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
    public class EdpController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(EdpController));

        [HttpPost]
        public ActionResult SendRealEstateIdentifiers(string json)
        {
            try
            {
                var res = new HttpStatusCodeResult(HttpStatusCode.OK);
                return res;
            }
            catch (Exception e)
            {
                _log.FatalFormat("SendRealEstateIdentifiers: {0}", e);
                throw e;
            }
        }

        [HttpPost]
        public ActionResult SendCoordinates(string json)
        {
            try
            {
                var res = new HttpStatusCodeResult(HttpStatusCode.OK);
                return res;
            }
            catch (Exception e)
            {
                _log.FatalFormat("SendCoordinates: {0}", e);
                throw e;
            }
        }
    }
}

