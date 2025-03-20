import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import ConfirmationDialog from "../../components/ConfirmationDialog";

// Hooks
import useUpdateEffect from "../../hooks/useUpdateEffect";
import useCookieStatus from "../../hooks/useCookieStatus";
import HajkToolTip from "components/HajkToolTip";
import { Grid } from "@mui/material";

const List = styled("div")(() => ({
  display: "flex",
  flex: "1 0 100%",
  flexFlow: "column nowrap",
  marginTop: "10px",
}));

const ListItem = styled("div")(({ theme }) => ({
  display: "flex",
  position: "relative",
  flex: "1 0 100%",
  justifyContent: "flex-start",
  border: `1px solid ${theme.palette.grey[400]}`,
  transform: "translateZ(1px)",
  borderBottom: "none",
  "&:first-of-type": {
    borderRadius: "3px 3px 0 0",
  },
  "&:last-child": {
    borderBottom: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: "0 0 3px 3px",
  },
}));

const AddButton = styled(Button)(() => ({
  flex: "1 0 auto",
  whiteSpace: "nowrap",
  height: "0%",
  top: "-22px",
  marginLeft: "10px",
}));

const BookmarkButton = styled(Button)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  flex: "1 0 100%",
  transform: "translateZ(1px)",
  "& svg": {
    color: theme.palette.text.secondary,
  },
  "&:hover svg.on": {
    opacity: 0.7,
  },
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  display: "block",
  position: "absolute",
  top: 0,
  right: 0,
  padding: "5px",
  width: "36px",
  height: "36px",
  borderRadius: "100% 0 0 100%",
  "&:hover svg": {
    color: theme.palette.error.dark,
    stoke: theme.palette.error.dark,
    fill: theme.palette.error.dark,
  },
}));

const BookmarkIconSpan = styled("span")(({ theme }) => ({
  display: "inline-block",
  position: "relative",
  width: "24px",
  height: "24px",
  marginRight: "8px",
  "& .on": {
    position: "absolute",
    top: "0",
    left: "0",
    width: "24px",
    height: "24px",
    color: theme.palette.text.secondary,
    stoke: theme.palette.text.secondary,
    fill: theme.palette.text.secondary,
    opacity: 0.001,
    transition: "all 300ms",
  },
}));

const ItemNameSpan = styled("span")(() => ({
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "calc(100% - 71px)",
  textTransform: "none",
}));

const StyledDeleteIcon = styled(DeleteIcon)(() => ({
  display: "block",
  width: "24px",
  height: "24px",
  transition: "all 300ms",
}));

const BookmarksView = (props) => {
  const { globalObserver } = props;
  const { functionalCookiesOk } = useCookieStatus(globalObserver);

  const [name, setName] = React.useState("");
  const [error, setError] = React.useState(false);
  const [helperText, setHelperText] = React.useState(" ");
  const [bookmarks, setBookmarks] = React.useState({});
  const [showRemovalConfirmation, setShowRemovalConfirmation] =
    React.useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = React.useState(null);

  // Update bookmarks when model changes.
  useUpdateEffect(() => {
    setBookmarks(props.model.bookmarks);
  }, [props.model.bookmarks]);

  const addBookmark = (e) => {
    if (name.trim() === "") {
      return;
    }
    props.model.addBookmark(name, true);

    setName("");
    checkBookmarkName("");
  };

  const openBookmark = (bookmark) => {
    props.model.setMapState(bookmark);
  };

  const deleteBookmark = (id) => {
    setShowRemovalConfirmation(true);
    setBookmarkToDelete(id);
  };

  const checkBookmarkName = (name) => {
    if (name.trim() === "") {
      setError(false);
      setHelperText(" ");
      return false;
    }

    const exists = props.model.bookmarkWithNameExists(name);

    if (exists) {
      setError(true);
      setHelperText(`Namnet upptaget. Ersätt bokmärke "${name}"?`);
      return false;
    } else {
      setError(false);
      setHelperText(" ");
      return true;
    }
  };

  const handleChange = (event) => {
    setName(event.target.value);
  };

  const handleKeyUp = (e) => {
    checkBookmarkName(e.target.value);

    if (e.nativeEvent.keyCode === 13 /* Enter, yes we all know... */) {
      addBookmark();
    }
  };

  const handleRemoveConfirmation = () => {
    setShowRemovalConfirmation(false);
    props.model.deleteBookmark(bookmarkToDelete);
    setBookmarkToDelete(null);
  };

  const handleRemoveConfirmationAbort = () => {
    setShowRemovalConfirmation(false);
  };

  const renderCookiesWarning = () => {
    return (
      <div>
        <Typography sx={{ marginBottom: 1 }}>
          Du har inte tillåtit funktionella kakor. För att kunna spara bokmärken
          måste du tillåta funktionella kakor.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={props.model.handleChangeCookieSettingsClick}
        >
          Cookie-inställningar
        </Button>
      </div>
    );
  };

  return functionalCookiesOk ? (
    <div>
      <Typography sx={{ marginBottom: 1 }}>
        Skapa ett bokmärke med kartans synliga lager, aktuella zoomnivå och
        utbredning.
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexFlow: "row nowrap",
          alignItems: "flex-end",
          width: "100%",
          gap: 2,
        }}
      >
        <Grid container alignItems="flex-end" justifyContent="space-between">
          <Grid item xs={8}>
            <HajkToolTip
              title="Ange ett namn för bokmärket."
              PopperProps={{
                modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
              }}
            >
              <TextField
                placeholder="Skriv bokmärkets namn"
                label="Namn"
                value={name}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
                error={error}
                helperText={helperText}
                sx={{ flexGrow: 1, width: "100%" }}
                variant="standard"
                fullWidth
              ></TextField>
            </HajkToolTip>
          </Grid>
          <Grid
            item
            xs={3}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            <HajkToolTip
              title="Klicka för att spara bokmärket."
              PopperProps={{
                modifiers: [{ name: "offset", options: { offset: [0, -40] } }],
              }}
            >
              <AddButton
                variant="contained"
                color="primary"
                size="small"
                startIcon={error ? null : <AddCircleOutlineIcon />}
                onClick={addBookmark}
              >
                {error ? "Ersätt" : "Lägg till"}
              </AddButton>
            </HajkToolTip>
          </Grid>
        </Grid>
      </Box>

      <List>
        {Object.keys(bookmarks).map((id) => {
          const bookmark = bookmarks[id];
          return (
            <ListItem key={id}>
              <BookmarkButton onClick={() => openBookmark(bookmark)}>
                <BookmarkIconSpan>
                  <BookmarkOutlinedIcon />
                  <BookmarkIcon className="on" />
                </BookmarkIconSpan>
                <ItemNameSpan>{id}</ItemNameSpan>
              </BookmarkButton>
              <DeleteButton
                aria-label="Ta bort"
                size="large"
                onClick={() => deleteBookmark(id)}
              >
                <StyledDeleteIcon fontSize="small" />
              </DeleteButton>
            </ListItem>
          );
        })}
        <ConfirmationDialog
          open={showRemovalConfirmation === true}
          titleName={"Radera bokmärke"}
          contentDescription={`Är du säker på att du vill radera bokmärket "${bookmarkToDelete}"?`}
          cancel={"Avbryt"}
          confirm={"Radera"}
          handleConfirm={handleRemoveConfirmation}
          handleAbort={handleRemoveConfirmationAbort}
        />
      </List>
    </div>
  ) : (
    renderCookiesWarning()
  );
};

BookmarksView.propTypes = {
  model: PropTypes.object.isRequired,
};

export default BookmarksView;
