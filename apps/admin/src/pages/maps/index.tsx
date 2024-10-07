import { useState } from "react";
import Grid from "@mui/material/Grid2";
import {
  List,
  ListItem,
  Paper,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateIcon from "@mui/icons-material/Update";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import {
  useMaps,
  useCreateMap,
  useDeleteMap,
  useUpdateMap,
} from "../../api/maps";
import Page from "../../layouts/root/components/page";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";

export default function MapsPage() {
  const { t } = useTranslation();
  const { data: maps, isLoading } = useMaps();

  const [id, setId] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [options, setOptions] = useState<Record<string, string>>({});

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMapName, setCurrentMapName] = useState<string | null>(null);
  const createMapMutation = useCreateMap();
  const updateMapMutation = useUpdateMap();
  const deleteMapMutation = useDeleteMap();

  const handleDeleteMap = (mapName: string) => {
    deleteMapMutation.mutate(mapName);
  };

  const handleOptionChange = (key: string, value: string) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [key]: value,
    }));
  };

  const handleAddOption = () => {
    const newKey = `key${Object.keys(options).length + 1}`;
    setOptions((prevOptions) => ({
      ...prevOptions,
      [newKey]: "",
    }));
  };

  const handleRemoveOption = (keyToRemove: string) => {
    const updatedOptions = Object.fromEntries(
      Object.entries(options).filter(([key]) => key !== keyToRemove)
    );
    setOptions(updatedOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentMapName) {
      // Update existing map
      updateMapMutation.mutate({
        mapName: currentMapName,
        data: {
          id,
          locked,
          name,
          options,
        },
      });
    } else {
      createMapMutation.mutate({
        id,
        locked,
        name,
        options,
      });
    }
  };

  const handleOpenDialog = (mapName: string | null = null) => {
    if (mapName) {
      const mapToEdit = maps?.find((map: string) => map === mapName);
      if (mapToEdit) {
        setCurrentMapName(mapToEdit);
      }
    } else {
      setCurrentMapName(null);
      setId(0);
      setLocked(false);
      setName("");
      setOptions({});
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <Page title={t("common.maps")}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Grid size={12}>
            <Typography variant="h2" textAlign="center">
              {t("common.maps")}
              {maps && ` (${maps.length})`}
            </Typography>

            <List>
              {maps?.map((map) => (
                <ListItem key={map} sx={{ padding: "10px 10px 10px 0" }}>
                  <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography>{map}</Typography>
                      <IconButton
                        sx={{ marginLeft: "auto" }}
                        aria-label="update"
                        onClick={() => handleOpenDialog(map)} // Open dialog for updating
                      >
                        <UpdateIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteMap(map)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                </ListItem>
              ))}
            </List>
            <Grid container gap={2} size={12}>
              <ThemeSwitcher />
              <LanguageSwitcher />
            </Grid>
          </Grid>
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Skapa Karta</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid size={12}>
                <Paper
                  elevation={3}
                  style={{
                    padding: "20px",
                    marginTop: "20px",
                    maxWidth: "600px",
                  }}
                >
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Typography variant="h5" gutterBottom>
                          Skapa Karta
                        </Typography>
                      </Grid>

                      <Grid size={12}>
                        <TextField
                          fullWidth
                          type="number"
                          label="ID"
                          value={id}
                          onChange={(e) => setId(Number(e.target.value))}
                          variant="outlined"
                        />
                      </Grid>

                      <Grid size={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={locked}
                              onChange={(e) => setLocked(e.target.checked)}
                            />
                          }
                          label="Locked"
                        />
                      </Grid>

                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          variant="outlined"
                        />
                      </Grid>

                      <Grid size={12}>
                        <Typography variant="h6">
                          Options (Key-Value Pairs):
                        </Typography>
                        {Object.entries(options).map(([key, value], index) => (
                          <Grid
                            container
                            spacing={2}
                            key={index}
                            alignItems="center"
                          >
                            <Grid size={5}>
                              <TextField
                                fullWidth
                                label={`Key ${index + 1}`}
                                value={key}
                                onChange={(e) => {
                                  const newKey = e.target.value;

                                  const { [key]: oldValue, ...restOptions } =
                                    options;
                                  setOptions({
                                    ...restOptions,
                                    [newKey]: oldValue,
                                  });
                                }}
                                variant="outlined"
                                sx={{ marginTop: "1.5rem" }}
                              />
                            </Grid>
                            <Grid size={5}>
                              <TextField
                                fullWidth
                                label={`Value ${index + 1}`}
                                value={value}
                                onChange={(e) =>
                                  handleOptionChange(key, e.target.value)
                                }
                                variant="outlined"
                                sx={{ marginTop: "1.5rem" }}
                              />
                            </Grid>
                            <Grid size={2}>
                              <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleRemoveOption(key)}
                              >
                                Remove
                              </Button>
                            </Grid>
                          </Grid>
                        ))}

                        <Button
                          variant="outlined"
                          onClick={handleAddOption}
                          style={{ marginTop: "1rem" }}
                        >
                          Add Option
                        </Button>
                      </Grid>

                      <Grid size={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          fullWidth
                        >
                          Create
                        </Button>
                      </Grid>

                      {createMapMutation.status === "pending" && (
                        <Grid size={12}>
                          <Typography>Creating map...</Typography>
                        </Grid>
                      )}
                      {createMapMutation.isError && (
                        <Grid size={12}>
                          <Typography color="error">
                            Error:{" "}
                            {createMapMutation.error instanceof Error
                              ? createMapMutation.error.message
                              : "An unexpected error occurred"}
                          </Typography>
                        </Grid>
                      )}
                      {createMapMutation.isSuccess && (
                        <Grid size={12}>
                          <Typography color="primary">
                            Map created successfully!
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </form>
                </Paper>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Dialog for updating maps */}
          <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
            <DialogTitle>Uppdatera Karta</DialogTitle>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="ID"
                      value={id}
                      onChange={(e) => setId(Number(e.target.value))}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={locked}
                          onChange={(e) => setLocked(e.target.checked)}
                        />
                      }
                      label="Locked"
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="h6">
                      Options (Key-Value Pairs):
                    </Typography>
                    {Object.entries(options).map(([key, value], index) => (
                      <Grid
                        container
                        spacing={2}
                        key={index}
                        alignItems="center"
                      >
                        <Grid size={5}>
                          <TextField
                            fullWidth
                            label={`Key ${index + 1}`}
                            value={key}
                            onChange={(e) => {
                              const newKey = e.target.value;

                              const { [key]: oldValue, ...restOptions } =
                                options;
                              setOptions({
                                ...restOptions,
                                [newKey]: oldValue,
                              });
                            }}
                            variant="outlined"
                            sx={{ marginTop: "1.5rem" }}
                          />
                        </Grid>
                        <Grid size={5}>
                          <TextField
                            fullWidth
                            label={`Value ${index + 1}`}
                            value={value}
                            onChange={(e) =>
                              handleOptionChange(key, e.target.value)
                            }
                            variant="outlined"
                            sx={{ marginTop: "1.5rem" }}
                          />
                        </Grid>
                        <Grid size={2}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleRemoveOption(key)}
                          >
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    ))}

                    <Button
                      variant="outlined"
                      onClick={handleAddOption}
                      style={{ marginTop: "1rem" }}
                    >
                      Add Option
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" onClick={handleSubmit} color="primary">
                Update
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Page>
  );
}
