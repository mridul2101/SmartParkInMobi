var operation = require('./dbOperation');

/* Register Device Query Formation */
exports.registerDevice = function(accesskey, metadata, callback){
	
	try {
	  var deviceobj = JSON.parse(metadata);
	  operation.registerDevice(accesskey, deviceobj.Metadata, function(err, msg, res){
		callback(err, msg, res);			
	});
	} 
	catch (e) {
	  callback(true, "Send Metadata in JSON Format", null);
	}	
}

/* Register Sensor Query Formation */
exports.registerSensor = function(metadata, callback){
     try{
	var sensorobj = JSON.parse(metadata);	
	operation.registerSensor(sensorobj.Metadata, function(err, msg, res){
		callback(err, msg, res);			
	});	
     } 
     catch (e) {
	callback(true, "Send Metadata in JSON Format", null);
     }
}

exports.getCampusList = function(callback){
	operation.getCampusList(function(err, campus){
		callback(err, campus);		
	});	

}

exports.getSensorList = function(campus, callback){
	operation.getSensorList(campus, function(err, sensor){
		callback(err, sensor);		
	});	

}

