
var crypto = require('crypto');
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var moment = require('moment');
var uuid = require('uuid');
var config = require('config');
var log4js = require('log4js');
var email_manager = require('./email-dispatcher');

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

//log4js.loadAppender('file');
//log4js.addAppender(log4js.appenders.file('logs/dboperation.log'), '[DB-OP]');
var logger = log4js.getLogger('[DB-OP]');
var dbURI = config.get('MongoDB.uri');

var dbase;
var accounts, signups, devices, apps, device, sensor;

/* establish the database connection */
/*var dbHost = config.get('MongoDB.hosturi');
var dbPort = config.get('MongoDB.port');
var dbName = 'sensorDB';

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
    db.open(function(err, conn){
    if (err) {
        logger.error(err);
    }	else{
        logger.info('connected to database : ' + dbName);
    }
});*/

MongoClient.connect(dbURI, {auto_reconnect: true}, function(err, database) {
  if(err) logger.error(err);
  else{
	  dbase = database;
	  logger.info('connected to database' );
	  accounts = dbase.collection("accounts");
	  signups = dbase.collection("signups");
	  devices = dbase.collection("device");
	  apps = dbase.collection("apps");
  	  device = dbase.collection('device');
	  sensor = dbase.collection('sensor');
  }
});

// setInterval(connectDB, 100*1000);

/* User/Device Account management */

/* my login code */

exports.genDeviceKeys = function(username, callback){
        var newDevice = {};
        newDevice.deviceID = uuid.v1();
	var secretkey = crypto.randomBytes(20).toString('hex');
        newDevice.secretKey = saltAndHashPass(secretkey);
        newDevice.ownerID = username;
        newDevice.registered = false;
        devices.insert(newDevice, {safe:true}, function(e,o){
            if(e){
                callback(e);
            }
            else{
		var returnDevice = {};
		returnDevice.deviceID = newDevice.deviceID;
		returnDevice.secretKey = secretkey;
                callback(null, returnDevice);
            }
        });    
}

/* sign-up via email verification */
var genAndSendVerificationLink = function(username, email, callback){
    verificationLink = username + ":" + crypto.randomBytes(20).toString('hex');
    email_manager.dispatchEmail(email, verificationLink, function(e,o){
        if(e){
            callback(e);
        }
        else{
            console.log('email success');
            callback(null, verificationLink);
        }

    });
}

exports.newAppSignUp = function(username, password, appname, email, callback)
{
    apps.findOne({username:username}, function(e,o){
        if(e){
            callback(e);
        }
        else if(o){
            console.log('app-username exists');
            callback('app-username exists');
        }
        else{
//            apps.findOne({email:email}, function(e,o){
//                if(e){
//                    callback(e);
//                }
//                else if(o){
//                    console.log('email exists');
//                    callback('email exists');
//                }
//                else{
                    console.log('app-email available');
                    var newAppSignup = {};
                    newAppSignup.username = username;
                    newAppSignup.password = saltAndHashPass(password);
                    newAppSignup.appname = appname;
                    newAppSignup.email = email;
                    newAppSignup.date = moment().format('MMMM Do YYYY, h:mm:ss a');
                    apps.insert(newAppSignup, {safe:true}, callback);
//                }
//            });
        }

    });
}

exports.newSignUp = function(username, password, name, email, userLocation, callback)
{
    accounts.findOne({username:username}, function(e,o){
        if(e){
            callback(e);
        }
        else if(o){
            console.log('username exists');
            callback('username exists');
        }
        else{
//            accounts.findOne({email:email}, function(e,o){
//                if(o){
//                    callback('email exists');
//                }
//                else{
            console.log('username available');
            var newSignup = {};
            newSignup.username = username;
            newSignup.name = name;
            newSignup.password = saltAndHashPass(password);
            newSignup.email = email;
            newSignup.userLocation = userLocation;
            newSignup.date = moment().format('MMMM Do YYYY, h:mm:ss a');
            genAndSendVerificationLink(username, email, function(e,o){
                if(e){
                    callback(e);
                }
                else{
                    newSignup.verificationLink = o;
                    signups.insert(newSignup, {safe:true}, callback);
                }
            });
//                }
//            });
        }
    });
}

var splitVerificationLink = function(verificationLink){
    var splitLink = verificationLink.split(":");
    return splitLink[0];
}

exports.verifyEmail = function(verificationLink, callback)
{
    username = splitVerificationLink(verificationLink);
    console.log(verificationLink);
    accounts.findOne({username:username}, function(e,o){
        if(e){
            callback(e);
        }
        else if(o){
            console.log('username exists');
            callback('username exists');
        }
        else{
            signups.findOne({username:username}, function(e,o){
                if(e){
                    callback(e);
                }
                else if(o == null){
                    callback('link invalid');
                }
                else if(o.verificationLink == verificationLink){
                    var newUser = {};
                    newUser.username = o.username;
                    newUser.name = o.name;
                    newUser.password = o.password;
                    newUser.email = o.email;
                    newUser.userLocation = o.userLocation;
                    newUser.date = moment().format('MMMM Do YYYY, h:mm:ss a');
                    accounts.insert(newUser, {safe:true}, callback);
                }
                else{
                    callback('link invalid');
                }
            })
        }
    })
}

