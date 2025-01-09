import Grid from "@mui/material/Grid2";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import useAppStateStore from "../store/use-app-state-store";
import { Language, LANGUAGES } from "../i18n/i18n";

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const language = useAppStateStore((state) => state.language);
  const setLanguage = useAppStateStore((state) => state.setLanguage);

  return (
    <Paper elevation={4} sx={{ height: 80, width: 250, mt: 2 }}>
      <Grid
        container
        sx={{ height: "100%", width: "100%", p: 2 }}
        justifyContent="center"
        alignContent="center"
      >
        <FormControl variant="outlined" fullWidth>
          <InputLabel id="language-select-label">
            {t("common.language")}
          </InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={language}
            onChange={(e) => {
              const selectedLanguage = e.target.value as Language;
              setLanguage(selectedLanguage);
            }}
            label={t("common.language")}
          >
            <MenuItem value={LANGUAGES.EN}>
              <Box display="flex">
                {t("common.english")}
                <Box component="img" src="/en.logo.svg" sx={{ ml: 1 }} />
              </Box>
            </MenuItem>
            <MenuItem value={LANGUAGES.SV}>
              <Box display="flex">
                {t("common.swedish")}
                <Box component="img" src="/sv.logo.svg" sx={{ ml: 1 }} />
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Paper>
  );
}
