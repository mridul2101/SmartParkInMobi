
var crypto = require('crypto');
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var uuid = require('uuid');
var config = require('config');
var request = require('request');
var uuid = require('uuid');
var moment = require('moment');

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

var dbURI = config.get('MongoDB.uri');
//console.log(dbURI);

var dbase;
var parkstatus, parking;
MongoClient.connect(dbURI, {auto_reconnect: true}, function(err, database) {
  if(err) logger.error(err);
  else{
	  dbase = database;
	  console.log('connected to database' );
	  parkstatus = dbase.collection('parkstatus');
	  parking = dbase.collection('park');
  }
});

exports.updateParkStatus = function(parkid, max, avail, callback){
	console.log(parkid);
	console.log(max);
	parkstatus.findOne({ parkID: parkid }, function(err, obj){
		if(err)
			callback(err, "Failed");
		else if(!obj){
			var newEntry = [];
                        newEntry.push({ parkID:parkid, maxAvail: parseInt(max), available: parseInt(avail) });
			parkstatus.insert(newEntry, function(err, obj){
				if(err)
					callback(err, "Failed");
				else
					callback(false, "Success");					
			});
		}
		else {
			var updateEntry = [];
                        updateEntry.push({ available: parseInt(avail) });		
			parkstatus.update({ parkID: parkid  }, {$set: updateEntry[0]}, function(err, obj){
				if(err)  callback(err, "Failed");
				else	callback(false, "Success");

			});
		}
		
	});
}

var findDistance = function(lat1, lon1, lat2, lon2, callback){
	
	var uri = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + lat1 + ',' + lon1 +'&destinations=' + lat2 + ',' + lon2 +'&language=en';
	console.log(uri);
	request(uri, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var body = JSON.parse(body);
			
			var distance = body.rows[0].elements[0].distance.text;
			var time = body.rows[0].elements[0].duration.text;
			callback(distance, time, false);
  		}
	});
}


/* Get Available Parklots List */
exports.getParkStatus = function( lat,  lon, callback){
	parkstatus.find({ available: {$gt: 0} }, {_id:0}).toArray(function(err, parklots){
		console.log(parklots);
		var parklist = [];
		//for(var i = 0;i<parklots.length;i++){
		parklots.forEach(function(lot){
			var parkobj = {};
			var avail = lot.available;
			console.log("TEST: " + lot);
			
			parking.findOne({parkID: lot.parkID}, function(err, obj){
				if(err)
					callback(err, "Failed");
				else if(obj){
					console.log("TEST1 : " + obj);
					parkobj.parkID = obj.parkID;
					parkobj.parkName = obj.parkName;
					parkobj.avail = avail;
					findDistance(lat, lon, obj.latitude, obj.longitude, function(distance, time, err){
						if(err)
							callback(err, "Failed");
						else{
							parkobj.distance = distance;
							parkobj.time = time;
							
							parkobj.lat = obj.latitude;
							
							parkobj.lon = obj.longitude;
							parklist.push(parkobj);
							//console.log(parklist);
							if(parklist.length == parklots.length)
								callback(false, parklist);
							console.log("PP : "+parklist);
						}
					});		
				}
			});
		});
		//console.log("Hello");
		//console.log(parklist);
		
		//callback(null, parklots);
        });
}

exports.registerPark = function(source, callback){
	//var source = JSON.parse(source);
	parking.findOne({ parkID: source.parkID }, function(err, obj){
		if(err)
			callback(err, "Failed");
		else if(obj){
			callback(true, "Already Present");
		}
		else{
			var newEntry = [];
                        newEntry.push({ parkID:source.parkID, parkName: source.parkName, latitude: source.latitude, longitude: source.longitude, max: parseInt(source.max), uri: source.uri });
                        parking.insert(newEntry, function(err, obj){
                                if(err)
                                        callback(err, "Failed");
                                else{
					var newEntry1 = [];
					newEntry1.push({ parkID:source.parkID, maxAvail: parseInt(source.max), available: parseInt(source.max)});
					parkstatus.insert(newEntry1, function(err, obj){ 
                                        	if(err)
							callback(err, "Failed");
						else
							callback(null, "Success");
					});
				}
                        });

		}
	});
}


exports.bookParking = function(userid, parkid, lat, lon, callback){
	var bookid = uuid.v1();
	parking.findOne({ parkID: parkid }, function(err, obj){
		if(err)
			callback(true, "Failed");
		else if(obj){
			findDistance(lat, lon, obj.latitude, obj.longitude, function(distance, time, err){
				var booktime = moment().format('MMMM Do YYYY, h:mm:ss a');
				var bookobj = {};
				bookobj.booking_id = bookid;
				bookobj.app_id = userid;
				bookobj.parking_lot_id = parkid;
				bookobj.booking_time = booktime;
				bookobj.time_to_reach = time;
				
				var uri = obj.uri + '/makebooking';
				console.log(uri);
				var r = request.post( uri, {form: bookobj },
					function (error, res, body) {	
						console.log("Error:" + error);
						if (!error && res.statusCode === 200) {	
		  					//response = JSON.parse(body);	
							console.log(body);
							if(body == "\"success\""){
								console.log("Successfull Booking, Booking ID: "+ bookid);
								callback(false, bookid);
							}
							else
								callback(true, "Failed");
						}
				});
			});
		}
		});
	} 





