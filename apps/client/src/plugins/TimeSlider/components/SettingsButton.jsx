import { Badge, Button } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

export default function SettingsButton({ layerStatus, open, setOpen }) {
  return (
    <HajkToolTip title={i18n.t("common.settings")}>
      <Badge
        color="error"
        invisible={!layerStatus.error}
        badgeContent={`${
          layerStatus.faultyLayers.length > 0
            ? layerStatus.faultyLayers.length
            : 1
        }`}
      >
        <Button
          variant="contained"
          onClick={() => {
            setOpen(!open);
          }}
        >
          <SettingsOutlinedIcon />
        </Button>
      </Badge>
    </HajkToolTip>
  );
}
