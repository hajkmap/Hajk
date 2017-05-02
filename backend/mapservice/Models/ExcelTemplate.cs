using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MapService.Models
{
    public class ExcelTemplate
    {
        public string TabName { get; set; }
        public List<string> Cols { get; set; }
        public List<List<object>> Rows { get; set; }
    }
}