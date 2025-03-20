import { Box, Chip, Typography, Stack, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import InfoIcon from "@mui/icons-material/Info";

interface Props {
  selectedLayers: string[];
  preSelectedLayers: string[];
  removedSelectedLayers: string[];
  isDarkMode: boolean;
}

export default function DataGridBadge({
  selectedLayers,
  preSelectedLayers,
  removedSelectedLayers,
  isDarkMode,
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
                sx={{
                  fontWeight: "bold",
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
