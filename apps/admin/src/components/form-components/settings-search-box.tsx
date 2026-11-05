import { useEffect, useState, type RefObject } from "react";
import { TextField, Typography } from "@mui/material";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { useTranslation } from "react-i18next";
import { applySettingsSearch } from "./settings-search";

/**
 * The query stays in this field. The form is filtered after a short pause,
 * directly in the DOM, so a keystroke does not re-render the settings form.
 */
export function SettingsSearchBox({
  active,
  resultsRef,
}: {
  active: boolean;
  resultsRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [empty, setEmpty] = useState(false);
  const [previousActive, setPreviousActive] = useState(active);
  // Closing the search tab drops the "no matches" message. Done while rendering
  // so the effect below only updates the DOM.
  if (active !== previousActive) {
    setPreviousActive(active);
    if (!active) setEmpty(false);
  }

  useEffect(() => {
    if (!active) {
      applySettingsSearch(resultsRef.current, "");
      return;
    }
    const id = window.setTimeout(
      () => setEmpty(applySettingsSearch(resultsRef.current, query)),
      query ? 200 : 0,
    );
    return () => window.clearTimeout(id);
  }, [active, query, resultsRef]);

  if (!active) return null;

  return (
    <>
      <TextField
        placeholder={`${t("common.searchSettings")}...`}
        fullWidth
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <ManageSearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            ),
          },
        }}
        sx={{ mb: 2 }}
      />
      {empty && (
        <Typography variant="body2" color="text.secondary" sx={{ pb: 2 }}>
          {t("common.noSettingsMatches")}
        </Typography>
      )}
    </>
  );
}
