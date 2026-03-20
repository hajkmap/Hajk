import React, { useState, useEffect } from "react";
import {
  OutlinedInput,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddBoxIcon from "@mui/icons-material/AddBox";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import HajkToolTip from "components/HajkToolTip";

export default function CQLFilter({ layer }) {
  const operatorOptions = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "ILIKE"];
  const [fieldNames, setFieldNames] = useState([]);
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
  const [cqlFilter, setCqlFilter] = useState("");

  const disabled = !layer?.getVisible();

  // Fetch field names from Map server if layer is enabled

  useEffect(() => {
    if (!layer || disabled) return;

    let isActive = true;
    getFieldNames(layer).then((fields) => {
      if (isActive) setFieldNames(fields);
    });
    return () => {
      isActive = false;
    };
  }, [layer, disabled]);

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

    let wfsUrl = wmsUrl.includes("/wms")
      ? wmsUrl.replace(/\/wms.*/, "/wfs")
      : wmsUrl.includes("/ows")
        ? wmsUrl.replace(/\/ows.*/, "/ows")
        : null;
    if (!wfsUrl) return [];

    const describeUrl = `${wfsUrl}?service=WFS&version=1.1.0&request=DescribeFeatureType&typename=${typeName}`;

    // try to get the field names, otherwise return empty array

    try {
      const response = await fetch(describeUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const elements = xml.getElementsByTagName("xsd:element").length
        ? xml.getElementsByTagName("xsd:element")
        : xml.getElementsByTagName("element");
      const fields = Array.from(elements).map((el) => el.getAttribute("name"));
      return fields;
    } catch (err) {
      console.error("DescribeFeatureType error:", err);
      return [];
    }
  };

  // Parse CQL into rows

  useEffect(() => {
    if (!layer) return;
    const source = layer.getSource?.();
    const activeCQL = source?.getParams?.()?.CQL_FILTER || "";
    setCqlFilter(activeCQL);

    if (activeCQL.trim()) {
      try {
        const parsedRows = parseCQL(activeCQL);
        if (parsedRows.length) setRows(parsedRows);
      } catch (err) {
        console.warn("Failed to parse CQL filter, using empty rows.", err);
      }
    }
  }, [layer]);

  // Parce CQL filter

  const parseCQL = (cql) => {
    if (!cql || !cql.trim()) return [];
    const regex =
      /\(|\)|AND|OR|(\w+)\s*(=|!=|>|<|>=|<=|LIKE|ILIKE)\s*('([^']*)'|[0-9.]+)/gi;
    const matches = [...cql.matchAll(regex)];
    if (!matches.length) return [];

    const parsed = [];
    let lastLogic = "AND";
    const stack = [];

    matches.forEach((t) => {
      const token = t[0].trim();
      if (!token) return;

      if (token === "(") {
        stack.push(parsed.length);
      } else if (token === ")") {
        if (stack.length > 0) {
          const idx = stack.pop();
          if (parsed[idx]) parsed[idx].close = true;
        }
      } else if (
        token.toUpperCase() === "AND" ||
        token.toUpperCase() === "OR"
      ) {
        lastLogic = token.toUpperCase();
      } else {
        const m = token.match(
          /(\w+)\s*(=|!=|>|<|>=|<=|LIKE|ILIKE)\s*('([^']*)'|[0-9.]+)/i
        );
        if (m) {
          parsed.push({
            open: stack.length > 0,
            field: m[1],
            operator: m[2],
            value: m[4] ?? m[3],
            logic: parsed.length === 0 ? "" : lastLogic,
            close: false,
          });
        }
      }
    });

    return parsed;
  };

  // Build CQL string from rows

  const buildCQL = (rows) => {
    return rows
      .filter((r) => r.field && r.operator && r.value)
      .map((r, i) => {
        let part = "";
        if (r.open) part += "(";
        const isNumber = !isNaN(r.value);
        const safeValue = r.value.replace(/'/g, "''");
        part += isNumber
          ? `${r.field} ${r.operator} ${r.value}`
          : `${r.field} ${r.operator} '${safeValue}'`;
        if (r.close) part += ")";
        if (i > 0 && r.logic) part = `${r.logic} ${part}`;
        return part;
      })
      .join(" ");
  };

  // Update GeoServer CQL Filter

  const updateFilter = () => {
    if (disabled) return;
    const filter = cqlFilter.trim() || undefined;
    const source = layer?.getSource?.();
    if (source?.updateParams) source.updateParams({ CQL_FILTER: filter });
  };

  // Row handlers

  const updateRow = (i, key, val) => {
    if (disabled) return;
    const updated = [...rows];
    updated[i][key] = val;
    setRows(updated);
    setCqlFilter(buildCQL(updated));
  };
  const toggleRow = (i, key) => {
    if (disabled) return;
    const updated = [...rows];
    updated[i][key] = !updated[i][key];
    setRows(updated);
    setCqlFilter(buildCQL(updated));
  };
  const addRow = () => {
    if (disabled) return;
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
  const removeRow = (i) => {
    if (disabled) return;
    const updated = rows.filter((_, idx) => idx !== i);
    setRows(updated);
    setCqlFilter(buildCQL(updated));
  };

  // Render

  return (
    <Stack spacing={1}>
      <Typography sx={{ flexGrow: 1, flexBasis: "25%" }} variant="subtitle2">
        Attributbaserad filtrering
      </Typography>

      {rows.map((row, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center">
          {i > 0 && (
            <IconButton
              size="small"
              onClick={() =>
                updateRow(i, "logic", row.logic === "AND" ? "OR" : "AND")
              }
              disabled={disabled}
              sx={(theme) => ({
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: disabled
                  ? theme.palette.action.disabledBackground
                  : theme.palette.action.selected,
                color: disabled
                  ? theme.palette.text.disabled
                  : theme.palette.text.primary,
                fontSize: "0.75rem",
                width: 40,
                height: 28,
                borderRadius: 0,
                "&:hover": {
                  backgroundColor: disabled
                    ? theme.palette.action.disabledBackground
                    : theme.palette.action.hover,
                },
              })}
            >
              {row.logic}
            </IconButton>
          )}

          {/* ( toggle */}
          <Tooltip title="Lägg till/ta bort vänsterparentes">
            <span>
              <IconButton
                size="small"
                onClick={() => toggleRow(i, "open")}
                disabled={disabled}
                sx={(theme) => ({
                  position: "relative",
                  width: 20,
                  height: 28,
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: row.open
                    ? theme.palette.primary.dark
                    : disabled
                      ? theme.palette.action.disabledBackground
                      : theme.palette.action.hover,
                  color: row.open
                    ? theme.palette.primary.contrastText
                    : disabled
                      ? theme.palette.text.disabled
                      : theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: row.open
                      ? theme.palette.primary.dark
                      : disabled
                        ? theme.palette.action.disabledBackground
                        : theme.palette.action.hover,
                    border: `1px solid ${theme.palette.divider}`,
                  },
                })}
              >
                (
              </IconButton>
            </span>
          </Tooltip>

          {/* Select or write field name in case field names cannot be accessed */}
          {fieldNames.length > 0 ? (
            <Select
              size="small"
              value={row.field}
              onChange={(e) => updateRow(i, "field", e.target.value)}
              displayEmpty
              disabled={disabled}
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
              disabled={disabled}
              sx={{ height: 30, width: "30%" }}
            />
          )}

          {/* Select operator */}
          <Select
            value={row.operator}
            onChange={(e) => updateRow(i, "operator", e.target.value)}
            size="small"
            disabled={disabled}
            sx={{ height: 32 }}
          >
            {operatorOptions.map((op) => (
              <MenuItem key={op} value={op}>
                {op}
              </MenuItem>
            ))}
          </Select>

          {/* Value input */}
          <OutlinedInput
            style={{ height: 30, width: "30%" }}
            value={row.value}
            placeholder="Värde..."
            onChange={(e) => updateRow(i, "value", e.target.value)}
            disabled={disabled}
          />

          {/* ) toggle */}
          <Tooltip title="Lägg till/ta bort högerparentes">
            <span>
              <IconButton
                size="small"
                onClick={() => toggleRow(i, "close")}
                disabled={disabled}
                disableRipple
                disableFocusRipple
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.divider}`,
                  width: 20,
                  height: 28,
                  borderRadius: 0,
                  backgroundColor: row.close
                    ? theme.palette.primary.dark
                    : disabled
                      ? theme.palette.action.disabledBackground
                      : theme.palette.action.hover,
                  color: row.close
                    ? theme.palette.primary.contrastText
                    : disabled
                      ? theme.palette.text.disabled
                      : theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: row.close
                      ? theme.palette.primary.dark
                      : disabled
                        ? theme.palette.action.disabledBackground
                        : theme.palette.action.hover,
                    border: `1px solid ${theme.palette.divider}`,
                  },
                })}
              >
                )
              </IconButton>
            </span>
          </Tooltip>

          {/* Remove row */}
          {i > 0 && (
            <Tooltip title="Ta bort det här villkor">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeRow(i)}
                  disabled={disabled}
                >
                  <RemoveCircleIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      ))}

      {/* Add row */}
      <Tooltip title="Lägg till ett villkor">
        <span>
          <IconButton
            size="small"
            color="primary"
            onClick={addRow}
            disabled={disabled}
            sx={{ width: 32, height: 32 }}
          >
            <AddBoxIcon />
          </IconButton>
        </span>
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
          disabled={disabled}
          endAdornment={
            <InputAdornment position="end">
              <HajkToolTip title="Tryck för att ladda om lagret med angivet filter">
                <span>
                  <IconButton
                    edge="end"
                    onClick={updateFilter}
                    size="small"
                    disabled={disabled}
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </HajkToolTip>
            </InputAdornment>
          }
        />
      </Stack>
    </Stack>
  );
}
