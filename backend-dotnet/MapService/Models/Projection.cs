namespace MapService.Models
{
    public class Projection
    {
        public Projection() 
        {
            this.extent = new Envelop();
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

        public Envelop extent { get; set; }

        public string? units { get; set; }
    }
}
