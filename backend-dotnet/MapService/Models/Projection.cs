namespace MapService.Models
{
    public class Projection
    {
        public Projection() 
        {
            this.extent = new Enevelop();
        }

        public string? code 
        {
            get
            {
                return extent.code;
            }
            set
            {
                extent.code = value;
            }
        }

        public string? definition { get; set; }

        public Enevelop extent { get; set; }

        public string? units { get; set; }
    }
}
