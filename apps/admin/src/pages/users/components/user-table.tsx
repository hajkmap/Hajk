import { useMemo, useState } from "react";
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
import { useDebounce } from "use-debounce";

import { Role, User } from "../../../api/users";
import { useDeleteUser, useUsers } from "../../../api/users/hooks";
import useAppStateStore from "../../../store/use-app-state-store";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../../i18n/translations/datagrid/sv";
import UserListFilterPanel from "./user-list-filter-panel";

const PAGE_SIZE = 5;

export default function UserTable() {
  const language = useAppStateStore((state) => state.language);
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [searchString, setSearchString] = useState("");
  const [debouncedSearchString] = useDebounce(searchString, 200);

  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const deleteUserMutation = useDeleteUser();

  const columns = [
    { field: "fullName", flex: 1, headerName: t("user.name") },
    { field: "email", flex: 1, headerName: t("user.email") },
    {
      field: "roles",
      headerName: t("user.roles"),
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
              email: params.row.fullName,
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

  const filteredUsers = useMemo(() => {
    return !users
      ? []
      : users.filter((user) => {
          return (
            debouncedSearchString === "" ||
            Object.values(user).some((value) => {
              return (
                (typeof value === "string" &&
                  value
                    .toLowerCase()
                    .includes(debouncedSearchString.toLowerCase())) ||
                (value &&
                  typeof value === "object" &&
                  Object.values(user).some(
                    (v) =>
                      typeof v === "string" &&
                      v
                        .toLowerCase()
                        .includes(debouncedSearchString.toLowerCase())
                  ))
              );
            })
          );
        });
  }, [users, debouncedSearchString]);

  return (
    <>
      <UserListFilterPanel
        searchString={searchString}
        setSearchString={setSearchString}
      />
      <DataGrid<User>
        rows={filteredUsers}
        columns={columns}
        loading={usersLoading}
        localeText={language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined}
        disableRowSelectionOnClick
        sx={{ maxWidth: "100%" }}
        initialState={{
          pagination: { paginationModel: { pageSize: PAGE_SIZE } },
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        autoHeight={true}
        hideFooterPagination={users && users.length <= PAGE_SIZE}
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
          {`${t("user.deleteAccount")} ${userToDelete?.email ?? ""}?`}
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
