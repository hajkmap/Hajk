import SquareIconButton from "./square-icon-button";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useState } from "react";
import HajkTooltip from "../../../../components/hajk-tooltip";
import { useTranslation } from "react-i18next";

interface Props {
  locked: boolean;
  toggleLocked: () => void;
  sx?: object;
}
const LockButton = (props: Props) => {
  const [mouseIsOver, setMouseIsOver] = useState(false);
  const { t } = useTranslation();

  const handleMouseEnter = () => {
    setMouseIsOver(true);
  };

  const handleMouseLeave = () => {
    setMouseIsOver(false);
  };

  const getIcon = () => {
    if (props.locked) {
      return mouseIsOver ? (
        <LockOpenIcon fontSize="medium" />
      ) : (
        <LockIcon fontSize="medium" />
      );
    } else {
      return mouseIsOver ? (
        <LockIcon fontSize="medium" />
      ) : (
        <LockOpenIcon fontSize="medium" />
      );
    }
  };

  return (
    <HajkTooltip
      title={
        props.locked ? t("common.sidebar.unlock") : t("common.sidebar.lock")
      }
    >
      <SquareIconButton
        onClick={props.toggleLocked}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{ ...props.sx }}
      >
        {getIcon()}
      </SquareIconButton>
    </HajkTooltip>
  );
};

export default LockButton;
