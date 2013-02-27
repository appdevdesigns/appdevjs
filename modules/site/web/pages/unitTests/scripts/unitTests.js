//// Template Replace:
//   site     : the name of this page's module: (lowercase)
//   unitTests  : the name of this page :  (lowercase)
//   UnitTests  : the name of this page :  (Uppercase)
/**
 * @class UnitTests
 * @parent site
 * 
 *  The setup script for the unitTests Page container. 
 *
 *  The job of this code is to perform all the setup steps on the existing
 *  HTML DOM items now.  Add Events, actions, etc... 
 *
 *  This file will be generated 1x by the RAD tool and then left alone.
 *  It is safe to put all your custom code here.
 */


(function() {


////[appRad] --  setup object definitions here:
var siteUnitTestsSetup = function (topic, data) {


    //// Setup Your Page Data/ Operation Here

	$("#unitTests").run_tests({});
	
	// unsubscribe me so this doesn't get called again ... 
	//AD.Comm.Notification.unsubscribe(unitTestsSubID);
} // end siteUnitTestsSetup()
AD.Comm.Notification.subscribe('ad.site.unitTests.setup',siteUnitTestsSetup);




$(document).ready(function () {

    //// Do you need to do something on document.ready() before the above
    //// siteUnitTestsSetup() script is called?


}); // end ready()

}) ();