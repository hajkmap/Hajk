import { Box } from "@mui/material";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import LsIconButton from "./LsIconButton";

const LsRadioButton = ({ toggleState, id }) => {
  return (
    <LsIconButton id={id} size="small" sx={{}}>
      <RadioButtonUncheckedIcon />
      <Box
        sx={[
          {
            position: "absolute",
            top: "calc(50%)",
            left: "50%",
            transition: "transform 200ms ease, opacity 200ms ease",
            lineHeight: 0,
          },
          toggleState !== "unchecked"
            ? {
                transform: "translate(-50%, -50%) scale(1.05)",
              }
            : {
                transform: "translate(-50%, -50%) scale(0.0)",
              },
          toggleState !== "unchecked"
            ? {
                opacity: 1.0,
              }
            : {
                opacity: 0.0,
              },
        ]}
      >
        <RadioButtonCheckedIcon />
      </Box>
    </LsIconButton>
  );
};

export default LsRadioButton;
