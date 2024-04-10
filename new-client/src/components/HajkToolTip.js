import Tooltip from "@mui/material/Tooltip";

const HajkToolTip = ({ title, children }) => {
  return (
    <Tooltip
      enterDelay={500}
      leaveDelay={50}
      disableInteractive={true}
      title={title ? title : ""}
    >
      {children ? children : <></>}
    </Tooltip>
  );
};

export default HajkToolTip;
