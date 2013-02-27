/**
 *  appRAD generated setup script for the AdminPortal Interface container. 
 *
 *  The job of this code is to make sure the HTML DOM content required
 *  for the login_setup() is generated before it is called.
 */



// Keep all variables and functions inside an encapsulated scope
(function() {

////[appRad] --  setup object definitions here:
var loginRADSetup = function(topic, data) {

    // we should tell our AD.Lang.Label to scan for labels here
    AD.Lang.Labels.initLabels();
    AD.Lang.Labels.loadLabel('/page/site/login');
    
    // AD.Settings.loadSettings({ key:value, key2:value2, ... keyN,valueN });
    
    // AD.Viewer = new Viewer({});
    
    // publish a notification it's time to run loginSetup()
    OpenAjax.hub.publish("ad.site.login.setup", {});
    
    // note: since anyone can publish a key, we want to prevent 
    // running this a second time:
    OpenAjax.hub.unsubscribe(subscriptionID);
}
var subscriptionID=OpenAjax.hub.subscribe('ad.site.login.radsetup',loginRADSetup);



$(document).ready(function () {



//    loginSetup();

}); // end ready()

}) ();