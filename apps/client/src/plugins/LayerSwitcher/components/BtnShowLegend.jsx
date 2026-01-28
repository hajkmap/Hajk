import React from "react";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "./LsIconButton";

const BtnShowLegend = ({ legendIsActive, onClick, ...props }) => (
  <HajkToolTip
    placement="left"
    title={legendIsActive ? "Dölj teckenförklaring" : "Visa teckenförklaring"}
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
