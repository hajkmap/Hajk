import React, { Component } from "react";
//import Button from '@material-ui/core/Button'; 
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
    if (!this.props.visible) return null;    
    return (
      <div>        
        <TextField
          id="comment"
          label="Kommentar"
          value={this.state.comment}
          onChange={this.handleChange('comment')}
          margin="normal"
        />
      </div>
    )
  }
}

export default Collector;