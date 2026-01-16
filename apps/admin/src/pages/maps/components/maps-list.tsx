import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import { Button, TextField, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../../layouts/root/components/page";
import { useMaps, Map, useCreateMap, MapMutation } from "../../../api/maps";
import DialogWrapper from "../../../components/flexible-dialog";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import StyledDataGrid from "../../../components/data-grid";
import { GridColDef } from "@mui/x-data-grid";
import MoreIcon from "@mui/icons-material/More";
import { useDebounce } from "use-debounce";

interface MapsListProps {
  filterMaps: (maps: Map[]) => Map[];
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

export default function MapsList({
  filterMaps,
  showCreateButton = true,
  pageTitleKey,
  baseRoute,
}: MapsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: maps, isLoading } = useMaps();
  const { mutateAsync: createMap } = useCreateMap();
  const { palette } = useTheme();

  const [searchString, setSearchString] = useState("");
  const [debouncedSearchString] = useDebounce(searchString, 200);
  const [open, setOpen] = useState<boolean>(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(event.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const filteredMaps = useMemo(() => {
    if (!maps) return [];

    // First apply the specific filter for this page type
    const typeFilteredMaps = filterMaps(maps);

    // Then apply search filter
    const searchFilter = (map: Map) => {
      return (
        debouncedSearchString === "" ||
        Object.values(map).some((value) => {
          return (
            (typeof value === "string" &&
              value
                .toLowerCase()
                .includes(debouncedSearchString.toLowerCase())) ||
            (value &&
              typeof value === "object" &&
              Object.values(map).some(
                (v) =>
                  typeof v === "string" &&
                  v.toLowerCase().includes(debouncedSearchString.toLowerCase())
              )) ||
            (typeof map === "object" &&
              typeof map.options === "object" &&
              Object.values(map.options).some(
                (v) =>
                  typeof v === "string" &&
                  v.toLowerCase().includes(debouncedSearchString.toLowerCase())
              ))
          );
        })
      );
    };

    return typeFilteredMaps.filter(searchFilter);
  }, [maps, debouncedSearchString, filterMaps]);

  const columns: GridColDef<Map>[] = [
    { field: "name", flex: 1, headerName: t("map.name") },
    {
      field: "description",
      flex: 1,
      headerName: t("map.description"),
      valueGetter: (_value, row) =>
        row.options?.description ?? "(to be implemented)",
    },
    {
      field: "title",
      flex: 1,
      headerName: t("map.title"),
      valueGetter: (_value, row) => {
        return row.options?.title;
      },
    },
    { field: "locked", flex: 1, headerName: t("map.locked") },
    {
      field: "more",
      headerName: "",
      flex: 0.2,
      renderCell: () => (
        <Button
          color="info"
          size="small"
          //   onClick={() => {}}
        >
          <MoreIcon />
        </Button>
      ),
    },
  ];

  const defaultValues = {
    id: 0,
    name: "",
    locked: false,
    options: {
      title: "",
      description: "",
    },
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MapMutation>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleMapSubmit = async (mapData: MapMutation) => {
    try {
      const payload = {
        id: 0, // This will be set by the server
        name: mapData.name,
        locked: mapData.locked,
        options: mapData.options,
      };
      const response = await createMap(payload);
      toast.success(t("maps.createMapSuccess", { name: mapData.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      void navigate(`${baseRoute}/${response?.id}`);
      reset();
      handleClose();
    } catch (error) {
      console.error("Failed to submit map:", error);
      toast.error(t("maps.createMapFailed"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const onSubmit = (data: MapMutation) => {
    void handleMapSubmit(data);
  };

  return (
    <Page
      title={t(pageTitleKey) + (maps && ` (${maps.length})`)}
      actionButtons={
        showCreateButton ? (
          <>
            <Button
              onClick={handleClickOpen}
              color="primary"
              variant="contained"
            >
              {t("map.createMap")}
            </Button>
          </>
        ) : undefined
      }
    >
      <DialogWrapper
        fullWidth
        open={open}
        title={t("maps.dialog.title")}
        onClose={handleClose}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)(e);
        }}
        actions={
          <>
            <Button variant="text" onClick={handleClose} color="primary">
              {t("common.dialog.closeBtn")}
            </Button>
            <Button type="submit" color="primary" variant="contained">
              {t("common.dialog.saveBtn")}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              label={t("map.name")}
              fullWidth
              {...register("name", {
                required: `${t("common.required")}`,
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("map.title")}
              fullWidth
              {...register("options.title")}
              error={!!errors.options?.title}
              helperText={errors.options?.title?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("map.description")}
              fullWidth
              multiline
              rows={3}
              {...register("options.description")}
              error={!!errors.options?.description}
              helperText={errors.options?.description?.message}
            />
          </Grid>
        </Grid>
      </DialogWrapper>
      {isLoading ? (
        <Typography variant="h6">{t("common.loading")}</Typography>
      ) : (
        <>
          <Grid size={12} container sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={t("map.searchTitle")}
              variant="outlined"
              value={searchString}
              onChange={handleSearchChange}
            />
          </Grid>

          <Grid size={12}>
            <StyledDataGrid<Map>
              onRowClick={({ row }) => {
                const id: string = row.id;
                if (id) {
                  void navigate(`${baseRoute}/${id}`);
                }
              }}
              rows={filteredMaps}
              columns={columns}
              loading={isLoading}
            />
          </Grid>
        </>
      )}
    </Page>
  );
}
