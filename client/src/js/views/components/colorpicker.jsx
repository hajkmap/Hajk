var ColorPicker = {
  /*
   * @property {Array{string}} colors
   */
  colors: [
    "rgb(77, 77, 77)",
    "rgb(153, 153, 153)",
    "rgb(255, 255, 255)",
    "rgb(244, 78, 59)",
    "rgb(254, 146, 0)",
    "rgb(252, 220, 0)",
    "rgb(219, 223, 0)",
    "rgb(164, 221, 0)",
    "rgb(104, 204, 202)",
    "rgb(15, 175, 255)",
    "rgb(174, 161, 255)",
    "rgb(253, 161, 255)",
    "rgb(51, 51, 51)",
    "rgb(128, 128, 128)",
    "rgb(204, 204, 204)",
    "rgb(211, 49, 21)",
    "rgb(226, 115, 0)",
    "rgb(252, 196, 0)",
    "rgb(176, 188, 0)",
    "rgb(104, 188, 0)",
    "rgb(22, 165, 165)",
    "rgb(0, 156, 224)",
    "rgb(123, 100, 255)",
    "rgb(250, 40, 255)",
    "rgb(0, 0, 0)",
    "rgb(102, 102, 102)",
    "rgb(179, 179, 179)",
    "rgb(159, 5, 0)",
    "rgb(196, 81, 0)",
    "rgb(251, 158, 0)",
    "rgb(128, 137, 0)",
    "rgb(25, 77, 51)",
    "rgb(12, 121, 125)",
    "rgb(0, 98, 177)",
    "rgb(101, 50, 148)",
    "rgb(171, 20, 158)"
  ],
  /*
   * Abort any operation and deselect any tool
   * when the components unmounts.
   * @return {objct} state
   */
  getInitialState: function() {
    return {
      color: this.props.model.get(this.props.property)
    };
  },
  /*
   * @override
   */
  componentWillReceiveProps: function () {
    // TODO:
    // The stack trace seems messed up here.
    // The value in the model is not correct at the time of render,
    // the model switches the values and keeps the last set value.
    // This is solved by setTimeout 0, to put the call
    // at the bottom of the stack. But anyway, its considered a bug.
    setTimeout(() => {
      this.setState({
        color: this.props.model.get(this.props.property)
      });
    }, 0);
  },
  /*
   * Set the current color of the component.
   * @param {ol.event} event
   */
  setColor: function (event) {
    var reg   = /rgb[a]?\(.*\)/
    ,   value = reg.exec(event.target.style.background)

    if (value && value[0]) {
      this.setState({
        color: value[0]
      });
      this.props.onChange(value[0]);
    }
  },
  /*
   * Get current color.
   * @return {string} color
   */
  getColor: function () {
    return this.state.color;
  },
  /*
   * Render the color map component.
   * @return {React.Component} component
   */
  renderColorMap: function () {
    return this.colors.map((color, i) => {
      var black = "rgb(0, 0, 0)"
      ,   gray  = "rgb(150, 150, 150)"
      ,   white = "rgb(255, 255, 255)"
      ,   style = {
        width:        "22px",
        height:       "22px",
        display:      "inline-block",
        margin:       "2px",
        background:   color,
        border:       color === this.state.color ?
                      color === black ? "2px solid " + gray : "2px solid " + black :
                      color === white ? "2px solid " + gray : "2px solid " + color
      };
      return <div onClick={this.setColor} key={i} style={style}></div>
    });
  },
  /*
   * Render the colorpicker tool.
   * @return {React.Component} component
   */
  render: function () {
    var colorMap = this.renderColorMap();
    var noColor = this.props.noColor
    ? (
        <div>
          <label htmlFor="no-color">Ingen bakgrund</label>&nbsp;
          <input checked={this.state.color === "rgba(0, 0, 0, 0)"} id="no-color" onChange={() => {
            this.setColor({
              target: {
                style: {
                  background: "rgba(0, 0, 0, 0)"
                }
              }
            })
          }} type="checkbox"></input>
        </div>
      )
    : "";
    return (
      <div>
        <div className="swatch">
          {colorMap}
        </div>
        {noColor}
      </div>
    )
  }
};

module.exports = React.createClass(ColorPicker);