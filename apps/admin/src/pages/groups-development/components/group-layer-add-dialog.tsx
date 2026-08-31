import CollectionsIcon from "@mui/icons-material/Collections";
import LayersIcon from "@mui/icons-material/Layers";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Group } from "../../../api/groups";
import type { Layer } from "../../../api/layers";
import useAppStateStore from "../../../store/use-app-state-store";
import type { CatalogDragItem } from "../types";

type AddDialogTab = "groups" | "layers";

interface GroupLayerAddDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: CatalogDragItem[]) => void;
  parentName: string;
  groups: Group[];
  layers: Layer[];
  placedGroupIds: Set<string>;
  placedLayerIds: Set<string>;
  /** Background baselayer ids — excluded from the Kartlager add list. */
  backgroundLayerIds?: Set<string>;
  /** Only these layer ids may be added (Lager-tab active FOREGROUND). */
  activeForegroundLayerIds?: Set<string> | null;
  excludeGroupSourceId?: string;
  allowLayers?: boolean;
}

export default function GroupLayerAddDialog({
  open,
  onClose,
  onConfirm,
  parentName,
  groups,
  layers,
  placedGroupIds,
  placedLayerIds,
  backgroundLayerIds,
  activeForegroundLayerIds = null,
  excludeGroupSourceId,
  allowLayers = true,
}: GroupLayerAddDialogProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const [activeTab, setActiveTab] = useState<AddDialogTab>("groups");
  const [search, setSearch] = useState("");
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const normalizedSearch = search.trim().toLowerCase();

  const availableLayers = useMemo(() => {
    if (!allowLayers) {
      return [];
    }

    return layers
      .filter(
        (layer) =>
          (layer.layerKind ?? "display") === "display" &&
          !backgroundLayerIds?.has(layer.id) &&
          (activeForegroundLayerIds == null ||
            activeForegroundLayerIds.has(layer.id)) &&
          !placedLayerIds.has(layer.id) &&
          layer.name.toLowerCase().includes(normalizedSearch),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    activeForegroundLayerIds,
    allowLayers,
    backgroundLayerIds,
    layers,
    normalizedSearch,
    placedLayerIds,
  ]);

  const availableGroups = useMemo(() => {
    return groups
      .filter(
        (group) =>
          group.id !== excludeGroupSourceId &&
          !placedGroupIds.has(group.id) &&
          group.name.toLowerCase().includes(normalizedSearch),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [excludeGroupSourceId, groups, normalizedSearch, placedGroupIds]);

  useEffect(() => {
    if (!allowLayers) {
      setActiveTab("groups");
    }
  }, [allowLayers, open]);

  const resetState = () => {
    setActiveTab("groups");
    setSelectedLayers(new Set());
    setSelectedGroups(new Set());
    setSearch("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleLayerToggle = (layerId: string) => {
    setSelectedLayers((current) => {
      const next = new Set(current);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const items: CatalogDragItem[] = [
      ...Array.from(selectedLayers).map((id) => {
        const layer = layers.find((entry) => entry.id === id);
        return {
          kind: "layer" as const,
          id,
          name: layer?.name ?? id,
        };
      }),
      ...Array.from(selectedGroups).map((id) => {
        const group = groups.find((entry) => entry.id === id);
        return {
          kind: "group" as const,
          id,
          name: group?.name ?? id,
        };
      }),
    ];

    onConfirm(items);
    resetState();
    onClose();
  };

  const selectedCount = selectedLayers.size + selectedGroups.size;
  const activeItems =
    activeTab === "groups" ? availableGroups : availableLayers;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotprops={{
        paper:{
        sx: {
            backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
          },
        },
      }}
    >
      <DialogTitle>{t("common.addItemsToGroup")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {parentName}
        </Typography>
        <TextField
          placeholder={t("common.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 1.5 }}
        />
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value as AddDialogTab)}
          sx={{
            minHeight: 36,
            mb: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTabs-indicator": {
              height: 2,
            },
            "& .MuiTab-root": {
              minHeight: 36,
              py: 0.5,
              px: 1,
              minWidth: 0,
              fontSize: "0.8125rem",
              gap: 0.5,
            },
            "& .MuiTab-icon": {
              fontSize: "1rem",
              marginBottom: "0 !important",
            },
          }}
        >
          <Tab
            icon={<CollectionsIcon />}
            iconPosition="start"
            value="groups"
            label={`${t("common.layerGroups")} (${availableGroups.length})`}
          />
          {allowLayers ? (
            <Tab
              icon={<LayersIcon />}
              iconPosition="start"
              value="layers"
              label={`${t("common.layers")} (${availableLayers.length})`}
            />
          ) : null}
        </Tabs>
        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {activeItems.length > 0 ? (
            <List dense>
              {activeTab === "groups"
                ? availableGroups.map((group) => (
                    <ListItem key={group.id} disablePadding>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedGroups.has(group.id)}
                            onChange={() => handleGroupToggle(group.id)}
                          />
                        }
                        label={group.name}
                        sx={{ width: "100%" }}
                      />
                    </ListItem>
                  ))
                : availableLayers.map((layer) => (
                    <ListItem key={layer.id} disablePadding>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedLayers.has(layer.id)}
                            onChange={() => handleLayerToggle(layer.id)}
                          />
                        }
                        label={layer.name}
                        sx={{ width: "100%" }}
                      />
                    </ListItem>
                  ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {t("common.noAvailableItemsToAdd")}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("common.cancel")}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedCount === 0}
        >
          {t("common.add")} ({selectedCount})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
