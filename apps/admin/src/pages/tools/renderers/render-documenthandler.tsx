import { useEffect, useRef, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { Control, Controller, FieldValues, useForm, UseFormSetValue } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Tool } from "../../../api/tools";
import { MenuEditor } from "../components/documenthandler/menu-editor/menu-editor";
import type { MenuConfig } from "../components/documenthandler/menu-editor/types";
import { DocumentsTabPanel } from "../components/documenthandler/documents/documents-tab-panel";
import { DocumentEditorDialog } from "../components/documenthandler/documents/document-editor-dialog";
import { SettingsTabPanel } from "../components/documenthandler/settings/settings-tab-panel";
import { useDocumentById } from "../../../api/documents";
import { getDocuments } from "../../../api/documents/requests";

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
    if (
      linkedDoc &&
      linkedDoc.id !== lastAppliedIdRef.current
    ) {
      lastAppliedIdRef.current = linkedDoc.id;
      setOpenDocument({ folder: linkedDoc.folderName, document: linkedDoc.name });
      setActiveTab("documents");
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

  function handleOpenDocument(folder: string, document: string) {
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
        console.warn('DocumentHandler: Failed to fetch documents for', { folder, document }, err);
      });
  }

  function handleCloseDocument() {
    setOpenDocument(null);
    setSearchParams({});
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value as ActiveTab)}
          sx={{ flex: 1 }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.key} value={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Settings tab */}
      <Box sx={{ display: activeTab === "settings" ? "block" : "none" }}>
        <SettingsTabPanel
          control={control}
          setValue={setValue}
          toolId={toolId}
        />
      </Box>

      {/* Menu settings tab */}
      <Box sx={{ display: activeTab === "menuSettings" ? "block" : "none" }}>
        <Controller
          name="menuConfig"
          control={control}
          render={({ field }) => (
            <MenuEditor
              value={field.value as MenuConfig | undefined}
              onChange={field.onChange}
              toolId={toolId}
              onOpenDocument={handleOpenDocument}
            />
          )}
        />
      </Box>

      {/* Documents tab */}
      <Box sx={{ display: activeTab === "documents" ? "block" : "none" }}>
        <DocumentsTabPanel
          key={toolId ?? "none"}
          toolId={toolId}
          openDocument={openDocument}
          onOpenDocument={handleOpenDocument}
          onCloseDocument={handleCloseDocument}
        />
      </Box>

      {toolId !== undefined && openDocument && (
        <DocumentEditorDialog
          open
          toolId={toolId}
          folderName={openDocument.folder}
          docName={openDocument.document}
          onClose={handleCloseDocument}
        />
      )}
    </>
  );
}
