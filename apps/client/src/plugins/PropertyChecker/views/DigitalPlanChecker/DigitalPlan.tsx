import React, { useState } from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import DigitalPlanItem from "./DigitalPlanItem";
import ReportDialog from "./ReportDialog";

import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";
import type {
  DigitalPlanProps,
  ControlledRegulation,
  LayerNotes,
} from "../../types";

function DigitalPlan(props: DigitalPlanProps) {
  const { digitalPlanKey, plan, options, userDetails } = props;
  const [controlledRegulations, setControlledRegulations] = useState<
    ControlledRegulation[]
  >([]);

  // This map will hold values for user's own notes that can be written
  // for each layer in the list.
  const [regulationNotes, setRegulationNotes] = useState<LayerNotes>({});

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
        {Object.entries(plan.features).map(
          ([useType, type]: [string, Feature<Geometry>[]], j) => (
            <React.Fragment key={j}>
              <Typography variant="h6" sx={[j !== 0 && { mt: 2 }]}>
                {useType}
                {}
              </Typography>
              {type
                .sort((a: Feature<Geometry>, b: Feature<Geometry>) => {
                  return a
                    .get(options.digitalPlanItemTitleAttribute)
                    ?.localeCompare(
                      b.get(options.digitalPlanItemTitleAttribute)
                    );
                })
                .map((f: Feature<Geometry>, index: number) => (
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
          )
        )}
      </AccordionDetails>
    </Accordion>
  );
}
export default DigitalPlan;
