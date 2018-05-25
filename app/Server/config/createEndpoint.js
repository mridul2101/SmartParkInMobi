var exec = require('child-process-promise').exec;
var spawn = require('child_process').spawn;
var config = require('config');

var amqp = require('amqp');
var amqp_hacks = require('./amqp-hacks');

var log4js = require('log4js');
var logger = log4js.getLogger('[ENDPOINT]');

var HashMap = require('hashmap');
var map = new HashMap();

exports.getKinesisInfo = function(callback){
	var regionName = config.get('Kinesis.region');
	var streamName = config.get('Kinesis.streamName');
	var numshards = config.get('Kinesis.shards');
	var response = [];
	response.push({StreamName: streamName, NumShards: numshards, Region: regionName});
	callback(response);
}

exports.requestStream = function(user, streams, endpoint, callback) {

	var topologyName, streamName, regionName, scriptPath, amqpHost;
	//var streamJsonObj = JSON.parse(streams);	

	var streamArray = streams.toString().split(",");
	streamArray.sort();
	
	generateTopologyName(user, function(err, topologyname){
		if(err){
			logger.debug('Could not create Topology Name! Exiting..');
			process.exit(-1);
		}else{
			topologyName = topologyname;
		}
	});
	regionName = config.get('Kinesis.region');
	streamName = config.get('Kinesis.streamName');
	scriptPath = config.get('Path.scriptPath');
	if(endpoint)
		amqpHost = endpoint;
	else
		amqpHost = config.get('Host.amqpHost');
	streams = streamArray.toString();
	
	logger.info("Topology Name : " + topologyName);
	logger.info('Stream Name : '+ streamName);
	logger.info('Region : '+ regionName);
	logger.info('Streams : ' + streams);
	logger.info('ScriptPath : ' + scriptPath);
	logger.info('AMQPHost : ' + amqpHost);	

	/*if(!endpoint){
		var connection = amqp.createConnection({host: amqpHost});	
		connection.on('ready', function(){
			connection.exchange(streams, {type: 'fanout',
			autoDelete: false}, function(exchange){
			});
		});
		amqp_hacks.safeEndConnection(connection);
	}*/	


		var child = spawn('bash',[scriptPath, topologyName, streamName, regionName, streams, amqpHost]);
		logger.info('childProcess.pid: ', child.pid);
		child.stdout.on('data', function (data) {
		  logger.info('stdout: ' + data);
		});

		child.stderr.on('data', function (data) {
		 logger.info('stderr: ' + data);
		});

		child.on('close', function (code) {
		    logger.info('child process exited with code ' + code);
		});
		
	var result = [];
	result.push({AMQPHost: amqpHost, QueueName: topologyName});
	
	callback(null, result);
}
 
var generateTopologyName = function(user, callback){
	var topologyname;
	topologyname = user + "_" + new Date().getTime() + "_Topology";
	callback(null, topologyname);
}


