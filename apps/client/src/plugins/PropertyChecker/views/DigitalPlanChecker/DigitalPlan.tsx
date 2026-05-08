import React, { useState } from "react";

import { Box, Button, Divider, Typography } from "@mui/material";

import DigitalPlanItem from "./DigitalPlanItem";
import ReportDialog from "./ReportDialog";

import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";
import type {
  DigitalPlanProps,
  ControlledRegulation,
  LayerNotes,
} from "../../types";

function DigitalPlan({
  digitalPlanKey,
  plan,
  options,
  userDetails,
}: DigitalPlanProps) {
  const [controlledRegulations, setControlledRegulations] = useState<
    ControlledRegulation[]
  >([]);
  const [regulationNotes, setRegulationNotes] = useState<LayerNotes>({});
  const [reportDialogVisible, setReportDialogVisible] = useState(false);

  return (
    <Box>
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
            sx={{ mb: 1 }}
            disabled={
              controlledRegulations.filter(
                (l) => l.digitalPlanKey === digitalPlanKey
              ).length === 0
            }
            onClick={() => setReportDialogVisible(true)}
          >
            Generera rapport
          </Button>
        </>
      )}
      {Object.entries(plan.features).map(
        ([useType, type]: [string, Feature<Geometry>[]], j) => (
          <React.Fragment key={j}>
            <Divider textAlign="left" sx={{ mt: j === 0 ? 0.5 : 2, mb: 0.5 }}>
              <Typography variant="overline" color="text.secondary">
                {useType}
              </Typography>
            </Divider>
            {type
              .sort((a: Feature<Geometry>, b: Feature<Geometry>) =>
                a
                  .get(options.digitalPlanItemTitleAttribute)
                  ?.localeCompare(b.get(options.digitalPlanItemTitleAttribute))
              )
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
    </Box>
  );
}

export default DigitalPlan;
