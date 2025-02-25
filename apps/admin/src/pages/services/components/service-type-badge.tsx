import Grid from "@mui/material/Grid2";
import { SERVICE_TYPE } from "../../../api/services";
import { Chip } from "@mui/material";

interface Props {
  type: SERVICE_TYPE;
}

export default function ServiceTypeBadge(props: Props) {
  const { type } = props;
  return (
    <Grid
      container
      justifyContent="flex-start"
      alignContent="center"
      sx={{ height: "100%", width: "100%" }}
    >
      <Chip
        size="small"
        color={type === SERVICE_TYPE.WMS ? "success" : "warning"}
        label={type}
      />
    </Grid>
  );
}
