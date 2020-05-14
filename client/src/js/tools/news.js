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

var ToolModel = require('tools/tool');
var NewsView = require('components/news');

/**
 * @typedef {Object} SearchModel~SearchModelProperties
 * @property {string} type - Default: search
 * @property {string} panel - Default: searchpanel
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-search icon
 * @property {string} title - Default: Sök i kartan
 * @property {string} visible - Default: false
 * @property {string} headerText - Default: 'Information om kartan.'
 * @property {string} text - Default: false
 */
var NewsModelProperties = {
    type: 'news',
    panel: '',
    toolbar: 'top-right',
    icon: 'fa fa-bell fa-lg',
    title: 'Nyhet',
    display: false,
    headerText: 'Nyhet',
    visibleAtStart: '',
    text: '',
    latestShown: '',
    Id: 'nyhetBtn'
};

/**
 * Prototype for creating a search model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {SearchModel~NewsModelProperties} options - Default options
 */
var NewsModel = {
    /**
     * @instance
     * @property {SearchModel~InformationModelProperties} defaults - Default settings
     */
    defaults: NewsModelProperties,


    initialize: function (options) {
        var cat = localStorage.getItem('lastUpdate');
        if(cat == null || cat == ''){
            if(this.get('visibleAtStart')){
                this.set({'display': true});
                this.set({'visibleAtStart': true});
            }else{
                this.set({'display': false});
                this.set({'visibleAtStart': false});
            }
        }else if(this.get('text') + this.get('headerText')!= cat){
            if(this.get('visibleAtStart')){
                this.set({'display': true});
                this.set({'visibleAtStart': true});
            }else{
                this.set({'display': false});
                this.set({'visibleAtStart': false});
            }
        }else{
            this.set({'display': false});
            this.set({'visibleAtStart': false});
        }

        localStorage.setItem('lastUpdate', this.get('text') + this.get('headerText'));
        ToolModel.prototype.initialize.call(this);

        /*var cookies = document.cookie;
        if (cookies.length == 0 || !options.showInfoOnce) {
            // TODO: Titta efter om vi ska använda cookie för att visa informationsrutan endast en gång
            // OBS! json.showInfoOnce kan vara undefined, då ska det fungera som innan cookie användes
            if (options.showInfoOnce) {
                document.cookie = 'seen=true';
            }
        } else {
            this.set({'display': false});
            this.set({'visibleAtStart': false});
        }
        ToolModel.prototype.initialize.call(this);*/
    },

    configure: function (shell) {
        this.set({'display': this.get('visibleAtStart')});
        const element = <NewsView model={this} />;
        ReactDOM.render(
            element,
            document.getElementById('news')
        );
    },
    /**
     * @description
     *
     *   Handle click event on toolbar button.
     *   This handler sets the property visible,
     *   which in turn will trigger the change event of navigation model.
     *   In pracice this will activate corresponding panel as
     *   "active panel" in the navigation panel.
     *
     * @instance
     */
    clicked: function () {
        this.set({
            'display': !this.get('display')
        });
    }
};

/**
 * Search model module.<br>
 * Use <code>require('models/search')</code> for instantiation.
 * @module SearchModel-module
 * @returns {NewsModel}
 */
module.exports = ToolModel.extend(NewsModel);
