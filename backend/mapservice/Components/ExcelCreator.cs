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
using Newtonsoft.Json;

namespace MapService.Components
{
    public class ExcelCreator
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="dataSet"></param>
        /// <returns></returns>
        public byte[] Create()
        {
            HSSFWorkbook workbook = new HSSFWorkbook();
            HSSFSheet sheet = (HSSFSheet)workbook.CreateSheet("Fel");
            HSSFRow row = (HSSFRow)sheet.CreateRow(0);
            HSSFCell cell = (HSSFCell)row.CreateCell(0);
            cell.SetCellValue("Indata till rapport saknas.");
            MemoryStream ms = new MemoryStream();
            workbook.Write(ms);
            return ms.ToArray();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="dataSet"></param>
        /// <returns></returns>
        public byte[] Create(DataSet dataSet)
        {
            HSSFWorkbook workbook = new HSSFWorkbook();
            if (dataSet.Tables.Count == 0)
            {
                return Create();
            }
            foreach (DataTable table in dataSet.Tables)
            {
                // Append sheet to workbook and fill with table
                HSSFSheet sheet = (HSSFSheet)workbook.CreateSheet(table.TableName);

                // Set captions   
                int rowCount = 0;
                HSSFRow captionRow = (HSSFRow)sheet.CreateRow(rowCount);
                foreach (DataColumn column in table.Columns)
                {
                    HSSFCell cell = (HSSFCell)captionRow.CreateCell(column.Ordinal);
                    cell.SetCellValue(column.Caption);

                    // Create a new font in the workbook
                    HSSFFont headerRowCellFont = (HSSFFont)workbook.CreateFont();
                    headerRowCellFont.FontName = "Arial";
                    headerRowCellFont.Boldweight = (short)NPOI.SS.UserModel.FontBoldWeight.Bold;

                    // Create a new style in the workbook
                    HSSFCellStyle headerRowCellStyle = (HSSFCellStyle)workbook.CreateCellStyle();
                    headerRowCellStyle.SetFont(headerRowCellFont);

                    cell.CellStyle = headerRowCellStyle;
                }

                // Set cell values
                foreach (DataRow dataRow in table.Rows)
                {
                    int cellCount = 0;
                    rowCount += 1;
                    HSSFRow row = (HSSFRow)sheet.CreateRow(rowCount);
                    foreach (var value in dataRow.ItemArray)
                    {
                        HSSFCell cell = (HSSFCell)row.CreateCell(cellCount);
                        int value_int;
                        double value_double;
                        if (int.TryParse(value.ToString(), out value_int))
                        {
                            cell.SetCellValue(value_int);
                        }
                        else if (double.TryParse(value.ToString(), out value_double))
                        {
                            cell.SetCellValue(value_double);
                        }
                        else
                        {
                            cell.SetCellValue(value.ToString());
                        }
                        cellCount += 1;
                    }
                }

                for (int i = 0; i < table.Columns.Count; i++)
                {
                    sheet.AutoSizeColumn(i);
                    int w = sheet.GetColumnWidth(i);
                    const int buffer = 512;
                    const int max = 25000;
                    if (w < max)
                    {
                        sheet.SetColumnWidth(i, w + buffer);
                    }
                    else
                    {
                        sheet.SetColumnWidth(i, max + buffer);
                    }
                }
            }


            using (MemoryStream ms = new MemoryStream())
            {
                workbook.Write(ms);                
                return ms.ToArray();
            }
        }
    }
}