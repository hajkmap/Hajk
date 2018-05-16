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

ol.interaction.Drag = function () {
  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.Drag.prototype.handleDownEvent,
    handleDragEvent: ol.interaction.Drag.prototype.handleDragEvent,
    handleMoveEvent: ol.interaction.Drag.prototype.handleMoveEvent,
    handleUpEvent: ol.interaction.Drag.prototype.handleUpEvent
  });

  this.coordinate_ = null;

  this.cursor_ = 'pointer';

  this.feature_ = null;

  this.layer_ = null;

  this.previousCursor_ = undefined;
};

ol.inherits(ol.interaction.Drag, ol.interaction.Pointer);

ol.interaction.Drag.prototype.pause = function () {
  this.paused = true;
};

ol.interaction.Drag.prototype.resume = function () {
  this.paused = false;
};

var acceptedLayers = {
  'preview-layer': true
};

ol.interaction.Drag.prototype.addAcceptedLayer = function (layerName) {
  acceptedLayers[layerName] = layerName;
};

ol.interaction.Drag.prototype.removeAcceptedLayer = function (layerName) {
  delete acceptedLayers[layerName];
};

ol.interaction.Drag.prototype.isDraggable = function (layer) {
  return layer ? acceptedLayers.hasOwnProperty(layer.getProperties().name) || layer.dragLocked === false : true;
};

ol.interaction.Drag.prototype.handleDownEvent = function (evt) {
  var map = evt.map,
    feature;

  this.layer_ = undefined;

  feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
    this.layer_ = layer;
    return feature;
  });

  if (feature && this.isDraggable(this.layer_)) {
    this.coordinate_ = evt.coordinate;
    this.feature_ = feature;
  } else {
    if (this.layer_) { this.layer_.dragLocked = true; }
    feature = false;
    this.feature_ = false;
  }

  return !!feature;
};

ol.interaction.Drag.prototype.handleDragEvent = function (evt) {
  var map = evt.map,
    deltaX = 0,
    deltaY = 0,
    geometry;

  if (this.paused) {
    return;
  }

  deltaX = evt.coordinate[0] - this.coordinate_[0];
  deltaY = evt.coordinate[1] - this.coordinate_[1];

  this.coordinate_[0] = evt.coordinate[0];
  this.coordinate_[1] = evt.coordinate[1];

  if (this.layer_ && this.layer_.getProperties().name !== 'highlight-wms') {
    this.feature_.getGeometry().translate(deltaX, deltaY);
  }
};

ol.interaction.Drag.prototype.handleMoveEvent = function (evt) {
  if (this.cursor_) {
    var featureLayer = '',
      map = evt.map,
      feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        featureLayer = layer;
        return feature;
      }),
      element = evt.map.getTargetElement();

    if (feature && feature.getProperties().user === true) {
      if (element.style.cursor != this.cursor_) {
        this.previousCursor_ = element.style.cursor;
        element.style.cursor = this.cursor_;
      }
    } else if (this.previousCursor_ !== undefined) {
      element.style.cursor = this.previousCursor_;
      this.previousCursor_ = undefined;
    }
  }
};

ol.interaction.Drag.prototype.handleUpEvent = function (evt) {
  this.coordinate_ = null;
  this.feature_ = null;
  return false;
};

module.exports = ol.interaction.Drag;
