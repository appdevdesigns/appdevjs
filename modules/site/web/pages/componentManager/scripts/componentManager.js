//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   componentManager  : the name of this interface :  (lowercase)
//   ComponentManager  : the name of this interface :  (Uppercase)
/**
 *  The setup script for the componentManager Interface container. 
 *
 *  The job of this code is to perform all the setup steps on the existing
 *  HTML DOM items now.  Add Events, actions, etc... 
 *
 *  This file will be generated 1x by the RAD tool and then left alone.
 *  It is safe to put all your custom code here.
 */


(function() {


////[appRad] --  setup object definitions here:
var siteComponentManagerSetup = function (topic, data) {


    //// Setup Your Page Data/ Operation Here
    $('table[system="modules"]').module_visit();
    $('.component-manager button.submit').apply_button();
    $('.component-manager tr.component-row').component_row();


} // end siteComponentManagerSetup()
OpenAjax.hub.subscribe('ad.site.componentManager.setup',siteComponentManagerSetup);




$(document).ready(function () {

    //// Do you need to do something on document.ready() before the above
    //// siteComponentManagerSetup() script is called?


}); // end ready()

}) ();