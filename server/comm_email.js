
/*
 * @class AD_Server.Comm.Email
 * @parent AD_Server.Comm
 * 
 * An object to send email using one of our installed email modules
 */

var mailer, mandrill;
var _sendMail;
var $ = AD.jQuery;

/**
 * @function _mandrillMail
 * Send email using the Mandrill service.
 */
var _mandrillMail = function(data, next)
{
    var dfd = $.Deferred();
    
    var opts = {
        type: 'messages',
        call: 'send',
        key: AD.Defaults.emailKey,
        message: {
            to: [{ email: data['to'] }],
            from_email: data['from'],
            subject: data['subject'],
            html: data['body']
        }
    };
    mandrill.call(opts, function(response) {
    
        if (next) next();
        dfd.resolve(response);
    });
    
    

    return dfd;
}


/**
 * @function _smtpMail
 * Send email using a normal SMTP server, as configured during installation.
 */
var _smtpMail = function(data, next) 
{
    var mailhost = AD.Defaults.emailHost || "securemail.example.com";
    var mailport = AD.Defaults.emailPort || "25";
    var maildomain = AD.Defaults.emailDomain || "localhost";

    var dfd = $.Deferred();
    
    mailer.send({
	  host : mailhost,              // smtp server hostname
	  port : mailport,                     // smtp server port
	  domain : maildomain,            // domain used by client to identify itself to server
	  to : data['to'],
	  from : data['from'],
	  subject : data['subject'],
	  body: data['body']
	  //authentication : "login",        // auth login is supported; anything else is no auth
	  //username : data['smtpuser'],       // Base64 encoded username
	  //password : data['smtppass']        // Base64 encoded password
	},
	
	function(err, result){
	  if(err) { 
		  if (next) next(err); 
		  dfd.reject(err);
	  }
	  else { 
	      
		  if (next) next(); 
		  dfd.resolve(result);
	  }
	  
	});
    
    return dfd;
}

switch (AD.Defaults.emailMethod.toLowerCase()) {
    default:
    case 'smtp': 
        mailer = require('./mailer');
        _sendMail = _smtpMail;
        break;
        
    case 'mandrill':
        mandrill = require('./mandrill');
        _sendMail = _mandrillMail;
        break;
}


/*
 * @function sendMail
 * 
 * ##sendMail
 * A function taking in email parameters in the data object and using `mailer` to send the email.
 * 
 * @param {Object} data
 * @param {Function} callback
 * @return {deferred} 
 */
exports.sendMail = function(data, callback) 
{
    return _sendMail(data, callback);
}

//// TODO: how do we detect mandrill errors?
//// TODO: data[to] should support an array of receipients, each method should support sending to multiple accounts.
//// TODO: should support both libraries simultaneously.  if data.mailer exists, then choose the desired mailer, else use the AD.Defaults.emailMethod

