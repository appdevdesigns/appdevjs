
////
//// Send Mail
////
//// Send an email with the SMTP server securemail.appdevdesigns.net port 25
    // test using: usage:

	// send an email with; 	Email Subject: 'hi'
	//						Email Body: 'hello'
	//						From: 'appdev@appdevdesigns.net'
	//						To: 'admin@appdevdesigns.net'

	// 		url?from=appdev@appdevdesigns.net&to=ineo@appdevdesigns.net&subject=hi&body=hello



////---------------------------------------------------------------------
var hasPermission = function (req, res, next) {
    // Verify the current viewer has permission to perform this action.


    // if viewer has 'appRAD.Developer' action
        next();
    // else
        // var errorData = { message:'No Permission' }
        // ResponseService.sendError(req, res, errorData );
    // end if

}


var trim = function (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};


// Supposed to be like the PHP isset()
var isset = function(thing) {
    if (typeof thing == 'undefined') {
        return false;
    }
    return true;
}




////---------------------------------------------------------------------
var initData = function (req, res, next) {
    // Gather the required Data for this operation.

    var sender = req.param('from'); 
    var recipient = req.param('to'); 
    var subject = req.param('subject'); 
    var body = req.param('body'); 
    var smtpuser = req.param('user'); 
    var smtppass = req.param('pass'); 

    
    if (!recipient || !body) {
        Log(req, '  - error: some data not provided body['+body+'] to['+recipient+']');
        LogDump(req, '');

        AD.Comm.Service.sendError(req, res, {errorMSG:'some data not provided body['+body+'] to['+recipient+']'} );

    }

    else {
                
        req.aRAD.sender = sender;
        req.aRAD.recipient = recipient;
        req.aRAD.subject = subject;
        req.aRAD.body = body;
        req.aRAD.smtpuser = smtpuser;
        req.aRAD.smtppass = smtppass;
        
        console.log(req.aRAD);
        next();
    }
    
}


//send email
var sendMail = function(req, res, next) {
 
// To Do
	var sender = req.aRAD.sender;
	var recipient = req.aRAD.recipient;
	var subject = req.aRAD.subject;
	var body = req.aRAD.body;
	var smtpuser = req.aRAD.smtpuser;
	var smtppass = req.aRAD.smtppass;

	var emailSent = AD.Comm.Email.sendMail({
		 to: recipient,
		 from: sender,
		 subject: subject,
		 body: body,
		 //smtpuser: smtpuser,
		 //smtppass: smtppass
	});
      
	$.when(emailSent).then(function() {
	    
	    next();
	    
	}).fail(function(err){
	    
	    AD.Comm.Service.sendError(req, res, {
	        errorMSG:'error sending mail', 
	        data:err}
	    );
	    
	});
}



//// perform these actions in sequence:
var moduleStack = [
        hasPermission,  // make sure we have permission to access this
        initData,
        sendMail // send email
        ];
        
        
////---------------------------------------------------------------------
app.all('/site/email/send', moduleStack, function(req, res, next) {
    
    // by the time we enter this, we should have done all our steps
    // for this operation.
    LogDump(req,'  - finished');
    
    // send a success message
    AD.Comm.Service.sendSuccess(req, res, {message:'Mail sent!' } );
    
});
