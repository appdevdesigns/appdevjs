/**
 * @class AD_Client.Comm
 * @parent AD_Client
 *
 * AD.Comm
 */

if ("undefined" == typeof AD.Comm) {
    AD.Comm = {};
}



/*
* 
* @class AD_Client.Comm.API
* @parent AD_Client.Comm
* 
* ##API interface
* 
* We provide a framework utility to allow our Model (and Service) objects 
* to dynamically load their url links from the server definitions.
*
*
* ##Usage:
*
*  suppose we have a nifty widget on a screen that displays a list of 
*  favorite TV shows.  Each time a new TV Show is created, it wants to 
*  refresh it's list of shows.
*
*  Please see the code examples in AD.Comm.Notification.publish and AD.Comm.Notification.subscribe
*  for instructions on how to do this.
*
*/
//--------------------------------------------------------------------------
AD.Comm.API = {};
AD.Comm.API._links = {};  // contain all our link definitions:
// {
//	 "module": {
//		"resource":{
//			uri:'/some/uri/[id]',
//			params:{},
//			type:'action'
//		}
//	  }
// }

/* 
 * @function link
 * 
 *  return a link description object that can be used to communicate with 
 *  a server side resource.
 *  
 *  @codestart
 *      AD.Comm.Notification.publish('TVShow.Added', { name:'Hawaii-5-O' });
 *  @codeend
 */
AD.Comm.API.link = function(module, resource, action, onSuccess, onError){
	
	var dfd = $.Deferred();
    
	var links = AD.Comm.API._links;
	var linkFound = false;
	
	var processLink = function( link) {
		
		// save url:
		if (!linkFound) AD.Comm.API.addLink(module, resource, action, link);
		
		// callbacks get processed first:
		if (onSuccess) {  onSuccess(link); }
		
		dfd.resolve(link);
	}
	
	
	// validate inputs
	if ('undefined' == typeof module) module = '';
	if ('undefined' == typeof resource) resource = '';
	if ('undefined' == typeof action) action = '';
	
	// if link is already found, then return link
	if (('undefined' != typeof links[module])
		&& ('undefined' != typeof links[module][resource])
		&& ('undefined' != typeof links[module][resource][action])) {
		
		linkFound = true;
		processLink(links[module][resource][action]);
		
	} else {
		// make request for /site/api/[module]/[resource]/[action]
		
		var url = '/site/api';
		if ('' != module) url += '/'+module;
		if ('' != resource) url += '/'+resource;
		if ('' != action) url += '/'+action;
		
		AD.ServiceJSON.get({
            url: url,
            params: {},
            success: function (data) {
                        var data = AD.ServiceModel.returnData(data);
                        processLink(data);
                    },
            failure: function (error) {
            	if (onError) onError(error);
            	dfd.reject(error);
            }

        });
	}

    
    return dfd;
}



/* 
 * @function addLink
 * 
 *  Add the given module.resource.action link to our list of links.
 *  
 *  @param {string} module  The module key 
 *  @param {string} resource The resource key
 *  @param {string} action The Action Key
 *  @param {object} link  The link being stored
 *  @return {undefined}
 */
AD.Comm.API.addLink = function(module, resource, action, link){
	
	var links = AD.Comm.API._links;
	
	// validate inputs
	if ('undefined' == typeof module) module = '';
	if ('undefined' == typeof resource) resource = '';
	if ('undefined' == typeof action) action = '';
	
	
	if ('undefined' == typeof links[module]) { links[module] = {}; }
	if ('undefined' == typeof links[module][resource]) { links[module][resource] = {}; }
	
	links[module][resource][action] = link;

}



/* 
 * @function params
 * 
 *  Return the params of the given link 
 *  
 *  The link.params definition follows one of these patters:
 *  @codestart
 *  {
 *  	key:'',							// 1) key = attr[key]
 *  	param1:'[key]',					// 2) value of param1 = attr[key]
 *  	param2:'/[key1]/[key2]/[key3]'	// 3) variation of (2) with multiple keys
 *  }
 *  @codeend
 *  
 *  For example, if attr and params are:
 *  @codestart
 *  var attr = {
 *  	id:1,
 *  	name:'appRAD'
 *  }
 *  
 *  var link.params = {
 *  	id:'',
 *  	module:'[name]',
 *  	uri:'/[name]/[id]'
 *  }
 *  @codeend
 *  
 *  Then a call to AD.Comm.API.params(link, attr) would produce:
 *  @codestart
 *  {
 *  	id:1,
 *  	module:'appRAD',
 *  	uri:'/appRAD/1'
 *  }
 *  @codeend
 *  
 *  @param {object} link  The link definition
 *  @param {object} attr  key=>value pairs that can modify the params template
 *  @return {object}
 */
AD.Comm.API.params = function(link, attr){
	
	var params = {};
	var tParams = link.params;
	
	// transfer over the params and copy in any direct key references
	for (var t in tParams){
		
		// 1) if the tParam.key  matches an attr.key  then params.t = attr.t
		if ('undefined' != typeof attr[t])  params[t] = attr[t];
		else params[t] = tParams[t];
	}
	
	// for each attribute, do any string replacing on the params
	for (var a in attr) {
		
		for (var p in params) {
			
		    // make sure params[p] is a valid string
		    if ('string' == typeof params[p]) {
		        
    			// 2 & 3) replace any [a] values embedded in the param[key] data.
    			params[p] = params[p].replace('['+a+']', attr[a]);
		    }
		}
	}
	
	
	return params;

}



/* 
 * @function uri
 * 
 *  Return the uri of the given link 
 *  
 *  @param {object} link  The link definition
 *  @param {object} attr  key=>value pairs that can modify the uri template
 *  @return {string}
 */
AD.Comm.API.uri = function(link, attr){
	
	var uri = link.uri;
	
	for (var a in attr){
		uri = uri.replace('['+a+']', attr[a])
	}
	
	return uri;

}



