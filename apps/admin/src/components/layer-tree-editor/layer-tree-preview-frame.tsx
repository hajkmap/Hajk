import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import MapThemesTab from "../../pages/maps/components/map-themes-tab";
import DialogWrapper from "../flexible-dialog";
import type { LayerTreePreviewOptions } from "./layer-tree-preview-options";

export type LayerTreeMapTab = "layers" | "background" | "drawOrder";

interface LayerTreePreviewFrameProps {
  mapName: string;
  options: LayerTreePreviewOptions;
  tab: LayerTreeMapTab;
  onTabChange: (tab: LayerTreeMapTab) => void;
  /** Above the content, e.g. the tree's search and expand-all. */
  toolbar?: ReactNode;
  children: ReactNode;
}

/**
 * The map's tree, background and draw order framed as the client's
 * layerswitcher, as Lagerordning showed them: its tabs, and its quick access
 * with the map's themes where the layerswitcher has them.
 */
export default function LayerTreePreviewFrame({
  mapName,
  options,
  tab,
  onTabChange,
  toolbar,
  children,
}: LayerTreePreviewFrameProps) {
  const { t } = useTranslation();
  const [themesOpen, setThemesOpen] = useState(false);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {options.name
            ? t("common.layerSwitcherHierarchyTreeDescription", {
                name: options.name,
              })
            : t("layerTree.preview.noLayerswitcher")}
        </Typography>
      </Box>

      <AppBar
        position="relative"
        color="default"
        elevation={0}
        sx={{ zIndex: 1 }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => onTabChange(value as LayerTreeMapTab)}
          variant="fullWidth"
          textColor="inherit"
        >
          <Tab value="layers" label={t("layerTree.tabs.layers")} />
          <Tab value="background" label={t("layerTree.tabs.background")} />
          <Tab value="drawOrder" label={t("layerTree.tabs.drawOrder")} />
        </Tabs>
      </AppBar>

      {toolbar ? <Box sx={{ px: 2, pt: 1.25 }}>{toolbar}</Box> : null}

      {tab === "layers" && options.showQuickAccess ? (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: 1,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <StarBorderOutlinedIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
            {t("layerTree.preview.quickAccess")}
          </Typography>
          {options.enableQuickAccessPresets ? (
            <Tooltip title={t("common.themes")}>
              <IconButton
                size="small"
                aria-label={t("common.themes")}
                onClick={() => setThemesOpen(true)}
              >
                <FolderOpenOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {options.enableUserQuickAccessFavorites ? (
            <IconButton size="small" disabled>
              <PersonOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          ) : null}
          <IconButton size="small" disabled>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : null}

      {tab === "drawOrder" && !options.showDrawOrderView ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, pt: 1 }}
        >
          {t("layerTree.preview.drawOrderHidden")}
        </Typography>
      ) : null}

      <Box sx={{ p: 1 }}>{children}</Box>

      <DialogWrapper
        open={themesOpen}
        title={t("common.themes")}
        onClose={() => setThemesOpen(false)}
        fullWidth
        maxWidth="lg"
        actions={
          <Button onClick={() => setThemesOpen(false)}>
            {t("common.dialog.closeBtn")}
          </Button>
        }
      >
        {themesOpen ? <MapThemesTab mapName={mapName} /> : null}
      </DialogWrapper>
    </Box>
  );
}
