
// we are creating a generic Resource Controller  Service
// this file should guide a ResourceObject through each of it's RESTful actions:


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;
var error = AD.Util.Error;
var errorDump = AD.Util.ErrorDump;
var $ = AD.jQuery;




var RCService = function( appKey, model ) {

    var self = this;

    this.appKey = appKey;
    this.resourceKey = model;

    this.model = null;  // which model does this instance use?
    if (appKey && model) this.model = AD.Model.List[appKey+'.'+model];


    if (this.model) {

        this.model.bind('created', function(ev, attr){
            self.onCreated(ev, attr);
        });

        this.model.bind('updated', function(ev, attr){
            self.onUpdated(ev, attr);
        });

        this.model.bind('destroyed', function(ev, attr){
            self.onDestroyed(ev, attr);
        });
    }

}

RCService.prototype = new AD.App.Service({});

module.exports = RCService;


var moduleHub = null;


////---------------------------------------------------------------------
RCService.prototype.publicLinks = function () {
console.log('normal...');
    return Express.publicLinks;
}



////---------------------------------------------------------------------
RCService.prototype.fieldValidations = function () {
    return  {}
}



////---------------------------------------------------------------------
RCService.prototype.find = function (req, res, next) {
    /// is expecting a req.aRAD.filter = { field:value }
    /// places results in res.aRAD.results

    log(req,'   - '+this.resourceKey+'.find()');


    if (this.model) {
        var found = this.model.findAll(req.aRAD.params);
        $.when(found)
            .then(function(listResults){

                if (req.aRAD._findOne) {
                    res.aRAD.results = listResults[0];
                } else {
                    res.aRAD.results = listResults;
                }
                next();
            })
            .fail(function(err){
console.log(err);
                AD.Comm.Service.sendError(req, res, err, AD.Const.HTTP.ERROR_SERVER ); // 500 : our problem
            });
    } else {

        console.log('no Model defined for this resource controller.');
        next();
    }
}




////---------------------------------------------------------------------
RCService.prototype.create = function (req, res, next) {
    /// is expecting a req.aRAD.params = { field:value }
    /// places results in res.aRAD.results
console.log(' in .create() ');
    var self = this;

    log(req,'   - '+this.resourceKey+'.create()');

    var params = req.aRAD.params;

    if (this.model) {

        var newObj = new this.model(this.model.onlyModelFields(params));
        newObj.save(function(id) {

                log(req,'     new id:'+ id);
                var rID = {};
                rID[self.model.id] = id;
                res.aRAD.results = rID;
                next();

        }, function(err) {
          error(req, '     error creating resource');
          errorDump(req, err);
          AD.Comm.Service.sendError(req, res, err, AD.Const.HTTP.ERROR_SERVER ); // 500 : our problem

        });

    } else {

        log(req, 'no Model defined for this resource controller.');
        next();
    }

}


////---------------------------------------------------------------------
RCService.prototype.onCreated = function (ev, attr) {
//    console.log(attr);
    console.log(this.resourceKey+'.onCreate()');
}

////---------------------------------------------------------------------
RCService.prototype.onUpdated = function (ev, attr) {
//    console.log(attr);
    console.log(this.resourceKey+'.onUpdated()');
}

////---------------------------------------------------------------------
RCService.prototype.onDestroyed = function (ev, attr) {
//    console.log(attr);
    console.log(this.resourceKey+'.onDeleted()');
}




////---------------------------------------------------------------------
RCService.prototype.update = function (req, res, next) {
    /// is expecting a req.aRAD.params = { field:value }
    /// places results in res.aRAD.results
console.log(' resource update ...');
    var self = this;

    log(req,'   - '+this.resourceKey+'.update()');

    var params = req.aRAD.params;

    // an update operation has /app/resource/id
    // need to remove id value from
    var id = params.id;

    delete params.id;

    if (this.model) {
        var found = this.model.findOne({id:id});
        $.when(found).then(function( model ){

            model.attrs(self.model.onlyModelFields(params));
            model.save(function() {

                log(req,'     update completed');
                res.aRAD.results = {};
                next();

            }, function(err) {
                error(req, '     error updating resource');
                errorDump(req, err);
                AD.Comm.Service.sendError(req, res, err, AD.Const.HTTP.ERROR_SERVER ); // 500 : our problem
            });
        });

    } else {

        log(req, 'no Model defined for this resource controller.');
        next();
    }

}



