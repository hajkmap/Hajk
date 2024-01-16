import React, { useState } from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import DigitalPlanItem from "./DigitalPlanItem.js";
import ReportDialog from "./ReportDialog.js";

function DigitalPlan(props) {
  const { digitalPlanKey, plan, options, userDetails } = props;
  const [controlledRegulations, setControlledRegulations] = useState([]);

  // This map will hold values for user's own notes that can be written
  // for each layer in the list.
  const [regulationNotes, setRegulationNotes] = useState({});

  const [reportDialogVisible, setReportDialogVisible] = useState(false);
  return (
    <Accordion disableGutters defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="button">{digitalPlanKey}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {options.enableDigitalPlansReport && (
          <>
            <ReportDialog
              reportDialogVisible={reportDialogVisible}
              setReportDialogVisible={setReportDialogVisible}
              digitalPlanKey={digitalPlanKey}
              markerFeature={plan.markerFeature}
              controlledRegulations={controlledRegulations}
              layerNotes={regulationNotes}
              userDetails={userDetails}
              options={options}
            />
            <Button
              fullWidth
              variant="outlined"
              size="small"
              disabled={
                controlledRegulations.filter(
                  (l) => l.digitalPlanKey === digitalPlanKey
                ).length === 0
              }
              onClick={() => {
                setReportDialogVisible(true);
              }}
            >
              Generera rapport
            </Button>
          </>
        )}
        {Object.entries(plan.features).map(([useType, type], j) => (
          <React.Fragment key={j}>
            <Typography variant="h6" sx={{ ...(j !== 0 && { mt: 2 }) }}>
              {useType}
              {}
            </Typography>
            {type
              .sort((a, b) =>
                a.get("label_text").localeCompare(b.get("label_text"))
              )
              .map((f, index) => (
                <DigitalPlanItem
                  feature={f}
                  digitalPlanKey={digitalPlanKey}
                  key={index}
                  controlledRegulations={controlledRegulations}
                  setControlledRegulations={setControlledRegulations}
                  regulationNotes={regulationNotes}
                  setRegulationNotes={setRegulationNotes}
                  options={options}
                  useType={useType}
                />
              ))}
          </React.Fragment>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export default DigitalPlan;
