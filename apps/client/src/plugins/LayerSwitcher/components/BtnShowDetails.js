import React from "react";
import ShowDetailsIcon from "@mui/icons-material/MoreOutlined";
import LsIconButton from "./LsIconButton";

const BtnShowDetails = ({ children, id, ...props }) => (
  <LsIconButton
    id={id}
    size="small"
    sx={(theme) => ({
      marginTop: "3px",
      "&:hover .ls-details-icon": {
        color: theme.palette.grey[900],
        ...theme.applyStyles("dark", {
          color: "#fff",
        }),
      },
    })}
    {...props}
  >
    <ShowDetailsIcon
      className="ls-details-icon"
      sx={(theme) => ({
        width: "0.7em",
        height: "0.7em",
        transform: "rotate(180deg)",
        mt: "1px",
        color: theme.palette.grey[500],
      })}
    />
    {children}
  </LsIconButton>
);

export default BtnShowDetails;
