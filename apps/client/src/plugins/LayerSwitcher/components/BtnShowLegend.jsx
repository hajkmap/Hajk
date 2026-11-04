import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "./LsIconButton";
import i18n from "src/i18n";

const BtnShowLegend = ({ legendIsActive, onClick, ...props }) => (
  <HajkToolTip
    placement="left"
    title={
      legendIsActive
        ? i18n.t("layerSwitcher.hideLegend")
        : i18n.t("layerSwitcher.showLegend")
    }
  >
    <LsIconButton
      sx={{ p: 0.25, mt: 0.5, mr: "5px" }}
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      {...props}
    >
      <FormatListBulletedOutlinedIcon fontSize="small" />
    </LsIconButton>
  </HajkToolTip>
);

export default BtnShowLegend;