////---------------------------------------------------------------------
RCService.prototype.destroy = function (req, res, next) {
    /// is expecting a req.aRAD.params = { field:value }
    /// places results in res.aRAD.results
console.log(' resource destroy ...');
    var self = this;

    log(req,'   - '+this.resourceKey+'.destroy()');

    var params = req.aRAD.params;

    // an update operation has /app/resource/id
    // need to remove id value from
    var id = params.id;

    delete params.id;

    if (this.model) {

        var found = this.model.findOne({id:id});
        $.when(found).then(function( model ){
            model.destroy(function(){

                log(req,'     destroy completed');
                res.aRAD.results = {};
                next();

            }, function(err) {
                error(req, '     error updating resource');
                errorDump(req, err);
                AD.Comm.Service.sendError(req, res, err, AD.Const.HTTP.ERROR_SERVER ); // 500 : our problem
            })
        });

    } else {

        log(req, 'no Model defined for this resource controller.');
        next();
    }

}



//// The Express.* methods are express steps for managing the service calls
var Express = function(service) {
    this.service = service;
};





////---------------------------------------------------------------------
Express.prototype.prepParams = function (req, res, next) {
    // make sure our expected aRAD values are on the req/res params
    req.aRAD = {};
    res.aRAD = {};
    next();
}



////---------------------------------------------------------------------
Express.prototype.hasPermission = function (req, res, next) {
    // Verify the current viewer has permission to perform this action.

    var pkey = req.aRAD.pkey;
    var permission = [pkey.app, pkey.resource, pkey.action].join('.');
console.log(permission);

if (!AD.Defaults.authRequired) next();
else {

    var viewer = AD.Viewer.currentViewer(req);

    log(req, '   - hasPermission(): checking for : '+permission);

    // if viewer has 'app.resource.action' action/permission
    if (viewer.hasTask(permission)) {
console.log(' permissions.next()');
        log(req, '     viewer ['+viewer.guid()+'] has permission: '+permission);
        next();

    } else {

        errorDump(req, '     viewer failed permission check!');
        AD.Comm.Service.sendError(req, res, errorData, AD.Const.HTTP.ERROR_FORBIDDEN);  // 403 : you don't have permission

    } // end if
}
}











////---------------------------------------------------------------------
Express.prototype.findOneCheck = function (req, res, next) {
    // does this route have an :id set?

    var params = req.aRAD.params;
    var id = req.param('id');
    if (id) {
        params[this.service.model.id] = id;
        req.aRAD._findOne = true;
    }

//console.log('--------');
//console.log(id);
//console.log(params);

    req.aRAD.params = params;
    next();
};



////---------------------------------------------------------------------
Express.prototype.idCheck = function (req, res, next) {
    // does this route have an :id set?

    var params = req.aRAD.params;
    var id = req.param('id');
    if (id) {
        params.id = id;
    }

//console.log('--------');
//console.log(id);
//console.log(params);

    req.aRAD.params = params;
    next();
};




////---------------------------------------------------------------------
Express.prototype.grabParams = function (req, res, next) {
    // Make sure all required parameters are given before continuing.

    var params = {};
    var sets = [ 'params', 'body', 'query' ];
    for (var i=0; i<sets.length; i++) {
        for (var paramName in req[ sets[i] ]) {
            if (typeof params[ paramName ] == 'undefined') {
                params[ paramName ] = req[ sets[i] ][ paramName ];
            }
        }
    }

    req.aRAD.params = params;
    next();
};




