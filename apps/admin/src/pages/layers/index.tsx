import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLayers } from "../../api/layers";
import useAppStateStore from "../../store/use-app-state-store";
import Page from "../../layouts/root/components/page";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import AddLayerDialog from "./add-layer-dialog";
import SearchBar from "./searchbar";
import LayersTable from "./layers-table";
import { Button } from "@mui/material";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();
  const language = useAppStateStore((state) => state.language);
  const [open, setOpen] = useState<boolean>(false);
  const { data: services } = useServices();
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const processedLayers = useMemo(() => {
    if (!layers || !services) return [];
    return layers.map((layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId
      );
      return {
        ...layer,
        type: service?.type ?? "",
        url: service?.url ?? "",
      };
    });
  }, [layers, services]);

  // const handleClose = () => {
  //   setOpen(false);
  // };

  // const handleClickOpen = () => {
  //   setOpen(true);
  // };

  // const [layer, setLayer] = useState<DynamicFormContainer<FieldValues>>(
  //   new DynamicFormContainer<FieldValues>()
  // );

  const handleDialogClose = () => setOpenDialog(false);
  const handleDialogOpen = () => setOpenDialog(true);

  // Filtered layers based on the search query
  const filteredLayers = layers?.filter((layer) =>
    Object.values(layer)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return isLoading ? (
    <SquareSpinnerComponent />
  ) : (
    <Page
      title={t("common.layers")}
      actionButtons={
        <Button onClick={handleDialogOpen} color="primary" variant="contained">
          {t("layers.dialog.addBtn")}
        </Button>
      }
    >
      <AddLayerDialog open={openDialog} onClose={handleDialogClose} />
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <LayersTable layers={filteredLayers ?? []} language={language} />
    </Page>
  );
}
