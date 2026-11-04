import { useParams, useSearchParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Box, TextField, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import { useTools, useUpdateTool, Tool } from "../../api/tools";
import { useMaps } from "../../api/maps";
import FormContainer from "../../components/form-components/form-container";
import FormActionPanel from "../../components/form-action-panel";
import UnsavedChangesGuard from "../../components/unsaved-changes-guard";
import { SettingsPageTabs } from "../../components/settings-page-tabs";
import { SettingsSearchTermProvider } from "../../components/form-components/settings-search-context";
import { applySettingsSearch } from "../../components/form-components/settings-search";
import { useRef, useEffect, useState, type RefObject } from "react";
import { toast } from "react-toastify";
import RenderTool from "./renderers/render-tool";
import { withToolOptionDefaults } from "./renderers/tool-option-defaults";
import UsedInMapsPanel from "../../components/used-in-maps-panel";
import { useForm, FieldValues } from "react-hook-form";

const TOOL_PAGE_TABS = [
  { key: "settings", labelKey: "common.settings", icon: <SettingsIcon /> },
  {
    key: "search",
    labelKey: "common.searchSettings",
    icon: <ManageSearchIcon />,
  },
] as const;

/** Hides rows the search marked. Kept off the fields so MUI styles cannot override it. */
const settingsSearchSx = {
  "& [data-settings-hidden]": { display: "none !important" },
};

/**
 * The query stays in this field. The form is filtered after a short pause,
 * directly in the DOM, so a keystroke does not re-render every setting.
 */
function ToolSearchField({
  active,
  resultsRef,
  emptyRef,
}: {
  active: boolean;
  resultsRef: RefObject<HTMLDivElement | null>;
  emptyRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!active) {
      applySettingsSearch(resultsRef.current, "");
      if (emptyRef.current) emptyRef.current.style.display = "none";
      return;
    }
    const id = window.setTimeout(() => {
      const root = resultsRef.current;
      const empty = applySettingsSearch(root, query);
      if (emptyRef.current) {
        emptyRef.current.style.display = empty ? "block" : "none";
      }
    }, 200);
    return () => window.clearTimeout(id);
  }, [active, query, resultsRef, emptyRef]);

  if (!active) return null;

  return (
    <TextField
      placeholder={t("common.searchSettings") + "..."}
      fullWidth
      autoFocus
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <ManageSearchIcon sx={{ mr: 1, color: "text.secondary" }} />
          ),
        },
      }}
      sx={{ mb: 2 }}
    />
  );
}

export default function ToolSettings() {
  const { t } = useTranslation();
  const { toolId } = useParams<{ toolId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "search" ? "search" : "settings";
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchEmptyRef = useRef<HTMLElement>(null);
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
      // Fill in defaults for any field missing from saved options (e.g. a
      // freshly created tool) so the isDirty baseline isn't `undefined` for
      // fields a widget will write a concrete value to on first touch.
      const options = withToolOptionDefaults(tool.type, tool.options);
      reset({
        type: tool.type ?? "",
        internalName: tool.internalName ?? "",
        options,
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

    const type = data.type as string;
    const nestedOptions: unknown = data.options;
    const options: Record<string, unknown> = {
      ...(tool.options ?? {}),
      ...(nestedOptions && typeof nestedOptions === "object"
        ? (nestedOptions as Record<string, unknown>)
        : {}),
    };

    // Strip attachments where both name and link are blank
    if (Array.isArray(options.pdfLinks)) {
      options.pdfLinks = (
        options.pdfLinks as { name: string; link: string }[]
      ).filter((a) => a.name.trim() !== "" || a.link.trim() !== "");
    }

    const internalName =
      typeof data.internalName === "string" ? data.internalName.trim() : "";

    updateToolMutation.mutate(
      {
        id: tool.id,
        data: {
          type,
          internalName,
          options,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("common.dialog.saveSuccess"));
          reset({ type, internalName, options });
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

  const displayName = tool?.internalName?.trim() || tool?.type;

  return (
    <Page
      title={
        displayName
          ? `${t("common.settings")} - ${displayName}`
          : t("common.settings")
      }
    >
      <FormActionPanel
        cancelTo={"/tools"}
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
            <SettingsPageTabs
              value={activeTab}
              onChange={(tab) => setSearchParams({ tab }, { replace: true })}
              tabs={[...TOOL_PAGE_TABS]}
            />
            <ToolSearchField
              active={activeTab === "search"}
              resultsRef={searchResultsRef}
              emptyRef={searchEmptyRef}
            />
            <Box
              ref={searchResultsRef}
              sx={activeTab === "search" ? settingsSearchSx : undefined}
            >
              <SettingsSearchTermProvider
                term={activeTab === "search" ? "" : null}
              >
                {renderTool(tool)}
              </SettingsSearchTermProvider>
              <Typography
                ref={searchEmptyRef}
                variant="body2"
                color="text.secondary"
                sx={{ display: "none", py: 2 }}
              >
                {t("common.noSettingsMatches")}
              </Typography>
            </Box>
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
