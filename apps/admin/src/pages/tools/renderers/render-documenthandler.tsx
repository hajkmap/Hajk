import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Backdrop, Box, CircularProgress, Tab, Tabs } from "@mui/material";
import {
  Control,
  Controller,
  FieldValues,
  useForm,
  UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Tool } from "../../../api/tools";
import { MenuEditor } from "../components/documenthandler/menu-editor/menu-editor";
import type { MenuConfig } from "../components/documenthandler/menu-editor/types";
import { DocumentsTabPanel } from "../components/documenthandler/documents/documents-tab-panel";
import { SettingsTabPanel } from "../components/documenthandler/settings/settings-tab-panel";
import { useDocumentById } from "../../../api/documents";
import { getDocuments } from "../../../api/documents/requests";
import FormPanel from "../../../components/form-components/form-panel";

// The editor dialog pulls in the rich-text editor, so it is loaded only when a
// document is opened.
const DocumentEditorDialog = lazy(() =>
  import("../components/documenthandler/documents/document-editor-dialog").then(
    (m) => ({ default: m.DocumentEditorDialog }),
  ),
);

function TabLoading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

// Switching tabs re-renders this component, so each tab's contents are
// memoized: a click then only redraws the tab bar and the visibility toggles,
// not the forms and trees inside every tab.
const MemoSettingsTabPanel = memo(SettingsTabPanel);
const MemoDocumentsTabPanel = memo(DocumentsTabPanel);

interface MenuTabProps {
  control: Control<FieldValues>;
  toolId: number | undefined;
  mounted: boolean;
  onOpenDocument: (folder: string, document: string) => void;
}

// The Controller stays registered before the tab is first opened, so the menu
// config remains part of the form; only the editor itself waits.
const MenuTab = memo(function MenuTab({
  control,
  toolId,
  mounted,
  onOpenDocument,
}: MenuTabProps) {
  const { t } = useTranslation();
  return (
    <FormPanel title={t("tools.documenthandler.menuEditor.tabLabel")} hideTitle>
      <Controller
        name="options.menuConfig"
        control={control}
        render={({ field }) =>
          mounted ? (
            <MenuEditor
              value={field.value as MenuConfig | undefined}
              onChange={field.onChange}
              toolId={toolId}
              onOpenDocument={onOpenDocument}
            />
          ) : (
            <TabLoading />
          )
        }
      />
    </FormPanel>
  );
});

interface DocumentHandlerRendererProps {
  tool: Tool;
  // control/setValue are optional — when omitted, a local useForm() is created.
  // This is safe because all callers either:
  //   1) Pass control/setValue from a parent form (e.g. render-tool.tsx) for sync, or
  //   2) Use their own local form within the renderer (e.g. menu-editor).
  control?: Control<FieldValues>;
  setValue?: UseFormSetValue<FieldValues>;
}

type ActiveTab = "settings" | "menuSettings" | "documents";

