import Grid from "@mui/material/Grid2";
import { CircularProgress } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { SERVICE_STATUS } from "../../../api/services";

interface Props {
  status: SERVICE_STATUS;
}

export default function ServiceStatusIndicator(props: Props) {
  const { status } = props;
  return (
    <Grid
      container
      justifyContent="center"
      alignContent="center"
      sx={{ height: "100%", width: "100%" }}
    >
      {status === SERVICE_STATUS.UNKNOWN ? (
        <CircularProgress />
      ) : status === SERVICE_STATUS.UNHEALTHY ? (
        <WarningAmberIcon color="warning" />
      ) : (
        <CheckCircleOutlineIcon color="success" />
      )}
    </Grid>
  );
}
