import { useParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";

import { useTools, useUpdateTool, Tool } from "../../api/tools";
import { useMaps } from "../../api/maps";
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
  const { data: maps } = useMaps();
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
      const options = tool.options ?? {};
      const optionsTitle =
        typeof options.title === "string" && options.title
          ? options.title
          : (tool.title ?? "");
      reset({
        type: tool.type ?? "",
        // Flat title field (e.g. documenthandler) — same seed as options.title
        title: optionsTitle,
        options: {
          ...options,
          title: optionsTitle,
        },
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

    const { type, title: formTitle, options: nestedOptions, ...rest } = data;
    const nested =
      nestedOptions && typeof nestedOptions === "object"
        ? (nestedOptions as Record<string, unknown>)
        : null;
    const submittedOptions = nested ? { ...rest, ...nested } : rest;
    const options: Record<string, unknown> = {
      ...(tool.options ?? {}),
      ...submittedOptions,
    };

    // options.title wins when present (layerswitcher etc.). Flat `title`
    // (documenthandler) only fills in when options.title was not submitted.
    if (nested && "title" in nested) {
      options.title = nested.title;
    } else if (typeof formTitle === "string") {
      options.title = formTitle;
    }

    // Strip attachments where both name and link are blank
    if (Array.isArray(options.pdfLinks)) {
      options.pdfLinks = (
        options.pdfLinks as { name: string; link: string }[]
      ).filter((a) => a.name.trim() !== "" || a.link.trim() !== "");
    }

    // After create, options.title is source of truth and keeps tool.title in sync
    const syncedTitle =
      typeof options.title === "string" ? options.title : undefined;

    updateToolMutation.mutate(
      {
        id: tool.id,
        data: {
          type: type as string,
          title: syncedTitle,
          options,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("common.dialog.saveSuccess"));
          reset({
            ...data,
            title: syncedTitle ?? "",
            options,
          });
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      },
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

  const displayName =
    (typeof tool?.options?.title === "string" && tool.options.title
      ? tool.options.title
      : undefined) ??
    tool?.title ??
    tool?.type;

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
                mapId: maps?.find((map) => map.name === mapName)?.id,
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
