import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useReloadLayerTree } from "../../api/layer-tree";
import DialogWrapper from "../flexible-dialog";
import type { LayerTreeEditorMode } from "./layer-tree-model";

interface LayerTreeConflictDialogProps {
  mode: LayerTreeEditorMode;
  /** The group's id in group mode, the map's name in map mode. */
  ownerId: string;
  open: boolean;
  onClose: () => void;
  /** Drops the page's draft; the saved tree is then loaded again. */
  onReload: () => void;
}

/**
 * Tells that a save of the layer tree was refused because someone else saved
 * the tree after it was loaded, and offers to load it again.
 */
export default function LayerTreeConflictDialog({
  mode,
  ownerId,
  open,
  onClose,
  onReload,
}: LayerTreeConflictDialogProps) {
  const { t } = useTranslation();
  const reloadTree = useReloadLayerTree();

  return (
    <DialogWrapper
      fullWidth
      open={open}
      title={t("layerTree.conflict.title")}
      onClose={onClose}
      actions={
        <>
          <Button variant="text" color="primary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              onReload();
              void reloadTree(mode, ownerId);
            }}
          >
            {t("layerTree.conflict.reload")}
          </Button>
        </>
      }
    >
      <Typography>
        {t(
          mode === "map"
            ? "layerTree.conflict.map"
            : "layerTree.conflict.group",
        )}
      </Typography>
    </DialogWrapper>
  );
}
