import React from "react";
import { Box } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import LsIconButton from "./LsIconButton";

const LsCheckBox = ({ toggleState }) => {
  return (
    <LsIconButton size="small" sx={{}}>
      <CheckBoxOutlineBlankIcon />
      <Box
        sx={{
          position: "absolute",
          top: "calc(50%)",
          left: "50%",
          transition: "transform 200ms ease, opacity 200ms ease",
          transform:
            toggleState !== "unchecked"
              ? "translate(-50%, -50%)  scale(1.05)"
              : "translate(-50%, -50%) scale(0.0)",
          opacity: toggleState !== "unchecked" ? 1.0 : 0.0,
          lineHeight: 0,
        }}
      >
        <CheckBoxIcon
          sx={
            {
              semichecked: { fill: "gray" },
              checkedWithWarning: {
                fill: (theme) => theme.palette.warning.dark,
              },
            }[toggleState]
          }
        />
      </Box>
    </LsIconButton>
  );
};

export default LsCheckBox;
