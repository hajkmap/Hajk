using MapService.Models;
using System.Collections.Generic;
using System.Data;

namespace MapService.Components
{
    public static class Util
    {
        /// <summary>
        /// 
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="list"></param>
        /// <returns></returns>
        public static DataSet ToDataSet(List<ExcelTemplate> templates)
        {
            DataSet dataSet = new DataSet();
            templates.ForEach(template =>
            {
                DataTable table = new DataTable() { TableName = template.TabName };
                var index = 0;
                template.Cols.ForEach(column => {
                    System.Type type = string.Empty.GetType();
                    if (template.Rows[0][index] != null)
                    {
                        type = template.Rows[0][index].GetType();
                    }
                    table.Columns.Add(
                        column,
                        type
                    );
                    index++;
                });
                template.Rows.ForEach(row =>
                {
                    table.Rows.Add(row.ToArray());
                });
                dataSet.Tables.Add(table);
            });
            return dataSet;
        }
    }
}