/**
 * BRIEF DESCRIPTION
 * =================
 *
 * --- SEARCH MODEL ---
 * App initiates the search model so it's available to the rest of the application,
 * probably exposed as "this.app.searchModel" from our plugin's perspective.
 *
 * The Search Model (this.app.searchModel) exposes the following methods:
 *  async doAutocompleteLookup(text)
 *  async doSearch([searchString string], [spatialFilter geom])
 *  abort() // both autocomplete and search, or separate abort methods for each of them?
 *
 * The Search Model reads the map config and sets up WFS search sources.
 *
 * Any search plugin (whether Hajk's standard or some other implementation) can use
 * Search Model in a following manner:
 *  - User starts typing. For each searchField.onChange-event our plugin
 *    calls "await this.app.searchModel.doAutocompleteLookup(searchField.value)".
 *  - When autocomplete results arrive they are handled and rendered properly, as
 *    desired by the given plugin. Please note that the autocomplete could also be
 *    skipped entirely.
 *  - Next user can do something that will mean that our plugin wants to invoke
 *    the actual search. (It could be that user clicks the search button, presses enter
 *    or clicks on a autocomplete item.) When this happens, our plugin calls
 *    "await this.app.searchModel.doSearch()" with proper parameters.
 *      - If we're just doing regular search, we supply the value of
 *        search field as parameter to doSearch().
 *      - If we want to limit the search spatially, we (somehow) read the geom
 *        and supply as a second parameter to doSearch().
 *      - If we want to search in visible layers only, we must be able to send
 *        that info to our search model too. Could be done by getting the list
 *        visible layers from our ol.Map, and supplying that array as an option
 *        to doSearch(). In that case, doSearch will filter search sources to
 *        only include those that are supplied in this array of visible layers.
 *  - No matter which of the above is used, calling "await this.app.searchModel.doSearch()"
 *    will always resolve into a Promise that contains some data: the search results. Those
 *    must be displayed for the user somehow. (It could also be that we want to do something
 *    more, such as zoom into the first result. But implementation of that functionality should
 *    be done in each specific search plugin.)
 *  - So at this step, we have got some results back to our plugin and those are ready
 *    to be displayed for the user. Our search plugin takes care of this by looping the
 *    resulting object, styling and formatting and finally rendering the results list.
 *  - It is up to the plugin as well to set up listeners for items in the results list. One
 *    common listener would be a click listener on each item that will zoom in to the
 *    clicked result.
 *  - Each search plugin should be able to abort any ongoing search. This is achieved by calling
 *    this.app.searchModel.abort() at any given time. It is, of course, up to the search plugin
 *    to implement necessary UI element (typically a button) that will abort ongoing searches.
 *  - Please note that clearing the search results is NOT something that the Search Model should
 *    care about. Instead it's entirely up to the implementing plugin to handle different user
 *    actions (and hiding the results list is such an action). **The Search Model must only care
 *    about supplying autocomplete, supplying search results and aborting those two.**
 *
 *
 * --- SEARCH COMPONENT ---
 *
 * App loads this Component if so configured by admin.
 *
 * Search Component enters the constructor phase.
 *
 * Listeners and event handlers are setup.
 *
 * Listeners:
 *  search.populateAutocomplete
 *  search.populateResultsList
 *  search.addFunctionality
 *
 * Event handlers:
 *  User types -> search.stringChanged
 *  User aborts search -> search.aborted
 *  ...
 *
 * --- PLUGIN WITH SEARCH FUNCTIONALITY ---
 *
 * Plugins are loaded by app. If plugin wants to expose
 * search functionality, add something or in some way take
 * care of search results, the following must be implemented
 * the plugin.
 *
 * Plugin subscribes to minimum these events:
 *  search.stringChanged
 *  search.aborted
 *
 * This way the plugin knows whether user types into search box
 * or cancels the search. From here, plugin can take care of whatever
 * it whishes to do with the current value of search field. The
 * normal thing would be that it reads the value, does some magic
 * and then gets some results back.
 *
 * In this case, the results must be sent back to Search in a
 * standardized manner. For this the plugin publishes this event:
 *  search.populateAutocomplete
 * if we have implemented autocomplete and have something to offer, or:
 *  search.populateResultsList
 * if user have pressed "search" and we want the actual results
 * and not only autocomplete values.
 *
 * The values sent back must be standardized. Perhaps something like this:
 * [{
 *  label: string
 *  geom: // whatever to mark/select in map
 * }, ...]
 */

//
// *https://www.registers.service.gov.uk/registers/country/use-the-api*
import React, { useEffect, useRef, useState } from "react";

import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import Draw from "ol/interaction/Draw";
import GeoJSON from "ol/format/GeoJSON";

import {
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  makeStyles,
  Checkbox
} from "@material-ui/core";

