using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

using NPOI.HSSF;
using NPOI.HSSF.UserModel;
using NPOI.HSSF.Util;
using System.Data;
using System.Xml;

namespace MapService.Components
{
    public class KMLCreator
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="xml"></param>
        /// <returns></returns>
        public byte[] Create(string xml)
        {
            XmlDocument doc = new XmlDocument();            
            using (MemoryStream ms = new MemoryStream())
            {
                doc.LoadXml(xml);
                doc.Save(ms);
                return ms.ToArray();
            }
        }
    }
}