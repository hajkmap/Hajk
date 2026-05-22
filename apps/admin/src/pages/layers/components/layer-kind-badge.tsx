import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  LAYER_CATEGORY_I18N_KEYS,
  LayerCategory,
  normalizeLayerCategory,
} from "../layer-category";

const KIND_COLORS: Record<
  LayerCategory,
  "default" | "primary" | "secondary" | "info"
> = {
  display: "primary",
  search: "secondary",
  editing: "info",
};

interface LayerKindBadgeProps {
  layerKind?: string | null;
  size?: "small" | "medium";
}

export default function LayerKindBadge({
  layerKind,
  size = "small",
}: LayerKindBadgeProps) {
  const { t } = useTranslation();
  const category = normalizeLayerCategory(layerKind);

  return (
    <Chip
      size={size}
      color={KIND_COLORS[category]}
      label={t(LAYER_CATEGORY_I18N_KEYS[category])}
    />
  );
}
