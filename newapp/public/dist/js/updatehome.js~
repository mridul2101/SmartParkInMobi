$( document ).ready(function() {
	function displayPoints(){
		var lon = "78.4800";
			var lat = "12.5667";
			var uri = "http://10.14.121.31:3030/getparklots/13.173706/77.8826809";
			$.get(uri, function(data) {
				alert(data);			    			
			var obj = JSON.parse(data);
			var len = obj.length;
			
			$('#map_canvas').gmap({'zoom': 2, 'disableDefaultUI':true}).bind('init', function(evt, map) { 	
					
			   for(var i=0;i<len;i++){
				var gmapobj = {};
				var lat = obj[i].lat;
				var lon = obj[i].lon;
				var name = obj[i].parkName;
				var parkid = obj[i].parkID;
				name = 'Name: ' + name + '  vacancy: ' + obj[i].avail + '  distance: ' + obj[i].distance + '  time: ' + obj[i].time;
				$('#map_canvas').gmap('addMarker', { 'position': new google.maps.LatLng(lat, lon), 'bounds': true }).click(function() {				
					var uribook = "http://10.14.121.31:3030/bookparking";
					var user = "app_" + Math.floor((Math.random() * 100) + 1);
					$.post(uribook, {parkid: parkid, userid: user, latitude:lat, longitude: lon}, function(data) {
			 			alert(data);
						if(data != "Failed")
							jQuery('#qr').qrcode(data);
					});
					$('#map_canvas').gmap('openInfoWindow', { 'content': name }, this);
					
				});			
			   }
			});	
		});	
	}

	setTimeout(displayPoints, 1000)
	
});

