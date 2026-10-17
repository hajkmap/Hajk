import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import LayerTreeGroupSettingsDialog from "./layer-tree-group-settings-dialog";
import LayerTreeLayerSettingsDialog from "./layer-tree-layer-settings-dialog";
import { hiddenGroupsAbove, type LayerTreeFlatNode } from "./layer-tree-model";
import type { LayerTreeRowToggle } from "./layer-tree-row";
import {
  groupSettingsOf,
  groupToggleState,
  layerSettingsOf,
  toggleGroupVisible,
  withGroupSettings,
  withLayerSettings,
  type LayerTreeSettings,
} from "./layer-tree-settings";

/** What a row shows of the map's settings. */
export interface LayerTreeRowSettings {
  toggle?: LayerTreeRowToggle;
  active?: boolean;
  displayName?: string;
  onEditSettings?: () => void;
}

type SettingsTarget =
  | { kind: "group"; groupId: string; name: string }
  | {
      kind: "layer";
      groupId: string;
      groupName: string;
      layerId: string;
      name: string;
    };

interface UseTreeSettingsUiOptions {
  /** Map mode only; without it rows show no settings. */
  settings?: LayerTreeSettings;
  onChange: (settings: LayerTreeSettings) => void;
  nodes: LayerTreeFlatNode[];
  disabled: boolean;
}

/**
 * Map mode: the map's settings in the tree, as in Lagerordning. A box left of
 * a layer sets it visible at start; a group's box (where the group has a
 * toggle-all button) sets all its layers. In an exclusive group the layers
 * show radio buttons, a preview only, as the user picks one layer at a time.
 * The rest is in a dialog per group or layer.
 */
export function useTreeSettingsUi({
  settings,
  onChange,
  nodes,
  disabled,
}: UseTreeSettingsUiOptions): {
  rowSettings: (node: LayerTreeFlatNode) => LayerTreeRowSettings;
  dialog: ReactNode;
} {
  const { t } = useTranslation();
  const [target, setTarget] = useState<SettingsTarget | null>(null);
  // By group node: the layer node its radio preview shows picked.
  const [radioPreview, setRadioPreview] = useState<Record<string, string>>({});
  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const hiddenWith = useMemo(() => hiddenGroupsAbove(nodes), [nodes]);

  const rowSettings = (node: LayerTreeFlatNode): LayerTreeRowSettings => {
    if (!settings) return {};
    const hidden = Boolean(node.data.hidden) || hiddenWith.has(node.id);

    if (node.data.kind === "group") {
      if (node.data.cycle) return {};
      const groupId = node.data.sourceId;
      const group = groupSettingsOf(settings, groupId);
      const state = groupToggleState(settings, nodes, node.id);
      return {
        displayName: group.name ?? undefined,
        active: state === "checked",
        // As in Lagerordning: only where the group has its toggle-all button.
        toggle:
          group.toggled && !group.exclusive
            ? {
                state,
                variant: "checkbox",
                label: t("layerTree.settings.toggleGroup"),
                disabled: disabled || hidden,
                onClick: () =>
                  onChange(toggleGroupVisible(settings, nodes, node.id)),
              }
            : undefined,
        onEditSettings: disabled
          ? undefined
          : () => setTarget({ kind: "group", groupId, name: node.text }),
      };
    }

    const parent = byId.get(node.parent);
    if (parent?.data.kind !== "group") return {};
    const groupId = parent.data.sourceId;
    const layerId = node.data.sourceId;
    const layer = layerSettingsOf(settings, groupId, layerId);
    const exclusive = groupSettingsOf(settings, groupId).exclusive;
    const picked = radioPreview[parent.id] === node.id;
    return {
      active: layer.visibleAtStart,
      toggle: exclusive
        ? {
            state: picked ? "checked" : "unchecked",
            variant: "radio",
            label: t("layerTree.settings.radioPreview"),
            disabled: hidden,
            onClick: () =>
              setRadioPreview((current) => {
                const next = { ...current };
                if (picked) delete next[parent.id];
                else next[parent.id] = node.id;
                return next;
              }),
          }
        : {
            state: layer.visibleAtStart ? "checked" : "unchecked",
            variant: "checkbox",
            label: t("layerTree.settings.visibleAtStart"),
            disabled: disabled || hidden,
            onClick: () =>
              onChange(
                withLayerSettings(settings, groupId, layerId, {
                  ...layer,
                  visibleAtStart: !layer.visibleAtStart,
                }),
              ),
          },
      onEditSettings: disabled
        ? undefined
        : () =>
            setTarget({
              kind: "layer",
              groupId,
              groupName: groupSettingsOf(settings, groupId).name ?? parent.text,
              layerId,
              name: node.text,
            }),
    };
  };

  let dialog: ReactNode = null;
  if (settings && target?.kind === "group") {
    dialog = (
      <LayerTreeGroupSettingsDialog
        key={`group:${target.groupId}`}
        groupName={target.name}
        values={groupSettingsOf(settings, target.groupId)}
        onClose={() => setTarget(null)}
        onSave={(values) => {
          setTarget(null);
          onChange(withGroupSettings(settings, target.groupId, values));
        }}
      />
    );
  } else if (settings && target?.kind === "layer") {
    dialog = (
      <LayerTreeLayerSettingsDialog
        key={`layer:${target.groupId}:${target.layerId}`}
        layerName={target.name}
        groupName={target.groupName}
        values={layerSettingsOf(settings, target.groupId, target.layerId)}
        exclusive={groupSettingsOf(settings, target.groupId).exclusive}
        onClose={() => setTarget(null)}
        onSave={(values) => {
          setTarget(null);
          onChange(
            withLayerSettings(settings, target.groupId, target.layerId, values),
          );
        }}
      />
    );
  }

  return { rowSettings, dialog };
}
