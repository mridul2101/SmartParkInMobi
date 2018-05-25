var AWS = require('aws-sdk');
var log4js = require('log4js');
var logger = log4js.getLogger();

var iam; 
/* Create IAM User on AWS */
exports.createIAMUser = function(deviceid, callback){
	deviceid = "Edge_"+deviceid;
	iam = new AWS.IAM();
	var awskeys = undefined;

	var params = {
  		UserName: deviceid, /* required */
  		Path: '/smartcampus/device/'
	};
	iam.createUser(params, function(err, data) {
		if(err){ 
			logger.error(err, err.stack); // an error occurred
			callback(err, null);
		}
		else{     
			logger.info(data);           // successful response
			addUserToGroup(deviceid, function(err, res){
				if(err) callback(err, null);				
			});

			createAccessKey(deviceid, function(err, res){
				if(err) callback(err, null);
				else if(res) callback(err, res);
				else callback(null, res);				
			});						
		}
	});
}

/* Generate IAM Access Key for user */
var createAccessKey = function(deviceid, callback){
	var params = {
  		UserName: deviceid
	};	
	iam.createAccessKey(params, function(err, data) {
		if(err){			
			logger.error(err, err.stack); // an error occurred
			callback(err, null);
		}
		else{
			logger.info(data);           // successful response
			logger.info('IAM access key for user ' + deviceid + ' has been generated.');
			callback(null, data);
		}
	});
}

/* Add IAM user to IAM Group */
var addUserToGroup = function(deviceid, callback){
	var groupName = 'Smartcampus-Device';
	var params = {
  		GroupName: groupName, /* required */
  		UserName: deviceid /* required */
	};
	iam.addUserToGroup(params, function(err, data) {
		if(err){ 			
			logger.error(err, err.stack); // an error occurred
			callback(err, undefined);
		}
		else{
			logger.info(data);           // successful response
			logger.info('IAM user ' + deviceid + ' has been added to group ' + groupName + '.');
			callback(err, true);
		}
	});	
}

