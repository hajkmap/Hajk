import React from "react";
// import PropTypes from "prop-types";
// import { withStyles } from "@material-ui/core/styles";
// import Edit from "@material-ui/icons/Edit";
// import SearchButton from "../../components/shared/SearchButton";
// import ClearIcon from "@material-ui/icons/Clear";
// import InputAdornment from "@material-ui/core/InputAdornment";
// import { OutlinedInput } from "@material-ui/core";

// const styles = theme => ({
//   clearIcon: {
//     cursor: "pointer"
//   },
//   input: {
//     flex: "auto"
//   },
//   root: {
//     display: "flex",
//     flex: "auto"
//   }
// });

class SearchWithPolygonInput extends React.PureComponent {
  state = {
    polygonDrawn: false
  };
  componentDidMount() {
    const { model, onSearchDone, localObserver } = this.props;
    localObserver.publish(
      "searchToolChanged",
      "Sök genom att rita en polygon i kartan"
    );
    model.polygonSearch(
      () => {
        this.setState({ polygonDrawn: true });
      },
      featureCollections => {
        onSearchDone(featureCollections);
      }
    );
  }

  // renderInput() {
  //   const { classes, resetToStartView } = this.props;

  //   if (this.state.polygonDrawn) {
  //     this.input.blur();
  //   }

  //   return (
  //     <OutlinedInput
  //       className={classes.input}
  //       autoComplete="off"
  //       autoFocus
  //       readOnly
  //       value={
  //         this.state.polygonDrawn ? "Ritat område : 1" : "Rita objekt i kartan"
  //       }
  //       inputRef={input => {
  //         this.input = input;
  //       }}
  //       startAdornment={
  //         <InputAdornment position="start">
  //           <Edit />
  //         </InputAdornment>
  //       }
  //       endAdornment={
  //         <InputAdornment position="end">
  //           <ClearIcon
  //             className={classes.clearIcon}
  //             onClick={() => {
  //               resetToStartView();
  //             }}
  //           />
  //         </InputAdornment>
  //       }
  //     />
  //   );
  // }

  render() {
    // const { classes } = this.props;
    return null;
    //   // <div className={classes.root}>
    //   //   {this.renderInput()}
    //   //   <SearchButton />
    //   // </div>
    //   <>Kör!</>
    // );
  }
}

// SearchWithPolygonInput.propTypes = {
//   classes: PropTypes.object.isRequired
// };

// export default withStyles(styles)(SearchWithPolygonInput);
export default SearchWithPolygonInput;
