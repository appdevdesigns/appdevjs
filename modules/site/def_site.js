/**
 * @class Site
 * @parent Installed_Modules
 * 
 * ###Site Module
 * 
 * This module contains administrative tools for the generic site framework.
 * 
 */

//required to separate comment blocks for documentjs, please do not remove
var __filler;

/**
 * @class Site.server
 * @parent Site
 * 
 * ##Site server
 * 
 * Site server
 */
//required to separate comment blocks for documentjs, please do not remove
var __filler;

/**
 * @class Site.client
 * @parent Site
 * 
 * ##Site client
 * 
 * Site client
 */
//required to separate comment blocks for documentjs, please do not remove
var __filler;

/**
 * @class Site.client.pages
 * @parent Site.client
 * 
 * ##Site client pages
 * 
 * Site client pages
 */
//required to separate comment blocks for documentjs, please do not remove
var __filler;

/**
 * @class Site.titanium
 * @parent Site
 * 
 * ##Site titanium
 * 
 * Site titanium
 */


var $ = AD.jQuery;

var siteModule = new AD.App.Module({
    nameModule: 'site',
    pathModule: __dirname,
    serviceLoadOrder: ['site_api.js']
//    pathPages:   __dirname + '/web/pages/',
//    pathServerModels: __dirname + '/models/node/',
//    pathClientModels: __dirname + '/models/client/'
    
    });
    




////
//// setup any Site specific routes here
////



siteModule.createRoutes();

// Initialize the Admin Interface sub-module routes
AD.AdminToolbar.createRoutes(siteModule.app);

/*
////
//// On any /site/* route, we make sure our Client Models are loaded:
//// 
app.get('/init/site/*', function(req, res, next) {

Log(req,' init/site/*  : adding model dependencies.');

    addJavascripts( req, siteModule.clientModels );

    next();
});
*/



var dI = siteModule.initialize();
module.exports = siteModule;
exports.version = 1;  // which version of AD.App.Module this conforms to:

$.when(dI).then(function(){

    // post a notification to indicate that the site module is loaded & ready
    AD.Comm.Notification.publish('site.ready', {});
});

/*
//// 
//// Scan any sub interfaces to gather their routes
////

siteModule.loadInterfaces();



////
//// The Model objects 
////
//// Load the Server side model objects to handle incoming model actions.
////

siteModule.loadServerModels();
exports.listModels=siteModule.listModels;



////
//// 
//// Load the Client Side models and be sure they are included in the page
//// dependencies.

siteModule.loadClientModels();

*/
