var db = require('./dbFunction');
var projection = {};

var query = {};
query['AccessKey'] = 'AccessKey188';
console.log(query);
var newEntry = [];
newEntry.push({SensorID: "SensorNEW11", AccessKey: "AccessKey188"});
var update = {};
update['$set'] = newEntry[0];	
console.log(update);			
db.dbConnect(function(err){
	db.insertDB("device", newEntry, function(err, records){
		console.dir(records);
	});
	db.selectDB("device", query, projection, function(err, records){
		console.dir(records[0]);
	});
	db.updateDB("device", query, newEntry[0], function(err, records){
		console.dir(records);
	});
});


