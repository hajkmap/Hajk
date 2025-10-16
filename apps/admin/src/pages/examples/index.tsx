import {
  Grid2 as Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import Page from "../../layouts/root/components/page";
import FormActionPanel from "../../components/form-action-panel";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import FormAccordion from "../../components/form-components/form-accordion";
import FormSlider from "../../components/form-components/form-slider";
import { FieldValues, useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SketchPicker } from "react-color";

interface ExampleFormValues extends FieldValues {
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  sliderValue: number;
  sliderValue2: number;
  switchOne: boolean;
  switchTwo: boolean;
  checkOne: boolean;
  checkTwo: boolean;
  radioValue: string;
  colorValue: string;
}

const defaultValues: ExampleFormValues = {
  text1: "",
  text2: "",
  text3: "",
  text4: "",
  text5: "",
  sliderValue: 50,
  sliderValue2: 25,
  switchOne: true,
  switchTwo: false,
  checkOne: true,
  checkTwo: false,
  radioValue: "option1",
  colorValue: "#000000",
};

export default function FormComponentsExamplePage() {
  const { t } = useTranslation();
  const { register, control, handleSubmit } = useForm<ExampleFormValues>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit = (data: ExampleFormValues) => {
    console.log("Example form submit", data);
  };

  return (
    <Page title="Examples">
      <FormActionPanel
        updateStatus="idle"
        deleteStatus="idle"
        onUpdate={() => {
          void handleSubmit(onSubmit)();
        }}
        onDelete={() => {
          /* no-op */
        }}
        lastSavedBy=""
        lastSavedDate=""
        saveButtonText={t("common.dialog.saveBtn")}
        deleteButtonText={t("common.dialog.deleteBtn")}
      >
        <FormContainer
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          noValidate={false}
        >
          <FormPanel title="Example Panel">
            <Grid container>
              <Grid size={12}>
                <Typography sx={{ mb: 1 }}>A nice piece of content</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="text1"
                  control={control}
                  rules={{
                    required: true,
                    minLength: {
                      value: 2,
                      message: "Minimum length is 2 characters.",
                    },
                    maxLength: {
                      value: 10,
                      message: "Maximum length is 10 characters.",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      label="Example Input 1"
                      fullWidth
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="text2"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Example Input 2"
                      variant="outlined"
                      fullWidth
                      {...field}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="text3"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Example textarea"
                      multiline
                      rows={4}
                      {...field}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </FormPanel>

          <FormAccordion title="Example Accordion">
            <Grid container>
              <Grid size={12}>
                <Typography sx={{ mb: 1 }}>
                  This is an example accordion content.
                </Typography>
                <Typography>
                  Accordions are great for organizing related content that can
                  be collapsed and expanded.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="text4"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Example Input 3"
                      variant="outlined"
                      fullWidth
                      {...field}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="text5"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Example Input 4"
                      variant="outlined"
                      fullWidth
                      {...field}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <FormPanel title="Example Selects">
            <Grid container>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="example-select-1-label" shrink>
                    Example Select 1
                  </InputLabel>
                  <Controller
                    name="select1"
                    control={control}
                    render={({ field }) => (
                      <Select
                        labelId="example-select-1-label"
                        label="Example Select 1"
                        defaultValue=""
                        displayEmpty
                        {...field}
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value={"1"}>Option 1</MenuItem>
                        <MenuItem value={"2"}>Option 2</MenuItem>
                        <MenuItem value={"3"}>Option 3</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="example-select-2-label" shrink>
                    Example Select 2
                  </InputLabel>
                  <Select
                    labelId="example-select-2-label"
                    label="Example Select 2"
                    defaultValue=""
                    displayEmpty
                    {...register("radioValue")}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={"A"}>Option A</MenuItem>
                    <MenuItem value={"B"}>Option B</MenuItem>
                    <MenuItem value={"C"}>Option C</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </FormPanel>

          <FormPanel title="Example Sliders">
            <Grid container>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <Controller
                    name="sliderValue"
                    control={control}
                    render={({ field }) => (
                      <FormSlider
                        label="Example Slider 1"
                        min={0}
                        max={100}
                        step={1}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <Controller
                    name="sliderValue2"
                    control={control}
                    render={({ field }) => (
                      <FormSlider
                        label="Example Slider 2"
                        min={0}
                        max={100}
                        step={1}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </FormPanel>

          <FormPanel title="Switches, Checkboxes & Radios">
            <Grid container>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormGroup>
                  <Controller
                    name="switchOne"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={(_, checked) => field.onChange(checked)}
                          />
                        }
                        label="Enable feature A"
                      />
                    )}
                  />
                  <Controller
                    name="switchTwo"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={(_, checked) => field.onChange(checked)}
                          />
                        }
                        label="Enable feature B"
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormGroup>
                  <Controller
                    name="checkOne"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Receive notifications"
                      />
                    )}
                  />
                  <Controller
                    name="checkTwo"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Subscribe to newsletter"
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
              <Grid size={12}>
                <FormControl>
                  <FormLabel id="example-radiogroup-label">
                    Preferred contact
                  </FormLabel>
                  <Controller
                    name="radioValue"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        row
                        aria-labelledby="example-radiogroup-label"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <FormControlLabel
                          value="option1"
                          control={<Radio />}
                          label="Email"
                        />
                        <FormControlLabel
                          value="option2"
                          control={<Radio />}
                          label="SMS"
                        />
                        <FormControlLabel
                          value="option3"
                          control={<Radio />}
                          label="Phone"
                        />
                      </RadioGroup>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </FormPanel>
          <FormPanel title="Example Color Picker">
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <Controller
                  name="colorValue"
                  control={control}
                  render={({ field }) => (
                    <SketchPicker
                      color={field.value}
                      onChange={(color) => field.onChange(color.hex)}
                    />
                  )}
                />
              </FormControl>
            </Grid>
          </FormPanel>
        </FormContainer>
      </FormActionPanel>
    </Page>
  );
}
