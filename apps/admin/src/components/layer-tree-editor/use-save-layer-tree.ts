import { useIsMutating } from "@tanstack/react-query";

import {
  LAYER_TREE_SAVE_KEY,
  useUpdateGroupTree,
  useUpdateMapLayerTree,
} from "../../api/layer-tree";
import {
  toGroupNested,
  toMapExceptions,
  toWriteNodes,
  type LayerTreeDraft,
} from "./layer-tree-model";
import { toMapTreeSettings } from "./layer-tree-settings";

/**
 * Saves a layer tree draft from the page's own save button. Throws with the
 * server's reason (for example a group placed inside itself) on failure.
 */
export function useSaveLayerTree() {
  const { mutateAsync: updateGroupTree } = useUpdateGroupTree();
  const { mutateAsync: updateMapTree } = useUpdateMapLayerTree();
  const isSaving = useIsMutating({ mutationKey: LAYER_TREE_SAVE_KEY }) > 0;

  const save = async (draft: LayerTreeDraft) => {
    const items = toWriteNodes(draft.nodes);
    if (draft.mode === "group") {
      await updateGroupTree({
        groupId: draft.ownerId,
        payload: { items, nested: toGroupNested(draft.nodes, draft.ownerId) },
      });
      return;
    }
    await updateMapTree({
      mapName: draft.ownerId,
      payload: {
        items,
        exceptions: toMapExceptions(draft.nodes),
        // Only what was changed is sent.
        settings: draft.settings
          ? toMapTreeSettings(draft.settings, draft.nodes)
          : undefined,
        background: draft.background?.map(
          ({ layerId, visibleAtStart, infobox }) => ({
            layerId,
            visibleAtStart,
            infobox,
          }),
        ),
        drawOrder: draft.drawOrder,
      },
    });
  };

  return { save, isSaving };
}
