using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts
{
    [DataContract]    
    public class Bookmark
    {
        /// <summary>
        /// Unique ID of the bookmark
        /// </summary>
        [DataMember(Name = "id")]
        public int id { get; set; }
        /// <summary>
        /// Is the bookmark favourite
        /// </summary>
        [DataMember(Name = "favourite")]
        public bool favourite { get; set; }
        /// <summary>
        /// User who owns the bookmark
        /// </summary>
        [DataMember(Name = "username")]
        public string username { get; set; }        
        /// <summary>
        /// Name of the bookmark
        /// </summary>
        [DataMember(Name = "name")]
        public string name { get; set; }
        /// <summary>
        /// Blob of settings.
        /// </summary>
        [DataMember(Name = "settings")]
        public string settings { get; set; }
    }
}