////---------------------------------------------------------------------
Express.prototype.sendResult = function (req, res, next) {
    // Make sure all required parameters are given before continuing.

    logDump(req,' finished ');

    // send a success message
    AD.Comm.Service.sendSuccess(req, res,  res.aRAD.results );
};



////---------------------------------------------------------------------
Express.prototype.evalParams = function (req, res, next) {
    // Make sure all required parameters are given before continuing.

    var params = req.aRAD.params;

//console.log('evalParams:');
//console.log(params);

    for(var p in params) {

        // check for unspecified parameter in url
        if (params[p] == '['+p+']') {
            console.log( 'resource_controller.evalParams():  found potential missed parameter['+p+'] value:'+params[p]);
            console.log( '  --> ignoring!');
            delete params[p];
        }
    }
//console.log('after:');
//console.log(params);

    next();
};




//these are our publicly available /site/api/hris/object  links:
//note: in below definitions, any value in [] is a templated value replaced with the instances value for that attribute: [id] = obj.id;
//note: params are defined like:  params:{ requiredParam1:'[requiredParam1]', requiredParam2: '[requiredParam2]'}
Express.publicLinks = {
    findAll: { method:'GET',    uri:'/rc/[app]/[resource]', params:{}, type:'resource' },
    findOne: { method:'GET',    uri:'/rc/[app]/[resource]/[id]', params:{}, type:'resource' },
    create:  { method:'POST',   uri:'/rc/[app]/[resource]', params:{}, type:'action' },
    update:  { method:'PUT',    uri:'/rc/[app]/[resource]/[id]', params:{}, type:'action' },
    destroy: { method:'DELETE', uri:'/rc/[app]/[resource]/[id]', params:{}, type:'action' },
}

//var serviceURL = publicLinks.create.uri.replace('[id]',':id').replace('[object_key]', ':hrisObjKey');




