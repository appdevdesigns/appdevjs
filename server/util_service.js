
var request = require('request');
var $ = AD.jQuery;




//// Here we attempt to pull in some of the most common 
/**
 * @class checks
 * @parent AD.Util.Service.validateParams
 * 
 * This object collects some of the common parameter checks used for our 
 * services.  Each check is a method called with a parameter value, and returns
 * true if value passes the check, or false otherwise.
 * 
 * All checks will return true if the given value parameter is undefined, except
 * for the 'exists' check.
 * 
 */
var checks = {};



/**
 * @function exists
 * 
 * This method checks whether or not the given value is considered 'undefined'). 
 * If the value is not undefined, then the value 'exists'.
 * 
 */
checks.exists = function(value) {
    return (typeof value != 'undefined');
}



/**
 * @function notEmpty
 * 
 * This method checks whether or not the given value is '' or null.  If it is 
 * not either of these values, then it is considered 'not empty'.
 * 
 */
checks.notEmpty = function( value ) {
    if (typeof value != 'undefined') 
        return ((value != '') && ( value != null));
    else
        return true;
}



/**
 * @function isNumeric
 * 
 * This method checks whether or not the given value is a numeric value.
 * 
 */
checks.isNumeric = function(n) {
    if (typeof value != 'undefined') {
        n = n.replace(/,/,".");  // adjust for language formatting of values ( ',' -> '.')
        return !isNaN(parseFloat(n)) && isFinite(n);
    } 
    else
        return true;
}






/**
 * @class  AD_Server.Util.Service
 * @parent AD_Server.Util
 *
 * ###Service
 *
 * This object contains several tools designed to facilitate the common tasks of 
 * server side services.
 */
var Service = {};


/**
 * @function validateParams
 *
 * This function provides several common parameter validation features.
 * 
 * To use, simply pass in an object representing the parameters you want to 
 * check, associated with an array of checks to perform.  If all the checks pass, 
 * then the success callback will be called.  If ANY of the checks fail, then the 
 * error callback will be called with a description of the error and which check failed.
 * 
 * The paramList is formatted as follows:
 * @codestart
 * {
 *  'var1': ['exists', 'notEmpty', 'isEmail'],
 *  'var2': ['exists', 'notEmpty', 'isNumeric'],
 *  ...
 *  'varN': ['exists', 'notEmpty', 'isDate'],
 * }
 * @codeend
 * 
 * @param {obj} req  The Express req object that we can use to gather the values
 * @param {array} paramList  A list of required parameters 
 * @param {function} onSuccess A callback function to call if all checks pass
 * @param {function} onError A callback function to call if any check fails
 * @return nil
 */
Service.validateParams = function( req, paramList, onSuccess, onError ) {
    
    var isValid = true;
    
    // For each variable
    for (var p in paramList) {
        var value = req.param(p);
        var listChecks = paramList[p];
        
        for (var c=0; c < listChecks.length; c++) {
            var op = listChecks[c];
            if (typeof checks[op] != 'undefined') {
                if (!checks[op](value)) {
                    
                    if (onError) {
                        // check failed
                        var err = {
                                check:op,
                                param:p,
                                value:value
                        }
                        
                        switch(op) {
                            case 'exists':
                                err.message = 'parameter['+p+'] is required';
                                break;
                            
                            default:
                                err.message = 'parameter['+p+'] has invalid value['+value+']';
                                break;
                        }
                        onError(err);
                        return;
                    }
                }
            } else {
                console.log(' *** unknown validation check ['+op+']');
            }
        }
    }
    // next
    
    if (onSuccess)  onSuccess();
}



/**
 * @function validateParamsExpress
 *
 * This function is an Express callback function to use as an interface to the 
 * AD.Util.Service.validateParams() function.
 * 
 * If all checks pass, the next() function will be called. 
 * 
 * If any checks fail, an INVALID_PARAM error will be returned to the res object.
 * 
 * 
 * @param {json} req  The Express request object
 * @param {json} res  The Express response object
 * @param {fn()} next The Express next() 
 * @param {array} paramList  A list of required parameters
 * @return nil
 */
Service.validateParamsExpress = function( req, res, next, paramList ) {
   // Make sure all required parameters are given before continuing.
    
    AD.Util.Service.validateParams(req, paramList, function(){
        next();
    }, function(err) {
        
        /// TODO: send back multilingual Label [site.util.service.MissingParams]
        AD.Util.Error(req, 'invalid parameters ['+err.param+']');
        AD.Util.Error(req, 'failed check ['+err.check+']'); 
        AD.Util.Error(req, 'value ['+err.value+']');
        AD.Util.LogDump(req);
        
        // return an error message (400: bad request)
        AD.Comm.Service.sendError(req, res, { errorMSG: err.message}, AD.Const.HTTP.ERROR_CLIENT);
    
    });
   
}



