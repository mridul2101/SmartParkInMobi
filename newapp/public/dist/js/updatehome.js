var map;
$(document).ready(function(){
	$('#map_canvas').gmap({'center': '57.7973333,12.0502107', 'zoom': 10, 'disableDefaultUI':true, 'callback': function() {
		var self = this;
		self.addMarker({'position': this.get('map').getCenter() }).click(function() {
			self.openInfoWindow({ 'content': 'Hello World!' }, this);
		});	
	}});
	google.maps.event.trigger($('#map_canvas').get('map'), 'resize');
	$( window ).resize(function() {
		console.log("Hello1");
		console.log("Hello");
	});
});

