var express = require('express');
var passport = require('passport');
var bodyParser = require('body-parser');
var path = require('path');

//var query = require('./Server/config/dbQueryCreate');
var operation = require('./Server/config/dbOperation1');
var endpoint = require('./Server/config/createEndpoint');
var aws = require('./Server/config/awsKey');

var log4js = require('log4js');
var logger = log4js.getLogger('[INDEX]');

var app = express();
app.use(bodyParser.urlencoded({ extended: true })); 
app.set('view engine', 'ejs');  //tell Express we're using EJS  
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
//app.use('/site', express.static(path.join(__dirname, '/public/site')));
//app.use('/doc', express.static(path.join(__dirname, '/public/doc')));
 app.use('/public', express.static(__dirname + '/public'));

var requestCount = 0;

if(process.argv.length <3){
	logger.error('usage: node index.js server_port');
	process.exit(-1);
}
var port = process.argv[2];

app.get('/apidoc', function(req, res){
	res.redirect('/doc/index.html');
});

app.get('/device-login', function(req, res){
	res.render('login', {error: undefined});
});
app.get('/loginfailed', function(req, res){  
    res.render('login', {error: 'Login Failed'});
});
app.get('/register-device', function(req, res){  
    res.render('register');
});
app.get('/logout', function(req, res){  
    res.render('login', {error: undefined});
});
app.get('/hello', function(req, res){
    res.render('home', {username: 'Mridul'});
});


app.get('/app-login', function(req, res){
    res.render('app-login', {error: undefined});
});
app.get('/app-loginfailed', function(req, res){  
    res.render('app-login', {error: 'Login Failed'});
});
app.get('/app-register', function(req, res){  
    res.render('app-register');
});
app.get('/app-logout', function(req, res){  
    res.render('app-login', {error: undefined});
});
app.get('/app-home', function(req, res){  
    res.render('app-home', {username: 'App'});
});
app.get('/app-sensor', function(req, res){  
    res.render('app-sensor', {username: 'App'});
});


/**
 * @api {post} /site-admin Site admin home page.
 * @apiName SiteAdmin
 * @apiGroup Admin
 * @apiVersion 0.1.0
 *
 * @apiParam {String} username Admin Username
 * @apiParam {String} password Admin Password
 *
 * @apiSuccess {String} Success Login Successful.
 */
app.post('/site-admin', passport.authenticate('site-admin-login', {session:false, failureRedirect:'/loginfailed'}),
        function(req, res){
            console.log('Passed');
            res.render('home', {username: 'Mridul'});
        });

/**
 * @api {post} /app Application home page.
 * @apiName App
 * @apiGroup APP
 * @apiVersion 0.1.0
 *
 * @apiParam {String} username App Username
 * @apiParam {String} password App Password
 *
 * @apiSuccess {String} Success Login Successful.
 */
app.post('/app-home', passport.authenticate('app-login', {session:false, failureRedirect:'/app-loginfailed'}),
        function(req, res){
            console.log('Passed');
            res.render('app-home', {username: 'App'});
        });

/**
 * @api {post} /app-signup Sign-up for Application.
 * @apiName AppSignup
 * @apiGroup APP
 * @apiVersion 0.1.0
 *
 * @apiParam {String} username App Username
 * @apiParam {String} password App Password
 * @apiParam {String} appname App Name
 * @apiParam {String} email App Email
 *
 * @apiSuccess {String} Success. Signup successful.
 */
app.post('/app-signup', function(req, res){

    var username = req.body.username;
    var password = req.body.password;
    var appname = req.body.appname;
    var email = req.body.email;

    operation.newAppSignUp(username, password, appname, email, function(e,o){
        if(e){
            res.send(e);
        }
        else{
            res.render('app-home', {username: 'App'});
        }
    });
});

/**
 * @api {post} /admin-signup Sign-up for Site admin.
 * @apiName AdminSignup
 * @apiGroup Admin
 * @apiVersion 0.1.0
 *
 * @apiParam {String} username Admin Username
 * @apiParam {String} password Admin Password
 * @apiParam {String} name Admin Name
 * @apiParam {String} email Admin Email
 * @apiParam {String} userLocation Admin Location
 *
 * @apiSuccess {String} Success. Signup requested.
 */
