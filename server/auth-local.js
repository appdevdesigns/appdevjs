/**
 * @class authLocal
 * @parent Authentication
 *
 * This is the appDev object for handling local authentication. 
 */

var url = require('url');
var authLabels = {};
var log = AD.Util.Log;
var logDump = AD.Util.LogDump;

/**
 * Pass in the labels.
 */
exports.setLabels = function(labels)
{
    authLabels = labels;
}


/**
 * @function getExemptedRoutes
 *
 * A list of routes that do not require authentication under this auth handler.
 *
 * @return array
 */
exports.getExemptedRoutes = function() 
{
    return [
        '/init/site/login',
        '/page/site/login',
        '/page/site/logout',
        '/service/site/login/authenticate',
        '/service/site/logout',
        '/query/findall/site/Labels',
        '/labels/site/login/labels.js'
    ];
}


/**
 * @function authenticatePage
 *
 * Verify that the current viewer is authenticated. If not, redirect to
 * the login page.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.authenticatePage = function (req, res, next) 
{
// page requests should be directed back to the login page:

    authenticate( req, res, next, function (currentViewer) {
    
//// TODO: store our original path & params & body data
////       in session to restore later.
        req.session.originalPath = req.url;
    
        // at this point, we were headed somewhere and not
        // properly validated, so redirect to login
 //       log(req,'   path['+path.pathname+']  --> attempting to Redirect !!!');
        
        currentViewer.loggingIn = true;
        req.session.viewer = currentViewer;
        
        res.redirect('/page/site/login');
    });

}


/**
 * @function authenticateService
 *
 * Verify that the current viewer is authenticated. If not, respond with
 * an error message so the client side script can initiate reauthentication.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.authenticateService = function(req, res, next) 
{
    authenticate(req, res, next, function() {
        // If authentication fails
        // services will respond with a common error message:
        AD.Comm.Service.sendError( req, res, {errorID:55, errorMSG:authLabels['[site.autherrors.Reauthenticate]'][req.aRAD.defaults['siteDefaultLanguage']]}, AD.Const.HTTP.ERROR_UNAUTHORIZED );
    });
}



/**
 * Helper function that checks if user is authenticated, and executes a 
 * callback if the check fails.
 *
 * @param {object} req
 *      Express request object
 * @param {object} res
 *      Express response object
 * @param {function} next
 *      The callback for when the viewer is already authenticated
 * @param {function} doRequestLogin
 *      The callback for when the viewer is not authenticated
 */
var authenticate = function(req, res, next, doRequestLogin) 
{
//  make sure current viewer of the page has authenticated.
//  if not, then create an unauthenticed viewer object

    var msg = '   - authentication.authenticate() ';
    var currentViewer = AD.Viewer.trueViewer(req);
    var path = url.parse(req.url);
    
    // if a viewer object has been added to session already, 
    // keep on.
    if (req.session.viewer) {
        
        log(req,msg + ' -> but session has a viewer:');
        log(req,req.session.viewer);
        // already authenticated!
        next();
    
    } else { 
    
        // Not authenticated. Execute the callback which will 
        // direct the user to login.
        doRequestLogin(currentViewer);             
    }
        
}



/**
 * @function logoutPage
 *
 */
exports.logoutPage = function(req, res, returnUrl) 
{
    
    //
    
}


/**
 * @function login
 *
 * A service that accepts authentication credentials and sends a response.
 * If authentication passes, the viewer is stored in the session.
 *
 * This is the only routine that validates the userID and password.
 *
 * see `modules/site/interfaces/login/node_login.js`
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.login = function( req, res, next) 
{
    var userID = req.body.userID;
    var pWord = req.body.pWord;

    log(req,'    - authentication.login:');
    log(req, '      checking userID['+userID+'] pWord['+pWord+'] ... ');

    // Look for viewer entry with matching userID and password
    AD.Viewer.viewerFromLogin(userID, pWord,  function(err, currentViewer) {
    
        if (err) {
            
            // Unexpected DB error
            log(req, '      error:');
            log(req, err);
            logDump(req);        
            // return json Failure
            AD.Comm.Service.sendError( req, res, {errorID:55, errorMSG:authLabels['[site.autherrors.InvalidUP]'][req.aRAD.defaults['siteDefaultLanguage']]}, AD.Const.HTTP.ERROR_SERVER ); // 500: this is our problem
        
        } else {
            
            // Viewer account found, and is active
            if (currentViewer.isAuthenticated && currentViewer.viewer_isActive) {

                log(req, '      viewer.userID['+userID+'] pWord['+pWord+'] is Authenticated!');
                logDump(req);

                // Update the last login date
                AD.Viewer.updateViewer({
                    'viewer_id': currentViewer.viewer_id,
                    'viewer_lastLogin': "now"
                });

                // store viewer in session  ==> we should now pass authenticate()
                req.session.viewer = currentViewer;
                req.aRAD.viewer = currentViewer;

                //  return json success 
                AD.Comm.Service.sendSuccess( req, res, {
                    'url': req.session.originalPath 
                });
                
            } 
            // Viewer account found, but is inactive
            else if (currentViewer.isAuthenticated && !currentViewer.viewer_isActive) {
                log(req, 'viewer has valid password but is not "active"');
                AD.Comm.Service.sendError(req, res, {
                    errorID: 55, // what's the right code here?
                    errorMSG: authLabels['[site.autherrors.InvalidUP]'][req.aRAD.defaults['siteDefaultLanguage']]
                }, AD.Const.HTTP.ERROR_FORBIDDEN);  // 403: this guy is not allowed!
            
            }
            // Viewer account not found -- bad username or password
            else {
                log(req,'      current Viewer is not authenticated:');
                log(req, currentViewer);
                logDump(req);
                //  return json failure
                AD.Comm.Service.sendError( req, res, {
                	errorID:55, 
                	errorMSG:authLabels['[site.autherrors.InvalidUP]'][req.aRAD.defaults['siteDefaultLanguage']]
                }, AD.Const.HTTP.ERROR_UNAUTHORIZED); // 401: not authenticated 
            }
            
        }
    
    });

}
