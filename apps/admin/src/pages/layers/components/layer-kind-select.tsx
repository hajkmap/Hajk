import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  LAYER_CATEGORIES,
  LAYER_CATEGORY_I18N_KEYS,
  LayerCategory,
} from "../layer-category";

interface LayerKindSelectProps {
  value: LayerCategory;
  onChange: (value: LayerCategory) => void;
  labelKey?: string;
  fullWidth?: boolean;
  minWidth?: number;
}

export default function LayerKindSelect({
  value,
  onChange,
  labelKey = "layers.layerKind",
  fullWidth = false,
  minWidth = 220,
}: LayerKindSelectProps) {
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent<LayerCategory>) => {
    onChange(event.target.value as LayerCategory);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      sx={fullWidth ? undefined : { minWidth }}
    >
      <InputLabel id="layer-kind-select-label">{t(labelKey)}</InputLabel>
      <Select
        labelId="layer-kind-select-label"
        label={t(labelKey)}
        value={value}
        onChange={handleChange}
      >
        {LAYER_CATEGORIES.map((kind) => (
          <MenuItem key={kind} value={kind}>
            {t(LAYER_CATEGORY_I18N_KEYS[kind])}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
