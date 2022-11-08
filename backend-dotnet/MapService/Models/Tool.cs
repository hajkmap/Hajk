namespace MapService.Models
{
    public class Tool
    {
        public int index { get; set; }

        public string? type { get; set; }

        public ToolOptions options { get; set; }

        public class ToolOptions
        {
            public ToolOptions()
            {
                this.baselayers = new List<BaseLayer>();
            }

            public List<BaseLayer> baselayers { get; set; }

            public List<GroupLayer> groups { get; set; }

            public class BaseLayer
            {
                public string id { get; set; }

                public bool? visibleAtStart { get; set; }

                public int? drawOrder { get; set; }

                public string? visibleForGroups { get; set; }

                public string? infobox { get; set; }
            }

            public class GroupLayer
            {
                public GroupLayer(Guid Parent)
                {
                    this.parent = Parent;
                    this.layers = new List<BaseLayer>();
                    this.groups = new List<GroupLayer>();
                }

                public Guid id { get; set; }

                public Guid parent { get; set; }

                public string? name { get; set; }

                public bool? toogled { get; set; }

                public bool? expanded { get; set; }

                public List<BaseLayer> layers { get; set; }

                public List<GroupLayer> groups { get; set; }
            }
        }
    }
}
