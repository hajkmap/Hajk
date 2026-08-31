import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Popover,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  InputAdornment,
  Checkbox,
  Chip,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { isMobile } from "../../utils/IsMobile";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIosRounded";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import LaunchIcon from "@mui/icons-material/Launch";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import Crop54Icon from "@mui/icons-material/Crop54";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import SearchIcon from "@mui/icons-material/Search";
import LayersIcon from "@mui/icons-material/Layers";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import { setOLSubLayers } from "../../utils/groupLayers";
import { isValidLayerId } from "../../utils/Validator";

const MAX_RECENT = 5;
const TOP_LEVEL_LAYER_MATCH_LIMIT = 5;

const IS_MAC = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const SHORTCUT_LABEL = IS_MAC ? "⌘K" : "Ctrl+K";

function getCurrentThemeMode() {
  const stored = window.localStorage.getItem("userPreferredColorScheme");
  if (stored === "light" || stored === "dark") return stored;
  return window?.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

function getPresetConfig(appModel) {
  return appModel?.config?.mapConfig?.tools?.find((t) => t.type === "preset")
    ?.options;
}

// Initial commands to display
function getCommands(appModel) {
  const isDark = getCurrentThemeMode() === "dark";
  const presetConfig = getPresetConfig(appModel);
  return [
    {
      type: "__openTools",
      title: "Öppna verktyg",
      description: "Visa alla tillgängliga verktyg",
      icon: <LaunchIcon />,
      kind: "command",
    },
    {
      type: "__showLayers",
      title: "Lager",
      description: "Visa och hantera kartlager",
      icon: <LayersIcon />,
      kind: "command",
    },
    {
      type: "__showBackgrounds",
      title: "Byt bakgrundslager",
      description: "Välj kartans bakgrundslager",
      icon: <WallpaperIcon />,
      kind: "command",
    },
    ...(presetConfig?.presetList?.length > 0
      ? [
          {
            type: "__showPresets",
            title: "Snabbval",
            description: "Snabbval till fördefinierade platser och lager",
            icon: <FolderSpecialIcon />,
            kind: "command",
          },
        ]
      : []),
    ...getSearchCommands(appModel),
    {
      type: "__toggleTheme",
      title: isDark ? "Växla till ljust tema" : "Växla till mörkt tema",
      description: "",
      icon: <Brightness4Icon />,
      kind: "command",
    },
    {
      type: "__closeAllWindows",
      title: "Stäng alla fönster",
      description: "Stäng alla öppna plugin-fönster",
      icon: <CloseIcon />,
      kind: "command",
    },
    {
      type: "__hideAllLayers",
      title: "Dölj alla aktiva lager",
      description: "Gör alla synliga lager osynliga",
      icon: <VisibilityOffIcon />,
      kind: "command",
    },
  ];
}

function getSearchCommands(appModel) {
  const searchConfig =
    appModel?.config?.mapConfig?.tools?.find((t) => t.type === "search")
      ?.options || {};

  const commands = [];
  if (searchConfig.enablePolygonSearch !== false) {
    commands.push({
      type: "__searchPolygon",
      title: "Sök med polygon",
      description: "Rita en polygon för att söka inom området",
      icon: <EditIcon />,
      kind: "command",
    });
  }
  if (searchConfig.enableRadiusSearch !== false) {
    commands.push({
      type: "__searchRadius",
      title: "Sök med radie",
      description: "Rita en cirkel för att söka inom radien",
      icon: <RadioButtonUncheckedIcon />,
      kind: "command",
    });
  }
  if (searchConfig.enableSelectSearch !== false) {
    commands.push({
      type: "__searchSelect",
      title: "Sök med objekt",
      description: "Välj objekt i kartan för att söka",
      icon: <TouchAppIcon />,
      kind: "command",
    });
  }
  if (searchConfig.enableExtentSearch !== false) {
    commands.push({
      type: "__searchExtent",
      title: "Sök inom vyn",
      description: "Sök i den aktuella kartan",
      icon: <Crop54Icon />,
      kind: "command",
    });
  }
  commands.push({
    type: "__clearSearch",
    title: "Rensa sökning",
    description: "Rensa sökning och fokusera sökfältet",
    icon: <SearchOffIcon />,
    kind: "command",
  });
  return commands;
}

const BACK_COMMAND = {
  type: "__back",
  title: "Tillbaka",
  description: "Tillbaka till kommandon",
  icon: <ArrowBackIcon />,
  kind: "command",
};

// Translated plugin name to swedish menu texts
const PLUGIN_TITLES = {
  layerswitcher: "Visa",
  measurer: "Mät",
  print: "Skriv ut",
  routing: "Navigation",
  sketch: "Rita",
  location: "Positionera",
  bookmarks: "Bokmärken",
  coordinates: "Visa koordinat",
  anchor: "Dela",
  buffer: "Buffra",
  layercomparer: "Lagerjämförare",
  infodialog: "Informationsdialog",
  fir: "FIR",
  kir: "KIR",
  timeslider: "Tidslinje",
  collector: "Tyck till",
  streetview: "Gatuvy",
  fmeserver: "FME-server",
  propertychecker: "Fastighetskontroll",
  edit: "Redigera",
  search: "Sök",
};

function buildToolList(appModel) {
  if (!appModel) return [];
  return appModel
    .getPlugins()
    .filter((plugin) => plugin.type !== "commandpalette")
    .map((plugin) => ({
      type: plugin.type,
      title:
        plugin.options?.title ||
        PLUGIN_TITLES[plugin.type] ||
        plugin.type.charAt(0).toUpperCase() + plugin.type.slice(1),
      description: plugin.options?.description || "",
      icon: plugin.options?.icon || null,
      kind: "plugin",
    }));
}

function matchesQuery(item, q) {
  return (
    item.type.toLowerCase().includes(q) ||
    item.title.toLowerCase().includes(q) ||
    (item.description && item.description.toLowerCase().includes(q))
  );
}

export default function CommandPaletteView({ globalObserver, appModel }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allTools, setAllTools] = useState([]);
  const [viewMode, setViewMode] = useState("commands");
  const [layers, setLayers] = useState([]);
  const [backgroundLayers, setBackgroundLayers] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Fetch recently used tools from the plugin history
  const recentTools = useMemo(() => {
    if (!appModel) return [];
    const history = appModel.pluginHistory;
    if (!history || history.size === 0) return [];

    const recent = [];
    const entries = Array.from(history.entries()).reverse();
    for (const [type, data] of entries) {
      if (recent.length >= MAX_RECENT) break;
      const tool = allTools.find((t) => t.type === type);
      if (tool) {
        recent.push(tool);
      } else {
        recent.push({
          type,
          title: data?.title || type,
          description: data?.description || "",
          icon: data?.icon || null,
          kind: "plugin",
        });
      }
    }
    return recent;
  }, [appModel, allTools]);

  // Filter tools and commands based on what the user searched
  const filteredTools = useMemo(() => {
    if (!query.trim()) return allTools;
    const q = query.toLowerCase();
    return allTools.filter((tool) => matchesQuery(tool, q));
  }, [allTools, query]);

  const filteredRecent = useMemo(() => {
    if (!query.trim()) return recentTools;
    const q = query.toLowerCase();
    return recentTools.filter((tool) => matchesQuery(tool, q));
  }, [recentTools, query]);

  const filteredCommands = (() => {
    const commands = getCommands(appModel);
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) => matchesQuery(cmd, q));
  })();

  // Build layer list
  const buildLayerList = useCallback(() => {
    if (!appModel?.getMap) return [];
    return appModel
      .getMap()
      .getAllLayers()
      .filter(
        (l) => l.get("layerType") !== "system" && l.get("layerType") !== "base"
      )
      .map((l) => ({
        id: l.get("name"),
        caption: l.get("caption") || l.get("name"),
        visible: l.getVisible(),
        layerType: l.get("layerType"),
      }))
      .sort((a, b) => a.caption.localeCompare(b.caption, "sv"));
  }, [appModel]);

  useEffect(() => {
    // Keep the layer list live for as long as the palette is open, not just
    // while browsing the "Lager" view — the top-level view also needs fresh
    // data to match layer names directly.
    if (!open || !appModel?.getMap) return;

    const map = appModel.getMap();
    const allLayers = map.getAllLayers();

    // we need to subscribe to layer changes
    const handleChange = () => setLayers(buildLayerList());
    allLayers.forEach((l) => l.on("change:visible", handleChange));

    // initial load
    handleChange();

    return () => {
      allLayers.forEach((l) => l.un("change:visible", handleChange));
    };
  }, [open, appModel, buildLayerList]);

  const filteredLayers = useMemo(() => {
    if (!query.trim()) return layers;
    const q = query.toLowerCase();
    return layers.filter(
      (l) =>
        l.caption.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
    );
  }, [layers, query]);

  // Build background layer list
  const buildBackgroundList = useCallback(() => {
    if (!appModel?.getMap) return [];
    return appModel
      .getMap()
      .getAllLayers()
      .filter(
        (l) => l.get("layerType") === "base" && isValidLayerId(l.get("name"))
      )
      .map((l) => ({
        id: l.get("name"),
        caption: l.get("caption") || l.get("name"),
        visible: l.getVisible(),
      }));
  }, [appModel]);

  useEffect(() => {
    if (viewMode !== "backgrounds" || !appModel?.getMap) return;

    const map = appModel.getMap();
    const baseLayers = map
      .getAllLayers()
      .filter((l) => l.get("layerType") === "base");

    const handleChange = () => setBackgroundLayers(buildBackgroundList());
    baseLayers.forEach((l) => l.on("change:visible", handleChange));

    // initial load
    handleChange();

    return () => {
      baseLayers.forEach((l) => l.un("change:visible", handleChange));
    };
  }, [viewMode, appModel, buildBackgroundList]);

  const filteredBackgrounds = useMemo(() => {
    if (!query.trim()) return backgroundLayers;
    const q = query.toLowerCase();
    return backgroundLayers.filter(
      (l) =>
        l.caption.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
    );
  }, [backgroundLayers, query]);

  const presetList = useMemo(
    () => getPresetConfig(appModel)?.presetList || [],
    [appModel]
  );

  const filteredPresets = useMemo(() => {
    if (!query.trim()) return presetList;
    const q = query.toLowerCase();
    return presetList.filter((p) => p.name.toLowerCase().includes(q));
  }, [presetList, query]);

  const toggleLayer = useCallback(
    (layerId) => {
      if (!appModel?.getMap) return;
      const map = appModel.getMap();
      const layer = map.getAllLayers().find((l) => l.get("name") === layerId);
      if (!layer) return;

      const isVisible = layer.getVisible();
      const allSubLayers = layer.get("allSubLayers");

      if (allSubLayers) {
        if (isVisible) {
          layer.set("subLayers", []);
          setOLSubLayers(layer, []);
          layer.setVisible(false);
        } else {
          layer.set("subLayers", allSubLayers);
          setOLSubLayers(layer, allSubLayers);
          layer.setVisible(true);
        }
      } else {
        layer.setVisible(!isVisible);
      }
    },
    [appModel]
  );

  const switchBackgroundLayer = useCallback(
    (layerId) => {
      if (!appModel?.getMap) return;
      appModel
        .getMap()
        .getAllLayers()
        .filter((l) => l.get("layerType") === "base")
        .forEach((l) => l.setVisible(l.get("name") === layerId));

      const mapEl = document.getElementById("map");
      if (mapEl) {
        mapEl.style.backgroundColor = layerId === "-2" ? "#000" : "#fff";
      }

      globalObserver.publish("layerswitcher.backgroundLayerChanged", layerId);
    },
    [appModel, globalObserver]
  );

  // items to display in the list
  const displayItems = useMemo(() => {
    const items = [];

    if (viewMode === "commands") {
      for (const cmd of filteredCommands) {
        items.push({ ...cmd, section: "commands" });
      }
      // Match layer names directly from the top level too, so toggling a
      // layer doesn't require entering the "Lager" view first.
      if (query.trim() && filteredLayers.length > 0) {
        const topLevelLayerMatches = filteredLayers.slice(
          0,
          TOP_LEVEL_LAYER_MATCH_LIMIT
        );
        for (const layer of topLevelLayerMatches) {
          items.push({
            type: `__layer:${layer.id}`,
            title: layer.caption,
            description: "",
            icon: null,
            kind: "layer",
            layer,
            section: "layers",
          });
        }
        if (filteredLayers.length > TOP_LEVEL_LAYER_MATCH_LIMIT) {
          items.push({
            type: "__moreLayers",
            title: `Visa alla ${filteredLayers.length} lager`,
            description: "",
            icon: <LayersIcon />,
            kind: "command",
            section: "layers-more",
          });
        }
      }
      // Always offer a way to hand the typed text off to the real Search
      // tool, at the very bottom, regardless of what else matched.
      if (query.trim()) {
        items.push({
          type: "__searchInSearchTool",
          title: `Sök efter "${query.trim()}" i sökverktyget`,
          description: "",
          icon: <SearchIcon />,
          kind: "search",
        });
      }
    } else if (viewMode === "layers") {
      // layers
      if (!query.trim()) {
        items.push({ ...BACK_COMMAND, section: "back" });
      }
      for (const layer of filteredLayers) {
        items.push({
          type: `__layer:${layer.id}`,
          title: layer.caption,
          description: "",
          icon: null,
          kind: "layer",
          layer,
        });
      }
    } else if (viewMode === "backgrounds") {
      // background layers
      if (!query.trim()) {
        items.push({ ...BACK_COMMAND, section: "back" });
      }
      for (const layer of filteredBackgrounds) {
        items.push({
          type: `__background:${layer.id}`,
          title: layer.caption,
          description: "",
          icon: null,
          kind: "background",
          layer,
        });
      }
    } else if (viewMode === "presets") {
      // preset links
      if (!query.trim()) {
        items.push({ ...BACK_COMMAND, section: "back" });
      }
      filteredPresets.forEach((preset) => {
        const index = presetList.indexOf(preset);
        items.push({
          type: `__preset:${index}`,
          title: preset.name,
          description: "",
          icon: null,
          kind: "preset",
        });
      });
    } else {
      // plugins
      if (!query.trim()) {
        items.push({ ...BACK_COMMAND, section: "back" });
      }
      const recentToShow = query.trim() ? filteredRecent : recentTools;
      for (const tool of recentToShow) {
        items.push({ ...tool, section: "recent" });
      }
      const recentTypes = new Set(recentToShow.map((t) => t.type));
      for (const tool of filteredTools) {
        if (!recentTypes.has(tool.type)) {
          items.push({ ...tool, section: "all" });
        }
      }
    }

    return items;
  }, [
    viewMode,
    filteredCommands,
    filteredTools,
    filteredRecent,
    filteredLayers,
    filteredBackgrounds,
    filteredPresets,
    presetList,
    recentTools,
    query,
  ]);

  const handleQueryChange = useCallback((e) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  }, []);

  // go to the selected item when selection changes
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-command-item]");
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const openPalette = useCallback(() => {
    setAllTools(buildToolList(appModel));
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
    setViewMode("commands");
  }, [appModel]);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
    setViewMode("commands");
  }, []);

  const selectItem = useCallback(
    (type) => {
      if (type === "__openTools") {
        setViewMode("plugins");
        setQuery("");
        setSelectedIndex(0);
        return;
      }
      if (type === "__showLayers") {
        setViewMode("layers");
        setQuery("");
        setSelectedIndex(0);
        return;
      }
      if (type === "__showBackgrounds") {
        setViewMode("backgrounds");
        setQuery("");
        setSelectedIndex(0);
        return;
      }
      if (type === "__showPresets") {
        setViewMode("presets");
        setQuery("");
        setSelectedIndex(0);
        return;
      }
      if (type === "__moreLayers") {
        // Jump into the full "Lager" view, keeping the current search term
        // so the rest of the matches are immediately visible.
        setViewMode("layers");
        setSelectedIndex(0);
        return;
      }
      if (type === "__back") {
        setViewMode("commands");
        setQuery("");
        setSelectedIndex(0);
        return;
      }
      // if we are in the layers we dont want toggle to close the palette
      if (type.startsWith("__layer:")) {
        const layerId = type.slice(8);
        toggleLayer(layerId);
        return;
      }
      // switching background shouldn't close the palette either, so the
      // user can preview a few backgrounds before going back
      if (type.startsWith("__background:")) {
        const layerId = type.slice(13);
        switchBackgroundLayer(layerId);
        return;
      }
      // Presets are a one-shot navigation action, so close the palette and
      // hand off entirely to PresetLinks (via globalObserver) — it owns the
      // link parsing, fly-to, layer-swap confirmation and error handling.
      if (type.startsWith("__preset:")) {
        const index = Number(type.slice(9));
        closePalette();
        globalObserver.publish("preset.selectPreset", presetList[index]);
        return;
      }
      closePalette();
      if (type === "__toggleTheme") {
        globalObserver.publish("core.toggleTheme");
      } else if (type === "__closeAllWindows") {
        appModel.getPlugins().forEach((plugin) => {
          globalObserver.publish(`${plugin.type}.closeWindow`);
        });
      } else if (type === "__hideAllLayers") {
        appModel.clear();
      } else if (type === "__searchPolygon") {
        globalObserver.publish("search.spatialSearchActivated", {
          type: "Polygon",
        });
      } else if (type === "__searchRadius") {
        globalObserver.publish("search.spatialSearchActivated", {
          type: "Circle",
        });
      } else if (type === "__searchSelect") {
        globalObserver.publish("search.spatialSearchActivated", {
          type: "Select",
        });
      } else if (type === "__searchExtent") {
        globalObserver.publish("search.spatialSearchActivated", {
          type: "Extent",
        });
      } else if (type === "__clearSearch") {
        globalObserver.publish("search.clearSearch");
      } else if (type === "__searchInSearchTool") {
        // `query` still holds the pre-close value here — closePalette()'s
        // setQuery("") above only affects the *next* render, not this
        // closure — so this is the text the user actually typed.
        globalObserver.publish("search.setSearchPhrase", query.trim());
        globalObserver.publish("search.focusInput");
      } else {
        globalObserver.publish(`${type}.showWindow`);
        if (type === "search") {
          globalObserver.publish("search.focusInput");
        }
      }
    },
    [
      globalObserver,
      closePalette,
      appModel,
      toggleLayer,
      switchBackgroundLayer,
      presetList,
      query,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, openPalette, closePalette]);

  // navigation the menu
  const handleInputKeyDown = useCallback(
    (e) => {
      const itemCount = displayItems.length;
      if (itemCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case "Enter":
          e.preventDefault();
          if (displayItems[selectedIndex]) {
            selectItem(displayItems[selectedIndex].type);
          }
          break;
        case "Escape":
          e.preventDefault();
          if (
            viewMode === "plugins" ||
            viewMode === "layers" ||
            viewMode === "backgrounds" ||
            viewMode === "presets"
          ) {
            setViewMode("commands");
            setQuery("");
            setSelectedIndex(0);
          } else {
            closePalette();
          }
          break;
        default:
          break;
      }
    },
    [displayItems, selectedIndex, selectItem, closePalette, viewMode]
  );

  if (!open) {
    if (isMobile) return null;
    return (
      <Chip
        label={SHORTCUT_LABEL}
        size="small"
        variant="outlined"
        onClick={openPalette}
        sx={{
          position: "fixed",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: "blur(4px)",
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.secondary,
          fontWeight: 500,
          letterSpacing: 0.3,
          opacity: 0.7,
          transition: "opacity 0.15s ease",
          "&:hover": {
            opacity: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
          },
        }}
      />
    );
  }

  const kindLabel = (kind) => (
    <Typography
      variant="caption"
      sx={{
        opacity: 0.5,
        ml: "auto",
        pl: 1,
        flexShrink: 0,
      }}
    >
      {kind === "command" ? "Kommando" : "Plugin"}
    </Typography>
  );

  const listContent = [];
  let itemIndex = 0;

  if (viewMode === "commands") {
    // Commands
    if (filteredCommands.length > 0) {
      for (const cmd of filteredCommands) {
        const isSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key={cmd.type}
            data-command-item
            selected={isSelected}
            onClick={() => selectItem(cmd.type)}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            {cmd.icon && (
              <ListItemIcon sx={{ minWidth: 36 }}>{cmd.icon}</ListItemIcon>
            )}
            <ListItemText
              primary={cmd.title}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
            {kindLabel("command")}
          </ListItemButton>
        );
        itemIndex++;
      }
    }

    // Layer name matches, shown directly at the top level so toggling a
    // layer doesn't require entering the "Lager" view first.
    const showTopLevelLayerMatches = query.trim() && filteredLayers.length > 0;
    if (showTopLevelLayerMatches) {
      listContent.push(
        <Box key="layers-header" sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 500 }}>
            Lager
          </Typography>
        </Box>
      );

      const topLevelLayerMatches = filteredLayers.slice(
        0,
        TOP_LEVEL_LAYER_MATCH_LIMIT
      );
      for (const layer of topLevelLayerMatches) {
        const isSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key={`top-layer-${layer.id}`}
            data-command-item
            selected={isSelected}
            onClick={() => toggleLayer(layer.id)}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Checkbox checked={layer.visible} size="small" sx={{ p: 0 }} />
            </ListItemIcon>
            <ListItemText
              primary={layer.caption}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
          </ListItemButton>
        );
        itemIndex++;
      }

      if (filteredLayers.length > TOP_LEVEL_LAYER_MATCH_LIMIT) {
        const isMoreSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key="more-layers"
            data-command-item
            selected={isMoreSelected}
            onClick={() => selectItem("__moreLayers")}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LayersIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={`Visa alla ${filteredLayers.length} lager`}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
          </ListItemButton>
        );
        itemIndex++;
      }
    }

    // Always offer a way to hand the typed text off to the real Search
    // tool, at the very bottom, regardless of what else matched.
    const searchFallbackQuery = query.trim();
    if (searchFallbackQuery) {
      if (filteredCommands.length > 0 || showTopLevelLayerMatches) {
        listContent.push(<Divider key="search-fallback-divider" />);
      }
      const isSelected = itemIndex === selectedIndex;
      listContent.push(
        <ListItemButton
          key="search-fallback"
          data-command-item
          selected={isSelected}
          onClick={() => selectItem("__searchInSearchTool")}
          sx={{
            py: 0.5,
            "&.Mui-selected": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SearchIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={`Sök efter "${searchFallbackQuery}" i sökverktyget`}
            slotProps={{ primary: { variant: "body2", noWrap: true } }}
          />
        </ListItemButton>
      );
      itemIndex++;
    }
  } else if (viewMode === "layers") {
    // Layers view
    if (!query.trim()) {
      const isBackSelected = itemIndex === selectedIndex;
      listContent.push(
        <ListItemButton
          key={BACK_COMMAND.type}
          data-command-item
          selected={isBackSelected}
          onClick={() => selectItem(BACK_COMMAND.type)}
          sx={{
            py: 0.5,
            "&.Mui-selected": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{BACK_COMMAND.icon}</ListItemIcon>
          <ListItemText
            primary={BACK_COMMAND.title}
            slotProps={{
              primary: { variant: "body2", noWrap: true },
            }}
          />
        </ListItemButton>
      );
      itemIndex++;
      listContent.push(<Divider key="back-divider" />);
    }

    if (filteredLayers.length > 0) {
      for (const layer of filteredLayers) {
        const isSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key={layer.id}
            data-command-item
            selected={isSelected}
            onClick={() => toggleLayer(layer.id)}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Checkbox checked={layer.visible} size="small" sx={{ p: 0 }} />
            </ListItemIcon>
            <ListItemText
              primary={layer.caption}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
            <Typography
              variant="caption"
              sx={{ opacity: 0.5, ml: "auto", pl: 1, flexShrink: 0 }}
            >
              {layer.layerType === "base" ? "Bakgrund" : "Lager"}
            </Typography>
          </ListItemButton>
        );
        itemIndex++;
      }
    }

    if (displayItems.length === 0) {
      listContent.push(
        <Box key="empty" sx={{ px: 2, py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ opacity: 0.5 }}>
            Inga lager hittades
          </Typography>
        </Box>
      );
    }
  } else if (viewMode === "backgrounds") {
    // Background layers view
    if (!query.trim()) {
      const isBackSelected = itemIndex === selectedIndex;
      listContent.push(
        <ListItemButton
          key={BACK_COMMAND.type}
          data-command-item
          selected={isBackSelected}
          onClick={() => selectItem(BACK_COMMAND.type)}
          sx={{
            py: 0.5,
            "&.Mui-selected": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{BACK_COMMAND.icon}</ListItemIcon>
          <ListItemText
            primary={BACK_COMMAND.title}
            slotProps={{
              primary: { variant: "body2", noWrap: true },
            }}
          />
        </ListItemButton>
      );
      itemIndex++;
      listContent.push(<Divider key="back-divider" />);
    }

    if (filteredBackgrounds.length > 0) {
      for (const layer of filteredBackgrounds) {
        const isSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key={layer.id}
            data-command-item
            selected={isSelected}
            onClick={() => switchBackgroundLayer(layer.id)}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {layer.visible ? (
                <RadioButtonCheckedIcon fontSize="small" color="primary" />
              ) : (
                <RadioButtonUncheckedIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={layer.caption}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
          </ListItemButton>
        );
        itemIndex++;
      }
    }

    if (displayItems.length === 0) {
      listContent.push(
        <Box key="empty" sx={{ px: 2, py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ opacity: 0.5 }}>
            Inga bakgrundslager hittades
          </Typography>
        </Box>
      );
    }
  } else if (viewMode === "presets") {
    // Preset links view
    if (!query.trim()) {
      const isBackSelected = itemIndex === selectedIndex;
      listContent.push(
        <ListItemButton
          key={BACK_COMMAND.type}
          data-command-item
          selected={isBackSelected}
          onClick={() => selectItem(BACK_COMMAND.type)}
          sx={{
            py: 0.5,
            "&.Mui-selected": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{BACK_COMMAND.icon}</ListItemIcon>
          <ListItemText
            primary={BACK_COMMAND.title}
            slotProps={{
              primary: { variant: "body2", noWrap: true },
            }}
          />
        </ListItemButton>
      );
      itemIndex++;
      listContent.push(<Divider key="back-divider" />);
    }

    if (filteredPresets.length > 0) {
      for (const preset of filteredPresets) {
        const index = presetList.indexOf(preset);
        const isSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key={`preset-${index}`}
            data-command-item
            selected={isSelected}
            onClick={() => selectItem(`__preset:${index}`)}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemText
              primary={preset.name}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
          </ListItemButton>
        );
        itemIndex++;
      }
    }

    if (displayItems.length === 0) {
      listContent.push(
        <Box key="empty" sx={{ px: 2, py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ opacity: 0.5 }}>
            Inga snabbval hittades
          </Typography>
        </Box>
      );
    }
  } else {
    // Plugins
    if (!query.trim()) {
      const isBackSelected = itemIndex === selectedIndex;
      listContent.push(
        <ListItemButton
          key={BACK_COMMAND.type}
          data-command-item
          selected={isBackSelected}
          onClick={() => selectItem(BACK_COMMAND.type)}
          sx={{
            py: 0.5,
            "&.Mui-selected": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{BACK_COMMAND.icon}</ListItemIcon>
          <ListItemText
            primary={BACK_COMMAND.title}
            slotProps={{
              primary: { variant: "body2", noWrap: true },
            }}
          />
        </ListItemButton>
      );
      itemIndex++;
      listContent.push(<Divider key="back-divider" />);
    }

    // Recent
    const recentToShow = query.trim() ? filteredRecent : recentTools;
    if (recentToShow.length > 0) {
      if (query.trim()) {
        listContent.push(
          <Box key="recent-header" sx={{ px: 2, pt: 1, pb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontWeight: 500 }}
            >
              Senast använda
            </Typography>
          </Box>
        );
      }
      for (const tool of recentToShow) {
        const isSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key={tool.type}
            data-command-item
            selected={isSelected}
            onClick={() => selectItem(tool.type)}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            {tool.icon && (
              <ListItemIcon sx={{ minWidth: 36 }}>{tool.icon}</ListItemIcon>
            )}
            <ListItemText
              primary={tool.title}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
            {kindLabel("plugin")}
          </ListItemButton>
        );
        itemIndex++;
      }
      listContent.push(<Divider key="recent-divider" />);
    }

    // All plugins
    const recentTypes = new Set(recentToShow.map((t) => t.type));
    const allToolsToShow = filteredTools.filter(
      (t) => !recentTypes.has(t.type)
    );
    if (allToolsToShow.length > 0) {
      if (recentToShow.length > 0) {
        listContent.push(
          <Box key="all-header" sx={{ px: 2, pt: 1, pb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontWeight: 500 }}
            >
              Verktyg
            </Typography>
          </Box>
        );
      }
      for (const tool of allToolsToShow) {
        const isSelected = itemIndex === selectedIndex;
        listContent.push(
          <ListItemButton
            key={tool.type}
            data-command-item
            selected={isSelected}
            onClick={() => selectItem(tool.type)}
            sx={{
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "action.hover",
              },
            }}
          >
            {tool.icon && (
              <ListItemIcon sx={{ minWidth: 36 }}>{tool.icon}</ListItemIcon>
            )}
            <ListItemText
              primary={tool.title}
              slotProps={{
                primary: { variant: "body2", noWrap: true },
              }}
            />
            {kindLabel("plugin")}
          </ListItemButton>
        );
        itemIndex++;
      }
    }

    if (displayItems.length === 0) {
      listContent.push(
        <Box key="empty" sx={{ px: 2, py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ opacity: 0.5 }}>
            Inga verktyg hittades
          </Typography>
        </Box>
      );
    }
  }

  return (
    <>
      <Box
        ref={(el) => setAnchorEl(el)}
        sx={{ position: "fixed", top: 0, left: "50%", zIndex: 0 }}
      />
      {open && (
        <Popover
          open
          disableRestoreFocus
          disableEnforceFocus
          anchorEl={anchorEl}
          onClose={closePalette}
          anchorOrigin={{ horizontal: "center", vertical: "top" }}
          transformOrigin={{ horizontal: "center", vertical: "top" }}
          slotProps={{
            paper: {
              sx: {
                width: 380,
                maxHeight: 320,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                backgroundImage: "unset",
              },
            },
          }}
        >
          <TextField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            fullWidth
            variant="outlined"
            placeholder=""
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleInputKeyDown}
            inputRef={inputRef}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ArrowForwardIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 0,
                "&.Mui-focused fieldset": {
                  borderWidth: 0,
                },
              },
              "& .MuiInputBase-root": {
                height: 36,
              },
              "& .MuiInputBase-input": {
                py: "7px",
              },
            }}
          />
          <List
            ref={listRef}
            dense
            disablePadding
            sx={{
              overflow: "auto",
              flex: 1,
            }}
          >
            {listContent}
          </List>
        </Popover>
      )}
    </>
  );
}