export default function DocumentHandlerRenderer({
  tool,
  control: parentControl,
  setValue: parentSetValue,
}: DocumentHandlerRendererProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Use parent control/setValue if provided, otherwise create local ones
  const localForm = useForm<FieldValues>();
  const control = parentControl ?? localForm.control;
  const setValue = parentSetValue ?? localForm.setValue;

  const [activeTab, setActiveTab] = useState<ActiveTab>("settings");
  // Tabs are mounted the first time they are opened and then kept mounted, so
  // the heavy Menu and Documents trees aren't built for tabs nobody opens.
  // Mounting runs in a transition: the tab switches at once and shows a
  // spinner while React builds the tab's contents.
  const [visitedTabs, setVisitedTabs] = useState<ReadonlySet<ActiveTab>>(
    () => new Set<ActiveTab>(["settings"]),
  );
  const [, startTransition] = useTransition();

  function showTab(tab: ActiveTab) {
    setActiveTab(tab);
    startTransition(() => {
      setVisitedTabs((prev) =>
        prev.has(tab) ? prev : new Set<ActiveTab>([...prev, tab]),
      );
    });
  }
  const [openDocument, setOpenDocument] = useState<{
    folder: string;
    document: string;
  } | null>(null);

  // Documents are now owned by the Tool instance itself — use tool.id directly.
  const toolId = tool.id != null ? Number(tool.id) : undefined;

  // Resolve the URL document id → open the editor dialog
  const documentId = searchParams.get("documentId") ?? undefined;
  const urlDocId =
    documentId !== undefined ? parseInt(documentId, 10) : undefined;
  const validUrlDocId =
    urlDocId !== undefined && !isNaN(urlDocId) ? urlDocId : undefined;

  const { data: linkedDoc } = useDocumentById(validUrlDocId);
  const lastAppliedIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (linkedDoc && linkedDoc.id !== lastAppliedIdRef.current) {
      lastAppliedIdRef.current = linkedDoc.id;
      setOpenDocument({
        folder: linkedDoc.folderName,
        document: linkedDoc.name,
      });
      showTab("documents");
    }
    if (!validUrlDocId && lastAppliedIdRef.current !== undefined) {
      lastAppliedIdRef.current = undefined;
      setOpenDocument(null);
    }
  }, [linkedDoc, validUrlDocId]);

  const tabs: { key: ActiveTab; label: string }[] = [
    {
      key: "settings",
      label: t("common.settings"),
    },
    {
      key: "menuSettings",
      label: t("tools.documenthandler.menuEditor.tabLabel"),
    },
    {
      key: "documents",
      label: t("tools.documenthandler.documents.tabLabel"),
    },
  ];

  const handleOpenDocument = useCallback(
    (folder: string, document: string) => {
      setOpenDocument({ folder, document });
      if (toolId === undefined) return;
      queryClient
        .fetchQuery({
          queryKey: ["documents", toolId, folder],
          queryFn: () => getDocuments(toolId, folder),
          staleTime: 30_000,
        })
        .then((docs) => {
          const id = docs.find((d) => d.name === document)?.id;
          if (id !== undefined) {
            setSearchParams({ documentId: String(id) });
          }
        })
        .catch((err) => {
          console.warn(
            "DocumentHandler: Failed to fetch documents for",
            { folder, document },
            err,
          );
        });
    },
    [toolId, queryClient, setSearchParams],
  );

  const handleCloseDocument = useCallback(() => {
    setOpenDocument(null);
    setSearchParams({});
  }, [setSearchParams]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => showTab(value as ActiveTab)}
          sx={{ flex: 1 }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.key} value={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Settings tab */}
      <Box sx={{ display: activeTab === "settings" ? "block" : "none" }}>
        <MemoSettingsTabPanel
          control={control}
          setValue={setValue}
          toolId={toolId}
        />
      </Box>

      {/* Menu settings tab */}
      <Box sx={{ display: activeTab === "menuSettings" ? "block" : "none" }}>
        <MenuTab
          control={control}
          toolId={toolId}
          mounted={visitedTabs.has("menuSettings")}
          onOpenDocument={handleOpenDocument}
        />
      </Box>

      {/* Documents tab */}
      <Box sx={{ display: activeTab === "documents" ? "block" : "none" }}>
        <FormPanel
          title={t("tools.documenthandler.documents.tabLabel")}
          hideTitle
        >
          {visitedTabs.has("documents") ? (
            <MemoDocumentsTabPanel
              key={toolId ?? "none"}
              toolId={toolId}
              openDocument={openDocument}
              onOpenDocument={handleOpenDocument}
              onCloseDocument={handleCloseDocument}
            />
          ) : (
            <TabLoading />
          )}
        </FormPanel>
      </Box>

      {toolId !== undefined && openDocument && (
        <Suspense
          fallback={
            <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal }}>
              <CircularProgress />
            </Backdrop>
          }
        >
          <DocumentEditorDialog
            open
            toolId={toolId}
            folderName={openDocument.folder}
            docName={openDocument.document}
            onClose={handleCloseDocument}
          />
        </Suspense>
      )}
    </>
  );
}
