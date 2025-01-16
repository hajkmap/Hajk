import React from "react";
import { Button as MuiButton } from "@mui/material";

interface ButtonProps {
  onClick: () => void;
  text: string;
  sx?: Record<string, unknown>;
}

const CreateButton: React.FC<ButtonProps> = ({ onClick, text, sx }) => {
  return (
    <MuiButton
      variant="contained"
      sx={{ backgroundColor: "black", height: "35px", width: "180px", ...sx }}
      onClick={onClick}
    >
      {text}
    </MuiButton>
  );
};

export default CreateButton;
