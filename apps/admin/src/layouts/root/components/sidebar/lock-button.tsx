import SquareIconButton from "./square-icon-button";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useState } from "react";

interface Props {
  locked: boolean;
  toggleLocked: () => void;
  sx?: object;
}
const LockButton = (props: Props) => {
  const [mouseIsOver, setMouseIsOver] = useState(false);

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
    <SquareIconButton
      onClick={props.toggleLocked}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{ ...props.sx }}
    >
      {getIcon()}
    </SquareIconButton>
  );
};

export default LockButton;
