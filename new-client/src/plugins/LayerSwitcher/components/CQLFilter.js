import React, { useState } from "react";
import {
  OutlinedInput,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

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
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography sx={{ flexGrow: 1, flexBasis: "20%" }} variant="subtitle2">
        Filter
      </Typography>
      <OutlinedInput
        id="cqlfilter"
        type="text"
        size="small"
        multiline
        fullWidth
        placeholder="foo='bar' AND fii='baz'"
        value={cqlFilter}
        onChange={(e) => setCqlFilter(e.target.value)}
        endAdornment={
          <InputAdornment position="end">
            <Tooltip
              disableInteractive
              title="Tryck för att ladda om lagret med angivet filter"
            >
              <IconButton edge="end" onClick={updateFilter} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        }
      />
    </Stack>
  );
};

export default CQLFilter;
