import { Box, Chip, Typography, Stack, Tooltip, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import InfoIcon from "@mui/icons-material/Info";

interface Props {
  selectedLayers: string[];
  preSelectedLayers: string[];
  removedSelectedLayers: string[];
  isDarkMode: boolean;
  onLayerClick: (layerName: string) => void;
}

export default function DataGridBadgeButton({
  selectedLayers,
  preSelectedLayers,
  removedSelectedLayers,
  isDarkMode,
  onLayerClick,
}: Props) {
  const { t } = useTranslation();

  return (
    <Box component="div" sx={{ border: "1px solid #ccc", p: 1, mb: 1 }}>
      <Box
        sx={{
          float: "right",
        }}
      >
        <Tooltip
          slotProps={{
            tooltip: { sx: { bgcolor: isDarkMode ? "#333" : "#fff" } },
          }}
          title={
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  textAlign: "center",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {t("layers.legend")}
              </Typography>
              <Stack direction="column" spacing={1}>
                <Chip
                  label={t("availableLayers.legend.stored")}
                  color="success"
                  variant="filled"
                />
                <Chip
                  label={t("availableLayers.legend.newlySelected")}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={t("availableLayers.legend.removal")}
                  color="error"
                  variant="outlined"
                />
              </Stack>
            </Box>
          }
          arrow
        >
          <InfoIcon />
        </Tooltip>
      </Box>
      <Typography variant="body2" sx={{ mb: 1.5, ml: 1 }}>
        {t("layers.selected")}
      </Typography>

      {selectedLayers.map((item, index) => {
        const isRemoved = removedSelectedLayers.includes(item);
        return (
          <Button
            sx={{ ml: 0.5, mb: 0.5 }}
            size="small"
            key={`selected-${index}`}
            color={!isRemoved ? "error" : "success"}
            variant={!isRemoved ? "outlined" : "contained"}
            onClick={() => onLayerClick(item)}
          >
            {item}
          </Button>
        );
      })}

      {preSelectedLayers.map((item, index) => (
        <Button
          sx={{ ml: 0.5, mb: 0.5 }}
          size="small"
          key={`preselected-${index}`}
          onClick={() => onLayerClick(item)}
          color="success"
          variant="outlined"
        >
          {item}
        </Button>
      ))}
    </Box>
  );
}
