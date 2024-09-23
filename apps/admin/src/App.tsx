import { useState } from "react";
import { useTranslation } from "react-i18next";

import "./App.css";
import "./i18n";
import { Button } from "@mui/material";

function App() {
  const [count, setCount] = useState(0);
  const { t } = useTranslation();

  return (
    <>
      <div>
        <Button
          onClick={() => setCount((count) => count + 1)}
          sx={{ backgroundColor: (theme) => theme.palette.primary.main }}
        >
          count is {count}
        </Button>
        <p>{t("common.hello")}</p>
      </div>
    </>
  );
}

export default App;