/* login validation methods */

exports.manualLogin = function(username, password, callback)
{
    accounts.findOne({username:username}, function(e, o) {
        if(e){
            callback(e);
        }
        if (o == null){
            console.log("user-not-found");
            callback(null, null);
        }   else{
            validatePassword(password, o.password, function(err, res) {
                if (res){
                    console.log("user-match");
                    callback(null, o);
                }   else{
                    console.log("user-unmatch");
                    callback(null, false);
                }
            });
        }
    });
}

exports.deviceLogin = function(deviceid, secretkey, callback)
{
    device.findOne({deviceID:deviceid}, function(e, o) {
        if(e){
            callback(e);
        }
        if (o == null){
            console.log("device-not-found");
            callback(null, null);
        }   else{		
            validatePassword(secretkey, o.secretKey, function(err, res) {
                if (res){
                    console.log("device-match");
                    callback(null, o);
                }   else{
                    console.log("device-unmatch");
                    callback(null, false);
                }
            });
        }
    });
}

var generateSalt = function()
{
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
}

var md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}


var saltAndHashPass = function(password)
{
    var salt = generateSalt();
    return (salt + md5(password + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
    var salt = hashedPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    callback(null, hashedPass === validHash);
}

/*----------------------------------------------------------------------------------*/


/* Edge Device Registration */
exports.registerDevice = function(deviceid, metadata, callback)
{	
        try{
            metadata = JSON.parse(metadata);
            metadata= metadata.Metadata;

            //var metadatadb = db.collection('device');
            device.findOne({deviceID: deviceid}, function(err, obj) {
                if(err)
                    callback(true,"Sorry, Device registeration in failed!!!", null);
                else if(!obj)
                    callback(true, "Given AccessKey is wrong", null);
                else if(obj){
                    device.update({deviceID: deviceid, registered: false}, {$set: {deviceIP: metadata.DeviceIP, specification: metadata.Specification, locationID: metadata.DLocation.LocationID, locationDetail: metadata.DLocation.Detail, permission: metadata.Permission, registered: true }}, function(err, updated) {

                        if( err ) 
                        callback(err,"Sorry, Device registeration in failed!!!", null);					
                        else if(!updated)
                        callback(err, "Your Device is already registered!!! [Device ID: " + obj.deviceID +" ]", null);
                        else if(updated)
                        callback(err, "Your device has been successfully Registered!!! [Device ID: " + deviceid +" ]", deviceid);
                    });	
                }
            });
        }catch (e) {
            callback(true, "Send Metadata in JSON Format", null);
        }	
}
	
/* Sensor Registration */
exports.registerSensor = function(metadata, callback)
{	
        try{
            metadata = JSON.parse(metadata);
            metadata= metadata.Metadata;
            device.findOne({deviceID:metadata.DeviceID, registered: true}, {w:1},function(err, obj) {
                if (!obj){
                    callback(true, "Device "+ metadata.DeviceID + " is Not Registered!!!", null);
                }
                else{
                    sensor.findOne({sensorID:metadata.SensorID}, {w:1},function(err, obj) {

                        if (obj){
                            callback(err, "Sensor "+ metadata.SensorID + " is already Registered!!!", undefined);
                        }	
                        else{
                            var newEntry = [];
                            newEntry.push({sensorID: metadata.SensorID, vendorID: metadata.VendorID, sensorType: metadata.SensorType, sensorInfo: metadata.SensorInfo, deviceID: metadata.DeviceID, locationID: metadata.SLocation.LocationID, locationDetail: metadata.SLocation.Detail, permission: metadata.Permission});
                            sensor.insert(newEntry, function(err, records) {
                                if (err) 
                                callback(err,  "Sorry, Enable to register Sensor "+ metadata.SensorID, metadata.SensorID);
                                else if(records)
                                callback(err, "Sensor "+ metadata.SensorID + " is successfully Registered!!!", metadata.SensorID);				
                            });

                        }

                    });
                }

            });
        }
        catch (e) {
            callback(true, "Send Metadata in JSON Format", null);
        }
}

/* Get SmartCampus List */
exports.getCampusList = function(callback){
  	device.distinct('locationID', function(err, campus){
			callback(err, campus);

	});
}

/* Get Sensor List inside campus-'C' */
exports.getSensorList = function(campus, callback){
	if(campus)
		sensor.find({locationID: campus}, {_id:0}).toArray(function(err, sensor){
				callback(err, sensor);

		});
	else
		sensor.find({}, {_id:0}).toArray(function(err, sensor){
				callback(err, sensor);

		});
}

