import { useState } from "react";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import { Role, User } from "../../../api/users";
import { useDeleteUser, useUsers } from "../../../api/users/hooks";
import useAppStateStore from "../../../store/use-app-state-store";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../../i18n/translations/datagrid/sv";

export default function UserTable() {
  const language = useAppStateStore((state) => state.language);
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  const deleteUserMutation = useDeleteUser();

  const columns = [
    { field: "fullName", flex: 1, headerName: "Name" },
    { field: "email", flex: 1, headerName: "Email" },
    {
      field: "roles",
      headerName: "Roles",
      flex: 1,
      valueGetter: (value: Role[]) => value.map((v) => t(v.title)).join(", "),
      renderCell: (params: GridRenderCellParams<User, string>) => {
        return (
          <>
            {params.row.roles.map((role) => (
              <Chip key={role.id} label={t(role.title)} size="small" />
            ))}
          </>
        );
      },
    },
    {
      field: "delete",
      headerName: "",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<User, string>) => (
        <Button
          color="error"
          size="small"
          onClick={() =>
            setUserToDelete({
              id: params.row.id,
              fullName: params.row.fullName,
            })
          }
        >
          <DeleteIcon />
        </Button>
      ),
    },
  ];

  const handleDeleteUserConfirmationClick = () => {
    deleteUserMutation.mutate(userToDelete?.id ?? "", {
      onError: () =>
        toast.error(t("user.deleteUserFailed"), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        }),
      onSuccess: () => {
        toast.success(t("user.deleteUserSuccess"), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      },
    });
    setUserToDelete(null);
  };

  return (
    <>
      <DataGrid<User>
        rows={users ?? []}
        columns={columns}
        loading={usersLoading}
        localeText={language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined}
        disableRowSelectionOnClick
        sx={{ maxWidth: "100%" }}
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        autoHeight={true}
        slotProps={{
          pagination: {
            showFirstButton: true,
            showLastButton: true,
          },
        }}
      />
      <Dialog
        open={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        aria-labelledby="delete-user-dialog-title"
        aria-describedby="delete-user-dialog-description"
      >
        <DialogTitle id="delete-user-dialog-title">
          {`${t("common.delete")} ${userToDelete?.fullName ?? ""}s ${t(
            "common.account"
          ).toLowerCase()}?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-user-dialog-description">
            {t("user.deleteConfirmation")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserToDelete(null)} variant="contained">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleDeleteUserConfirmationClick}
            autoFocus
            variant="contained"
            color="error"
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
