import React, { useState } from "react";
import {
  InputLabel,
  OutlinedInput,
  IconButton,
  InputAdornment,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import HajkToolTip from "components/HajkToolTip";

const CQLFilter = ({ layer }) => {
  const source = layer.getSource();
  const currentCqlFilterValue =
    (typeof source.getParams === "function" &&
      source.getParams()?.CQL_FILTER) ||
    "";

  const [cqlFilter, setCqlFilter] = useState(currentCqlFilterValue);

  const updateFilter = () => {
    let filter = cqlFilter.trim();
    if (filter.length === 0) filter = undefined; // If length === 0, unset filter.
    layer.getSource().updateParams({ CQL_FILTER: filter });
  };

  return (
    <>
      <InputLabel htmlFor="cqlfilter">Ange CQL-filter</InputLabel>
      <OutlinedInput
        id="cqlfilter"
        type="text"
        multiline
        fullWidth
        placeholder="foo='bar' AND fii='baz'"
        value={cqlFilter}
        onChange={(e) => setCqlFilter(e.target.value)}
        endAdornment={
          <InputAdornment position="end">
            <HajkToolTip title="Tryck för att ladda om lagret med angivet filter">
              <IconButton edge="end" onClick={updateFilter} size="large">
                <RefreshIcon />
              </IconButton>
            </HajkToolTip>
          </InputAdornment>
        }
      />
    </>
  );
};

export default CQLFilter;
