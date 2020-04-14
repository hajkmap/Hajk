// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

/**
 * @class
 */
var NewsView = {

    componentDidMount: function () {
        this.props.model.on('change:display', () => {
            this.setState({
                display: this.props.model.get('display')
            });
        });
        this.setState({
            display: this.props.model.get('display')
        });
    },

    componentWillUnMount: function () {
        this.props.model.off('change:display');
    },

    /**
     * Close the infomraiton box
     * @instance
     * @return {external:ReactElement}
     */
    close: function () {
        this.props.model.set('display', false);
    },

    /** lo
     * Render the legend item component.
     * @instance
     * @return {external:ReactElement}
     */
    render: function () {
        if (this.state && this.state.display) {
            var infoContent = this.props.model.get('text');
            if (this.props.model.get('base64EncodeForInfotext')) {
                infoContent = atob(infoContent.replace(/\s/g, ''));
            }

            return (
                <div id='blanket'>
                    <div id='container'>
                        <div key='a' id='header'>{this.props.model.get('headerText')}
                            <i className='fa fa-times pull-right clickable panel-close' id='close' onClick={this.close} />
                        </div>
                        <div id='body-wrapper'>
                            <div key='b' id='body' dangerouslySetInnerHTML={{__html: infoContent}} />
                        </div>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
};

/**
 * LegendView module.<br>
 * Use <code>require('views/legend')</code> for instantiation.
 * @module LegendView-module
 * @returns {NewsView}
 */
module.exports = React.createClass(NewsView);
