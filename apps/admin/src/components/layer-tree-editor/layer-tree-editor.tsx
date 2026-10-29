import { getBackendOptions, MultiBackend } from "@minoru/react-dnd-treeview";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useIsMutating } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import {
  isSavedHere,
  LAYER_TREE_SAVE_KEY,
  useGroupTree,
  useLatestLayerTree,
  useMapLayerTree,
  type MapBackgroundLayer,
} from "../../api/layer-tree";
import { useLayers } from "../../api/layers";
import type { Presence, PresenceResource } from "../../api/presence";
import PresenceNotice, { type PresenceShadowOf } from "../presence-notice";
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
import { layerTreeShadowRows, savedTreeShadow } from "./layer-tree-shadow";
import type { LayerTreeShadowState } from "./layer-tree-shadow-tree";
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

/** Whether a save at `at` came after the one at `than` (null: never saved). */
const isLater = (at: string, than: string | null) =>
  than === null || Date.parse(at) > Date.parse(than);

const MAP_HELP: Record<LayerTreeMapTab, string> = {
  layers: "layerTree.mapHelp",
  background: "layerTree.backgroundHelp",
  drawOrder: "layerTree.drawOrderHelp",
};

/** Who else is editing the tree, and its last save, from usePresence. */
export interface LayerTreePresence {
  resource: PresenceResource;
  data: Presence | undefined;
}

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
  /**
   * Others editing the tree, and saves made after the draft began: warned of
   * under the help text, or in map mode under the text of the frame's
   * heading. The others' unsaved tree is shown in the tree's place on request.
   */
  presence?: LayerTreePresence;
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
  presence,
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
  // When the saved tree a draft began from was saved, kept while it lasts.
  const savedAt = activeDraft
    ? activeDraft.savedAt
    : (baseline?.savedAt ?? null);
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
      nodes: state.nodes,
      settings: settingsChanged ? state.settings : undefined,
      background: backgroundChanged ? state.background : undefined,
      drawOrder: orderChanged ? state.drawOrder : undefined,
      savedAt,
    };
  };

  // Every change goes through here, so Ctrl+Z can take it back, also past a
  // save made here.
  const history = useDraftHistory({
    owner: `${mode}:${ownerId}`,
    savedAt: baseline ? baseline.savedAt : undefined,
    savedHere: (at) => isSavedHere(mode, ownerId, at),
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
            nodes: next.nodes,
            settings: changedSettings,
            background: changedBackground,
            drawOrder: changedOrder,
            savedAt,
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

  // Saved elsewhere after the draft began: saving the draft overwrites that.
  const saved = presence?.data?.saved ?? null;
  const overwrites =
    activeDraft !== null &&
    saved !== null &&
    !isSaving &&
    isLater(saved.at, activeDraft.savedAt);
  // Without a draft the tree follows the saves made elsewhere.
  const behind =
    activeDraft === null &&
    saved !== null &&
    baseline !== null &&
    isLater(saved.at, baseline.savedAt);
  const { refetch } = query;
  useEffect(() => {
    if (behind) void refetch();
  }, [behind, refetch]);

  // Someone else's tree in the tree's place on request: the unsaved one of
  // the first who edits it, or the one saved after the draft began.
  const editors = presence?.data?.editors ?? [];
  const [shadowOf, setShadowOf] = useState<PresenceShadowOf | null>(null);
  if (shadowOf === "editing" && editors.length === 0) setShadowOf(null);
  if (shadowOf === "saved" && !overwrites) setShadowOf(null);
  const editing = shadowOf === "editing" ? editors[0] : undefined;
  const latest = useLatestLayerTree(
    mode,
    ownerId,
    saved?.at ?? null,
    shadowOf === "saved",
  );
  const latestShadow = useMemo(
    () => (latest.data ? savedTreeShadow(latest.data, mode) : null),
    [latest.data, mode],
  );
  const theirs =
    shadowOf === "saved" ? latestShadow : (editing?.shadow ?? null);
  const shadowRows = useMemo(
    () =>
      theirs && baseline
        ? layerTreeShadowRows(
            {
              nodes: baseline.nodes,
              settings: mode === "map" ? baseline.settings : undefined,
            },
            theirs,
            false,
          )
        : [],
    [theirs, baseline, mode],
  );
  let shadowState: LayerTreeShadowState | undefined;
  if (shadowOf === "editing" && !editing?.shadow) shadowState = "tooBig";
  if (shadowOf === "saved" && !latestShadow) {
    shadowState = latest.isError ? "failed" : "loading";
  }

  const notice = presence ? (
    <PresenceNotice
      resource={presence.resource}
      presence={presence.data}
      shadowOf={shadowOf}
      // Theirs takes the tree's place, so only where the tree is.
      onShadowChange={
        mode === "group" || tab === "layers" ? setShadowOf : undefined
      }
      overwrites={overwrites}
      // Without the draft the tree catches up with the save (see above).
      onReload={() => onDraftChange(null)}
      sx={mode === "group" ? { mb: 1.5 } : { mt: 1 }}
    />
  ) : null;

  if (query.isLoading) {
    return <CircularProgress size={24} />;
  }
  if (query.isError || !baseline) {
    return <Alert severity="error">{t("layerTree.loadFailed")}</Alert>;
  }

  // In a map: framed as the map's layerswitcher, whose tabs switch between
  // the tree, the background and the draw order.
  const framed = (content: ReactNode, toolbar?: ReactNode) => (
    <LayerTreePreviewFrame
      mapName={ownerId}
      options={preview}
      tab={tab}
      onTabChange={setTab}
      toolbar={toolbar}
      headerExtra={notice}
    >
      {content}
    </LayerTreePreviewFrame>
  );

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t(mode === "group" ? "layerTree.groupHelp" : MAP_HELP[tab])}
      </Typography>
      {mode === "group" ? notice : null}

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
          shadow={
            shadowOf ? { rows: shadowRows, state: shadowState } : undefined
          }
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
