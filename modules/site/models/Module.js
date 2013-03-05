
/**
 * @class site.server.models.[modelName]
 * @parent site.server.models
 * 
 *  This is an object to manage the interaction with the site.[modelName]s service.
 */


(function () {
	  var onServer = false;
	  if (typeof exports !== 'undefined') {
	  // exports are defined on the server side node modules
	      onServer = true;
	  } 
	  

	  if (!onServer) {

		  var attr = {
		      // Client Definitions
				_adModule:'site',
				_adResource:'module',	// singular
//				_adModel: [ModelName]   // <-- if the data returned is associated with a diff Model obj, provide it's name here:  _adModel:site.Label,
				labelKey:'name',
				id:'id'  // the field that is the id of the data
		  };
		  
		  AD.Service.extend("site.Module",
    		  attr,
    		  {
    		  // define instance methods here.
    		  });
	  }
})()
