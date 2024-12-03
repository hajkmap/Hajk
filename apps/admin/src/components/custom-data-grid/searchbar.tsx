import React from "react";
import { TextField } from "@mui/material";

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  return (
    <TextField
      label={placeholder}
      variant="outlined"
      value={value}
      onChange={onChange}
      sx={{ width: "100%", label: { color: "gray" } }}
      size="small"
    />
  );
};

export default SearchBar;
