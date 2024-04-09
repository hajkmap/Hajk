import React from "react";
import {
  Tooltip,
  Grid,
  Switch,
  FormGroup,
  FormLabel,
  FormControl,
  FormControlLabel,
  Select,
  Chip,
  MenuItem,
  Input,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const ChipsWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
}));

class SearchSettings extends React.PureComponent {
  state = {
    showSearchSourcesFilter: this.props.searchSources.length > 0 ? true : false,
  };

  localUpdateSearchOptions = (name, value) => {
    const { searchOptions } = this.props;
    // Send the new values up to the Search component's state
    this.props.updateSearchOptions({ ...searchOptions, [name]: value });
  };

  render() {
    const { searchOptions, searchSources, searchModel } = this.props;

    const enabledSearchOptions = Array.isArray(this.props.enabledSearchOptions)
      ? this.props.enabledSearchOptions
      : false;

    const showSearchInVisibleLayers =
      !enabledSearchOptions ||
      enabledSearchOptions.includes("searchInVisibleLayers");
    const showWildcardAtStart =
      !enabledSearchOptions || enabledSearchOptions.includes("wildcardAtStart");
    const showWildcardAtEnd =
      !enabledSearchOptions || enabledSearchOptions.includes("wildcardAtEnd");
    const showMatchCase =
      !enabledSearchOptions || enabledSearchOptions.includes("matchCase");
    const showActiveSpatialFilter =
      !enabledSearchOptions ||
      enabledSearchOptions.includes("activeSpatialFilter");
    const showEnableLabelOnHighlight =
      !enabledSearchOptions ||
      enabledSearchOptions.includes("enableLabelOnHighlight");

    return (
      <Grid container spacing={2} direction="column">
        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">Generella sökinställningar</FormLabel>
            <FormGroup>
              <Tooltip
                disableInteractive
                title="Slå på för att välja vilka datakällor som sökningen kommer göras i. Om reglaget är i off-läget kommer sökningen att ske i alla tillgänliga sökkällor."
              >
                <FormControlLabel
                  label="Begränsa sökkällor"
                  control={
                    <Switch
                      checked={this.state.showSearchSourcesFilter}
                      onChange={(e) => {
                        // Pull out the new value
                        const showSearchSourcesFilter = e.target.checked;

                        // Set state to reflect in Switch's UI
                        this.setState({
                          showSearchSourcesFilter,
                        });

                        // Now, if user has turned off this setting, ensure
                        // that we also clean all search sources
                        if (showSearchSourcesFilter === false)
                          this.props.setSearchSources([]);
                      }}
                      color="primary"
                    />
                  }
                />
              </Tooltip>
              {this.state.showSearchSourcesFilter && (
                <Grid container spacing={2}>
                  <Grid item xs>
                    <Select
                      fullWidth
                      labelId="demo-mutiple-chip-label"
                      multiple
                      value={searchSources}
                      onChange={(event) =>
                        this.props.setSearchSources(event.target.value)
                      }
                      input={<Input id="select-multiple-chip" />}
                      renderValue={(selected) => (
                        <ChipsWrapper>
                          {selected.map((option) => (
                            <Chip
                              key={option.id}
                              label={option.caption}
                              sx={{ margin: 0.25 }}
                            />
                          ))}
                        </ChipsWrapper>
                      )}
                    >
                      {searchModel
                        .getSources()
                        .sort((a, b) => a.caption.localeCompare(b.caption))
                        .map((source) => (
                          <MenuItem key={source.id} value={source}>
                            {source.caption}
                          </MenuItem>
                        ))}
                    </Select>
                  </Grid>
                </Grid>
              )}
            </FormGroup>
            {showSearchInVisibleLayers && (
              <FormGroup>
                <Tooltip title="Om aktivt kommer sökningen att ske i lager som är inställda för sökning av systemadministratören och som är synliga.">
                  <FormControlLabel
                    label="Sök endast i synliga lager"
                    control={
                      <Switch
                        checked={searchOptions.searchInVisibleLayers}
                        onChange={() => {
                          this.localUpdateSearchOptions(
                            "searchInVisibleLayers",
                            !searchOptions.searchInVisibleLayers
                          );
                        }}
                        color="primary"
                      />
                    }
                  />
                </Tooltip>
              </FormGroup>
            )}
          </FormControl>
        </Grid>

        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              Inställningar för textsökning
            </FormLabel>
            <FormGroup>
              {showWildcardAtStart && (
                <Tooltip
                  disableInteractive
                  title="Om aktivt kommer en sökning på 'väg' även ge träffar på exempelvis 'storväg'."
                >
                  <FormControlLabel
                    label="Wildcard före"
                    control={
                      <Switch
                        checked={searchOptions.wildcardAtStart}
                        onChange={() =>
                          this.localUpdateSearchOptions(
                            "wildcardAtStart",
                            !searchOptions.wildcardAtStart
                          )
                        }
                        color="primary"
                      />
                    }
                  />
                </Tooltip>
              )}
              {showWildcardAtEnd && (
                <Tooltip
                  disableInteractive
                  title="Om aktivt kommer en sökning på 'väg' även ge träffar på exempelvis 'vägen'."
                >
                  <FormControlLabel
                    label="Wildcard efter"
                    control={
                      <Switch
                        checked={searchOptions.wildcardAtEnd}
                        onChange={() =>
                          this.localUpdateSearchOptions(
                            "wildcardAtEnd",
                            !searchOptions.wildcardAtEnd
                          )
                        }
                        color="primary"
                      />
                    }
                  />
                </Tooltip>
              )}
              {showMatchCase && (
                <Tooltip
                  disableInteractive
                  title="Om aktivt kommer en sökning på 'a' inte ge träffar på 'A'. Inaktivera för att söka oberoende av gemener/versaler."
                >
                  <FormControlLabel
                    label="Skiftlägeskänslighet"
                    control={
                      <Switch
                        checked={searchOptions.matchCase}
                        onChange={() =>
                          this.localUpdateSearchOptions(
                            "matchCase",
                            !searchOptions.matchCase
                          )
                        }
                        color="primary"
                      />
                    }
                  />
                </Tooltip>
              )}
            </FormGroup>
          </FormControl>
        </Grid>

        {showActiveSpatialFilter && (
          <Grid item xs>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                Spatiala sökinställningar
              </FormLabel>
              <FormGroup>
                <Tooltip
                  disableInteractive
                  title="Om aktivt kommer hela objektet (exempelvis en fastigheten) behöva rymmas inom sökområdet för att komma med i resultatet. Om inaktivt räcker det att endast en liten del av objektet ryms inom, eller nuddar vid, sökområdet."
                >
                  <FormControlLabel
                    label="Kräv att hela objektet ryms inom sökområde"
                    control={
                      <Switch
                        checked={searchOptions.activeSpatialFilter === "within"}
                        onChange={() =>
                          this.localUpdateSearchOptions(
                            "activeSpatialFilter",
                            searchOptions.activeSpatialFilter === "intersects"
                              ? "within"
                              : "intersects"
                          )
                        }
                        color="primary"
                      />
                    }
                  />
                </Tooltip>
              </FormGroup>
            </FormControl>
          </Grid>
        )}

        {showEnableLabelOnHighlight && (
          <Grid item xs>
            <FormControl component="fieldset">
              <FormLabel component="legend">Visning av resultat</FormLabel>
              <FormGroup>
                <Tooltip
                  disableInteractive
                  title="Om aktivt kommer en etikett att visas i kartan intill det markerade sökresultatet"
                >
                  <FormControlLabel
                    label="Visa textetikett i kartan"
                    control={
                      <Switch
                        checked={searchOptions.enableLabelOnHighlight}
                        onChange={() =>
                          this.localUpdateSearchOptions(
                            "enableLabelOnHighlight",
                            !searchOptions.enableLabelOnHighlight
                          )
                        }
                        color="primary"
                      />
                    }
                  />
                </Tooltip>
              </FormGroup>
            </FormControl>
          </Grid>
        )}
      </Grid>
    );
  }
}

export default SearchSettings;