app.post('/admin-signup', function(req,res){

    var username = req.body.username;
    var password = req.body.password;
    var name = req.body.name;
    var email = req.body.email;
    var userLocation = req.body.userLocation;

    operation.newSignUp(username, password, name, email, userLocation, function(e,o){
        if(e){
            res.send(e);
        }
        else{
            res.redirect('/hello');
        }
    });
});

/**
 * @api {get} /verify-admin-email To verify email address of the site admin and authorize his account.
 * @apiName VefifyAdminEmail
 * @apiGroup Admin
 * @apiVersion 0.1.0
 *
 * @apiParam {String} verificationLink Verification link recieved in an email sent by platform admin.
 *
 * @apiSuccess {String} Success. Signup successful.
 */

app.get('/verify-admin-email', function(req,res){

    var verificationLink = req.query.verificationLink;

    operation.verifyEmail(verificationLink, function(e,o){
        if(e){
            res.send(e);
        }
        else{
            res.redirect('/hello');
        }
    });
});

/**
 * @api {post} /generate-device-keys To generate a pair of access keys to register a new edge device.
 * @apiName GenerateDeviceKeys
 * @apiGroup Admin
 * @apiVersion 0.1.0
 *
 * @apiParam {String} username Site Admin username.
 * @apiParam {String} password Site Admin password.
 *
 * @apiSuccess {String} deviceid DeviceID for the new device.
 * @apiSuccess {String} secretkey Secretkey for the new device.
 */
app.post('/generate-device-keys', passport.authenticate('site-admin-login', {session:false, failureRedirect:'/loginfailed'}),
        function(req, res){
	    logger.info('API : /generate-device-keys is called');
            var username = req.body.username;
            operation.genDeviceKeys(username, function(e,o){
                if(e){
                    res.send(e);
                }
                else{
                    res.json(o);
                }
            });
        });

/**
 * @api {post} /registerdevice  To Register end device on smartcampus platform
 * @apiName RegisterStream
 * @apiGroup Device
 * @apiVersion 0.1.0
 *
 * @apiParam {String} DeviceID  Device ID generated by device registration.
 * @apiParam {String} DeviceMetada  Device Metadata.
 *
 * @apiSuccess {String} DeviceID  Generated DeviceID.
 * @apiSuccess {String} AWSCredentials  AWS Credentials include access and secret key with kinesis write permisiions.
 */


app.post('/registerdevice', passport.authenticate('device-login', {session:false, failureRedirect:'/loginfailed'}),
        function(req, res){
            logger.info('API : /registerdevice is called');
            /* passport authentication should be done with req.body.deviceid and req.body.secretkey */

            operation.registerDevice(req.body.deviceid, req.body.source, function(err, msg, deviceid){
                var result = [];
                if(err){
		        logger.error(msg);
		        result.push({Status: "Failed", Error: msg});
		        res.setHeader('Content-Type', 'text/plain');
		        res.json(result);}
                else if(!deviceid)
            {logger.error(msg);
                result.push({Status: "Warning", Warn: msg});
                res.setHeader('Content-Type', 'text/plain');
                res.json(result);}		
                else if(deviceid){
                    logger.info(msg);
                    aws.createIAMUser(deviceid, function(err, awskeys){
                        if(err)
                        awskeys = "Not generating IAM User";
                        else if(awskeys){
                            endpoint.getKinesisInfo(function(response){					
                                result.push({Status: "Success", AWSCredentials: awskeys.AccessKey, Kinesis: response});
                                res.setHeader('Content-Type', 'text/plain');
                                res.json(result);
                            });
                        }	
                    });			
                }		
            });
        });

/**
 * @api {post} /registersensor  To Register sensor on smartcampus platform
 * @apiName RegisterSensor
 * @apiGroup Device
 * @apiVersion 0.1.0
 *
 * @apiParam {String} DeviceID  Device ID generated by device registration.
 * @apiParam {String} SensoreMetada  Sensor Metadata.
 *
 * @apiSuccess {String} Message  Success message.
 */
