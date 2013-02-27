//
// ModelInstance
// 
// Defines an instance of a model.  Model instances are able to get, set, 
// update, and destroy their corresponding data entries.  They rely on their 
// Model[X] Base class' create(), update(), destroy() methods to carry out
// their operations.
//
// Model[X] Base classes also return individual instances of their data in 
// their findAll(), findOne() methods.
//
// An Example of how an instance can be used:
// @codestart
// var viewer = Viewer._new({ userID:'skipper', password:'doodle'});
// viewer.save();  // creates the data in the db table
// viewer.userID = 'sk1pper';
// viewer.save();  // updates the data in the db table.
// viewer.update({ password:'d00dle' });  // saves local change, and updates record.
// viewer.destroy(); // removed the row.
//
// Viewer.findAll({}, function (list) {
//      for (var a in list) {
//          list[a].isActive = 0;
//          list[a].save();         // each entry in list is an instance
//      }
// });
// @codeend
//



// search the given args for the corresponding entries in parameterList
// and return a key:value object in form:
// {
//    [parameterList[0]] : [args[0]],
//     ...
//    [parameterList[n]] : [args[n]]
// }
var parseArguments = function (parameterList, args) {
    
    var _args = {};
    for (var i=0; i<parameterList.length; i++){
        _args[parameterList[i]] = (typeof args[i] != 'undefined')? args[i]: null ;
    }
    return _args;
}



function ModelInstance(properties, klass) {
    
    
    for (var key in properties) {
        this[key] = properties[key];
    }
    
    
    this._isDirty = false;  // does this object differ from Stored Value
    
    var _klass = klass;
    this.getCLASS = function () {return _klass;};

}
module.exports = ModelInstance;





//model.attr(name, value, success, error) -> undefined
ModelInstance.prototype.attr = function (name, value, success, error) {
    
    var args = parseArguments(['name', 'value', 'onSuccess', 'onError'], arguments);
    var mode = 0; //0: invalid  1: get value  2: setValue
    
    if (args.name != null && args.value == null) mode = 1;
    if (args.name != null && args.value != null) mode = 2;
    
    switch(mode){
        case 1:
            return (typeof this[args.name] != 'undefined')? this[args.name]:null;
            break;
        case 2:
            // TODO: verify name is actually one of the model's attributes before adding it.
            this[args.name] = args.value;
            return;
            break;
    }
    
}


//model.attrs(attributes) -> Object
ModelInstance.prototype.attrs = function (attributes) {
    
    for (var a in attributes) {
        
        this.attr(a, attributes[a]);
    }
    
    return {}; // TODO: return object attributes
}



ModelInstance.prototype.destroy = function (onSuccess, onError) {
    
    var canDestroy = false;
    
    var _Class = this.getCLASS();

    // find my pk name
    var pkName = _Class.primaryKey;

    
    // if I have a value set for this[pk] then isUpdate = true;
    if ((typeof this[pkName] != 'undefined') && (this[pkName] > 0)) {
        canDestroy = true;
    }
    
    if (canDestroy) {

        var id = this[pkName];
        
        _Class.destroy(id, function(data) {
            
            delete this[pkName]; // remove this id
            
            // TODO: update any returned values here
            if (typeof onSuccess != 'undefined') onSuccess(data);
            
        }, onError);
        
    } 
}



ModelInstance.prototype.save = function (onSuccess, onError) {
    
    var isUpdate = false;
    var _Class = this.getCLASS();

    // find my pk name
    var pkName = _Class.primaryKey;
    
//console.log(_Class);
//throw new Error('look at _Class');

    var _model = _Class.getModel();
    
    // find my set attributes (w/o primarykey)
    var attr = {};
    for(var a in _model) {
        // if current entry is not a primary Key and is a member of this model then:
        if ( (!_Class.isAPrimaryKey(a)) && (typeof this[a] != 'undefined')) {
            attr[a] = this[a];
        }
    }
    
    // if I have a value set for this[pk] then isUpdate = true;
    if ((typeof this[pkName] != 'undefined') && (this[pkName] > 0)) {
        isUpdate = true;
    }
    
    if (isUpdate) {

        var id = this[pkName];
        
        _Class.update(id, attr, function(data) {
            
            // TODO: update any returned values here
            if (typeof onSuccess != 'undefined') onSuccess(data);
            
        }, onError);
        
    } else {

        var self = this;
        _Class.create(attr,function(data){
            
            if (typeof data[pkName] != 'undefined') {
                self[pkName]= data[pkName];
            }
            if (typeof onSuccess != 'undefined') onSuccess(data);
            
        }, onError);
    }
}



ModelInstance.prototype.update = function (attr, onSuccess, onError) {
    
    this.attrs(attr);
    this.save(onSuccess, onError);
}
