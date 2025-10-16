import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import {
  Button,
  TextField,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../../layouts/root/components/page";
import {
  useGroups,
  Group,
  useCreateGroup,
  GroupCreateInput,
  GroupType,
} from "../../../api/groups";
import DialogWrapper from "../../../components/flexible-dialog";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import StyledDataGrid from "../../../components/data-grid";

interface GroupsListProps {
  filterGroups: (groups: Group[]) => Group[];
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

export default function GroupsList({
  filterGroups,
  showCreateButton = true,
  pageTitleKey,
  baseRoute,
}: GroupsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGroups();
  const { mutateAsync: createGroup } = useCreateGroup();
  const { palette } = useTheme();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

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

    // First apply the specific filter for this page type
    const typeFilteredGroups = filterGroups(groups);

    // Then apply search filter
    const searchFilter = (group: Group) => {
      const combinedText = `${group.name} ${group.internalName ?? ""} ${
        group.type
      }`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return typeFilteredGroups.filter(searchFilter);
  }, [groups, searchTerm, filterGroups]);

  const defaultValues = {
    name: "",
    internalName: "",
    type: "",
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<GroupCreateInput>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
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
      void navigate(`${baseRoute}/${response?.id}`);
      reset();
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

  const onSubmit = (data: GroupCreateInput) => {
    void handleGroupSubmit(data);
  };

  return (
    <Page
      title={t(pageTitleKey)}
      actionButtons={
        showCreateButton ? (
          <>
            <Button
              onClick={handleClickOpen}
              color="primary"
              variant="contained"
            >
              {t("groups.create")}
            </Button>
          </>
        ) : undefined
      }
    >
      <DialogWrapper
        fullWidth
        open={open}
        title={t("groups.dialog.title")}
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
              label={t("common.name")}
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
              label={t("groups.internalName")}
              fullWidth
              {...register("internalName")}
            />
          </Grid>
          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel id="type-label">{t("groups.type")}</InputLabel>
              <Controller
                name="type"
                control={control}
                rules={{ required: `${t("common.required")}` }}
                render={({ field }) => (
                  <Select
                    labelId="type-label"
                    label={t("groups.type")}
                    {...field}
                  >
                    {Object.keys(GroupType).map((key) => {
                      const value = GroupType[key as keyof typeof GroupType];
                      return (
                        <MenuItem key={key} value={value}>
                          {t(`groupType.${key}`)}
                        </MenuItem>
                      );
                    })}
                  </Select>
                )}
              />
            </FormControl>
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
              label={t("groups.search")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Grid>

          <Grid size={12}>
            <StyledDataGrid<Group>
              onRowClick={({ row }) => {
                const id: string = row.id;
                if (id) {
                  void navigate(`${baseRoute}/${id}`);
                }
              }}
              rows={filteredGroups}
              columns={[
                {
                  field: "name",
                  headerName: "Visningsnamn",
                  flex: 0.4,
                },
                {
                  field: "type",
                  headerName: "Typ av grupp",
                  flex: 0.5,
                },
                {
                  field: "internalName",
                  headerName: "Intern namn",
                  flex: 0.3,
                },
              ]}
            />
          </Grid>
        </>
      )}
    </Page>
  );
}
