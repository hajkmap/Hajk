
var ToolModel = require('tools/tool');

var FirModelProperties = {
    type: 'fir',
    panel: 'firpanel',
    toolbar: 'bottom',
    icon: 'fa fa-home icon',
    title: 'FIR',
    visible: false,
    instruction: ''

};

var FirModel = {

    defaults: FirModelProperties,





    clicked: function(arg){
        this.set('visible', true);
        this.set('toggled', !this.get('toggled'));
    }
};


module.exports = ToolModel.extend(FirModel);