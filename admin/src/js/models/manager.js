
var manager = Backbone.Model.extend({

	getWMSCapabilities: function (url, callback) {

		var url = "/util/proxy/geturl/" + url;

		$.ajax(url, {
			data: {
				service: 'WMS',
				request: 'GetCapabilities'
			},
			success: function (data) {
				var response = (new ol.format.WMSCapabilities()).read(data);
				callback(response);
			}
		});

	},

	hello: function () {
		console.log("hello");
	}

});

module.exports = new manager();