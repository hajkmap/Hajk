import React from "react";
import { RadioGroup, FormControlLabel, Radio } from "@mui/material";
import Dialog from "../../../components/Dialog/Dialog";

export default function SelectFeatureDialog(props) {
  const { localObserver, drawModel } = props;
  const [selectedFeatures, setSelectedFeatures] = React.useState([]);
  const [modal, setModal] = React.useState(false);
  const handleSelectClick = React.useCallback((clickedFeatures) => {
    setSelectedFeatures(clickedFeatures);
    setModal(true);
  }, []);

  const [selectedValue, setSelectedValue] = React.useState({
    feature: null,
    index: 0,
  });

  React.useEffect(() => {
    localObserver.subscribe("drawModel.select.click", handleSelectClick);
    return () => {
      localObserver.unsubscribe("drawModel.select.click");
    };
  }, [localObserver, handleSelectClick]);

  const getAGSCompatibleLayer = (feature) => {
    return Object.keys(feature.layer.layersInfo).find((id) => {
      const fid = feature.getId().split(".")[0];
      const layerId = id.split(":").length === 2 ? id.split(":")[1] : id;
      return fid === layerId;
    });
  };

  const getCaption = (feature) => {
    let layer, caption;
    if (feature.layer.layersInfo && feature.getId()) {
      layer = getAGSCompatibleLayer(feature);
    }
    caption =
      feature.layer?.layersInfo?.[layer]?.caption || feature.values_.namn;
    return caption;
  };

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
                    label={getCaption(feature)}
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
      open={modal}
      onClose={() => {
        drawModel.drawSelectedFeature(selectedValue.feature);
        setModal(false);
      }}
      onAbort={() => setModal(false)}
    ></Dialog>
  );
}
