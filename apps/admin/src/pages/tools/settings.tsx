import { useParams, useNavigate } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import {
  Typography,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import StyledDataGrid from "../../components/data-grid";
import { useMapsByToolName, useTools } from "../../api/tools";
import { Map } from "../../api/maps";
import FormActionPanel from "../../components/form-action-panel";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import FormAccordion from "../../components/form-components/form-accordion";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { useRef } from "react";
import { toast } from "react-toastify";
import RenderTool from "./renderers/render-tool";

export default function ToolSettings() {
  const { t } = useTranslation();
  const { toolName } = useParams<{ toolName: string }>();
  const navigate = useNavigate();
  const {
    data: maps,
    isLoading: mapsLoading,
    isError: mapsError,
  } = useMapsByToolName(toolName ?? "");
  const { data: tools, isLoading: toolsLoading } = useTools();
  const formRef = useRef<HTMLFormElement | null>(null);

  const tool = (tools ?? []).find((t) => t.type === toolName);

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "",
      // Spread options into flat fields like options.key
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [
              `options.${k}`,
              String(v ?? ""),
            ])
          )
        : {}),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const loading = mapsLoading || toolsLoading;
  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const renderTool = (tool) => {
    if (tool) {
      return <RenderTool tool={tool} />;
    }
  };

  return (
    <Page title={toolName ?? t("common.tools")}>
      <FormActionPanel
        updateStatus="idle"
        onUpdate={handleExternalSubmit}
        saveButtonText={t("common.dialog.saveBtn")}
        createdBy={tool?.createdBy}
        createdDate={tool?.createdDate}
        lastSavedBy={tool?.lastSavedBy}
        lastSavedDate={tool?.lastSavedDate}
      >
        {loading ? (
          <Typography variant="h6">{t("common.loading")}</Typography>
        ) : !tool ? (
          <Typography variant="h6">{t("common.notFound")}</Typography>
        ) : (
          <FormContainer
            onSubmit={(e) => {
              e.preventDefault();
              toast.info(t("common.notImplemented"));
            }}
            noValidate={false}
            formRef={formRef}
          >
            {renderTool(tool)}
          </FormContainer>
        )}
      </FormActionPanel>
    </Page>
  );
}
