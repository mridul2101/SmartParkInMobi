$( document ).ready(function() {
	alert("Start");
	var lon = "78.4800";
	var lat = "12.5667";
	var uri = "http://localhost:3030/hello";
	var response = '';
	  var request = makeHttpObject();
	request.open("GET", uri, false);
	request.send(null);
	alert(request.responseText);
});

