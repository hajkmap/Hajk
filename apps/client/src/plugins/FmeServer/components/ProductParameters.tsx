import { Grid, IconButton, Typography } from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";
import InformationWrapper from "./InformationWrapper";
import ParameterField from "./ParameterField";
import { isDisplayOnlyParameter } from "../api/parameterUi";
import type { ProductParametersProps } from "../types";

const ProductParameters = ({
  parameters,
  setProductParameters,
  infoUrl,
  model,
  uploadParameterFile,
}: ProductParametersProps) => {
  const handleParameterChange = (
    value: string | number | boolean | string[],
    index: number
  ) => {
    // The rendered list is a filtered view of the state, so we update the
    // matching parameter in the state rather than writing the view back.
    const changed = parameters[index];
    if (!changed) {
      return;
    }
    setProductParameters((current) =>
      current.map((parameter) =>
        parameter.name === changed.name ? { ...parameter, value } : parameter
      )
    );
  };

  const visibleParameters = parameters.filter(
    (p) => !isDisplayOnlyParameter(p)
  );

  return (
    <Grid container spacing={2}>
      {infoUrl.length > 0 && (
        <Grid
          container
          wrap="nowrap"
          size={12}
          sx={{ justifyContent: "space-between" }}
        >
          <Typography sx={{ alignSelf: "center" }}>
            Oklart hur produkten fungerar? Tryck på frågetecknet för mer
            information.
          </Typography>
          <IconButton
            aria-label="Hjälp"
            onClick={() => window.open(infoUrl, "_blank")}
          >
            <HelpIcon />
          </IconButton>
        </Grid>
      )}

      {visibleParameters.length === 0 && (
        <Grid size={12}>
          <InformationWrapper type="info">
            <Typography>
              Det finns inga publicerade parametrar att rendera! Du kan
              fortsätta direkt till nästa steg!
            </Typography>
          </InformationWrapper>
        </Grid>
      )}

      {parameters.map((parameter, index) => (
        <ParameterField
          key={`${parameter.name}-${index}`}
          parameter={parameter}
          index={index}
          onChange={handleParameterChange}
          model={model}
          uploadParameterFile={uploadParameterFile}
        />
      ))}
    </Grid>
  );
};

export default ProductParameters;
