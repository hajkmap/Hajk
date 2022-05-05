import React from "react";
import { RadioGroup, FormControlLabel, Radio } from "@mui/material";
import Dialog from "../../../components/Dialog/Dialog";

export default function SelectFeatureDialog(props) {
  const { localObserver, drawModel } = props;
  const [selectedFeatures, setSelectedFeatures] = React.useState([]);

  const handleSelectClick = React.useCallback((clickedFeatures) => {
    setSelectedFeatures(clickedFeatures);
  }, []);

  const [selectedValue, setSelectedValue] = React.useState({
    feature: null,
    index: null,
  });

  React.useEffect(() => {
    localObserver.subscribe("drawModel.select.click", handleSelectClick);
    return () => {
      localObserver.unsubscribe("drawModel.select.click");
    };
  }, [localObserver, handleSelectClick]);

  return (
    <Dialog
      options={{
        text: (
          <>
            <div>
              <RadioGroup
                aria-label="ringtone"
                name="ringtone"
                value={selectedValue.index}
                onChange={(e) =>
                  setSelectedValue({
                    feature: selectedFeatures[e.target.value],
                    index: e.target.value,
                  })
                }
              >
                {selectedFeatures.map((feature, index) => (
                  <FormControlLabel
                    value={index}
                    key={feature.getId()}
                    control={<Radio />}
                    label={feature.getId()}
                  />
                ))}
              </RadioGroup>
            </div>
          </>
        ),
        headerText: "Välj vilken feature du vill kopiera",
        buttonText: "OK",
        abortText: "AVBRYT",
        useLegacyNonMarkdownRenderer: true,
      }}
      open={selectedFeatures.length > 1}
      onClose={() => {
        console.log("fire onclose");
        drawModel.drawSelectedFeature(selectedValue.feature);
        setSelectedFeatures([]);
      }}
      onAbort={() => setSelectedFeatures([])}
    ></Dialog>
  );
}
