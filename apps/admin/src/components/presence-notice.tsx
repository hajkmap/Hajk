import { Alert, Box, Button, type SxProps, type Theme } from "@mui/material";
import { useIsMutating } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  isSavedHere,
  LAYER_TREE_SAVE_KEY,
  useLoadedLayerTree,
  useReloadLayerTree,
} from "../api/layer-tree";
import type { Presence, PresencePart, PresenceResource } from "../api/presence";
import {
  isLayerTreeDraftFor,
  type LayerTreeDraft,
} from "./layer-tree-editor/layer-tree-model";

const PART_ORDER: PresencePart[] = ["tree", "settings", "tools", "details"];

interface PresenceNoticeProps {
  resource: PresenceResource;
  /** From the page's usePresence, which keeps running wherever this shows. */
  presence: Presence | undefined;
  /** In the tree: its warnings. By the save button: the other parts'. */
  placement: "tree" | "sidebar";
  /** The page's unsaved tree; a save is checked against its version. */
  draft: LayerTreeDraft | null;
  /** Drops the page's tree draft; the saved tree is then loaded again. */
  onReload: () => void;
  /** Spacing to what is around it; nothing is drawn when there is no news. */
  sx?: SxProps<Theme>;
}

/**
 * That another tab has unsaved changes on the same map or group, and that its
 * tree has changed since this page loaded it. Only a warning; a save of a
 * stale tree is still refused by its version check.
 */
export default function PresenceNotice({
  resource,
  presence,
  placement,
  draft,
  onReload,
  sx,
}: PresenceNoticeProps) {
  const { t, i18n } = useTranslation();
  const mode = resource.type;
  const ownerId = resource.id;
  const { data: tree } = useLoadedLayerTree(mode, ownerId);
  const reloadTree = useReloadLayerTree();
  const treeSaving = useIsMutating({ mutationKey: LAYER_TREE_SAVE_KEY }) > 0;

  if (!presence) return null;

  // The tree's changes where the tree is, the other parts' by the save button.
  const shownParts: PresencePart[] =
    placement === "tree"
      ? PART_ORDER.filter((part) => part === "tree")
      : PART_ORDER.filter((part) => part !== "tree");
  const dirtyOthers = presence.others.filter((other) =>
    other.dirty.some((part) => shownParts.includes(part)),
  );
  const parts = shownParts.filter((part) =>
    dirtyOthers.some((other) => other.dirty.includes(part)),
  );
  const names = [
    ...new Set(dirtyOthers.flatMap((other) => other.userName ?? [])),
  ];
  // Since the first of them began; with the date only if that isn't today.
  const sinceIso = dirtyOthers
    .flatMap((other) => other.dirtySince ?? [])
    .sort()[0];
  const since = sinceIso ? new Date(sinceIso) : null;

  // Against the version this page's tree comes from: the draft's, or the
  // loaded tree's. The page's own saves (running or done) don't count.
  const ownDraft = isLayerTreeDraftFor(draft, mode, ownerId) ? draft : null;
  const base = ownDraft?.version ?? tree?.version;
  const treeChanged =
    placement === "tree" &&
    !treeSaving &&
    presence.version !== null &&
    base !== undefined &&
    presence.version > base &&
    !isSavedHere(mode, ownerId, presence.version);

  if (parts.length === 0 && !treeChanged) return null;

  const list = new Intl.ListFormat(i18n.language, { type: "conjunction" });
  return (
    <Box
      sx={[
        { display: "flex", flexDirection: "column", gap: 1, textAlign: "left" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      data-presence-notice={placement}
    >
      {parts.length > 0 && (
        <Alert severity="warning" data-presence-unsaved>
          {t(`presence.unsaved.${mode}`, {
            parts: list.format(
              parts.map((part) => t(`presence.part.${mode}.${part}`)),
            ),
            since: since
              ? ` ${t(
                  since.toDateString() === new Date().toDateString()
                    ? "presence.since.today"
                    : "presence.since.date",
                  {
                    date: since.toLocaleDateString(i18n.language),
                    time: since.toLocaleTimeString(i18n.language, {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                )}`
              : "",
            who: names.length > 0 ? ` (${list.format(names)})` : "",
          })}
        </Alert>
      )}
      {treeChanged && (
        <Alert
          severity="warning"
          action={
            <Button
              variant="outlined"
              color="inherit"
              sx={{ whiteSpace: "nowrap" }}
              onClick={() => {
                onReload();
                void reloadTree(mode, ownerId);
              }}
            >
              {t("layerTree.conflict.reload")}
            </Button>
          }
          data-presence-tree-changed
        >
          {t(`presence.treeChanged.${mode}`)}
          {ownDraft ? (
            <Box component="span" sx={{ display: "block" }}>
              {t("presence.treeChangedDraft")}
            </Box>
          ) : null}
        </Alert>
      )}
    </Box>
  );
}
