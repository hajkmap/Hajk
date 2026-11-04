import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

function TemplateView() {
  const { t } = useTranslation();
  return <Typography variant="h5">{t("template.hello")}</Typography>;
}

export default TemplateView;
