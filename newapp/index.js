var express = require('express');
var bodyParser = require('body-parser');


var app = express();
app.use(bodyParser.urlencoded({ extended: true })); 
app.set('view engine', 'ejs');    
app.use(bodyParser.json());

app.use('/public', express.static(__dirname + '/public'));

if(process.argv.length <3){
	logger.error('usage: node index.js server_port');
	process.exit(-1);
}
var port = process.argv[2];

app.get('/', function(req, res){
	res.render('map',{username:"User"});
});

app.get('/app-home', function(req, res){
	res.render('map',{username:"User"});
});


app.get('/app-test', function(req, res){
	console.log("Calling");
	res.render('app-test',{username:"User"});
});

var server = app.listen(Number(port));
console.log('server started on port:' + port); 
