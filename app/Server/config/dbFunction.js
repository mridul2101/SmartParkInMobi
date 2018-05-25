
var config = require('config');
var log4js = require('log4js');
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

var dbURI = config.get('MongoDB.uri');
var dbase;
var accounts, signups, devices, apps, device, sensor;

var logger = log4js.getLogger('[DB-OP]');
MongoClient.connect(dbURI, {auto_reconnect: true}, function(err, database) {
  if(err) logger.error(err);
  else{
	  dbase = database;
	  logger.info('connected to database' );
	  accounts = dbase.collection("accounts");
	  signups = dbase.collection("signups");
	  apps = dbase.collection("apps");
  	  device = dbase.collection('device');
	  sensor = dbase.collection('sensor');		
  }
});
	

exports.insertDB = function(key, obj, callback){
  switch (key) {
    case "accounts":
        	accounts.insert(obj, {safe:true}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "signups":
        	signups.insert(obj, {safe:true}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "apps":
        	apps.insert(obj, {safe:true}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "device":
        	device.insert(obj, {safe:true}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "sensor":
        	sensor.insert(obj, {safe:true}, function(err, records) {
			callback(err, records);
		});
        	break;
    default:
     		console.log("Wrong key");
       		break;
  }	
}

exports.updateDB = function(key, query, obj, callback){
  switch (key) {
    case "accounts":
        	accounts.update(query, {$set: obj}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "signups":
        	signups.update(query, {$set: obj}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "apps":
        	apps.update(query, {$set: obj}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "device":
        	device.update(query, {$set: obj}, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "sensor":
        	sensor.update(query, {$set: obj}, function(err, records) {
			callback(err, records);
		});
        	break;
    default:
     		console.log("Wrong key");
       		break;
  }	
}

exports.selectDB = function(key, query, projection, callback){
  switch (key) {
    case "accounts":
        	accounts.findOne(query, projection, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "signups":
        	signups.findOne(query, projection, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "apps":
        	apps.findOne(query, projection, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "device":
        	device.findOne(query, projection, function(err, records) {
			callback(err, records);
		});
       		 break;
    case "sensor":
        	sensor.findOne(query, projection, function(err, records) {
			callback(err, records);
		});
        	break;
    case "deviceall":
        	device.find(query, projection).toArray(function(err, records){
			callback(err, records);
		});
       		 break;
    case "sensorall":
        	sensor.find(query, projection).toArray(function(err, records){
			callback(err, records);
		});
        	break;
    default:
     		console.log("Wrong key");
       		break;
  }	
}

exports.distinctDB = function(key, field, query, callback){
  switch (key) {
    case "device":
        	device.distinct(field, query, function(err, records) {
			callback(err, records);
		});
       		 break;    
    default:
     		console.log("Wrong key");
       		break;
  }	
}



