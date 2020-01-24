import React from "react";
// import PropTypes from "prop-types";
// import { withStyles } from "@material-ui/core/styles";
// import ClearIcon from "@material-ui/icons/Clear";
// import AddCircleOutline from "@material-ui/icons/AddCircleOutline";
// import SearchButton from "../../components/shared/SearchButton";
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

class SearchWithSelectionInput extends React.PureComponent {
  state = {
    selectionDone: false
  };

  componentDidMount() {
    const { model, onSearchDone, localObserver } = this.props;
    localObserver.publish(
      "searchToolChanged",
      "Sök genom att markera objekt i kartan"
    );

    model.selectionSearch(() => {
      this.setState({ selectionDone: true });
    }, onSearchDone);
  }

  // renderInput() {
  //   const { classes, resetToStartView } = this.props;
  //   if (this.state.selectionDone) {
  //     this.input.blur();
  //   }
  //   return (
  //     <div>
  //       <OutlinedInput
  //         className={classes.input}
  //         autoComplete="off"
  //         autoFocus
  //         readOnly
  //         inputRef={input => {
  //           this.input = input;
  //         }}
  //         value={
  //           this.state.selectionDone
  //             ? "Markerat område : 1"
  //             : "Markera objekt i kartan"
  //         }
  //         startAdornment={
  //           <InputAdornment position="start">
  //             <AddCircleOutline />
  //           </InputAdornment>
  //         }
  //         endAdornment={
  //           <InputAdornment position="end">
  //             <ClearIcon
  //               className={classes.clearIcon}
  //               onClick={() => {
  //                 resetToStartView();
  //               }}
  //             />
  //           </InputAdornment>
  //         }
  //       />
  //     </div>
  //   );
  // }

  render() {
    return null;
    // const { classes } = this.props;
    // return (
    //   <div className={classes.root}>
    //     {this.renderInput()}
    //     <SearchButton />
    //   </div>
    // );
  }
}

// SearchWithSelectionInput.propTypes = {
//   classes: PropTypes.object.isRequired
// };

// export default withStyles(styles)(SearchWithSelectionInput);
export default SearchWithSelectionInput;
