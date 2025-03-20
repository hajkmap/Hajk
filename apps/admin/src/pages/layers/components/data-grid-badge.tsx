import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  selectedLayers: string[];
  preSelectedLayers: string[];
  removedSelectedLayers: string[];
}

export default function DataGridBadge({
  selectedLayers,
  preSelectedLayers,
  removedSelectedLayers,
}: Props) {
  const { t } = useTranslation();

  return (
    <Box component="div" sx={{ border: "1px solid #ccc", p: 1, mb: 1 }}>
      <Typography variant="body2" sx={{ mb: 1, ml: 1 }}>
        {t("layers.selected")}
      </Typography>

      {selectedLayers.map((item, index) => {
        const isRemoved = removedSelectedLayers.includes(item);
        return (
          <Chip
            sx={{ ml: 0.5, mb: 0.5 }}
            size="small"
            key={`selected-${index}`}
            label={item}
            color={!isRemoved ? "error" : "success"}
            variant={!isRemoved ? "outlined" : "filled"}
          />
        );
      })}

      {preSelectedLayers.map((item, index) => (
        <Chip
          sx={{ ml: 0.5, mb: 0.5 }}
          size="small"
          key={`preselected-${index}`}
          label={item}
          color="success"
          variant="outlined"
        />
      ))}
    </Box>
  );
}
