namespace MapService.Models
{
    public class Document
    {
        public string? map { get; set; }

        public List<Chapter> chapters { get; set; }

        public Document(string map)
        {
            this.map = map;
            this.chapters = new List<Chapter>();
        }

        public class Chapter
        {
            public Chapter()
            {
            }
        }
    }
}
