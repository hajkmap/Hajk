import SearchIcon from "@mui/icons-material/Search";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const StyledAppBar = styled(AppBar)(() => ({
  zIndex: 1,
}));

type PreviewTab = "layers" | "background" | "drawOrder";

interface LayerSwitcherPreviewProps {
  children: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
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
  showFilter = true,
  showQuickAccess = false,
  showDrawOrderView = true,
  enableQuickAccessPresets = false,
  enableUserQuickAccessFavorites = false,
}: LayerSwitcherPreviewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PreviewTab>("layers");

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
          onChange={(_, value) => setActiveTab(value as PreviewTab)}
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

      {activeTab === "layers" ? (
        <>
          {showFilter ? (
            <TextField
              size="small"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("common.search-layers")}
              variant="standard"
              fullWidth
              sx={{ px: 2, pt: 1.25, pb: 1 }}
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
          ) : null}

          {showQuickAccess ? (
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
                {enableQuickAccessPresets ? (
                  <IconButton size="small" disabled>
                    <FolderOpenOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
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
    </Box>
  );
}
