namespace MapService.Models
{
    /// <summary>
    /// Class representation of a document. 
    /// </summary>
    public class Document
    {
        /// <summary>
        /// Gets or sets the chapters in the document. 
        /// </summary>
        public List<Chapter> chapters { get; set; }

        /// <summary>
        /// Gets or sets the map name this document is associated with. 
        /// </summary>
        public string? map { get; set; }

        /// <summary>
        /// Creates a new document. 
        /// </summary>
        /// <param name="map">The map name this document is associated with, </param>
        public Document(string map)
        {
            this.map = map;
            this.chapters = new List<Chapter>();
        }

        /// <summary>
        /// Inner class that represents a chapter. 
        /// </summary>
        public class Chapter
        {
            //public string? header { get; set; }

            //public string? headerIdentifier { get; set; }

            //public string? html { get; set; }

            //public string? keywords { get; set; }

            //public bool? expanded { get; set; }

            //public List<Chapter> chapters { get; set; }

            /// <summary>
            /// Creates a new chapter. 
            /// </summary>
            public Chapter()
            {
                //this.chapters = new List<Chapter>();
            }
        }
    }
}
