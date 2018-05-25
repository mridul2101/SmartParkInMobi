
var config = require('config');
var serveruri = config.get('Server.uri');
var ES = require('./email-settings');
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({

	host 	    : ES.host,
	user 	    : ES.user,
	password    : ES.password,
	ssl		    : true

});

EM.dispatchEmail = function(email, link, callback)
{
	EM.server.send({
		from         : ES.sender,
		to           : ES.user,
		subject      : 'New Signup Initiated',
		text         : 'New Signup!',
		attachment   : EM.composeEmail(email, link)
	}, callback );
}

EM.composeEmail = function(email, link)
{
	//var link = 'http://<ip address>  /reset-password?e='+o.email+'&p='+o.pass;
	var elink = serveruri + '/verify-admin-email?verificationLink='+link;
	console.log(elink);
	var html = "<html><body>";
		html += "Hi,<br><br>";
        html += "New site admin signup attempt.<br><br>";
        html += "Email address: "+ email+"<br><br>";
		html += "<a href='"+elink+"'>Click this link verify email</a><br><br>";
		html += "Cheers,<br>";
		html += "Admin<br><br>";
		html += "</body></html>";
	return [{data:html, alternative:true}];
}
