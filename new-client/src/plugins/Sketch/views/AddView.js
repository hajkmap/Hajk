import React from "react";
import {
  Grid,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import Dialog from "../../../components/Dialog/Dialog";
import DrawTypeSelector from "../components/DrawTypeSelector";
import Information from "../components/Information";
import FeatureStyleSelector from "../components/featureStyle/FeatureStyleSelector";
import FeatureTextSetter from "../components/FeatureTextSetter";

const AddView = (props) => {
  // Let's destruct some properties from the props
  const { model, activeDrawType, setActiveDrawType, localObserver, drawModel } =
    props;
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(props.id);

  const [selectedFeatures, setSelectedFeatures] = React.useState([]);
  const handleSelectClick = React.useCallback((clickedFeatures) => {
    setSelectedFeatures(clickedFeatures);
  }, []);

  const [selectedValue, setSelectedValue] = React.useState("");

  React.useEffect(() => {
    localObserver.subscribe("drawModel.select.click", handleSelectClick);
    return () => {
      localObserver.unsubscribe("drawModel.select.click");
    };
  }, [localObserver, handleSelectClick]);

  return (
    <>
      <Dialog
        options={{
          text: (
            <>
              <div>
                <RadioGroup
                  aria-label="ringtone"
                  name="ringtone"
                  value={selectedValue}
                  onChange={(e) => setSelectedValue(e.target.value)}
                >
                  {selectedFeatures.map((feature, index) => (
                    <FormControlLabel
                      value={index}
                      key={feature.getId()}
                      control={<Radio />}
                      label={feature.values_.namn}
                    />
                  ))}
                </RadioGroup>
              </div>
            </>
          ),
          headerText: "Välj vilken feature du vill kopiera",
          buttonText: "OK",
          useLegacyNonMarkdownRenderer: true,
        }}
        open={selectedFeatures.length >= 2}
        onClose={() => {
          drawModel.drawSelectedIndex(selectedValue);
        }}
      ></Dialog>
      <Grid container>
        <Grid item xs={12}>
          <Information text={activity.information} />
        </Grid>
        <Grid item xs={12} style={{ marginTop: 16 }}>
          <Grid item xs={12} style={{ marginBottom: 4 }}>
            <Typography align="center">Typ</Typography>
          </Grid>
          <Grid item xs={12}>
            <DrawTypeSelector
              activeDrawType={activeDrawType}
              setActiveDrawType={setActiveDrawType}
            />
          </Grid>
        </Grid>
        <FeatureStyleSelector
          activeDrawType={activeDrawType}
          drawStyle={props.drawStyle}
          drawModel={props.drawModel}
          setDrawStyle={props.setDrawStyle}
          textStyle={props.textStyle}
          setTextStyle={props.setTextStyle}
        />
        <FeatureTextSetter
          localObserver={props.localObserver}
          drawModel={props.drawModel}
        />
      </Grid>
    </>
  );
};

export default AddView;
