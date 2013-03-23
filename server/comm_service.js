/* @class  AD_Server.Comm.Service
 * @parent AD_Server.Comm
 *
 * This module is responsible for returning data back to our client's AJAX
 * style calls.  These responses can either be in JSON or XML format.
 */

var serviceJSON = require('./comm_service/comm_service_JSON.js');
var serviceXML  = require('./comm_service/comm_service_XML.js');


/*
 * @function sendError
 *
 * Use this method to package an error message to return back to our request.
 *
 * Our standard message format for an error is:
 * @codestart
 * {
 * 	success:'false',
 * 	errorID: ##,  // <--  an application defined error ID #
 * 	errorMSG: 'error message', // <-- an application defined error message string
 * }
 * @codeend
 *
 * For an error, the default http status code will be 400, unless you provide
 * a more detailed code.
 *
 * @param {object} req
 *      An HTTP request object
 * @param {object} res
 * 		An HTTP response object
 * @param {object} options
 * 		The data to send back.
 * @param {int} code
 *      The HTTP status code to use in our response.
 * @return {object} a JSON object representing the data we sent back.
 */
exports.sendError = function (req, res, options, code) {

	if ('undefined' == typeof code) code = AD.Const.HTTP.ERROR_CLIENT;  // 400: generic "your fault" msg

    //// Build our Response Object
    var response = {
        success:'false',
        errorID:'150',  // unknown
        errorMSG:'Unknown. Something went wrong.',
        data:{}
    };

    for (var x in options) {
        response[x] = options[x];
    }
//console.log('json.params:');
//console.log(req.params);
    var requestType = req.headers.accept || 'application/json';
    var isJson = req.is('json') || req.is('*/json') || (requestType.indexOf('json') != -1) || ('undefined' != typeof req.param('json'));

    if (isJson) {

        // JSON Requested
        serviceJSON.send( req, res, response, code);

    } else if (requestType.indexOf('xml') != -1) {

        // XML Requested
        serviceXML.send( req, res, response, code);
    }
    else {
        // Default to JSON
        console.log('Could not determine the proper response type; defaulting to JSON.');
        serviceJSON.send( req, res, response, code);
    }

    return response;
}



/*
 * @function sendSuccess
 *
 * Use this method to package a response to return back to our request.
 *
 * Our standard message format for a response is:
 * @codestart
 * {
 * 	success:'true',
 * 	data: messageData
 * }
 * @codeend
 *
 * The default http status code will be 200, unless you provide
 * a specific code.
 *
 * @param {object} req
 *      An HTTP request object
 * @param {object} res
 * 		An HTTP response object
 * @param {object} messageData
 * 		The data to send back.
 * @param {int} code
 *      The HTTP status code to use in our response.
 * @return {object} a JSON object representing the data we sent back.
 */
exports.sendSuccess = function (req, res, messageData, code) {

	if ('undefined' == typeof code) code = AD.Const.HTTP.OK;  // 200: generic 'all ok' msg

    //// build our response object:
    var response = {
        success:'true',
        data: messageData
    };


    var requestType = req.headers.accept || 'application/json';
    if ((requestType.indexOf('json') != -1) || (req.query.format == 'json') || (req.params.format == 'json')) {

        // JSON requested:
        serviceJSON.send( req, res, response, code);

    } else if (requestType.indexOf('xml') != -1) {

        // XML requested
        serviceXML.send( req, res, response, code);
    }
    else {
        // Default to JSON
        console.log('Could not determine the proper response type; defaulting to JSON.');
        serviceJSON.send( req, res, response, code);
    }

    return response;
}
