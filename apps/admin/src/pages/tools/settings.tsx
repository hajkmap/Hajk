import { useParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";

import { useTools, useUpdateTool, Tool } from "../../api/tools";
import FormContainer from "../../components/form-components/form-container";
import FormActionPanel from "../../components/form-action-panel";
import { useRef, useEffect } from "react";
import { toast } from "react-toastify";
import RenderTool from "./renderers/render-tool";
import { useForm, FieldValues } from "react-hook-form";

export default function ToolSettings() {
  const { t } = useTranslation();
  const { toolName } = useParams<{ toolName: string }>();
  const { data: tools, isLoading } = useTools();
  const updateToolMutation = useUpdateTool();
  const formRef = useRef<HTMLFormElement | null>(null);

  const tool = (tools ?? []).find((t) => t.type === toolName);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Reset form with tool data when it loads
  useEffect(() => {
    if (tool) {
      reset({
        type: tool.type ?? "",
        ...tool.options,
      });
    }
  }, [tool, reset]);

  const loading = isLoading;
  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const onSubmit = (data: FieldValues) => {
    if (!tool) return;

    // Extract type from data, rest goes into options
    const { type, ...options } = data;

    updateToolMutation.mutate(
      {
        id: tool.id,
        data: {
          type: type as string,
          options,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("common.dialog.saveSuccess"));
          reset(data); // Reset form with current data to clear dirty state
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const renderTool = (t: Tool) => {
    if (t) {
      return <RenderTool tool={t} control={control} />;
    }
  };

  // Determine update status for FormActionPanel
  const updateStatus = updateToolMutation.isPending
    ? "pending"
    : updateToolMutation.isSuccess
      ? "success"
      : updateToolMutation.isError
        ? "error"
        : "idle";

  return (
    <Page title={toolName ?? t("common.tools")}>
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText={t("common.dialog.saveBtn")}
        createdBy={tool?.createdBy}
        createdDate={tool?.createdDate}
        lastSavedBy={tool?.lastSavedBy}
        lastSavedDate={tool?.lastSavedDate}
        isDirty={isDirty}
      >
        {loading ? (
          <Typography variant="h6">{t("common.loading")}</Typography>
        ) : !tool ? (
          <Typography variant="h6">{t("common.notFound")}</Typography>
        ) : (
          <FormContainer
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(onSubmit)(e);
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
