import { Box, Chip, IconButton, InputAdornment } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

interface SearchAdornmentProps {
  searchTerm: string;
  hitCount: number;
  highlightColor: string;
  handleClearSearch: () => void;
  minimumSearchLength: number;
}

function SearchAdornment({
  searchTerm,
  hitCount,
  highlightColor,
  handleClearSearch,
  minimumSearchLength,
}: SearchAdornmentProps) {
  return (
    <InputAdornment position="end">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
          minWidth: "60px",
        }}
      >
        {/* Hide Chip if searchTerm length is less than minimumSearchLength */}
        {searchTerm.length >= minimumSearchLength && (
          <Chip
            label={hitCount} // Always show hitCount, even if 0
            size="small"
            sx={{
              backgroundColor: highlightColor,
              color: "#fff",
              fontSize: "0.75rem",
              height: "22px",
              paddingTop: "1px",
              pointerEvents: "none",
            }}
          />
        )}
        <IconButton onClick={handleClearSearch} size="small">
          <ClearIcon />
        </IconButton>
      </Box>
    </InputAdornment>
  );
}

export default SearchAdornment;
