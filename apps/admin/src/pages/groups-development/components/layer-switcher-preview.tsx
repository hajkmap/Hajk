import SearchIcon from "@mui/icons-material/Search";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import DialogWrapper from "../../../components/flexible-dialog";
import MapThemesTab from "../../maps/components/map-themes-tab";

const StyledAppBar = styled(AppBar)(() => ({
  zIndex: 1,
}));

export type LayerSwitcherPreviewTab = "layers" | "background" | "drawOrder";

interface LayerSwitcherPreviewProps {
  children: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  /** Map name used to load/save themes from the presets button. */
  mapName?: string;
  activeTab?: LayerSwitcherPreviewTab;
  onActiveTabChange?: (value: LayerSwitcherPreviewTab) => void;
  showFilter?: boolean;
  showQuickAccess?: boolean;
  showDrawOrderView?: boolean;
  enableQuickAccessPresets?: boolean;
  enableUserQuickAccessFavorites?: boolean;
}

export default function LayerSwitcherPreview({
  children,
  search,
  onSearchChange,
  mapName,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  showFilter = true,
  showQuickAccess = false,
  showDrawOrderView = true,
  enableUserQuickAccessFavorites = false,
}: LayerSwitcherPreviewProps) {
  const { t } = useTranslation();
  const [uncontrolledActiveTab, setUncontrolledActiveTab] =
    useState<LayerSwitcherPreviewTab>("layers");
  const [themesDialogOpen, setThemesDialogOpen] = useState(false);
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;

  const setActiveTab = (value: LayerSwitcherPreviewTab) => {
    onActiveTabChange?.(value);
    if (controlledActiveTab === undefined) {
      setUncontrolledActiveTab(value);
    }
  };

  const themesButton =
    mapName != null && mapName !== "" ? (
      <Tooltip title={t("common.themes")}>
        <IconButton
          size="small"
          aria-label={t("common.themes")}
          onClick={() => setThemesDialogOpen(true)}
        >
          <FolderOpenOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ) : null;

  return (
    <Box
      className="ls-layers-tab-view"
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 700,
          }}
        >
          {t("common.layerSwitcherHierarchyTree")}
        </Typography>
      </Box>

      <StyledAppBar position="relative" color="default" elevation={0}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value as LayerSwitcherPreviewTab)}
          variant="fullWidth"
          textColor="inherit"
        >
          <Tab value="layers" label={t("maps.tab.mapContent")} />
          <Tab value="background" label={t("common.usage.BACKGROUND")} />
          {showDrawOrderView ? (
            <Tab value="drawOrder" label={t("common.drawOrder")} />
          ) : null}
        </Tabs>
      </StyledAppBar>

      {activeTab === "layers" ||
      activeTab === "background" ||
      activeTab === "drawOrder" ? (
        <>
          {showFilter ? (
            <Box
              sx={{
                px: 2,
                pt: 1.25,
                pb: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <TextField
                size="small"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("common.search-layers")}
                variant="standard"
                fullWidth
                slotProps={{
                  input: {
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {!showQuickAccess && activeTab === "layers" ? themesButton : null}
            </Box>
          ) : null}

          {activeTab === "layers" && showQuickAccess ? (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderTop: "1px solid",
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <StarBorderOutlinedIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {t("groupsDevelopment.quickAccessTitle")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                {themesButton}
                {enableUserQuickAccessFavorites ? (
                  <IconButton size="small" disabled>
                    <PersonOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                <IconButton size="small" disabled>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ) : null}

          {/* Themes access when filter is hidden but quick access is off */}
          {!showFilter &&
          !showQuickAccess &&
          activeTab === "layers" &&
          themesButton ? (
            <Box sx={{ px: 2, py: 0.5, display: "flex", justifyContent: "flex-end" }}>
              {themesButton}
            </Box>
          ) : null}

          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              "& .group-layer-tree-root": {
                listStyle: "none",
                m: 0,
                p: 0,
                flex: "0 0 auto",
                minHeight: 0,
              },
              "& .group-layer-tree-item": {
                listStyle: "none",
              },
              "& .group-layer-tree-drop-target": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(144, 202, 249, 0.12)"
                    : "rgba(25, 118, 210, 0.08)",
              },
              "& .group-layer-tree-dragging": {
                opacity: 0.5,
              },
            }}
          >
            {children}
          </Box>
        </>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            {t("map.drawOrderHelp")}
          </Typography>
        </Box>
      )}

      <DialogWrapper
        open={themesDialogOpen && mapName != null && mapName !== ""}
        title={t("common.themes")}
        onClose={() => setThemesDialogOpen(false)}
        fullWidth
        maxWidth="lg"
        actions={
          <Button onClick={() => setThemesDialogOpen(false)} color="primary">
            {t("common.dialog.closeBtn")}
          </Button>
        }
      >
        {mapName ? <MapThemesTab mapName={mapName} /> : null}
      </DialogWrapper>
    </Box>
  );
}
