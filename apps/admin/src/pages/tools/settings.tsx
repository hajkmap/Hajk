import { useParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";

import { useTools, useUpdateTool, Tool } from "../../api/tools";
import FormContainer from "../../components/form-components/form-container";
import FormActionPanel from "../../components/form-action-panel";
import UnsavedChangesGuard from "../../components/unsaved-changes-guard";
import { useRef, useEffect } from "react";
import { toast } from "react-toastify";
import RenderTool from "./renderers/render-tool";
import UsedInMapsPanel from "../../components/used-in-maps-panel";
import { useForm, FieldValues } from "react-hook-form";

export default function ToolSettings() {
  const { t } = useTranslation();
  const { toolId } = useParams<{ toolId?: string }>();
  const { data: tools, isLoading } = useTools();
  const updateToolMutation = useUpdateTool();
  const formRef = useRef<HTMLFormElement | null>(null);

  const tool = (tools ?? []).find((t) => String(t.id) === toolId);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
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
        options: tool.options ?? {},
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

    const { type, options: nestedOptions, ...rest } = data;
    const submittedOptions =
      nestedOptions && typeof nestedOptions === "object"
        ? {
            ...rest,
            ...(nestedOptions as Record<string, unknown>),
          }
        : rest;
    const options = {
      ...(tool.options ?? {}),
      ...submittedOptions,
    };

    // Strip attachments where both name and link are blank
    if (Array.isArray(options.pdfLinks)) {
      options.pdfLinks = (
        options.pdfLinks as { name: string; link: string }[]
      ).filter((a) => a.name.trim() !== "" || a.link.trim() !== "");
    }

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
      return <RenderTool tool={t} control={control} setValue={setValue} />;
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

  const displayName = tool?.title ?? tool?.type;

  return (
    <Page
      title={
        displayName
          ? `${t("common.settings")} - ${displayName}`
          : t("common.settings")
      }
    >
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
            <UsedInMapsPanel
              rows={tool.mapNames.map((mapName) => ({
                id: mapName,
                map: mapName,
              }))}
              isLoading={isLoading}
              emptyMessage={t("tools.usedInMapsNone")}
            />
          </FormContainer>
        )}
      </FormActionPanel>
      <UnsavedChangesGuard when={isDirty} />
    </Page>
  );
}
