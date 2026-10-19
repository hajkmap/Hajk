import { getBackendOptions, MultiBackend } from "@minoru/react-dnd-treeview";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useIsMutating } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import {
  isSavedHere,
  LAYER_TREE_SAVE_KEY,
  useGroupTree,
  useMapLayerTree,
  type MapBackgroundLayer,
} from "../../api/layer-tree";
import { useLayers } from "../../api/layers";
import { CATALOG_DRAG_TYPE } from "./lists/types";
import LayerTreeBackground from "./layer-tree-background";
import LayerTreeCatalog from "./layer-tree-catalog";
import LayerTreeCatalogColumn from "./layer-tree-catalog-column";
import LayerTreeDrawOrder from "./layer-tree-draw-order";
import LayerTreeEditorWindow from "./layer-tree-editor-window";
import {
  completeDrawOrder,
  contentSignature,
  isLayerTreeDraftFor,
  shownLayers,
  type LayerTreeDraft,
  type LayerTreeEditorMode,
  type LayerTreeFlatNode,
} from "./layer-tree-model";
import LayerTreeMoveZoneBox from "./layer-tree-move-zone-box";
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
  savedSettingsSignature,
  settingsSignature,
  type LayerTreeSettings,
} from "./layer-tree-settings";
import { useClickPlace } from "./use-click-place";
import {
  useDraftHistory,
  type LayerTreeEditorState,
} from "./use-draft-history";
import { useLayerTreeBaseline } from "./use-layer-tree-baseline";
import { useMoveZone } from "./use-move-zone";

const EMPTY_NODES: LayerTreeFlatNode[] = [];
const EMPTY_BACKGROUND: MapBackgroundLayer[] = [];
const EMPTY_ORDER: string[] = [];

const MAP_HELP: Record<LayerTreeMapTab, string> = {
  layers: "layerTree.mapHelp",
  background: "layerTree.backgroundHelp",
  drawOrder: "layerTree.drawOrderHelp",
};

interface LayerTreeEditorProps {
  mode: LayerTreeEditorMode;
  /** The group's id in group mode, the map's name in map mode. */
  ownerId: string;
  /** Unsaved edits; the page saves them with its own save button. */
  draft: LayerTreeDraft | null;
  onDraftChange: (draft: LayerTreeDraft | null) => void;
  /** Map mode: what the map's layerswitcher shows, to look like it. */
  preview?: LayerTreePreviewOptions;
  /** Map mode: where the page shows the move zone, beside its save button. */
  moveZoneHost?: HTMLElement | null;
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
  moveZoneHost = null,
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
  // The draw order as the list shows it, layers new in the tree on top.
  const fullDrawOrder = useMemo(
    () => completeDrawOrder(layersShown, drawOrder),
    [layersShown, drawOrder],
  );
  const layerNames = useMemo(
    () => new Map(layersShown.map((layer) => [layer.id, layer.name])),
    [layersShown],
  );

  /** The draft that shows `state`: what differs from the saved tree, or none. */
  const draftFor = (state: LayerTreeEditorState): LayerTreeDraft | null => {
    if (!baseline) return null;
    const nodesChanged = contentSignature(state.nodes) !== baseline.signature;
    // Compared as they would be saved: the settings of what is in the tree,
    // and the draw order as the list shows it.
    const settingsChanged =
      mode === "map" &&
      savedSettingsSignature(state.settings, state.nodes) !==
        savedSettingsSignature(baseline.settings, baseline.nodes);
    const backgroundChanged =
      mode === "map" &&
      JSON.stringify(state.background) !== JSON.stringify(baseline.background);
    const orderChanged =
      mode === "map" &&
      state.drawOrder.join() !==
        completeDrawOrder(
          shownLayers(baseline.nodes),
          baseline.drawOrder,
        ).join();
    const changed =
      nodesChanged || settingsChanged || backgroundChanged || orderChanged;
    if (!changed) return null;
    return {
      mode,
      ownerId,
      version: activeDraft?.version ?? baseline.version,
      nodes: state.nodes,
      settings: settingsChanged ? state.settings : undefined,
      background: backgroundChanged ? state.background : undefined,
      drawOrder: orderChanged ? state.drawOrder : undefined,
    };
  };

