import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
}: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <TextField
      fullWidth
      variant="outlined"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      label={t("common.searchLayer")}
      sx={{ marginTop: 3, marginBottom: 3 }}
    />
  );
}
