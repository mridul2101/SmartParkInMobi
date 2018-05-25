var crypto = require('crypto');
var log4js = require('log4js');

var account_manager = require('./dbOperation');

var BasicStrategy = require('passport-http').BasicStrategy;
var LocalStrategy = require('passport-local').Strategy;
var logger = log4js.getLogger('[AUTHP]');

var md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

var validatePassword = function(plainPass, hashedPass, callback){
    var salt = hashedPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    callback(null, hashedPass === validHash);
}

/* exports */
module.exports = function(passport){

    passport.use('device-login', new LocalStrategy({
        usernameField:'deviceid',
        passwordField:'secretkey'
    },
    function(username, password, done){
	process.nextTick(function(){
            account_manager.deviceLogin(username, password, function(e, o){
                if(e){
                    done(e);
                }
                if(o == null){
		    logger.info("Device " + username + "is not registered!!!");
                    done(null, false, 'device-not-found');
                }else{
		        if(o == false){
			    logger.info("Invalid secret key");
		            done(null, false, 'invalid-secretkey');
		        }
		        else{
			    logger.info("Device " + username + "is successfully login.");
		            done(null, 'success');
		        }
		}
            });
        })       
    }));

    passport.use('app-login', new LocalStrategy({
    },
    function(username, password, done){
        done(null, 'success');
    }));


    passport.use('site-admin-login', new LocalStrategy({
    },
    function(username, password, done){
        process.nextTick(function(){
            console.log("Reached: " + username+password);
            account_manager.manualLogin(username, password, function(e, o){
                if(e){
                    done(e);
                }
                if(o == null){ logger.info("User " + username + "not found.");                   
                    done(null, false, 'user-not-found');
                }else{
		        if(o == false){ logger.info("Invalid password.");
		            done(null, false, 'invalid-password');
		        }
		        else{  logger.info("Successfully Login");
		            done(null, 'success');
		        }
		}
            });
        })
    }));
    
    passport.use('local-login', new LocalStrategy({
    },
    function(username, password, done){
        process.nextTick(function(){
            accounts.findOne({username:username}, function(e,o){
                if (o == null){
                    done(null, false, 'user-not-found');
                }
                else{
                    validatePassword(password, o.password, function(err, res) {
                        if (res){
                            console.log('user-found');
                            done(null, o);
                        }       else{
                            console.log('wrong-password');
                            done(null, false, 'invalid-password');
                        }
                    });
                }
            });
        })
    }));

    passport.use(new BasicStrategy({
        },
        function(username, password, done){
            process.nextTick(function () {
                accounts.findOne({user:username}, function(e, o) {
                    if (o == null){
                        console.log(username);
                        done(null, false, 'user-not-found');
                    }
                    else{
                        validatePassword(password, o.pass, function(err, res) {
                            if (res){
                                console.log('user-found');
                                done(null, o);
                            }       else{
                                console.log('wrong-password');
                                done(null, false, 'invalid-password');
                            }
                        });
                    }   
                });
            })
        })
    )
    
}
