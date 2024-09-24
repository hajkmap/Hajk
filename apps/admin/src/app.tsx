import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";

import "./App.css";
import "./i18n";

function App() {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h2">{t("common.hello")}</Typography>
    </>
  );
}

export default App;
