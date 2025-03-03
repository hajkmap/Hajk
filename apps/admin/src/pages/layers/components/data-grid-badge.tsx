import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  selectedLayers: string[];
}

export default function DataGridBadge(props: Props) {
  const { t } = useTranslation();

  return (
    <Box component="div" sx={{ border: "1px solid #ccc", p: 1, mb: 1 }}>
      <Typography variant="body2" sx={{ mb: 1, ml: 1 }}>
        {t("layers.selected")}
      </Typography>
      {props.selectedLayers.map((item, index) => (
        <Chip
          sx={{ ml: 0.5, mb: 0.5 }}
          size="small"
          key={index}
          label={item}
          color="success"
          variant="outlined"
        />
      ))}
    </Box>
  );
}
