namespace MapService.Models
{
    public class DocumentsList
    {
        public List<string> documents { get; set; }

        public DocumentsList()
        {
            this.documents = new List<string>();
        }
    }
}
