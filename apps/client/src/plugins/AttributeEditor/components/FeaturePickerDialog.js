import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

/**
 * Modal dialog for selecting features when multiple features overlap
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Called when dialog is closed without selection
 * @param {Function} props.onSelect - Called with array of selected feature IDs
 * @param {Array} props.features - Array of {id, feature} objects
 * @param {Array} props.fieldMeta - Field metadata for displaying properties
 */
export default function FeaturePickerDialog({
  open,
  onClose,
  onSelect,
  features = [],
  fieldMeta = [],
  handleRowHover,
  handleRowLeave,
}) {
  const [selectedIds, setSelectedIds] = React.useState(new Set());

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  const handleToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === features.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(features.map((f) => f.id)));
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedIds));
    onClose();
  };

  // Get display properties for a feature
  const getDisplayProps = (feature) => {
    const props = feature.getProperties();
    const display = [];

    // Show first 3 non-technical fields
    const excludeKeys = [
      "geometry",
      "USER_DRAWN",
      "DRAW_METHOD",
      "EDIT_ACTIVE",
      "__geom__",
      "__pending",
      "__idx",
      "__ae_style_delegate",
      "TEXT_SETTINGS",
      "@_fid",
    ];

    for (const meta of fieldMeta) {
      if (excludeKeys.includes(meta.key)) continue;
      if (meta.key.startsWith("_") || meta.key.startsWith("__")) continue;

      const value = props[meta.key];
      if (value != null && value !== "") {
        display.push({
          label: meta.label || meta.key,
          value: String(value),
        });
        if (display.length >= 3) break;
      }
    }

    return display;
  };

  const allSelected =
    selectedIds.size === features.length && features.length > 0;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < features.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="span">
            Välj objekt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {features.length} objekt överlappar
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Select All checkbox */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
              />
            }
            label={
              <Typography variant="body2" fontWeight={600}>
                Markera alla ({features.length})
              </Typography>
            }
          />
        </Box>

        {/* Feature list */}
        <List sx={{ pt: 0 }}>
          {features.map((item, idx) => {
            const { id, feature } = item;
            const props = getDisplayProps(feature);
            const isChecked = selectedIds.has(id);

            return (
              <ListItem
                key={id}
                sx={{
                  borderBottom:
                    idx < features.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                  py: 1.5,
                  px: 2,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                  bgcolor: isChecked ? "action.selected" : "transparent",
                }}
                onClick={() => handleToggle(id)}
                onMouseEnter={() => handleRowHover?.(id, false)}
                onMouseLeave={() => handleRowLeave?.()}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    sx={{ mt: -0.5, mr: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleToggle(id)}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Feature ID */}
                    <Typography variant="subtitle2" fontWeight={600}>
                      ID: {id}
                    </Typography>

                    {/* Feature properties */}
                    {props.length > 0 ? (
                      <Box sx={{ mt: 0.5 }}>
                        {props.map((prop, i) => (
                          <Typography
                            key={i}
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ fontWeight: 500, color: "text.primary" }}
                            >
                              {prop.label}:
                            </Box>{" "}
                            {prop.value}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontStyle="italic"
                        sx={{ mt: 0.5 }}
                      >
                        Inga attribut att visa
                      </Typography>
                    )}
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Avbryt
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedIds.size === 0}
          sx={{ minWidth: 120 }}
        >
          Markera {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
