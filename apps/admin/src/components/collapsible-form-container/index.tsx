import { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { AccordionProps } from "./type";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InputField from "./input-field";
import useAppStateStore from "../../store/use-app-state-store";

export default function AccordionFormContainer({
  title,
  description,
  inputs,
  values,
  setValues,
  panelId,
  componentKey,
}: AccordionProps) {
  const { panels, setPanelExpanded, registerPanel } = useAppStateStore();

  useEffect(() => {
    if (registerPanel) {
      registerPanel(componentKey, panelId);
    }
  }, [panelId, registerPanel, componentKey]);

  const handleChange = () => {
    setPanelExpanded(componentKey, panelId, !isExpanded);
  };

  const isExpanded = panels[componentKey]?.[panelId] || false;

  return (
    <Accordion expanded={isExpanded} onChange={handleChange} sx={{ mt: 1 }}>
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
