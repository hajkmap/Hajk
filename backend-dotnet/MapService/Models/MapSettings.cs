using System.ComponentModel.DataAnnotations;

namespace MapService.Models
{
    public class mapsettings
    {
        /// <summary>
        /// Specify the drawer contents that should be active on start.
        /// </summary>
        /// <example>
        /// plugins
        /// </example>
        public string? activeDrawerOnStart { get; set; }

        /// <summary>
        /// Whether Alt-Shift-drag rotate is desired
        /// </summary>
        public bool altShiftDragRotate { get; set; }

        /// <summary>
        /// The OpenLayer view 'center' parameter eg. '376357,6386049'
        /// </summary>
        public int[]? center { get; set; }

        /// <summary>
        /// The map color settings
        /// </summary>
        public Colors? colors { get; set; }

        /// <summary>
        /// If true, the center coordinate is locked to the extent
        /// </summary>
        public bool constrainOnlyCenter { get; set; }

        /// <summary>
        /// If true, zoom is locked to the given resolutions
        /// </summary>
        public bool constrainResolution { get; set; }

        /// <summary>
        /// If true, zoom is locked to the given resolutions
        /// </summary>
        public bool constrainResolutionMobile { get; set; }

        /// <summary>
        /// If true, a checkbox regarding 3rd party cookies will show for new users.
        /// </summary>
        public bool cookieUse3dPart { get; set; }

        /// <summary>
        /// The cross origin parameter
        /// </summary>
        /// <example>
        /// anonymous
        /// </example>
        public string? crossOrigin { get; set; }

        /// <summary>
        /// The cookie message
        /// </summary>
        /// <example>
        /// Vi använder nödvändiga kakor (cookies) för att webbplatsen ska fungera på ett bra sätt för dig. Vi använder också funktionella kakor för att ge dig bästa möjliga funktion om du som användare har godkänt användningen av dessa.
        /// </example>
        public string? defaultCookieNoticeMessage { get; set; }

        /// <summary>
        /// Url that is opened when the 'Mer information' button is pressed.
        /// </summary>
        /// <example>
        /// https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/
        /// </example>
        public string? defaultCookieNoticeUrl { get; set; }

        /// <summary>
        /// Whether double click zoom is desired.
        /// </summary>
        public bool doubleClickZoom { get; set; }

        /// <summary>
        /// Whether drag pan is desired.
        /// </summary>
        public bool dragPan { get; set; }

        /// <summary>
        /// If true, the drawer is locked at start.
        /// </summary>
        public bool drawerPermanent { get; set; }

        /// <summary>
        /// If true, the drawer is visible at start.
        /// </summary>
        public bool drawerVisible { get; set; }

        /// <summary>
        /// If true, the drawer is visible at start.
        /// </summary>
        public bool drawerVisibleMobile { get; set; }

        /// <summary>
        /// If true, a download button is displayed next to each layer in the layer window.
        /// </summary>
        public bool enableDownloadLink { get; set; }

        /// <summary>
        /// The OpenLayer view 'extent' parameter eg. '-1200000,4700000,2600000,8500000'
        /// </summary>
        public int[]? extent { get; set; }

        /// <summary>
        /// Extra resolutions that are added on printouts.
        /// </summary>
        public int[]? extraPrintResolutions { get; set; }

        public string? geoserverLegendOptions { get; set; }

        /// <summary>
        /// If true, the introduction guide will start for new users.
        /// </summary>
        public bool introductionEnabled { get; set; }

        /// <summary>
        /// Show a button on the map that lets the user start the guide manually
        /// </summary>
        public bool introductionShowControlButton { get; set; }

        /// <summary>
        /// JSON object that defines what steps are highlighted in the introduction guide. (Se example https://github.com/HiDeoo/intro.js-react#step)
        /// </summary>
        public string[]? introductionSteps { get; set; }

        /// <summary>
        /// Whether keyboard interaction is desired.
        /// </summary>
        public bool keyboard { get; set; }

        /// <summary>
        /// File path to the logo to be used in the tag. Can be either be relative to Hajk root or absolute.
        /// </summary>
        /// <example>
        /// logoLight.png
        /// </example>
        public string? logo { get; set; }

        /// <summary>
        /// File path to the logo to be used in the tag. Can be either be relative to Hajk root or absolute.
        /// </summary>
        /// <example>
        /// logoDark.png
        /// </example>
        public string? logoDark { get; set; }

        /// <summary>
        /// File path to the logo to be used in the tag. Can be either be relative to Hajk root or absolute.
        /// </summary>
        /// <example>
        /// logoLight.png
        /// </example>
        public string? logoLight { get; set; }

        public bool mapcleaner { get; set; }

        public bool mapresetter { get; set; }

        public bool mapselector { get; set; }

        /// <summary>
        /// The max zoom of the OpenLayer view
        /// </summary>
        /// <example>
        /// 8
        /// </example>
        public int maxZoom { get; set; }

        /// <summary>
        /// The min zoom of the OpenLayer view
        /// </summary>
        /// <example>
        /// 0
        /// </example>
        public int minZoom { get; set; }

        /// <summary>
        /// Whether mouse wheel zoom is desired.
        /// </summary>
        public bool mouseWheelZoom { get; set; }

        /// <summary>
        /// Interact only when the map has the focus (default is false).
        /// </summary>
        public bool onFocusOnly { get; set; }

        /// <summary>
        /// The OpenLayer view 'origin' parameter eg. '0,0'
        /// </summary>
        public int[]? origin { get; set; }

        /// <summary>
        /// Whether pinch rotate is desired.
        /// </summary>
        public bool pinchRotate { get; set; }

        /// <summary>
        /// Whether pinch zoom is desired.
        /// </summary>
        public bool pinchZoom { get; set; }

        /// <example>
        /// EPSG:3006
        /// </example>
        public string? projection { get; set; }

        /// <summary>
        /// The OpenLayer view 'resolution' parameter eg. 2048,1024,512,256,128,64,32,16,8
        /// </summary>
        public int[]? resolutions { get; set; }

        /// <summary>
        /// Whether Shift-drag zoom is desired.
        /// </summary>
        public bool shiftDragZoom { get; set; }

        /// <summary>
        /// If true, the cookie message will show to new users.
        /// </summary>
        public bool showCookieNotice { get; set; }

        public bool showThemeToggler { get; set; }

        public bool showUserAvatar { get; set; }

        /// <example>
        /// map
        /// </example>
        public string? target { get; set; }

        /// <summary>
        /// The map title
        /// </summary>
        /// <example>
        /// Hajk 3
        /// </example>
        public string? title { get; set; }

        /// <summary>
        /// The start zoom of the OpenLayer view
        /// </summary>
        /// <example>
        /// 2
        /// </example>
        public int zoom { get; set; }

        /// <summary>
        /// Zoom level delta when using keyboard or double click zoom.
        /// </summary>
        public string? zoomDelta { get; set; }

        /// <summary>
        /// Duration of the zoom animation in milliseconds.
        /// </summary>
        public string? zoomDuration { get; set; }
    }
}