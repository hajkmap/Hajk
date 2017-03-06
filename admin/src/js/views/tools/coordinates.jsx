import React from "react";
import { Component } from "react";

var defaultState = {
  validationErrors: [],
  transformations: [],
  active: false
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "coordinates";
  }

  componentDidMount() {
    if (this.getTool()) {
      this.setState({
        active: true,
        transformations: this.getTool().options.transformations || []
      });
    } else {
      this.setState({
        active: false
      });
    }
  }

  componentWillUnmount() {
  }
  /**
   *
   */
  componentWillMount() {
  }

  activeChanged(e) {
    this.setState({
      active: e.target.checked
    });
  }

  getTool() {
    return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove(tool) {
    this.props.model.set({
      "toolConfig": this.props.model.get("toolConfig").filter(tool => tool.type !== this.type)
    });
  }

  replace(tool) {
    this.props.model.get('toolConfig').forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
      }
    });
  }

  save() {

    var tool = {
      "type": this.type,
      "options": {
        transformations: this.state.transformations
      }
    };

    var existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(this.props.model.get("toolConfig"), () => {
        this.props.parent.props.parent.setState({
          alert: true,
          alertMessage: "Uppdateringen lyckades"
        });
      });
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage: "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          confirmAction: () => {
            this.remove();
            update.call(this);
            this.setState({
              transformations: []
            });
          }
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }

  }

  addTransformation(e) {
    var elements = this.refs.transformationForm.elements
    ,   transformation = {
      "code": elements["code"].value,
      "default": elements["default"].checked,
      "hint": elements["hint"].value,
      "title": elements["title"].value,
      "xtitle": elements["xtitle"].value,
      "ytitle": elements["ytitle"].value,
      "inverseAxis": elements["inverseAxis"].checked
    };
    this.state.transformations.push(transformation);
    this.setState({
      transformations: this.state.transformations
    });
  }

  removeTransformation(code) {
    this.state.transformations = this.state.transformations.filter(f => f.code !== code);
    this.setState({
      transformations: this.state.transformations
    });
  }

  renderTransformations() {
    return this.state.transformations.map((t, i) => (
        <div key={i} className="inset-form">
          <div>
            <span onClick={() => this.removeTransformation(t.code)} className="btn btn-danger">Ta bort</span>
          </div>
          <div><span>SRS-kod</span>: <span>{t.code}</span></div>
          <div><span>Standard</span>: <span>{t.default ? "Ja" : "Nej"}</span></div>
          <div><span>Beskrivning</span>: <span>{t.hint}</span></div>
          <div><span>Titel</span>: <span>{t.title}</span></div>
          <div><span>X-ettikett</span>: <span>{t.xtitle}</span></div>
          <div><span>Y-ettikett</span>: <span>{t.ytitle}</span></div>
          <div><span>Inverterad</span>: <span>{t.inverseAxis ? "Ja" : "Nej"}</span></div>
        </div>
    ));
  }

  /**
   *
   */
  render() {
    return (
      <div>
        <p>
          <button className="btn btn-primary" onClick={() => this.save()}>Spara</button>
        </p>
        <div>
          <input
            id="active"
            name="active"
            type="checkbox"
            onChange={(e) => {this.activeChanged(e)}}
            checked={this.state.active}>
          </input>&nbsp;
          <label htmlFor="active">Aktiverad</label>
        </div>
        <div>
          <div>Transformationer</div>
          {this.renderTransformations()}
        </div>
        <div>
          <form ref="transformationForm" onSubmit={(e) => { e.preventDefault(); this.addTransformation(e) }}>
            <div>
              <label>SRS-kod*</label><input name="code" type="text"/>
            </div>
            <div>
              <label>Standard*</label><input name="default" type="checkbox" />
            </div>
            <div>
              <label>Beskrivning*</label><input name="hint" type="text" />
            </div>
            <div>
              <label>Titel*</label><input name="title" type="text" />
            </div>
            <div>
              <label>X-etikett*</label><input name="xtitle" type="text" />
            </div>
            <div>
              <label>Y-etikett*</label><input name="ytitle" type="text" />
            </div>
            <div>
              <label>Inverterad</label><input name="inverseAxis" type="checkbox" />
            </div>
            <button className="btn btn-success">Lägg till</button>
          </form>
        </div>
      </div>
    )
  }

}

export default ToolOptions;
