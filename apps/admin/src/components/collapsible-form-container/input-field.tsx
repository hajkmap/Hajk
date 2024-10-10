import { InputFieldProps } from "./type";
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
} from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";

export default function InputField({
  input,
  value,
  onChange,
}: InputFieldProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(input.key, e.target.value);
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
          <HelpOutlineOutlinedIcon fontSize="small" />
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
        width: "100%",
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        {(() => {
          switch (input.type) {
            case "TEXT":
            case "NUMBER":
            case "DATE":
              return (
                <TextField
                  label={input.title}
                  type={input.type.toLowerCase()}
                  value={value}
                  onChange={handleTextChange}
                  fullWidth
                  margin="normal"
                  slotProps={
                    input.type === "DATE"
                      ? { inputLabel: { shrink: true } }
                      : undefined
                  }
                />
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
                <Paper elevation={4} sx={{ p: 2 }}>
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
