
var crypto = require('crypto');
var moment = require('moment');
var uuid = require('uuid');
var config = require('config');
var log4js = require('log4js');
var email_manager = require('./email-dispatcher');
var logger = log4js.getLogger('[DB-OP]');
var db = require('./dbFunction');
/* User/Device Account management */

/* my login code */

exports.genDeviceKeys = function(username, callback){
        var newDevice = {};
        newDevice.deviceID = uuid.v1();
	var secretkey = crypto.randomBytes(20).toString('hex');
        newDevice.secretKey = saltAndHashPass(secretkey);
        newDevice.ownerID = username;
        newDevice.registered = false;
        db.insertDB("device", newDevice, function(err, obj){
            if(err){
                callback(err);
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
    email_manager.dispatchEmail(email, verificationLink, function(err, obj){
        if(err){
            callback(err);
        }
        else{
            console.log('email success');
            callback(null, verificationLink);
        }

    });
}

exports.newAppSignUp = function(username, password, appname, email, callback)
{
    var query = {};
    query['username'] = username;
    var projection = {};
    db.selectDB("apps", query, projection, function(err, obj){
        if(err){
            callback(err);
        }
        else if(obj){
            console.log('app-username exists');
            callback('app-username exists');
        }
        else{
//	     var query = {};
//	     query['email'] = email;
//            db.selectDB("apps", query, projection, function(err, obj){
//                if(err){
//                    callback(err);
//                }
//                else if(obj){
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
                    db.insertDB("apps", newAppSignup, callback);
//                }
//            });
        }

    });
}

exports.newSignUp = function(username, password, name, email, userLocation, callback)
{
    var query = {};
    query['username'] = username;
    var projection = {};
    db.selectDB("accounts", query, projection, function(err, obj){
        if(err){
            callback(err);
        }
        else if(obj){
            console.log('username exists');
            callback('username exists');
        }
        else{
//	     var query = {};
//	     query['email'] = email;
//           db.selectDB("accounts", query, projection, function(err, obj){
//                if(obj){
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
                    db.insertDB("signups", newSignup, callback);
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
	    var query = {};
	    query['deviceID'] = deviceid;
	    var projection = {};
            
            db.selectDB("device", query, projection, function(err, obj) {
                if(err)
                    callback(true,"Sorry, Device registeration in failed!!!", null);
                else if(!obj)
                    callback(true, "Given AccessKey is wrong", null);
                else if(obj){
		    query['registered'] = false;
		    var newEntry = [];
		    newEntry.push({deviceIP: metadata.DeviceIP, specification: metadata.Specification, locationID: metadata.DLocation.LocationID, locationDetail: metadata.DLocation.Detail, permission: metadata.Permission, registered: true });                            
                    db.updateDB("device", query, newEntry[0], function(err, updated) {
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
	    var query = {};
	    query['deviceID'] = metadata.DeviceID;
	    query['registered'] = true;
	    var projection = {};
            db.selectDB("device", query, projection, function(err, obj) {
                if (!obj){
                    callback(true, "Device "+ metadata.DeviceID + " is Not Registered!!!", null);
                }
                else{
		    var query = {};
		    query['sensorID'] = metadata.SensorID 
                    db.selectDB("sensor", query, projection, function(err, obj) {
                        if (obj){
                            callback(err, "Sensor "+ metadata.SensorID + " is already Registered!!!", undefined);
                        }	
                        else{
                            var newEntry = [];
                            newEntry.push({sensorID: metadata.SensorID, vendorID: metadata.VendorID, sensorType: metadata.SensorType, sensorInfo: metadata.SensorInfo, deviceID: metadata.DeviceID, locationID: metadata.SLocation.LocationID, locationDetail: metadata.SLocation.Detail, permission: metadata.Permission});
                            db.insertDB("sensor", newEntry, function(err, records) {
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
	var field = 'locationID';
	var query = {};	
	db.distinctDB("device", field, query, function(err, records){
		callback(err, records);
	});

}

/* Get Sensor List inside campus-'C' */
exports.getSensorList = function(campus, callback){	
	var query = {};
	var projection = {};
	projection['_id'] = 0;
	if(campus){
		query['locationID'] = campus;
		db.selectDB("sensorall", query, projection, function(err, records){
			callback(err, records);
		});
	}
	else
		db.selectDB("sensorall", query, projection, function(err, records){
			callback(err, records);
		});
	
}



