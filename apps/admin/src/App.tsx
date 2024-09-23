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
          color="primary"
          variant="contained"
        >
          count is {count}
        </Button>
        <Button
          onClick={() => setCount((count) => count + 1)}
          color="secondary"
          variant="contained"
        >
          count is {count}
        </Button>
        <p>{t("common.hello")}</p>
      </div>
    </>
  );
}

export default App;
