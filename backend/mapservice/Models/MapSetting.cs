using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models
{
    public struct Colors
    {
        public string primaryColor { get; set; }
        public string secondaryColor { get; set; }
        public string preferredColorScheme { get; set; }
    }

    public class MapSetting
    {
        public string target { get; set; }  
              
        public int[] center { get; set; }
		
		public string title { get; set; }

        public string projection { get; set; }

        public int zoom { get; set; }

        public int maxZoom { get; set; }

        public int minZoom { get; set; }

        public double[] resolutions { get; set; }
        
        public double[] extraPrintResolutions { get; set; }        

        public double[] origin { get; set; }

        public double[] extent { get; set; }

        public bool constrainOnlyCenter { get; set; }

        public bool constrainResolution { get; set; }
        
        public bool enableDownloadLink { get; set; }

        public string logo { get; set; }

        public string logoLight { get; set; }

        public string logoDark { get; set; }        

        public string geoserverLegendOptions { get; set; }

		public bool mapselector { get; set; }

        public bool mapcleaner { get; set; }

        public bool drawerVisible { get; set; }

        public bool drawerVisibleMobile {get; set; }

        public bool drawerPermanent { get; set; }

        public string activeDrawerOnStart { get; set; }

        public Colors colors { get; set; }

        public string defaultCookieNoticeMessage { get; set; }

        public string defaultCookieNoticeUrl { get; set; }
        
        public string crossOrigin { get; set; }

        public bool showCookieNotice { get; set; }

        public bool showThemeToggler { get; set; }
    }
}
