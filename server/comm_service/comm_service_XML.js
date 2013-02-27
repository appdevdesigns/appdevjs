
/**
 * @function service_XML.send
 * @parent AD.Comm.Service
 * 
 * ###service_XML.send
 * Respond with the given data in XML format. Calls objectToXML to do this.
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

	// make sure our http status code is set:
	if ('undefined' == typeof code) code = AD.Const.HTTP.OK;  // 200: assume all is ok
	
	
    res.header('Content-type', 'text/xml');

    var response = '<?xml version=\"1.0\"?>\n';
    response = response + objectToXML('response', data);
    
    res.send(response, code);
}



/**
 * @function service_XML.objectToXML
 *
 * ###service_XML.objectToXML
 * Respond with the given data in XML format.
 *
 * @param {string} rootName
 * 		A String
 * @param {string} data
 * 		A String
 * @return {string} response
 */
var objectToXML = function (rootName, data) {


//console.log("");
//console.log('comm_service(): ['+typeof data+'] data:');
//console.log(data);
    
    var response = '<'+rootName+'>\n';

    if ( typeof data == 'string') {
        
        response += data;
        
    } else {
        
        for( var di in data) {
    
//console.log("");
//var tp = typeof data[di];
//console.log('typof di['+di+']  ['+data[di]+'] = ['+tp+']');
    
            if (Object.prototype.toString.call(data[di]) == "[object Array]") {
            
                response += '<'+di+'>' + "\n";
                
                for (var indx=0; indx<data[di].length; indx++) {
                
                    response += objectToXML( di+'.'+indx, data[di][indx]) + "\n";
                
                }
                
                response += '</'+di+'>' + "\n";
                
            } else if (typeof data[di] == 'object') {
    
                response += objectToXML( di, data[di] ) + "\n";
                
            } else {
            
                response += '<'+di+'>' + data[di] + '</'+di+">\n";
                
            }
        }
    }

    response = response + '</'+rootName+'>';
    return response;

}

