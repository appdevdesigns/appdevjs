

/*
 * @class AD_Server.App.Service
 * @parent AD_Server.App
 * 
 * This object allows a framework service to plugin to the system.
 */
function Service( opt ) {

	
    this.version = 1;       // current Service definition version
    this.hub     = null;    // shared notification hub from Module/Interface
    
    
    for(var i in opt) {
        this[i] = opt[i];
    }
    
    this.type = 'ad.service';
    
};
module.exports = Service;



/**
 * @function setupSiteAPI
 * 
 * Register the provided links with the site API.
 *
 * @param {string} resource  what is the name of this resource to register
 * @param {object} links
 */
Service.prototype.setupSiteAPI = function( resource, links ) 
{

    // update our urls to use our module.name()
    var data = {moduleName:this.module.name()};
    for (var a in links){
        var entry = links[a];
        links[a].uri = AD.Util.String.render(entry.uri, data); //entry.uri.replace('[moduleName]', this.module.name());
    }
    
    
    ////Register the public site/api
    var definition = { 
        module:this.module.name(),
        resource:resource
    }
    AD.Util.Service.registerAPI(definition, links);
    
}


