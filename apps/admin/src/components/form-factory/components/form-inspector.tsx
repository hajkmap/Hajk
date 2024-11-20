import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface FormInspectorProps {
  formFields: Record<string, unknown>;
  dirtyFields: Record<string, unknown>;
}

/*

Simple inspector component for displaying form fields and dirty fields.

------------------------

Usage example:

const {
    formState: { dirtyFields  },
    watch,
  } = DefaultUseForm(defaultValues);

const formFields = watch();

<FormInspector formFields={formFields} dirtyFields={dirtyFields} />

*/

export default function FormInspector(props: FormInspectorProps) {
  return (
    <Box sx={{ mb: 2, mt: 2 }}>
      <Accordion sx={{ backgroundColor: "#4a5f4a", color: "#fff" }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
        >
          <Typography>Form fields</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontFamily: "monospace", fontSize: 11 }}>
            {JSON.stringify(props.formFields, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ backgroundColor: "#4a5f4a", color: "#fff" }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
        >
          <Typography>Dirty fields</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontFamily: "monospace", fontSize: 11 }}>
            {JSON.stringify(props.dirtyFields, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
