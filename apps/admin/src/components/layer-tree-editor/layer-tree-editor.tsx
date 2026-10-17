import { getBackendOptions, MultiBackend } from "@minoru/react-dnd-treeview";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useIsMutating } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { useTranslation } from "react-i18next";

import {
  LAYER_TREE_SAVE_KEY,
  useGroupTree,
  useMapLayerTree,
  type MapBackgroundLayer,
} from "../../api/layer-tree";
import { useLayers } from "../../api/layers";
import { CATALOG_DRAG_TYPE } from "../../pages/groups-development/types";
import LayerTreeBackground from "./layer-tree-background";
import LayerTreeCatalog from "./layer-tree-catalog";
import LayerTreeCatalogColumn from "./layer-tree-catalog-column";
import LayerTreeDrawOrder from "./layer-tree-draw-order";
import {
  contentSignature,
  isLayerTreeDraftFor,
  shownLayers,
  type LayerTreeDraft,
  type LayerTreeEditorMode,
  type LayerTreeFlatNode,
} from "./layer-tree-model";
import LayerTreePanel from "./layer-tree-panel";
import LayerTreePreviewFrame, {
  type LayerTreeMapTab,
} from "./layer-tree-preview-frame";
import {
  NO_LAYERSWITCHER,
  type LayerTreePreviewOptions,
} from "./layer-tree-preview-options";
import {
  EMPTY_SETTINGS,
  settingsSignature,
  type LayerTreeSettings,
} from "./layer-tree-settings";
import { useLayerTreeBaseline } from "./use-layer-tree-baseline";

const EMPTY_NODES: LayerTreeFlatNode[] = [];
const EMPTY_BACKGROUND: MapBackgroundLayer[] = [];
const EMPTY_ORDER: string[] = [];

const MAP_HELP: Record<LayerTreeMapTab, string> = {
  layers: "layerTree.mapHelp",
  background: "layerTree.backgroundHelp",
  drawOrder: "layerTree.drawOrderHelp",
};

/** Catalog on the left and the content on the right, as in Lagerordning. */
const COLUMNS = {
  display: "grid",
  gap: { xs: 2, lg: 3 },
  gridTemplateColumns: { xs: "1fr", lg: "minmax(220px, 280px) minmax(0, 1fr)" },
  alignItems: "start",
} as const;

interface LayerTreeEditorProps {
  mode: LayerTreeEditorMode;
  /** The group's id in group mode, the map's name in map mode. */
  ownerId: string;
  /** Unsaved edits; the page saves them with its own save button. */
  draft: LayerTreeDraft | null;
  onDraftChange: (draft: LayerTreeDraft | null) => void;
  /** Map mode: what the map's layerswitcher shows, to look like it. */
  preview?: LayerTreePreviewOptions;
}

/**
 * Edits a group's content (layers and linked groups, so a group with groups
 * in it is a layer tree), or a map: its tree of groups with the map's own
 * exceptions and settings, its background layers and its draw order, framed
 * as the map's layerswitcher.
 */
