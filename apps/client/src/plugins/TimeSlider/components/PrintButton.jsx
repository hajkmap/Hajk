import { Button, Grid } from "@mui/material";
import { PRINT_DISABLED_TOOLTIP, PRINT_ENABLED_TOOLTIP } from "../constants";
import HajkToolTip from "components/HajkToolTip";

export default function PrintButton({ disabled, onClick }) {
  return (
    <Grid
      container
      size={12}
      sx={{
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <HajkToolTip
        title={disabled ? PRINT_DISABLED_TOOLTIP : PRINT_ENABLED_TOOLTIP}
      >
        <span>
          <Button variant="contained" onClick={onClick} disabled={disabled}>
            Skriv ut
          </Button>
        </span>
      </HajkToolTip>
    </Grid>
  );
}
