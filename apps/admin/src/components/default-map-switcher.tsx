import Grid from "@mui/material/Grid";
import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDefaultMap } from "../hooks/use-default-map";

export default function DefaultMapSwitcher() {
  const { t } = useTranslation();
  const { defaultMap, setDefaultMap, maps, isLoading } = useDefaultMap();

  return (
    <Paper elevation={4} sx={{ height: 80, width: 250, mt: 2 }}>
      <Grid
        container
        sx={{
          height: "100%",
          width: "100%",
          p: 2,
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        {isLoading ? (
          <CircularProgress size={24} />
        ) : maps.length === 0 ? (
          t("common.defaultMap.noneAvailable")
        ) : (
          <FormControl variant="outlined" fullWidth>
            <InputLabel id="default-map-select-label">
              {t("common.defaultMap")}
            </InputLabel>
            <Select
              labelId="default-map-select-label"
              id="default-map-select"
              value={defaultMap ?? ""}
              onChange={(e) => {
                setDefaultMap(e.target.value);
              }}
              label={t("common.defaultMap")}
            >
              {maps.map((map) => (
                <MenuItem key={map.id} value={map.name}>
                  {map.options?.title ?? map.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Grid>
    </Paper>
  );
}
