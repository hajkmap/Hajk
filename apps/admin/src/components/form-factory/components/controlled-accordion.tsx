import React, { useState, useEffect, useCallback } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HajkTooltip from "../../hajk-tooltip";
import { FormElement } from "../dynamic-form-container";
import { FieldValues as TFieldValues } from "react-hook-form";
import DynamicInputSettings from "../types/dynamic-input-settings";

import CustomInputSettings from "../types/custom-input-settings";

interface ControlledAccordionProps {
  title: string;
  formInputs: FormElement<TFieldValues>[];
  formGetValues: () => Record<string, unknown>;
  triggerExpanded?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
}

function ControlledAccordion({
  title,
  formInputs,
  formGetValues,
  triggerExpanded = false,
  children,
  backgroundColor,
}: ControlledAccordionProps) {
  // triggerExpanded is used in the ControlledAccordion to programmatically
  // control whether the accordion is expanded or collapsed. When triggerExpanded
  // is set to true, the accordion expands, and when set to false, it collapses.
  // This allows external components to trigger changes to the accordion's expansion state.

  const [expanded, setExpanded] = useState(triggerExpanded);
  const [keyValues, setKeyValues] = useState<
    { key: string; value: string; title: string }[]
  >([]);

  const refreshKeyValues = useCallback(() => {
    const kv = formGetValues();

    const newKv: { key: string; value: string; title: string }[] = [];

    formInputs.map((input) => {
      if (
        input.kind === "DynamicInputSettings" ||
        input.kind === "CustomInputSettings"
      ) {
        const castedInput = input as
          | DynamicInputSettings<TFieldValues>
          | CustomInputSettings<TFieldValues>;

        const value = kv[castedInput.name];

        if (value) {
          newKv.push({
            key: castedInput.name,
            value: value as string,
            title: castedInput.title,
          });
        }
      }
    });

    setKeyValues(newKv);
  }, [formGetValues, formInputs, setKeyValues]);

  useEffect(() => {
    setExpanded(triggerExpanded);
  }, [triggerExpanded]);

  useEffect(() => {
    if (!expanded) {
      refreshKeyValues();
    }
  }, [expanded, refreshKeyValues]);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  const tooltipContent = () => {
    if (keyValues.length === 0) return "";
    return (
      <Box>
        {keyValues.map((keyValue, index) => (
          <Box
            key={"tooltip-row-" + index}
            className="truncate-overflow"
            sx={{ width: "100%", maxWidth: "100%" }}
          >
            {/* Please refactor the ugly * thing below */}
            {keyValue.title.replace("*", "").trim()}:{" "}
            {keyValue?.value + "".trim()}
          </Box>
        ))}
      </Box>
    );
  };

  const controlledAccordion = () => {
    const valuesAsString = keyValues
      .map((keyValue) => `${keyValue?.value + "".trim()}`)
      .join(", ");

    return (
      <Accordion
        disableGutters
        expanded={expanded}
        onChange={handleAccordionChange}
        sx={{
          width: "100%",
          ml: 2,
          marginBottom: "24px !important",
          backgroundColor: backgroundColor ?? "none",
        }}
      >
        <HajkTooltip
          title={tooltipContent()}
          placement="bottom-end"
          enterDelay={1000}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{ width: "calc(100% - 20px)", maxWidth: "calc(100% - 20px)" }}
              display="flex"
              alignItems="center"
              overflow="hidden"
            >
              <Typography variant="h6" sx={{ flexShrink: 0, paddingRight: 2 }}>
                {title}
              </Typography>
              {!expanded && (
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    flexGrow: 1,
                    textAlign: "right",
                  }}
                >
                  {keyValues && keyValues.length > 0 && (
                    <Box
                      className="truncate-overflow"
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        opacity: 0.7,
                      }}
                    >
                      {valuesAsString}
                    </Box>
                  )}
                </Typography>
              )}
            </Box>
          </AccordionSummary>
        </HajkTooltip>
        <AccordionDetails sx={{ pl: 0, pb: 0 }}>{children}</AccordionDetails>
      </Accordion>
    );
  };

  return controlledAccordion();
}

export default ControlledAccordion;
