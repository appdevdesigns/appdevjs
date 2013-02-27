
/**
 * @function service_JSON.send
 * @parent AD.Comm.Service
 * 
 * ###service_JSON.send
 * Respond with the given data in JSON format.
 *
 * @param {object} req
 *      An HTTP request object
 * @param {object} res
 * 		An HTTP response object
 * @param {string} data
 * 		A String
 * @param {int} code
 *      The HTTP status code to use in our response.
 * @return {nil}
 */
exports.send = function (req, res, data, code) {

	
	if ('undefined' == typeof code) code = AD.Const.HTTP.OK;  // 200: assume all is ok

    res.header('Content-type', 'application/json');
    res.send(JSON.stringify(data).replace('"false"', 'false').replace('"true"', 'true'), code);
    
}