RCService.prototype.setup = function( app ) {

    var self = this;
    this.Express = new Express(this);

    var myFind = function(req, res, next) {
        self.find(req, res, next);
    }

    var myCreate = function(req, res, next) {
        self.create(req, res, next);
    }

    var myUpdate = function(req, res, next) {
        self.update(req, res, next);
    }

    var myDestroy = function(req, res, next) {
        self.destroy(req, res, next);
    }


    var findOneCheck = function(req, res, next) {
        self.Express.findOneCheck(req, res, next);
    }

    var actionFind = function(req, res, next) {
        req.aRAD.pkey = {
                app : self.appKey,
                resource : self.resourceKey,
                action : 'find'
        };
        next();
    }

    var actionCreate = function(req, res, next) {
        req.aRAD.pkey = {
                app : self.appKey,
                resource : self.resourceKey,
                action : 'create'
        };
        next();
    }

    var actionUpdate = function(req, res, next) {
        req.aRAD.pkey = {
                app : self.appKey,
                resource : self.resourceKey,
                action : 'update'
        };
        next();
    }

    var actionDestroy = function(req, res, next) {
        req.aRAD.pkey = {
                app : self.appKey,
                resource : self.resourceKey,
                action : 'destroy'
        };
        next();
    }


    defaultLanguage = function(req, res, next) {
        // make sure we have a language_code param ready for our multilingual services

//console.log(' initial lang_code:'+req.aRAD.params.language_code);
//console.log(req.aRAD.params);

        // if we are a condition that needs a language_code:
            // Model is Multilingual  || or has a language_code field:
        if (self.model._isMultilingual || (self.model.modelFields['language_code'])) {

            // if no language_code found in params:
            if (typeof req.aRAD.params.language_code == 'undefined') {
        //console.log(' generating default ...');
                // does the viewer have a setting?
                var viewer = AD.Viewer.currentViewer(req);
                var viewerLangCode = viewer.languageKey;

                // default to side settings if not
                var langCode = viewerLangCode || req.aRAD.defaults.siteDefaultLanguage || 'en';

                req.aRAD.params.language_code = langCode;
            }

        }
//console.log(' final lang_code:'+req.aRAD.params.language_code);
        next();
    }



    var verifyParams = function (req, res, next) {
        // Make sure all required parameters are given before continuing.

        log(req, '   - verifyParams(): checking parameters');

        var listRequiredParams = self.fieldValidations();
        AD.Util.Service.validateParamsExpress(req, res, next, listRequiredParams);
    };





    var findStack = [
                     AD.App.Page.serviceStack,      // authenticates viewer, and prepares req.aRAD obj.
                     this.Express.prepParams,       // get the ResourceObj to work with
                     actionFind,
                     this.Express.hasPermission,    // make sure we have permission to access this
                     verifyParams,                  // make sure all required params are given
                     this.Express.grabParams,       // gather all available inputs and store them in req.aRAD.params
                     findOneCheck,                  // see if :id was provided on the url, (== findOne() )
                     defaultLanguage,               // make sure we have a defaultLanguage set
                     this.Express.evalParams,       // placeholder for request Controller to verify parameters:
                     myFind,                        // actually run the lookup
                     this.Express.sendResult
                 ];

    this.Express.actionStacks = {
            findAll:findStack,
            findOne:findStack,                      // findOne() is really a findAll() with an id set:
            create:[
                    AD.App.Page.serviceStack,       // authenticates viewer, and prepares req.aRAD obj.
                    this.Express.prepParams,        // get the ResourceObj to work with
                    actionCreate,
                    this.Express.hasPermission,     // make sure we have permission to access this
                    verifyParams,                   // make sure all required params are given
                    this.Express.grabParams,        // gather all available inputs and store them in req.aRAD.params
                    findOneCheck,                   // see if :id was provided on the url, (== findOne() )
                    defaultLanguage,                // make sure we have a defaultLanguage set
                    this.Express.evalParams,        // placeholder for request Controller to verify parameters:
                    myCreate,                       // actually run the create operation
                    this.Express.sendResult
                ],

            update:[
                    AD.App.Page.serviceStack,       // authenticates viewer, and prepares req.aRAD obj.
                    this.Express.prepParams,        // get the ResourceObj to work with
                    actionUpdate,
                    this.Express.hasPermission,     // make sure we have permission to access this
                    verifyParams,                   // make sure all required params are given
                    this.Express.grabParams,        // gather all available inputs and store them in req.aRAD.params
                    this.Express.idCheck,           // see if :id was provided on the url,
                    defaultLanguage,                // make sure we have a defaultLanguage set
                    this.Express.evalParams,        // placeholder for request Controller to verify parameters:
                    myUpdate,                       // actually run the update operation
                    this.Express.sendResult
                ],

            destroy:[
                    AD.App.Page.serviceStack,       // authenticates viewer, and prepares req.aRAD obj.
                    this.Express.prepParams,        // get the ResourceObj to work with
                    actionDestroy,
                    this.Express.hasPermission,     // make sure we have permission to access this
                    verifyParams,                   // make sure all required params are given
                    this.Express.grabParams,        // gather all available inputs and store them in req.aRAD.params
                    this.Express.idCheck,           // see if :id was provided on the url,
                    defaultLanguage,                // make sure we have a defaultLanguage set
                    this.Express.evalParams,        // placeholder for request Controller to verify parameters:
                    myDestroy,                      // actually run the update operation
                    this.Express.sendResult
                ]

    }




    moduleHub = this.module.hub;
    var rcAttribs = { app: this.appKey,  resource:this.resourceKey };
    var publicLinks = this.publicLinks();
    for (var a in publicLinks) {

        var link = publicLinks[a];

        var uri = AD.Util.String.render(link.uri, rcAttribs).replace('[id]',':id').toLowerCase();
        var verb = link.method.toLowerCase();

console.log('v['+verb+']  uri['+uri+']');
        app[verb](uri, this.Express.actionStacks[a]);
    }



/*
    ////Register the public site/api
    this.setupSiteAPI(this.resourceKey, publicLinks);
*/

} // end setup()

//// TODO: make sure links are available inside the resource file

