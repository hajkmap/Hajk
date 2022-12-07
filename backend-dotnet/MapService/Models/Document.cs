namespace MapService.Models
{
    public class Document
    {
        //public string? title { get; set; }

        public string? map { get; set; }

        public List<Chapter> chapters { get; set; }

        public Document(string map)
        {
            this.map = map;
            this.chapters = new List<Chapter>();
        }

        public class Chapter
        {
            //public string? header { get; set; }

            //public string? headerIdentifier { get; set; }

            //public string? html { get; set; }

            //public string? keywords { get; set; }

            //public bool? expanded { get; set; }

            //public List<Chapter> chapters { get; set; }

            public Chapter()
            {
                //this.chapters = new List<Chapter>();
            }
        }
    }
}
