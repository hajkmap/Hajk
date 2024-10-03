import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { Grid2 as Grid } from "@mui/material";
import ThemeSwitcher from "../../components/theme-switcher";
import LanguageSwitcher from "../../components/language-switcher";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <Page title={t("common.settings")}>
      <p>
        Here is you settings
        <br />
        <br />
      </p>
      <Grid container gap={2} size={12}>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Grid>
    </Page>
  );
}
