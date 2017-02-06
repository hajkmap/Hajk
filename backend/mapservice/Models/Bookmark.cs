using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models
{
    public class Bookmark
    {
        /// <summary>
        /// Unique ID of the bookmark
        /// </summary>
        public int id { get; set; }
        /// <summary>
        /// Is the bookmark favourite
        /// </summary>
        public bool favourite { get; set; }
        /// <summary>
        /// User who owns the bookmark
        /// </summary>
        public string username { get; set; }        
        /// <summary>
        /// Name of the bookmark
        /// </summary>
        public string name { get; set; }
        /// <summary>
        /// Blob of settings.
        /// </summary>
        public string settings { get; set; }
    }
}
