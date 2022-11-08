using System.ComponentModel;

namespace MapService.Models
{
    public class LayerSwitcher
    {
        public bool? active { get; set; }

        public bool? backgroundSwitcherBlack { get; set; }

        public bool? backgroundSwitcherWhite { get; set; }

        public string? description { get; set; }

        public bool? dropdownThemeMaps { get; set; }

        public bool? enableOSM { get; set; }

        public bool? enableTransparencySlider { get; set; }

        public string? height { get; set; }

        public string? instruction { get; set; }

        public bool? showBreadcrumbs { get; set; }

        public string? themeMapHeaderCaption { get; set; }

        public string? title { get; set; }

        public bool? visibleAtStart { get; set; }

        public bool? visibleAtStartMobile { get; set; }

        public string? width { get; set; }

        public Position? position { get; set; }

        public Position? target { get; set; }

        public List<BaseLayer> baseLayers { get; set; }

        public List<GroupLayer> groups { get; set; }

        public List<GroupLayer> visibleForGroups { get; set; }

        public enum Position
        {
            [Description("left")]
            left,

            [Description("right")]
            right
        }

        public class BaseLayer
        {
            public string id { get; set; }

            public int? drawOrder { get; set; }

            public string? infobox { get; set; }

            public bool? visibleAtStart { get; set; }
        }

        public class GroupLayer
        {
            public Guid id { get; set; }

            public bool? expanded { get; set; }

            public string? name { get; set; } 

            public Guid? parent { get; set; }

            public string? toggled { get; set; }

            public Type? type { get; set; }

            public List<BaseLayer> layers { get; set; }

            public List<GroupLayer> groups { get; set; }

            public enum Type
            {
                [Description("group")]
                group
            }

            public GroupLayer()
            {
                this.layers = new List<BaseLayer>();
                this.groups = new List<GroupLayer>();
            }
        }

        public LayerSwitcher()
        {
            this.baseLayers = new List<BaseLayer>();
            this.groups = new List<GroupLayer>();
            this.visibleForGroups = new List<GroupLayer>();
        }
    }
}
