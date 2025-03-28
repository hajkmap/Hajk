import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Button, TextField, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import {
  useGroups,
  Group,
  useCreateGroup,
  GroupCreateInput,
  GroupType,
} from "../../api/groups";
import DialogWrapper from "../../components/flexible-dialog";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import { toast } from "react-toastify";

export default function GroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGroups();
  const { mutateAsync: createGroup } = useCreateGroup();
  const { palette } = useTheme();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const createGroupContainer = new DynamicFormContainer<FieldValues>();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  createGroupContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 12,
    name: "type",
    title: `${t("groups.type")}`,
    defaultValue: "",
    optionList: Object.keys(GroupType).map((key) => {
      const value = GroupType[key as keyof typeof GroupType];
      return {
        title: t(`groupType.${key}`),
        value: value,
      };
    }),
  });

  const handleGroupSubmit = async (groupData: GroupCreateInput) => {
    try {
      const payload = {
        name: groupData.name,
        internalName: groupData.internalName,
        type: groupData.type,
      };
      const response = await createGroup(payload);
      toast.success(t("groups.createGroupSuccess", { name: response?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      void navigate(`/groups/${response?.id}`);
      handleClose();
    } catch (error) {
      console.error("Failed to submit group:", error);
      toast.error(t("groups.createGroupFailed"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const [createGroupContainerData] = useState(createGroupContainer);
  const defaultValues = createGroupContainerData.getDefaultValues();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
    getValues,
  } = DefaultUseForm(defaultValues);
  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,

    onValid: (data: FieldValues) => {
      const groupData = data as GroupCreateInput;
      void handleGroupSubmit(groupData);
    },
    onInvalid: (errors) => {
      console.log("Errors: ", errors);
    },
  });

  return (
    <Page
      title={t("common.layerGroups")}
      actionButtons={
        <>
          <Button onClick={handleClickOpen} color="primary" variant="contained">
            {t("groups.create")}
          </Button>
        </>
      }
    >
      <DialogWrapper
        fullWidth
        open={open}
        title={t("groups.dialog.title")}
        onClose={handleClose}
        onSubmit={onSubmit}
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
        <FormRenderer
          formControls={createGroupContainerData}
          formGetValues={getValues}
          register={register}
          control={control}
          errors={errors}
        />
      </DialogWrapper>
      {isLoading ? (
        <Typography variant="h6">{t("common.loading")}</Typography>
      ) : (
        <>
          <Grid size={12} container sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={t("groups.search")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Grid>

          <Grid size={12}>
            <DataGrid
              onCellClick={(params) => {
                const id: string = (params.row as Group).id;
                if (id) {
                  void navigate(`/groups/${id}`);
                }
              }}
              rows={filteredGroups}
              getRowId={(row) => row.id}
              columns={[
                {
                  field: "name",
                  headerName: "Visningsnamn",
                  flex: 0.4,
                },
                {
                  field: "locked",
                  headerName: "Typ av grupp",
                  flex: 0.5,
                },
                {
                  field: "id",
                  headerName: "Intern namn",
                  flex: 0.3,
                },
              ]}
              sx={{
                // maxWidth: "100%",
                "& .MuiDataGrid-row:hover": {
                  cursor: "pointer",
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "inherit",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
                "& .MuiDataGrid-cell.Mui-selected": {
                  backgroundColor: "inherit",
                },
              }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              hideFooterPagination={groups && groups.length < 10}
              pageSizeOptions={[5, 10, 25, 50]}
              slots={{ toolbar: GridToolbar }}
            />
          </Grid>
        </>
      )}
    </Page>
  );
}
