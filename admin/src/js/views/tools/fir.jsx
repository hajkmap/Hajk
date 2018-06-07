import React from 'react';
import { Component } from 'react';

var defaultState = {
    validationErrors: [],
    active: false,
    index: 0,
    instruction: '',
    visibleForGroups: []
};

class ToolOptions extends Component {
    /**
     *
     */
    constructor () {
        super();
        this.state = defaultState;
        this.type = 'routing';
    }

    componentDidMount () {
        var tool = this.getTool();
        if (tool) {
            this.setState({
                active: true,
                authActive: this.props.parent.props.parent.state.authActive,
                index: tool.index,
                instruction: tool.options.instruction,
                visibleForGroups: tool.options.visibleForGroups ? tool.options.visibleForGroups : []
            });
        } else {
            this.setState({
                active: false
            });
        }
    }

    componentWillUnmount () {
    }
    /**
     *
     */
    componentWillMount () {
    }

    handleInputChange (event) {
        var target = event.target;
        var name = target.name;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        if (typeof value === 'string' && value.trim() !== '') {
            value = !isNaN(Number(value)) ? Number(value) : value;
        }

        if (name == 'instruction') {
            value = btoa(value);
        }
        this.setState({
            [name]: value
        });
    }

    getTool () {
        return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
    }

    add (tool) {
        this.props.model.get('toolConfig').push(tool);
    }

    remove (tool) {
        this.props.model.set({
            'toolConfig': this.props.model.get('toolConfig').filter(tool => tool.type !== this.type)
        });
    }

    replace (tool) {
        this.props.model.get('toolConfig').forEach(t => {
            if (t.type === this.type) {
                t.options = tool.options;
                t.index = tool.index;
            }
        });
    }

    save () {
        var tool = {
            'type': this.type,
            'index': this.state.index,
            'options': {
                'instruction': this.state.instruction,
                'visibleForGroups': this.state.visibleForGroups.map(Function.prototype.call, String.prototype.trim)
            }
        };

        var existing = this.getTool();

        function update () {
            this.props.model.updateToolConfig(this.props.model.get('toolConfig'), () => {
                this.props.parent.props.parent.setState({
                    alert: true,
                    alertMessage: 'Uppdateringen lyckades'
                });
            });
        }

        if (!this.state.active) {
            if (existing) {
                this.props.parent.props.parent.setState({
                    alert: true,
                    confirm: true,
                    alertMessage: 'Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?',
                    confirmAction: () => {
                        this.remove();
                        update.call(this);
                        this.setState(defaultState);
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

    handleAuthGrpsChange (event) {
        const target = event.target;
        const value = target.value;
        let groups = [];

        try {
            groups = value.split(',');
        } catch (error) {
            console.log(`Någonting gick fel: ${error}`);
        }

        this.setState({
            visibleForGroups: value !== '' ? groups : []
        });
    }

    renderVisibleForGroups () {
        if (this.props.parent.props.parent.state.authActive) {
            return (
                <div>
                    <label htmlFor='visibleForGroups'>Tillträde</label>
                    <input id='visibleForGroups' value={this.state.visibleForGroups} type='text' name='visibleForGroups' onChange={(e) => { this.handleAuthGrpsChange(e); }} />
                </div>
            );
        } else {
            return null;
        }
    }

    /**
     *
     */
    render () {
        return (
            <div>
                <form>
                    <p>
                        <button className='btn btn-primary' onClick={(e) => { e.preventDefault(); this.save(); }}>Spara</button>
                    </p>
                    <div>
                        <input
                            id='active'
                            name='active'
                            type='checkbox'
                            onChange={(e) => { this.handleInputChange(e); }}
                            checked={this.state.active} />&nbsp;
                        <label htmlFor='active'>Aktiverad</label>
                    </div>
                    <div>
                        <label htmlFor='index'>Sorteringsordning</label>
                        <input
                            id='index'
                            name='index'
                            type='text'
                            onChange={(e) => { this.handleInputChange(e); }}
                            value={this.state.index} />
                    </div>
                    <div>
                        <label htmlFor='instruction'>Instruktion</label>
                        <textarea
                            type='text'
                            id='instruction'
                            name='instruction'
                            onChange={(e) => { this.handleInputChange(e); }}
                            value={this.state.instruction ? atob(this.state.instruction) : ''}
                        />
                    </div>
                    {this.renderVisibleForGroups()}
                </form>
            </div>
        );
    }
}

export default ToolOptions;
