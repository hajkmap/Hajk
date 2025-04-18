import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Typography,
} from "@mui/material";

const PdfDownloadList = ({ pdfFiles = [], options = {} }) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());

  const menuLookup = useMemo(() => {
    const lookup = {};
    options?.menuConfig?.menu?.forEach((m) => {
      lookup[m.document] = m.title;
    });
    return lookup;
  }, [options]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pdfFiles;
    return pdfFiles.filter((f) => {
      const titleMatch = f.title.toLowerCase().includes(term);
      const menuMatch = (menuLookup[f.title]?.toLowerCase() || "").includes(
        term
      );
      return titleMatch || menuMatch;
    });
  }, [pdfFiles, search, menuLookup]);

  // --------------------------- Handlers ---------------------------
  const toggleOne = useCallback((title) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelected((prev) => new Set([...prev, ...filtered.map((f) => f.title)]));
  }, [filtered]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const downloadSelected = useCallback(() => {
    pdfFiles.forEach((file) => {
      if (selected.has(file.title)) {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${file.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  }, [pdfFiles, selected]);

  // --------------------------- Helper ---------------------------
  const toolBtn = (label, onClick, disabled = false) => (
    <Button variant="text" onClick={onClick} disabled={disabled} sx={{ mr: 1 }}>
      <Typography fontWeight="bold" textTransform="none">
        {label}
      </Typography>
    </Button>
  );

  return (
    <Box>
      <TextField
        size="small"
        placeholder="Sök…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        {toolBtn("Välj alla", selectAllFiltered, filtered.length === 0)}
        {toolBtn("Rensa val", clearSelection, selected.size === 0)}
      </Box>

      <List dense>
        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            Inga filer matchar sökningen.
          </Typography>
        )}
        {filtered.map((file) => (
          <ListItem key={file.title} disableGutters dense sx={{ py: 0 }}>
            <Checkbox
              edge="start"
              checked={selected.has(file.title)}
              onChange={() => toggleOne(file.title)}
              sx={{ mr: 1 }}
            />
            <ListItemText
              primary={`${file.title}${menuLookup[file.title] ? ` (${menuLookup[file.title]})` : ""}`}
            />
          </ListItem>
        ))}
      </List>

      <Button
        variant="contained"
        onClick={downloadSelected}
        disabled={selected.size === 0}
        sx={{ mt: 2 }}
      >
        Ladda ner markerade filer
      </Button>
    </Box>
  );
};

export default PdfDownloadList;
