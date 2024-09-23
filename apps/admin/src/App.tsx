import { useState } from "react";
import { useTranslation } from "react-i18next";

import "./App.css";
import "./i18n";

function App() {
  const [count, setCount] = useState(0);
  const { t } = useTranslation();

  return (
    <>
      <div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>{t("common.hello")}</p>
      </div>
    </>
  );
}

export default App;
