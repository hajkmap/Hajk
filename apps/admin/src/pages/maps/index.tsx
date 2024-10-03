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
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps, useCreateMap } from "../../api/maps";
import Page from "../../layouts/root/components/page";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";

export default function MapsPage() {
  const [id, setId] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [options, setOptions] = useState<Record<string, string>>({});

  const createMapMutation = useCreateMap();

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
    const { [keyToRemove]: _, ...updatedOptions } = options;
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    createMapMutation.mutate({
      id,
      locked,
      name,
      options,
    });
  };

  const { t } = useTranslation();
  const { data: maps, isLoading } = useMaps();

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
                    <Typography>{map}</Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
            <Grid container gap={2} size={12}>
              <ThemeSwitcher />
              <LanguageSwitcher />
            </Grid>
          </Grid>
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
                      Skapa ny karta
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
                        Error: {(createMapMutation.error as any)?.message}
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
        </>
      )}
    </Page>
  );
}
