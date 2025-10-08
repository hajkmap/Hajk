import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  getDatabaseStatus,
  checkDatabaseTools,
  exportDatabase,
  importDatabase,
} from "./requests";
import useAuth from "../../hooks/use-auth";

export const useDatabaseStatus = () => {
  return useQuery({
    queryKey: ["database-status"],
    queryFn: getDatabaseStatus,
  });
};

export const useDatabaseTools = () => {
  return useQuery({
    queryKey: ["database-tools"],
    queryFn: checkDatabaseTools,
  });
};

export const useExportDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exportDatabase,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["database-status"] });
    },
  });
};

export const useImportDatabase = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: importDatabase,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["database-status"] });

      if (data.requiresLogout) {
        toast.info(t("database.import.logoutToast"), {
          autoClose: 7000,
        });

        setTimeout(async () => {
          const message = t("database.import.loginPageMessage");

          sessionStorage.setItem("databaseImportMessage", message);

          await logout();
          await navigate("/login", {
            state: {
              message: message,
            },
          });
        }, 2000);
      }
    },
  });
};
