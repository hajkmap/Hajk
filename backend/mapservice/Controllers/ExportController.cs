using System.Data;
using System.Web.Mvc;
using System.Collections.Generic;

using Newtonsoft.Json;

using MapService.Components;
using MapService.Components.MapExport;
using MapService.Models;

namespace MapService.Controllers
{
    public class ExportController : AsyncController
    {
        [HttpPost]
        public void PDFAsync(string json)
        {
            MapExportItem exportItem = JsonConvert.DeserializeObject<MapExportItem>(json);
            AsyncManager.OutstandingOperations.Increment();
            PDFCreator pdfCreator = new PDFCreator();
            pdfCreator.Create(exportItem, (result) =>
            {
                AsyncManager.Parameters["blob"] = result.bytes;
                AsyncManager.OutstandingOperations.Decrement();
            });
        }

        public ActionResult PDFCompleted(byte[] blob)
        {
            return File(blob, "application/pdf", "kartutskrift.pdf");
        }

        [HttpPost]
        [ValidateInput(false)]
        public ActionResult KML(string json)
        {
            KMLCreator kmlCreator = new KMLCreator();
            return File(kmlCreator.Create(json), "application/vnd.google-earth.kml+xml", "kartexport.kml");
        }

        [HttpPost]        
        public ActionResult Excel(string json)
        {
            List<ExcelTemplate> data = JsonConvert.DeserializeObject<List<ExcelTemplate>>(json);
            DataSet dataSet = Util.ToDataSet(data);
            ExcelCreator excelCreator = new ExcelCreator();            
            return File(excelCreator.Create(dataSet), "application/vnd.ms-excel", "kartexport.xls");
        }
    }
}