export default function LayerTreeEditor({
  mode,
  ownerId,
  draft,
  onDraftChange,
  preview = NO_LAYERSWITCHER,
}: LayerTreeEditorProps) {
  const { t } = useTranslation();
  const groupTree = useGroupTree(mode === "group" ? ownerId : "");
  const mapTree = useMapLayerTree(mode === "map" ? ownerId : "");
  const { data: catalogLayers } = useLayers();
  const query = mode === "group" ? groupTree : mapTree;
  const isSaving = useIsMutating({ mutationKey: LAYER_TREE_SAVE_KEY }) > 0;
  const [tab, setTab] = useState<LayerTreeMapTab>("layers");

  const activeDraft = isLayerTreeDraftFor(draft, mode, ownerId) ? draft : null;
  const baseline = useLayerTreeBaseline(
    mode,
    ownerId,
    query.data,
    activeDraft?.nodes,
  );
  const nodes = activeDraft?.nodes ?? baseline?.nodes ?? EMPTY_NODES;
  const settings: LayerTreeSettings =
    activeDraft?.settings ?? baseline?.settings ?? EMPTY_SETTINGS;
  const background =
    activeDraft?.background ?? baseline?.background ?? EMPTY_BACKGROUND;
  const drawOrder =
    activeDraft?.drawOrder ?? baseline?.drawOrder ?? EMPTY_ORDER;
  const layersShown = useMemo(() => shownLayers(nodes), [nodes]);
  const displayLayers = useMemo(
    () =>
      (catalogLayers ?? [])
        .filter((layer) => (layer.layerKind ?? "display") === "display")
        .map((layer) => ({ id: layer.id, name: layer.name })),
    [catalogLayers],
  );

  /** Keeps what differs from the saved state; no draft when nothing does. */
  const updateDraft = (
    changes: Partial<
      Pick<LayerTreeDraft, "nodes" | "settings" | "background" | "drawOrder">
    >,
  ) => {
    if (!baseline) return;
    const next = {
      nodes,
      settings: activeDraft?.settings,
      background: activeDraft?.background,
      drawOrder: activeDraft?.drawOrder,
      ...changes,
    };
    const nodesChanged = contentSignature(next.nodes) !== baseline.signature;
    const changedSettings =
      next.settings &&
      settingsSignature(next.settings) !== baseline.settingsSignature
        ? next.settings
        : undefined;
    const changedBackground =
      next.background &&
      JSON.stringify(next.background) !== JSON.stringify(baseline.background)
        ? next.background
        : undefined;
    const changedOrder =
      next.drawOrder && next.drawOrder.join() !== baseline.drawOrder.join()
        ? next.drawOrder
        : undefined;
    onDraftChange(
      nodesChanged || changedSettings || changedBackground || changedOrder
        ? {
            mode,
            ownerId,
            nodes: next.nodes,
            settings: changedSettings,
            background: changedBackground,
            drawOrder: changedOrder,
          }
        : null,
    );
  };

  if (query.isLoading) {
    return <CircularProgress size={24} />;
  }
  if (query.isError || !baseline) {
    return <Alert severity="error">{t("layerTree.loadFailed")}</Alert>;
  }

  const mapExceptions =
    mode === "group" ? (groupTree.data?.mapExceptions ?? []) : [];

  // In a map: framed as the map's layerswitcher, whose tabs switch between
  // the tree, the background and the draw order.
  const framed = (content: ReactNode, toolbar?: ReactNode) => (
    <LayerTreePreviewFrame
      mapName={ownerId}
      options={preview}
      tab={tab}
      onTabChange={setTab}
      toolbar={toolbar}
    >
      {content}
    </LayerTreePreviewFrame>
  );

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t(mode === "group" ? "layerTree.groupHelp" : MAP_HELP[tab])}
      </Typography>
      {mapExceptions.length > 0 ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {t("layerTree.mapExceptionsInfo", {
            maps: mapExceptions
              .map((entry) =>
                t("layerTree.mapExceptionsEntry", {
                  map: entry.mapName,
                  added: entry.added,
                  hidden: entry.hidden,
                }),
              )
              .join(", "),
          })}
        </Alert>
      ) : null}

      {mode === "group" || tab === "layers" ? (
        <LayerTreePanel
          mode={mode}
          rootGroupId={mode === "group" ? ownerId : undefined}
          nodes={nodes}
          ownerKey={`${mode}:${ownerId}`}
          isSaving={isSaving}
          onChange={(next) => updateDraft({ nodes: next })}
          settings={mode === "map" ? settings : undefined}
          onSettingsChange={(next) => updateDraft({ settings: next })}
          frame={mode === "map" ? framed : undefined}
          showSearch={mode === "group" || preview.showFilter}
        />
      ) : tab === "background" ? (
        <Box sx={COLUMNS}>
          <LayerTreeCatalogColumn>
            <LayerTreeCatalog
              offer="layer"
              // So Lagerordning's background panel takes the rows.
              dragType={CATALOG_DRAG_TYPE}
              placedKeys={
                new Set(background.map((entry) => `layer:${entry.layerId}`))
              }
              disabled={isSaving}
              onAdd={(item) =>
                updateDraft({
                  background: [
                    ...background,
                    {
                      layerId: item.id,
                      name: item.name,
                      visibleAtStart: false,
                      infobox: "",
                    },
                  ],
                })
              }
            />
          </LayerTreeCatalogColumn>
          {framed(
            <LayerTreeBackground
              background={background}
              layers={displayLayers}
              onChange={(next) => updateDraft({ background: next })}
            />,
          )}
        </Box>
      ) : (
        <Box sx={COLUMNS}>
          {/* Keeps the frame where it is on the other tabs. */}
          <Box sx={{ display: { xs: "none", lg: "block" } }} />
          {framed(
            <LayerTreeDrawOrder
              layers={layersShown}
              order={drawOrder}
              onChange={(next) => updateDraft({ drawOrder: next })}
            />,
          )}
        </Box>
      )}
    </DndProvider>
  );
}
