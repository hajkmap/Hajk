/* eslint-disable prettier/prettier */
import Tooltip from "@mui/material/Tooltip";

const HajkToolTip = ({ title, children }) => {
  return (
    <Tooltip
      enterDelay={500}
      leaveDelay={50}
      disableInteractive={true}
      title={title}
    >
      {children}
    </Tooltip>
  );
};

export default HajkToolTip;
