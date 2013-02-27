//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   email  : the name of this interface :  (lowercase)
//   Email  : the name of this interface :  (Uppercase)
/**
 * @class Site.server.email
 * @parent Site.server
 * 
 *  The setup script for the email Interface container. 
 *
 *  The job of this code is to perform all the setup steps on the existing
 *  HTML DOM items now.  Add Events, actions, etc... 
 *
 *  This file will be generated 1x by the RAD tool and then left alone.
 *  It is safe to put all your custom code here.
 */


(function() {

	/**
	 * @function siteEmailSetup
	 * 
	 * @param {object} topic
	 * @param {data} data
	 * 
	 */
////[appRad] --  setup object definitions here:
var siteEmailSetup = function (topic, data) {


    //// Setup Your Page Data/ Operation Here

/*
          // UI effects
      $('button.submit').mouseenter(function() {
        $(this).addClass('ui-state-hover');
      });
      $('button.submit').mouseleave(function() {
        $(this).removeClass('ui-state-hover');
      });

      // Set focus to the userID field when page first loads
      $("input[name='userID']").focus();
      
      // Pressing "Enter" from the password field should submit the form
      $("input[name='pWord']").keypress(function(event) {
        if (event.keyCode == 13 || event.keyCode == 10 || event.keyCode == 3) {
          $('button.submit').click();
        }
        return true;
      });
    
      // Handle form submission
      $('button.submit').click(function() {
        
        // Show busy animation
        $('.busy').show();
        // Hide any previous messages
        $('#error-message').empty().hide();
        // Gather form data
        var formData = {};
        $('form input').each(function() {
          var key = this.name;
          if (key == 'pWord') {
              var value = MD5(this.value);  // encrypt the pword before sending.
          } else {
              var value = this.value;
          }
          formData[key] = value;
        });
        // Submit data
        $.ajax({
          type: 'POST',
          dataType: 'json',
          data: formData,
          url: '/service/site/login/authenticate',
          success: function (data) {
            // Hide busy animation
            $('.busy').hide();
            // Handle response
            if (data.success) {
              // Success! Redirect to new page.
//              alert('success!!');
              window.location = '/page/test/viewer';
            } else {
              // Error! Display message.
              var message;
              message = data.errorMSG;
              $('#error-message')
                .text(message)
                .fadeIn();
            }
          },
          cache: false,
          error: function() {
            // Hide busy animation
            $('.busy').hide();
            // Unexpected error
            $('#error-message')
              .text('Sorry, there was a technical problem. Please try again.')
              .fadeIn();
          }
        });
      });
*/

} // end siteEmailSetup()
OpenAjax.hub.subscribe('ad.site.email.setup',siteEmailSetup);

/**
 * @function sendMail
 * 
 * @param {data} email
 * 
 */

/*
var sendMail = function (data) {
	
	var sender = req.aRAD.sender;
	var recipient = req.aRAD.recipient;
	var subject = req.aRAD.subject;
	var body = req.aRAD.body;
	var smtpuser = req.aRAD.smtpuser;
	var smtppass = req.aRAD.smtppass;
	
	OpenAjax.hub.publish("ad.site.email.send", {
		 to: recipient,
		 from: sender,
		 subject: subject,
		 body: body,
		 smtpuser: smtpuser,
		 smtppass: smtppass
	});

}
*/

/**
 * @function siteEmailSend
 * 
 * @param {data} email
 * 
 */

/*
var siteEmailSend = function (data) {

	var email = require('mailer');

	email.send({
	  host : "securemail.example.com",              // smtp server hostname
	  port : "25",                     // smtp server port
	  domain : "localhost",            // domain used by client to identify itself to server
	  to : data['to'],
	  from : data['from'],
	  subject : data['subject'],
	  body: data['body'],
	  authentication : "login",        // auth login is supported; anything else is no auth
	  username : data['smtpuser'],       // Base64 encoded username
	  password : data['smtppass']        // Base64 encoded password
	},
	
	function(err, result){
	  if(err){ console.log(err); }
	});
	
}
OpenAjax.hub.subscribe('ad.site.email.send',siteEmailSend);

*/

$(document).ready(function () {

	//$('#test').text('Test2');
	/*		
	var nav = $('#navBar');

	var renNotification = new AppDev.Comm.Notification({ 
	      data : '',
	      sender : nav,
	      name : 'Site.Email.Send'
		});	
	
	AppDev.Comm.sharedNotificationCenter.postNotification( nav, renNotification);
	
	alert(AppDev.Comm.sharedNotificationCenter.registeredNotifications.length);

	$('#navBar').appdev_testwidget();
	
    //// Do you need to do something on document.ready() before the above
    //// siteEmailSetup() script is called?
*/
}); // end ready()

}) ();