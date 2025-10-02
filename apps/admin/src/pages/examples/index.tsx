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
import { useState } from "react";
import Page from "../../layouts/root/components/page";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import FormAccordion from "../../components/form-components/form-accordion";
import FormSlider from "../../components/form-components/form-slider";

export default function FormComponentsExamplePage() {
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [sliderValue2, setSliderValue2] = useState<number>(25);
  const [switchOne, setSwitchOne] = useState<boolean>(true);
  const [switchTwo, setSwitchTwo] = useState<boolean>(false);
  const [checkOne, setCheckOne] = useState<boolean>(true);
  const [checkTwo, setCheckTwo] = useState<boolean>(false);
  const [radioValue, setRadioValue] = useState<string>("option1");
  return (
    <Page title="Examples">
      <FormContainer>
        <FormPanel title="Example Panel">
          <Grid container>
            <Grid size={12}>
              <Typography sx={{ mb: 1 }}>A nice piece of content</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Example Input 1" variant="outlined" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Example Input 2" variant="outlined" fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Example textarea"
                multiline
                rows={4}
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
                Accordions are great for organizing related content that can be
                collapsed and expanded.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Example Input 3" variant="outlined" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Example Input 4" variant="outlined" fullWidth />
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
                <Select
                  labelId="example-select-1-label"
                  label="Example Select 1"
                  defaultValue=""
                  displayEmpty
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value={"1"}>Option 1</MenuItem>
                  <MenuItem value={"2"}>Option 2</MenuItem>
                  <MenuItem value={"3"}>Option 3</MenuItem>
                </Select>
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
                <FormSlider
                  name="example-slider-1"
                  label="Example Slider 1"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue}
                  onChange={(v) => setSliderValue(v)}
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <FormSlider
                  name="example-slider-2"
                  label="Example Slider 2"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue2}
                  onChange={(v) => setSliderValue2(v)}
                />
              </FormControl>
            </Grid>
          </Grid>
        </FormPanel>

        <FormPanel title="Switches, Checkboxes & Radios">
          <Grid container>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={switchOne}
                      onChange={(e) => setSwitchOne(e.target.checked)}
                    />
                  }
                  label="Enable feature A"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={switchTwo}
                      onChange={(e) => setSwitchTwo(e.target.checked)}
                    />
                  }
                  label="Enable feature B"
                />
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkOne}
                      onChange={(e) => setCheckOne(e.target.checked)}
                    />
                  }
                  label="Receive notifications"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkTwo}
                      onChange={(e) => setCheckTwo(e.target.checked)}
                    />
                  }
                  label="Subscribe to newsletter"
                />
              </FormGroup>
            </Grid>
            <Grid size={12}>
              <FormControl>
                <FormLabel id="example-radiogroup-label">
                  Preferred contact
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="example-radiogroup-label"
                  name="preferred-contact"
                  value={radioValue}
                  onChange={(e) => setRadioValue(e.target.value)}
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
              </FormControl>
            </Grid>
          </Grid>
        </FormPanel>
      </FormContainer>
    </Page>
  );
}
