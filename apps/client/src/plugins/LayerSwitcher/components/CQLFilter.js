import React, { useState, useEffect } from "react";
import {
  OutlinedInput,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddBoxIcon from "@mui/icons-material/AddBox";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import Tooltip from "@mui/material/Tooltip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import HajkToolTip from "components/HajkToolTip";

export default function CQLFilter({ layer }) {
  const operatorOptions = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "ILIKE"];
  const [cqlFilter, setCqlFilter] = useState("");
  const [fieldNames, setFieldNames] = useState([]);

  useEffect(() => {
    const source = layer?.getSource();
    getFieldNames(layer).then(setFieldNames);
    console.log(getFieldNames(layer));
    const currentCqlFilterValue =
      (typeof source?.getParams === "function" &&
        source?.getParams()?.CQL_FILTER) ||
      "";
    setCqlFilter(currentCqlFilterValue);
  }, [layer]);

  const getFieldNames = async (layer) => {
    const source = layer.getSource();
    if (!source) return [];

    // --- Get URL whether source is TileWMS or ImageWMS ---
    let wmsUrl = null;

    if (typeof source.getUrls === "function") {
      const urls = source.getUrls();
      wmsUrl = urls && urls.length > 0 ? urls[0] : null;
    } else if (typeof source.getUrl === "function") {
      wmsUrl = source.getUrl();
    }

    if (!wmsUrl) {
      console.error("Unable to determine WMS URL");
      return [];
    }

    const typeName = source.getParams().LAYERS;

    // Convert WMS url to WFS
    let wfsUrl;
    if (wmsUrl.includes("/wms")) {
      wfsUrl = wmsUrl.replace(/\/wms.*/, "/wfs");
    } else if (wmsUrl.includes("/ows")) {
      wfsUrl = wmsUrl.replace(/\/ows.*/, "/ows");
    } else {
      console.error("Could not derive WFS URL from:", wmsUrl);
      return [];
    }

    const describeUrl = `${wfsUrl}?service=WFS&version=1.1.0&request=DescribeFeatureType&typename=${typeName}`;

    // try to get the field names

    try {
      const response = await fetch(describeUrl);
      const text = await response.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");

      const elements =
        xml.getElementsByTagName("xsd:element").length > 0
          ? xml.getElementsByTagName("xsd:element")
          : xml.getElementsByTagName("element");

      const fields = [];
      for (let i = 0; i < elements.length; i++) {
        const name = elements[i].getAttribute("name");
        fields.push(name);
      }

      return fields;
    } catch (err) {
      console.error("DescribeFeatureType error:", err);
      return [];
    }
  };

  const updateFilter = () => {
    let filter = cqlFilter.trim();
    if (filter.length === 0) filter = undefined;
    layer?.getSource().updateParams({ CQL_FILTER: filter });
  };

  const [rows, setRows] = useState([
    {
      open: false,
      field: "",
      operator: "=",
      value: "",
      logic: "AND",
      close: false,
    },
  ]);

  // Build CQL string from rows
  const buildCQL = (rows) => {
    return rows
      .map((r, i) => {
        if (!r.field || !r.operator || !r.value) return "";
        let part = "";
        if (r.open) part += "(";
        part += `${r.field} ${r.operator} '${r.value}'`;
        if (r.close) part += ")";
        if (i > 0) part = `${r.logic} ${part}`;
        return part;
      })
      .join(" ");
  };

  // Update row + sync text field
  const updateRow = (i, key, val) => {
    const updated = [...rows];
    updated[i][key] = val;
    setRows(updated);
    setCqlFilter(buildCQL(updated));
  };

  // Toggle bracket
  const toggleRow = (i, key) => {
    const updated = [...rows];
    updated[i][key] = !updated[i][key];
    setRows(updated);
    setCqlFilter(buildCQL(updated));
  };

  // Add row
  const addRow = () => {
    const updated = [
      ...rows,
      {
        open: false,
        field: "",
        operator: "=",
        value: "",
        logic: "AND",
        close: false,
      },
    ];
    setRows(updated);
    setCqlFilter(buildCQL(updated));
  };

  // Remove row
  const removeRow = (i) => {
    const updated = rows.filter((_, idx) => idx !== i);
    setRows(updated);
    setCqlFilter(buildCQL(updated));
  };

  return (
    <Stack spacing={1}>
      <Typography sx={{ flexGrow: 1, flexBasis: "25%" }} variant="subtitle2">
        Attributbaserad filtrering
      </Typography>
      {/* --- Row Builder UI --- */}
      {rows.map((row, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center">
          {/* AND/OR connector */}
          {i > 0 && (
            <IconButton
              size="small"
              onClick={() =>
                updateRow(i, "logic", row.logic === "AND" ? "OR" : "AND")
              }
              sx={(theme) => ({
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.action.selected,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
                color: theme.palette.text.primary,
                fontSize: "0.75rem",
                width: 40,
                height: 28,
                borderRadius: 0,
              })}
            >
              {row.logic}
            </IconButton>
          )}

          {/* ( toggle */}

          <Tooltip title="Lägg till/ta bort vänsterparentes">
            <IconButton
              size="small"
              onClick={() => toggleRow(i, "open")}
              sx={(theme) => ({
                position: "relative",
                width: 20,
                height: 28,
                borderRadius: 0,
                border: `1px solid ${theme.palette.divider}`,

                backgroundColor: row.open
                  ? theme.palette.primary.dark
                  : theme.palette.action.hover,

                color: row.open
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,

                "&:hover": {
                  backgroundColor: row.open
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                  border: `1px solid ${theme.palette.divider}`,
                },
              })}
            >
              (
            </IconButton>
          </Tooltip>

          {/* Select or write field name in case field names cannot be accessed */}
          {fieldNames.length > 0 ? (
            <Select
              size="small"
              value={row.field}
              onChange={(e) => updateRow(i, "field", e.target.value)}
              displayEmpty
              sx={{ height: 30, width: "30%" }}
            >
              <MenuItem value="">
                <em>Välj fältnamn</em>
              </MenuItem>

              {fieldNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <OutlinedInput
              size="small"
              value={row.field}
              placeholder="Fältnamn..."
              onChange={(e) => updateRow(i, "field", e.target.value)}
              sx={{ height: 30, width: "30%" }}
            />
          )}

          {/* Select operator */}
          <Tooltip title="Växla mellan AND/OR-operatorn">
            <Select
              value={row.operator}
              onChange={(e) => updateRow(i, "operator", e.target.value)}
              size="small"
              sx={{ height: 32 }}
            >
              {operatorOptions.map((op) => (
                <MenuItem key={op} value={op}>
                  {op}
                </MenuItem>
              ))}
            </Select>
          </Tooltip>

          {/* Value input */}
          <OutlinedInput
            style={{ height: 30, width: "30%" }}
            value={row.value}
            placeholder="Värde..."
            onChange={(e) => updateRow(i, "value", e.target.value)}
          ></OutlinedInput>

          {/* ) toggle */}
          <Tooltip title="Lägg till/ta bort högerparentes">
            <IconButton
              size="small"
              onClick={() => toggleRow(i, "close")}
              disableRipple
              disableFocusRipple
              sx={(theme) => ({
                border: `1px solid ${theme.palette.divider}`,
                width: 20,
                height: 28,
                borderRadius: 0,

                backgroundColor: row.close
                  ? theme.palette.primary.dark
                  : theme.palette.action.hover,

                color: row.close
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,

                "&:hover": {
                  backgroundColor: row.close
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                  border: `1px solid ${theme.palette.divider}`,
                },
              })}
            >
              )
            </IconButton>
          </Tooltip>

          {/* Remove row */}
          {i > 0 && (
            <Tooltip title="Ta bort det här villkor">
              <IconButton
                size="small"
                color="error"
                onClick={() => removeRow(i)}
              >
                <RemoveCircleIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ))}

      {/* Add row */}
      <Tooltip title="Lägg till ett villkor">
        <IconButton
          size="small"
          color="primary"
          onClick={addRow}
          sx={{ width: 32, height: 32 }}
        >
          <AddBoxIcon />
        </IconButton>
      </Tooltip>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Typography sx={{ flexGrow: 1, flexBasis: "25%" }} variant="subtitle2">
          Filtreringstillstånd
        </Typography>

        <OutlinedInput
          id="cqlfilter"
          type="text"
          size="small"
          multiline
          fullWidth
          placeholder={buildCQL(rows)}
          value={cqlFilter}
          onChange={(e) => setCqlFilter(e.target.value)}
          endAdornment={
            <InputAdornment position="end">
              <HajkToolTip
                disableInteractive
                title="Tryck för att ladda om lagret med angivet filter"
              >
                <IconButton edge="end" onClick={updateFilter} size="small">
                  <RefreshIcon />
                </IconButton>
              </HajkToolTip>
            </InputAdornment>
          }
        />
      </Stack>
    </Stack>
  );
}
