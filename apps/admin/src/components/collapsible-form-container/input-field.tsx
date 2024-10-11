import { useState } from "react";
import { InputFieldProps } from "./type";
import { useTranslation } from "react-i18next";
import useAppStateStore from "../../store/use-app-state-store";
import {
  TextField,
  Slider,
  Typography,
  Box,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel,
  FormControl,
  Tooltip,
  Paper,
  Checkbox,
  FormGroup,
  FormControlLabel,
  RadioGroup,
  Radio,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";

export default function InputField({
  input,
  value,
  onChange,
}: InputFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState<string>(value as string);
  const { t } = useTranslation();
  const themeMode = useAppStateStore((state) => state.themeMode);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleUrlChange = () => {
    onChange(input.key, tempUrl);
    handleDialogClose();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue: string | number = e.target.value;

    if (input.type === "NUMBER") {
      inputValue = Number(inputValue);

      if (isNaN(inputValue)) {
        inputValue = 0;
      }
    }

    onChange(input.key, inputValue);
  };
  const handleCheckboxChange = (optionKey: string, isChecked: boolean) => {
    const updatedCheckboxValues = {
      ...(value as Record<string, boolean>),
      [optionKey]: isChecked,
    };
    onChange(input.key, updatedCheckboxValues);
  };
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(input.key, e.target.value);
  };

  const handleSelectChange = (
    e: SelectChangeEvent<string | number | boolean>
  ) => {
    onChange(input.key, e.target.value);
  };

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    onChange(input.key, value);
  };

  const renderTooltip = () => {
    if (input.showToolTip) {
      return (
        <Tooltip sx={{ ml: 1 }} title={input.toolTipDescription} arrow>
          <HelpOutlineOutlinedIcon fontSize="medium" />
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "80%",
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        {(() => {
          switch (input.type) {
            case "TEXT":
            case "NUMBER":
            case "DATE":
              return (
                <>
                  <TextField
                    label={input.title}
                    type={input.type.toLowerCase()}
                    value={
                      input.type === "NUMBER" && typeof value === "number"
                        ? value
                        : value || ""
                    }
                    onChange={handleTextChange}
                    fullWidth
                    sx={{
                      "& input::-webkit-calendar-picker-indicator": {
                        filter:
                          themeMode === "light" ? "invert(0)" : "invert(1)",
                      },
                    }}
                    margin="normal"
                    slotProps={{
                      input: {
                        endAdornment: input.isUrl && (
                          <Button
                            sx={{
                              color: "mediumpurple",
                              width: "100%",
                              maxWidth: "100px",
                            }}
                            onClick={handleDialogOpen}
                            size="small"
                          >
                            {t("common.inputField.url")}
                          </Button>
                        ),
                      },
                      inputLabel:
                        input.type === "DATE" ? { shrink: true } : undefined,
                    }}
                  />
                  {input.isUrl && (
                    <Dialog
                      PaperProps={{ sx: { width: "100%" } }}
                      open={dialogOpen}
                      onClose={handleDialogClose}
                      sx={{ textAlign: "center" }}
                    >
                      <DialogTitle>Change URL</DialogTitle>
                      <DialogContent>
                        <TextField
                          label="New URL"
                          value={tempUrl}
                          onChange={(e) => setTempUrl(e.target.value)}
                          margin="normal"
                          fullWidth
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button
                          color="error"
                          variant="outlined"
                          onClick={handleDialogClose}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleUrlChange}
                          color="success"
                        >
                          Save
                        </Button>
                      </DialogActions>
                    </Dialog>
                  )}
                </>
              );

            case "CHECKBOX":
              return (
                <FormControl component="fieldset" margin="normal">
                  <Typography>{input.title}</Typography>
                  <FormGroup>
                    {input.options?.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        control={
                          <Checkbox
                            checked={Boolean(
                              (value as Record<string, boolean>)[
                                String(option.value)
                              ]
                            )}
                            onChange={(e) =>
                              handleCheckboxChange(
                                String(option.value),
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              );

            case "RADIO":
              return (
                <FormControl component="fieldset" margin="normal">
                  <Typography>{input.title}</Typography>
                  <RadioGroup value={value} onChange={handleRadioChange}>
                    {input.options?.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio />}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              );
            case "SELECT":
              return (
                <FormControl fullWidth>
                  <InputLabel>{input.title}</InputLabel>
                  <Select
                    label={input.title}
                    value={
                      typeof value === "string" || typeof value === "number"
                        ? value
                        : ""
                    }
                    onChange={handleSelectChange}
                    fullWidth
                  >
                    {input.options?.map((option) => (
                      <MenuItem key={option.key} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );

            case "SLIDER":
              return (
                <Paper elevation={4} sx={{ p: 2, borderRadius: 2, mt: 1 }}>
                  <Typography gutterBottom>{input.title}</Typography>
                  <Slider
                    sx={{ width: "100%" }}
                    value={typeof value === "number" ? value : 0}
                    min={input.min ?? 0}
                    max={input.max ?? 100}
                    step={input.step ?? 1}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                  />
                </Paper>
              );

            default:
              return null;
          }
        })()}
      </Box>
      {renderTooltip()}
    </Box>
  );
}
