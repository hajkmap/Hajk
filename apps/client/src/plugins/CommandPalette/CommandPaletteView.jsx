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
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIosRounded";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import LaunchIcon from "@mui/icons-material/Launch";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const MAX_RECENT = 5;

function getCurrentThemeMode() {
  const stored = window.localStorage.getItem("userPreferredColorScheme");
  if (stored === "light" || stored === "dark") return stored;
  return window?.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

// Initial commands to display
function getCommands() {
  const isDark = getCurrentThemeMode() === "dark";
  return [
    {
      type: "__openTools",
      title: "Öppna verktyg",
      description: "Visa alla tillgängliga verktyg",
      icon: <LaunchIcon />,
      kind: "command",
    },
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allTools, setAllTools] = useState([]);
  const [viewMode, setViewMode] = useState("commands");
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
    const commands = getCommands();
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) => matchesQuery(cmd, q));
  })();

  // Build a list of the items we want to display
  const displayItems = useMemo(() => {
    const items = [];

    if (viewMode === "commands") {
      for (const cmd of filteredCommands) {
        items.push({ ...cmd, section: "commands" });
      }
    } else {
      // Plugins, show back first, then recent plugins and lastly all plugins
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
    recentTools,
    query,
  ]);

  const handleQueryChange = useCallback((e) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-command-item]");
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Load the tools when the palette opens
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
      if (type === "__back") {
        setViewMode("commands");
        setQuery("");
        setSelectedIndex(0);
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
      } else {
        globalObserver.publish(`${type}.showWindow`);
        if (type === "search") {
          globalObserver.publish("search.focusInput");
        }
      }
    },
    [globalObserver, closePalette, appModel]
  );

  // listener for Ctrl+K or Cmd+K
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
          if (viewMode === "plugins") {
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

  if (!open) return null;

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
  let runningIndex = 0;

  if (viewMode === "commands") {
    // Commands
    if (filteredCommands.length > 0) {
      for (const cmd of filteredCommands) {
        const isSelected = runningIndex === selectedIndex;
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
        runningIndex++;
      }
    }

    if (filteredCommands.length === 0) {
      listContent.push(
        <Box key="empty" sx={{ px: 2, py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ opacity: 0.5 }}>
            Inga kommandon hittades
          </Typography>
        </Box>
      );
    }
  } else {
    // Plugins
    if (!query.trim()) {
      const isBackSelected = runningIndex === selectedIndex;
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
      runningIndex++;
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
        const isSelected = runningIndex === selectedIndex;
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
        runningIndex++;
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
        const isSelected = runningIndex === selectedIndex;
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
        runningIndex++;
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
