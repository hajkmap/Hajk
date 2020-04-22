import React from "react";
import {
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  makeStyles
} from "@material-ui/core";

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.handleOnChange = this.handleOnChange.bind(this);

    //this.searchModel = props.app.appModel.searchModel;
  }

  handleOnChange(e) {
    this.props.onSearchStringChange(e.target.value);
  }

  render() {
    return (
      <Paper>
        <TextField
          variant="outlined"
          placeholder="Skriv eller välj bland förslagen nedan..."
          value={this.props.searchString}
          onChange={this.handleOnChange}
        />
      </Paper>
    );
  }
}

export default SearchBar;
