import React, { Component } from "react";
import Button from '@material-ui/core/Button'; 
import TextField from '@material-ui/core/TextField';

class Collector extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      text: ""
    };  
  }
  
  save = () => {
    console.log("Save", this.state);
  }

  handleChange = (name) => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };
  

  render() {    
    return (
      <div>        
        <div className="cross">
          <i className="material-icons">trip_origin</i>
        </div>
        <TextField
          rows="2"
          multiline="true"
          id="comment"
          label="Kommentar"
          value={this.state.comment}
          onChange={this.handleChange('comment')}
          margin="normal"
        /><br/>
        <Button color="primary" variant="contained" onClick={this.save()}>Spara</Button>
      </div>
    )
  }
}

export default Collector;