app.post('/registersensor', passport.authenticate('device-login', {session:false, failureRedirect:'/loginfailed'}),
        function(req, res){
	logger.info('API : /registersensor is called');
	
    /* passport authentication should be done with req.body.deviceid and req.body.secretkey */

	operation.registerSensor(req.body.source, function(err, msg, sensorid){
		var result = [];
		if(err){
			logger.error(msg);
			result.push({Status: "Failed", Error: msg});res.json(result);
		}
		else if(!sensorid){
			logger.error(msg);
			result.push({Status: "Warning", Warn: msg});res.json(result);
		}
		else if(sensorid){
			logger.info(msg);		
			result.push({Status: "Success", Message: msg});res.json(result);
		}

		//res.setHeader('Content-Type', 'text/plain');
				
	});
});



/**
 * @api {get} /getcampuslist Return list of Campus IDs
 * @apiName GetCampusList
 * @apiGroup APP
 * @apiVersion 0.1.0
 *
 *
 * @apiSuccess {String} campuslist  List of Campus Ids.
 */
app.get('/getcampuslist',  /*passport.authenticate('app-login', {session:false, failureRedirect:'/loginfailed'}),*/
        function(req, res){
	
    logger.info('API : /getcampuslist is called');
	/*
		APP Authentication with username & password
	*/	
	
	operation.getCampusList(function(err, campuslist){
		if(err)
			logger.error("Error in getting campus list");
		else{
			logger.info("Campus List: " + campuslist);
			res.json(campuslist);
		}
	});
});


/**
 * @api {get} /getsensor Return list of metadata of all sensors
 * @apiName GetSensor
 * @apiGroup APP
 * @apiVersion 0.1.0
 *
 *
 * @apiSuccess {String} sensorlist  List of Sensor Metadata.
 */
app.get('/getsensor',  /*passport.authenticate('app-login', {session:false, failureRedirect:'/loginfailed'}),*/

        function(req, res){
	logger.info('API : /getsensor is called');
	/*
		APP Authentication with username & password
	*/	
	var campus = req.params.campus;
	operation.getSensorList(campus, function(err, sensor){
		if(err)
			logger.error("Error in getting sensor metadata ");
		else{
			logger.info("Send " + sensor.length + " sensor metadata list ");
			res.json(sensor);
		}
	});
});


/**
 * @api {get} /getsensor/:campus Return list of metadata of all sensors in campus
 * @apiName GetSensor
 * @apiGroup APP
 * @apiVersion 0.1.0
 *
 * @apiParam {String} campus Campus unique ID.
 *
 * @apiSuccess {String} sensorlist  List of Sensor Metadata.
 */
app.get('/getsensor/:campus',  /*passport.authenticate('app-login', {session:false, failureRedirect:'/loginfailed'}),*/
        
        function(req, res){
	logger.info('API : /getsensor/:campus is called');
	/*
		APP Authentication with username & password
	*/	
	var campus = req.params.campus;
	operation.getSensorList(campus, function(err, sensor){
		if(err)
			logger.error("Error in getting sensor metadata in campus " + campus);
		else{
			logger.info("Send " + sensor.length + " sensor metadata list for campus " + campus);
			res.json(sensor);
		}
	});
});

/**
 * @api {post} /requeststream Request for a sensor stream
 * @apiName RequestStream
 * @apiGroup APP
 *
 * @apiVersion 0.1.0
 *
 * @apiParam {String} APPCredentials User Credentials.
 * @apiParam {String} StreamList List of stream ids.
 *
 * @apiSuccess {String} AMQPHost  AMQP Host Endpoint.
 * @apiSuccess {String} QueueName  AMQP Queue Name.
 */
app.post('/requeststream',  /*passport.authenticate('app-login', {session:false, failureRedirect:'/loginfailed'}),*/
        function(req,res){
	logger.info('API : /getstream is called');	
	var queueEndPoint;	
	endpoint.requestStream(req.body.username, req.body.streams, req.body.endpoint, function(err, endpt){
		if(err){
			logger.info("Error in Creating Endpoint");
		}
		else if(endpt){
			queueEndPoint = endpt;
		}
		
	});
	logger.info("Response : " + JSON.stringify(queueEndPoint));
	res.json(queueEndPoint);
});

require('./Server/config/passport')(passport);

var server = app.listen(Number(port));
console.log('server started on port:' + port); 

