import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { AccordionProps } from "./type";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InputField from "./input-field";

export default function AccordionFormContainer({
  title,
  description,
  inputs,
  values,
  setValues,
}: AccordionProps) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>{description}</Typography>
        {inputs.map((input) => (
          <InputField
            key={input.key}
            input={input}
            value={values[input.key] || ""}
            onChange={setValues}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
