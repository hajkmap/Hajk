import React from "react";
import ShowDetailsIcon from "@mui/icons-material/MoreOutlined";
import LsIconButton from "./LsIconButton";

const BtnShowDetails = ({ children, ...props }) => (
  <LsIconButton
    size="small"
    sx={{
      marginTop: "3px",
      "&:hover .ls-details-icon": {
        color: (theme) =>
          theme.palette.mode === "dark" ? "#fff" : theme.palette.grey[900],
      },
    }}
    {...props}
  >
    <ShowDetailsIcon
      className="ls-details-icon"
      sx={{
        width: "0.7em",
        height: "0.7em",
        transform: "rotate(180deg)",
        mt: "1px",
        color: (theme) => theme.palette.grey[500],
      }}
    />
    {children}
  </LsIconButton>
);

export default BtnShowDetails;
