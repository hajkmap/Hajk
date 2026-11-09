import { Button, Grid } from "@mui/material";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

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
        title={
          disabled
            ? i18n.t("timeSlider.print.disabledTooltip")
            : i18n.t("timeSlider.print.enabledTooltip")
        }
      >
        <span>
          <Button variant="contained" onClick={onClick} disabled={disabled}>
            {i18n.t("timeSlider.print.print")}
          </Button>
        </span>
      </HajkToolTip>
    </Grid>
  );
}
