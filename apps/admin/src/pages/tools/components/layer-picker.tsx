import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SortByAlphaIcon from "@mui/icons-material/SortByAlpha";
import { useTranslation } from "react-i18next";

export interface LayerPickerOption {
  id: string;
  name: string;
  secondary?: string;
}

interface LayerPickerProps {
  options: LayerPickerOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Single choice (radio) instead of several (checkbox). */
  single?: boolean;
  isLoading?: boolean;
  error?: string;
  emptyText: string;
  /** Shown under each selected layer, e.g. per-layer access groups. */
  renderSelectedDetails?: (id: string) => ReactNode;
}

/** More rows than this are not rendered; the user narrows with the search. */
const MAX_ROWS = 150;

export default function LayerPicker({
  options,
  selectedIds,
  onChange,
  single = false,
  isLoading = false,
  error,
  emptyText,
  renderSelectedDetails,
}: LayerPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [ascending, setAscending] = useState(true);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const byId = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options
      .filter(
        (option) =>
          !needle ||
          option.name.toLowerCase().includes(needle) ||
          option.secondary?.toLowerCase().includes(needle) ||
          option.id.toLowerCase().includes(needle),
      )
      .sort(
        (a, b) =>
          (ascending ? 1 : -1) *
          a.name.localeCompare(b.name, "sv", { sensitivity: "base" }),
      );
  }, [options, query, ascending]);

  if (isLoading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (options.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  const toggle = (id: string) => {
    if (single) onChange(selected.has(id) ? [] : [id]);
    else
      onChange(
        selected.has(id)
          ? selectedIds.filter((current) => current !== id)
          : [...selectedIds, id],
      );
  };
  const remove = (id: string) =>
    onChange(selectedIds.filter((current) => current !== id));

  const visible = matches.slice(0, MAX_ROWS);
  const existingSelected = selectedIds.filter((id) => byId.has(id));

  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <TextField
          size="small"
          fullWidth
          value={query}
          placeholder={t("tools.layerPicker.search")}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Tooltip title={t("tools.layerPicker.sort")}>
          <Button
            variant="outlined"
            startIcon={<SortByAlphaIcon />}
            onClick={() => setAscending((current) => !current)}
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {t(
              ascending
                ? "tools.layerPicker.ascending"
                : "tools.layerPicker.descending",
            )}
          </Button>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {visible.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: "center" }}
          >
            {t("tools.layerPicker.noMatches")}
          </Typography>
        ) : (
          <List dense disablePadding>
            {visible.map((option) => (
              <ListItemButton
                key={option.id}
                selected={selected.has(option.id)}
                onClick={() => toggle(option.id)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {single ? (
                    <Radio
                      edge="start"
                      size="small"
                      checked={selected.has(option.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  ) : (
                    <Checkbox
                      edge="start"
                      size="small"
                      checked={selected.has(option.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={option.name}
                  secondary={option.secondary}
                  slotProps={{
                    primary: { noWrap: true },
                    secondary: { noWrap: true },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
      {matches.length > MAX_ROWS ? (
        <Typography variant="caption" color="text.secondary">
          {t("tools.layerPicker.truncated", {
            shown: MAX_ROWS,
            total: matches.length,
          })}
        </Typography>
      ) : null}

      {existingSelected.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t("tools.layerPicker.selectedHeading", {
              count: existingSelected.length,
            })}
          </Typography>
          {renderSelectedDetails ? (
            <Stack spacing={1}>
              {existingSelected.map((id) => (
                <Box
                  key={id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Chip
                    label={byId.get(id)?.name}
                    color="primary"
                    variant="outlined"
                    size="small"
                    onDelete={() => remove(id)}
                    sx={{ mb: 1 }}
                  />
                  {renderSelectedDetails(id)}
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {existingSelected.map((id) => (
                <Chip
                  key={id}
                  label={byId.get(id)?.name}
                  color="primary"
                  variant="outlined"
                  size="small"
                  onDelete={() => remove(id)}
                />
              ))}
            </Box>
          )}
        </Box>
      ) : null}
    </Stack>
  );
}
