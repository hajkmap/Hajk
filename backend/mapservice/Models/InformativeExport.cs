using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MapService.Models
{
    public class InformativeExport
    {
        public string mapFile { get; set; }
        public string documentFile { get; set; }
        public string chapterHeader { get; set; }
        public string chapterHtml { get; set; }
    }
}