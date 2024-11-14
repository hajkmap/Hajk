import Grid from "@mui/material/Grid2";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

interface Props {
  searchString: string;
  setSearchString: (arg: string) => void;
}

export default function UserListFilterPanel(props: Props) {
  return (
    <Grid container sx={{ mb: 2 }}>
      <TextField
        sx={{ width: "100%" }}
        id="user-search"
        value={props.searchString}
        label="Sök användare"
        onChange={(e) => {
          props.setSearchString(e.target.value);
        }}
        variant="outlined"
        slotProps={{
          input: {
            endAdornment:
              props.searchString.length > 0 ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="reset request search field"
                    onClick={() => props.setSearchString("")}
                    onMouseDown={() => props.setSearchString("")}
                    edge="end"
                    sx={{ mr: 1 }}
                  >
                    {<ClearIcon />}
                  </IconButton>
                </InputAdornment>
              ) : null,
          },
        }}
      />
    </Grid>
  );
}