/**
 * @function verifyParams
 *
 * Check the various `req` param objects for the existance of the given 
 * required parameters.  If one is missing, then return an error message.
 *
 * * req.params : parameters found in the route path
 * * req.query : querystring parameters, a.k.a. $_GET
 * * req.body : body parameters, a.k.a. $_POST
 * 
 * @param {JSON} req  The Express reqeust object
 * @param {JSON} res  The Express response object
 * @param {FN()} next The Express next() 
 * @param {Array} paramList  A list of required parameters [ "param1", "param2",...,"paramN"]
 * @return nil
 */
Service.verifyParams = function( req, res, next, paramList ) {
   // Make sure all required parameters are given before continuing.
    
    var allThere = true;
    var missingParams = [];
    
    for (var i=0; i<paramList.length; i++) {
        if (req.param(paramList[i]) == undefined) {
            allThere = false;
            missingParams.push(paramList[i]);
        }
    }

    // if all parameters are given
    if (allThere) {
        
        // continue
        next();
        
    } else {
        
//// TODO: send back multilingual Label [site.util.service.MissingParams]
        AD.Util.Error(req, 'missing parameters ['+missingParams.join(', ')+']');
        AD.Util.Error(req, req.params); 
        AD.Util.Error(req, req.body);
        AD.Util.Error(req, req.query);
        AD.Util.LogDump(req);
        
        // return an error message (400: bad request)
        AD.Comm.Service.sendError(req, res, { errorMSG: 'missing parameters:['+missingParams.join(', ')+']'}, AD.Const.HTTP.ERROR_CLIENT);
    }
}



/**
 * @function applyLinks
 *
 * Many of our service objects that we return can apply a set
 * of links that are specified according to a given linkDefinition.
 * 
 * This method returns a copy of the list of objects with those links applied
 * to them.
 * 
 * @param {array} list  a given list of objects 
 * @param {object} lnkDefs  an object that defines the links
 * @return {array} original list of objects with added links
 */
Service.applyLinks = function(list, lnkDefs ) {
  // Make sure all required parameters are given before continuing.
    
    var modifiedList = [];
    
    var isArray = true;
    if (typeof list != 'array') {
        list = [list];
        isArray = false;
    }
    
    // for each result
    for(var iLF=0; iLF < list.length; iLF++) {
        
        var entry = list[iLF];
        
        // now update it with our actions:
        entry.__links = {};
        for (var mA in lnkDefs) {
            var action = AD.Util.Object.clone(lnkDefs[mA]);
//console.log('action:');
//console.log(action);

            action.uri = AD.Util.String.render(action.uri, list[iLF]);
            entry.__links[mA] = action;
        }
        
        modifiedList.push(entry);
    }

    // if the given data wasn't an array, then just send
    // back the 1st entry.
    if (!isArray) {
        modifiedList = modifiedList[0];
    }
    
    
    return modifiedList;
}



/**
 * @function registerAPI
 *
 * This method registers link(s) with our /site/api/[module]/[resource]
 * service.
 * 
 * definition is a json obj in this format:
 * @codestart
 * {
 *     module:"[moduleKey]",
 *     resource:"[resourceKey]"
 * }
 * @codeend
 * 
 * links is a json obj defining the possible links associated with this 
 * module/resource.  For example:
 * @codestart
 * {
 *     //'actionKey': { method:[httpVerb]  uri:'link/definition', params:{required:value}, type:'resource|action|link' } 
 *     findAll: { method:'GET',    uri:'/[moduleKey]/[resourceKey]', params:{}, type:'resource' },
 *     findOne: { method:'GET',    uri:'/[moduleKey]/[resourceKey]/[id]', params:{}, type:'resource' },
 *     create:  { method:'POST',   uri:'/[moduleKey]/[resourceKey]', params:{}, type:'action' },
 *     update:  { method:'PUT',    uri:'/[moduleKey]/[resourceKey]/[id]', params:{module:'hris', page: '[page]'}, type:'action' },
 *     destroy: { method:'DELETE', uri:'/[moduleKey]/[resourceKey]/[id]', params:{}, type:'action' }
 * }
 * @codeend
 * The 'actionKeys' follow the javascriptMVC model pattern.
 * 
 * @param {object} definition define which module and resource 
 * @param {array}  links  an array of links being registered 
 */
Service.registerAPI = function(definition, links ) {
    // for each link
    for (var a in links){
        
        var entry = { 
                module:definition.module,
                resource:definition.resource,
                action:a,
                link:links[a]
        }
        
        // post the notification
        AD.Comm.Notification.publish(AD.Const.Notifications.SITE_API_NEWLINK, entry);
    }
}


module.exports = Service;
