import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "./LsIconButton";
import i18n from "src/i18n";

const BtnLayerWarning = ({ ...props }) => (
  <HajkToolTip
    disableInteractive
    title={i18n.t("layerSwitcher.layerLoadError")}
  >
    <LsIconButton
      sx={(theme) => ({
        marginTop: "5px",
        marginRight: "2px",
        p: "3px",
        backgroundColor: theme.palette.grey[200],
        ...theme.applyStyles("dark", {
          backgroundColor: theme.palette.grey[800],
        }),
      })}
      {...props}
    >
      <WarningAmberOutlinedIcon
        fontSize="small"
        sx={(theme) => ({
          marginTop: "-1px",
          color: theme.palette.warning.main,
        })}
      />
    </LsIconButton>
  </HajkToolTip>
);

export default BtnLayerWarning;