  // Every change goes through here, so Ctrl+Z can take it back, also past a
  // save made here.
  const history = useDraftHistory({
    owner: `${mode}:${ownerId}`,
    savedVersion: baseline?.version ?? null,
    savedHere: (version) => isSavedHere(mode, ownerId, version),
    draft: activeDraft,
    onDraftChange,
    current: { nodes, settings, background, drawOrder: fullDrawOrder },
    draftFor,
    disabled: isSaving,
  });

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
    history.change(
      nodesChanged || changedSettings || changedBackground || changedOrder
        ? {
            mode,
            ownerId,
            // A draft keeps the version it was begun on, even when the tree
            // is loaded again meanwhile: the save is checked against it.
            version: activeDraft?.version ?? baseline.version,
            nodes: next.nodes,
            settings: changedSettings,
            background: changedBackground,
            drawOrder: changedOrder,
          }
        : null,
    );
  };

  const moveZoneOn = mode === "map" && moveZoneHost !== null;
  const zone = useMoveZone({
    enabled: moveZoneOn,
    ready: baseline !== null,
    mapName: ownerId,
    tab,
    nodes,
    background,
    drawOrder: fullDrawOrder,
    layerNames,
    disabled: isSaving,
    onBackgroundChange: (next) => updateDraft({ background: next }),
    onDrawOrderChange: (next) => updateDraft({ drawOrder: next }),
  });
  // Click and place is switched on in the move zone, for the tree.
  const click = useClickPlace(moveZoneOn && tab === "layers");
  const held = click.pick;

  if (query.isLoading) {
    return <CircularProgress size={24} />;
  }
  if (query.isError || !baseline) {
    return <Alert severity="error">{t("layerTree.loadFailed")}</Alert>;
  }

  const mapExceptions =
    mode === "group" ? (groupTree.data?.mapExceptions ?? []) : [];
  const groupAdditions =
    mode === "group" ? (groupTree.data?.groupAdditions ?? []) : [];

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
      {/* Where the group shows with someone else's changes to it. */}
      {mapExceptions.length > 0 || groupAdditions.length > 0 ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {mapExceptions.length > 0 ? (
            <div>
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
            </div>
          ) : null}
          {groupAdditions.length > 0 ? (
            <div>
              {t("layerTree.groupAdditionsInfo", {
                groups: groupAdditions
                  .map((entry) =>
                    t("layerTree.groupAdditionsEntry", {
                      group: entry.name,
                      count: entry.added,
                    }),
                  )
                  .join(", "),
              })}
            </div>
          ) : null}
        </Alert>
      ) : null}

      {mode === "group" || tab === "layers" ? (
        <LayerTreePanel
          mode={mode}
          rootGroupId={mode === "group" ? ownerId : undefined}
          rootGroupName={groupTree.data?.name}
          nodes={nodes}
          ownerKey={`${mode}:${ownerId}`}
          isSaving={isSaving}
          onChange={(next) => updateDraft({ nodes: next })}
          settings={mode === "map" ? settings : undefined}
          onSettingsChange={(next) => updateDraft({ settings: next })}
          frame={mode === "map" ? framed : undefined}
          showSearch={mode === "group" || preview.showFilter}
          history={history}
          moveZone={
            moveZoneOn
              ? { flagged: zone.flaggedNodeIds, onPlaced: zone.placed }
              : undefined
          }
          clickPlace={
            click.active
              ? {
                  pick: held,
                  pickCatalog: click.pickCatalog,
                  pickTree: click.pickTree,
                  clear: click.clear,
                  zoneItems: zone.items,
                  onZonePlaced: zone.placedMany,
                }
              : undefined
          }
        />
      ) : tab === "background" ? (
        <LayerTreeEditorWindow>
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
              moveZone={
                moveZoneOn
                  ? {
                      ...zone.backgroundDrop,
                      flaggedIds: zone.flaggedBackgroundIds,
                    }
                  : undefined
              }
            />,
          )}
        </LayerTreeEditorWindow>
      ) : (
        <LayerTreeEditorWindow>
          {/* Keeps the frame where it is on the other tabs. */}
          <Box sx={{ display: { xs: "none", lg: "block" } }} />
          {framed(
            <LayerTreeDrawOrder
              layers={layersShown}
              order={drawOrder}
              onChange={(next) => updateDraft({ drawOrder: next })}
              moveZone={
                moveZoneOn
                  ? {
                      ...zone.drawOrderDrop,
                      flaggedIds: zone.flaggedDrawOrderIds,
                    }
                  : undefined
              }
            />,
          )}
        </LayerTreeEditorWindow>
      )}
      {/* Inside the drag and drop context, though shown by the save button. */}
      {moveZoneOn && moveZoneHost
        ? createPortal(
            <LayerTreeMoveZoneBox
              tab={tab}
              items={zone.items}
              canAccept={zone.canAccept}
              onAccept={zone.accept}
              onRemove={zone.remove}
              clickPlace={
                tab === "layers"
                  ? {
                      on: click.active,
                      onToggle: click.toggle,
                      pickedKeys: new Set(
                        held?.source === "zone" ? held.keys : [],
                      ),
                      onPick: click.pickZone,
                      onHoldHere:
                        held && held.source !== "zone"
                          ? () => {
                              zone.hold(held);
                              click.clear();
                            }
                          : undefined,
                    }
                  : undefined
              }
            />,
            moveZoneHost,
          )
        : null}
    </DndProvider>
  );
}
