var express = require('express');
var bodyParser = require('body-parser');
var db = require('./Routes/dbOperation');

var app = express();
var cors = require('cors');


app.use(bodyParser.urlencoded({ extended: true })); 
app.set('view engine', 'ejs');    
app.use(bodyParser.json());
app.use(cors());
app.use('/public', express.static(__dirname + '/public'));

//res.header("Access-Control-Allow-Origin", "*");
//res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

if(process.argv.length <3){
	logger.error('usage: node index.js server_port');
	process.exit(-1);
}
var port = process.argv[2];

/*app.get('/app-home', function(req, res){
	res.render('app-home',{username:"User"});
});*/

app.get('/getparklots/:latitude/:longitude', function(req, res){
	var lat = req.params.latitude;
	var lon = req.params.longitude;
	console.log(lat + ' ' + lon);
	//console.log(req);
	db.getParkStatus(lat, lon, function(err, parklots){
		if(err)
			res.json(err);
		else{
			console.log((parklots));
			res.setHeader('Content-Type', 'text/plain');
			res.json(parklots);
			//res.render('app-home', {username: parklots});
		}
	});
});
app.get('/hello', function(req,res){
	console.log("Hello Called");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
	res.send("{Hello}");
});

app.post('/updateparkstatus', function(req, res){
	console.log("/updateparkstatus is called");
	var parkid = req.body.parkID;
	var max = req.body.max;
	var avail = req.body.avail;
	console.log(parkid);
	db.updateParkStatus(parkid, max, avail, function(err,obj){
        if(err){
            res.json(err);
        }
        else{
		console.log(obj);
            res.json(obj);
        }
    });	

});

app.post('/registerpark', function(req, res){
	console.log("/registerapi is called");
	db.registerPark( req.body.source, function(err, obj){
		if(err)
			res.json("Failed");
		else
			res.json("Success");
	});
});

app.post('/bookparking', function(req, res){
	console.log("/bookparking api is called");
	var parkid = req.body.parkid;
	var userid = req.body.userid;
	var lat = req.body.latitude;
	var lon = req.body.longitude;
        db.bookParking( userid, parkid, lat, lon, function(err, obj){
                if(err)
                        res.json("Failed");
                else
                        res.json(obj);
        });
});



var server = app.listen(Number(port));
console.log('server started on port:' + port); 
