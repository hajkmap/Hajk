import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";

export const useToastifyOptions = () => {
  const { t } = useTranslation();
  const { palette } = useTheme();

  return (errorMsg: string, successMsg: string) => ({
    onError: () =>
      toast.error(t(errorMsg), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      }),
    onSuccess: () => {
      toast.success(t(successMsg), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    },
  });
};