import Autocomplete from "@material-ui/lab/Autocomplete";
import ToggleButton from "@material-ui/lab/ToggleButton";
import Divider from "@material-ui/core/Divider";

import MenuIcon from "@material-ui/icons/Menu";
import FormatSizeIcon from "@material-ui/icons/FormatSize";
import SearchIcon from "@material-ui/icons/Search";
import BrushTwoToneIcon from "@material-ui/icons/BrushTwoTone";
import WithinIcon from "@material-ui/icons/Adjust";
import IntersectsIcon from "@material-ui/icons/Toll";

import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

const useStyles = makeStyles(theme => ({
  iconButtons: {
    padding: 10
  }
}));
const SearchBar = props => {
  const classes = useStyles();

  // Grab some stuff from props
  const { menuButtonDisabled, onMenuClick } = props;
  const searchModel = props.app.appModel.searchModel;

  // Autocomplete state
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const loading = open && options.length === 0;

  // Settings to be sent to SearchModel
  const [wildcardAtStart, setWildcardAtStart] = useState(false);
  const [wildcardAtEnd, setWildcardAtEnd] = useState(true);
  const [matchCase, setMatchCase] = useState(false);
  const [activeSpatialFilter, setActiveSpatialFilter] = useState("intersects");

  // Layer to draw into (spatial search)
  const [drawActive, setDrawActive] = useState(false);
  const drawInteraction = useRef();
  const drawSource = useRef();
  const drawLayer = useRef();

  // Layer to visualize results
  const resultsSource = useRef();
  const resultsLayer = useRef();

  const map = useRef(props.map);

  const drawStyle = useRef(
    new Style({
      stroke: new Stroke({
        color: "rgba(255, 214, 91, 0.6)",
        width: 4
      }),
      fill: new Fill({
        color: "rgba(255, 214, 91, 0.2)"
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: "rgba(255, 214, 91, 0.6)",
          width: 2
        })
      })
    })
  );

  // For Search Sources Autocomplete
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;
  const [searchSources, setSearchSources] = useState(searchModel.getSources());

  useEffect(() => {
    drawSource.current = new VectorSource({ wrapX: false });
    drawLayer.current = new VectorLayer({
      source: drawSource.current,
      style: drawStyle.current
    });

    // Add layer that will be used to allow user draw on map - used for spatial search
    map.current.addLayer(drawLayer.current);
  }, []);

  useEffect(() => {
    resultsSource.current = new VectorSource({ wrapX: false });
    resultsLayer.current = new VectorLayer({
      source: resultsSource.current
      // style: drawStyle.current
    });

    map.current.addLayer(resultsLayer.current);
  }, []);

  const toggleDraw = (
    active,
    type = "Polygon",
    freehand = false,
    drawEndCallback
  ) => {
    if (active) {
      drawInteraction.current = new Draw({
        source: drawSource.current,
        type: type,
        freehand: freehand,
        stopClick: true,
        style: drawStyle.current
      });

      map.current.clicklock = true;
      map.current.addInteraction(drawInteraction.current);
    } else {
      map.current.removeInteraction(drawInteraction.current);
      map.current.clicklock = false;
      drawSource.current.clear();
    }
  };

  const handleClickOnDrawToggle = () => {
    setDrawActive(prevState => {
      toggleDraw(!prevState);
      return !prevState;
    });
  };

  useEffect(() => {
    const searchString = document.getElementById("searchInputField").value;
    if (searchString.length > 3) return undefined;

    let active = true;

    if (!loading) {
      return undefined;
    }

    (async () => {
      console.log("Getting Autocomplete for: ", searchString);
      const autocompleteList = await searchModel.getAutocomplete(searchString);
      console.log(
        "Got this back to populate autocomplete with: ",
        autocompleteList
      );

      if (active) {
        setOptions(autocompleteList);
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, searchModel]);

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  function addFeaturesToResultsLayer(featureCollections) {
    // Start with cleaning up
    resultsSource.current.clear();

    const features = featureCollections.map(fc =>
      fc.features.map(f => {
        const geoJsonFeature = new GeoJSON().readFeature(f);
        return geoJsonFeature;
      })
    );

    features.map(f => resultsSource.current.addFeatures(f));
    const currentExtent = resultsSource.current.getExtent();

    // If the extent doesn't include any "Infite" values, let's go on - else abort zooming
    if (currentExtent.map(Number.isFinite).includes(false) === false) {
      map.current.getView().fit(currentExtent, {
        size: map.current.getSize(),
        maxZoom: 7
      });
    }
  }

  async function doSearch(searchString) {
    // Grab existing search options from model
    const searchOptions = searchModel.getSearchOptions();

    // Apply our custom options based on user's selection
    searchOptions["activeSpatialFilter"] = activeSpatialFilter; // "intersects" or "within"
    searchOptions["featuresToFilter"] = drawSource.current.getFeatures();
    searchOptions["matchCase"] = matchCase;
    searchOptions["wildcardAtStart"] = wildcardAtStart;
    searchOptions["wildcardAtEnd"] = wildcardAtEnd;

    console.log("doSearch: ", searchString, searchSources, searchOptions);
    const results = await searchModel.getResults(
      searchString,
      searchSources, // this is a state variable!
      searchOptions
    );
    console.log("doSearch results: ", results);

    addFeaturesToResultsLayer(results);
  }

  function handleClickOnSearch() {
    const searchString = document.getElementById("searchInputField").value;
    doSearch(searchString);
  }

  /**
   * @summary Triggered when user selects a value/presses [Enter]. Makes a call and gets the actual search results.
   *
   * @param {Object} event
   * @param {String} value
   * @param {String} reason
   */
  function handleOnChange(event, value, reason) {
    // "value" can be String (if freeSolo) or Object (if autocomplete entry selected)
    // We must ensure that we grab the string either way.
    const searchString = value?.autocompleteEntry || value;
    doSearch(searchString);
  }
  /**
   * @summary Triggered each time user changes input field value (e.g. onKeyPress etc). Makes a call to get the autocomplete list.
   *
   * @param {Object} event
   * @param {String} value
   * @param {String} reason
   */
  function handleOnInputChange(event, value, reason) {
    console.log("Current input value", value);
    setOpen(value.length >= 3);
  }

  const tooltipText = menuButtonDisabled
    ? "Du måste först låsa upp verktygspanelen för kunna klicka på den här knappen. Tryck på hänglåset till vänster."
    : "Visa verktygspanelen";

  return (
    <Paper className={classes.root}>
      <Autocomplete
        id="searchInputField"
        style={{ width: 500 }}
        freeSolo
        clearOnEscape
        // open={open}
        // onOpen={e => {
        //   console.log("onOpen: ", e);
        //   // setOpen(true);
        // }}
        // onClose={(e, r) => {
        //   console.log("onClose: ", e, r);
        //   // setOpen(false);
        // }}
        onChange={handleOnChange}
        onInputChange={handleOnInputChange}
        getOptionSelected={(option, value) =>
          option.autocompleteEntry === value.autocompleteEntry
        }
        getOptionLabel={option => option?.autocompleteEntry || option}
        groupBy={option => option.dataset}
        options={options}
        loading={loading}
        renderInput={params => (
          <TextField
            {...params}
            label={undefined}
            variant="outlined"
            placeholder="Skriv eller välj bland förslagen nedan..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <Tooltip title={tooltipText}>
                  <span id="drawerToggler">
                    <IconButton
                      onClick={onMenuClick}
                      className={classes.iconButton}
                      disabled={menuButtonDisabled}
                      aria-label="menu"
                    >
                      <MenuIcon size={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              ),
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                  <ToggleButton
                    value="wildcardAtStart"
                    selected={wildcardAtStart}
                    onChange={() => setWildcardAtStart(!wildcardAtStart)}
                  >
                    *.
                  </ToggleButton>
                  <ToggleButton
                    value="wildcardAtEnd"
                    selected={wildcardAtEnd}
                    onChange={() => setWildcardAtEnd(!wildcardAtEnd)}
                  >
                    .*
                  </ToggleButton>
                  <ToggleButton
                    value="matchCase"
                    selected={matchCase}
                    onChange={() => setMatchCase(!matchCase)}
                  >
                    <FormatSizeIcon />
                  </ToggleButton>
                  <Divider orientation="vertical" />
                  <ToggleButton
                    value="drawActive"
                    selected={drawActive}
                    onChange={handleClickOnDrawToggle}
                  >
                    <BrushTwoToneIcon />
                  </ToggleButton>
                  <ToggleButton
                    value="activeSpatialFilter"
                    selected={activeSpatialFilter === "intersects"}
                    onChange={() =>
                      setActiveSpatialFilter(
                        activeSpatialFilter === "intersects"
                          ? "within"
                          : "intersects"
                      )
                    }
                  >
                    {activeSpatialFilter === "intersects" ? (
                      <IntersectsIcon />
                    ) : (
                      <WithinIcon />
                    )}
                  </ToggleButton>
                  <IconButton onClick={handleClickOnSearch}>
                    <SearchIcon />
                  </IconButton>
                </>
              )
            }}
          />
        )}
      />
      <Autocomplete
        onChange={(event, value, reason) => {
          setSearchSources(value);
        }}
        value={searchSources}
        multiple
        id="searchSources"
        options={searchModel.getSources()}
        disableCloseOnSelect
        getOptionLabel={option => option.caption}
        renderOption={(option, { selected }) => (
          <>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.caption}
          </>
        )}
        style={{ width: 500 }}
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            // label="Sökkällor"
            placeholder="Välj sökkälla"
          />
        )}
      />
    </Paper>
  );
};

export default SearchBar;
