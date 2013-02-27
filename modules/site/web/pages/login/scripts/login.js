/**
 *  The setup routines for the Site Login Interface/Page.
 *
 *  This is where we setup all the on screen widget functionality for the
 *  operation of the page.
 */


(function() {


    ////[appRad] --  initialize your page functionality here
    var loginSetup = function (topic, data) {


    	/*
        //// NOTE:  this widget requests a list of languages from the server.
        ////        this action can't proceed before login, so we do the manual
        ////        langList below:
        $('#languageList').appdev_list_languagepicker({
    		fontSize:'10px'
    	});
    	*/
    	
        //// setup language picker widget
        $('#langList').appdev_menu_ipod({
    //            contentDiv:'#langListContents',
            minWidth:200,
            onChange:function(element) {
                
                var langData = { language_code: element.attr('code') };
                
                AD.Comm.Notification.publish("site.multilingual.lang.set", langData);
            }
        });
        
        
        // install our translation swticher
        // Note: controller defined in: xlation_list.js  
        //$('#xlationList').xlation_list();
        $('#xlationState').appdev_list_xlationstate({
    		fontSize:'10px'
    	});


        // setup our login form
        // Note: controller defined in: login_form.js
        var form = $('#loginForm');
        $('#loginForm').login_form();
        
        
        // note: since anyone can publish a key, we want to prevent 
        // running this a second time:
        AD.Comm.Notification.unsubscribe(subscriptionID);
    }

    var subscriptionID = AD.Comm.Notification.subscribe('ad.site.login.setup',loginSetup);


    $(document).ready(function () {


    }); // end ready()

}) ();