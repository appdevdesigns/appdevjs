  
/* @class AD_Server.Model.Datastore.Datastore_MySQL
 * @parent AD_Server.Model.Datastore
 * 
 * Implements a DataStore that is backedup by a MySQL db. 
 */
var __doc;

// reuse the shared DB of our site:
var myDB = require(__appdevPath+'/server/database.js').sharedDB();
exports.DB = myDB;


var create = function (dataMgr, callback) {
// return a new instance of our DB.

    var dbTable = dataMgr.dbTable;
    var dbName = dataMgr.dbName || AD.Defaults.dbName;
    
    var columns = '';
    var values = [];
    var valuesText = '';
    
    for (var key in dataMgr.model) {
    
        if (columns != '') columns += ', ';
        columns += key;
        
        values.push( dataMgr.model[key]);
        
        if (valuesText != '') valuesText += ', ';
        valuesText += '?';
    }
    
//    var sql = 'INSERT INTO '+dbName+'.'+dbTable+' ('+ columns + ') VALUES ('+valuesText + ')';
    var sql = ['INSERT INTO ',dbName,'.',dbTable,' (', columns , ') VALUES (',valuesText , ')'].join('');

//console.log('-------');
//console.log('sql:'+sql); 
//console.log('values:');
//console.log(values);
    
    myDB.query(sql, values, function( err, info) {
        
        if (err) { 
            console.log(err);  
            console.log('sql:'+sql); 
            console.log('values:'); 
            console.log(values); 
        }
        
        //// on a create operation, we return the new ID of the object:
        var insertID = -1;
        if (undefined !== info) {
            if (undefined !== info.insertId) {
                insertID = info.insertId;
            }
        }
        callback( err, insertID );
    });
}
exports.create = create;



var validOperations = {
        '=':'=',
        '!=':'!=',
        'like':' like ',
        '!like':' not like ',
        '>': '>',
        '>=': '>=',
        '<' : '<',
        '<=': '<=',
//        'in': ' in '
}

var valueConversions = {
        'in': function(value) {
                if ('array' == typeof value)  return '(' + array.join(',') + ')';
                return '(' + value + ')';
            }
}

var conditionParse = function(fieldName, obj, values) {
    
/*
 {
     '>=':1,
     '<=':10,
     '>' :3,
     '<' :7,
     '!=':6,
     'in':[ 5, 6, 7],
     '=' : 5,
     'or':{
             '=':4
         }
 }
 
 */
    var conditions = [];
    
    // foreach op in obj
    for (var k in obj) {
        
        // if it is valid Operation
        if ('undefined' != typeof validOperations[k]) {

            var op = validOperations[k];
            var val = obj[k];
            if ('undefined' != typeof valueConversions[k])  val = valueConversions[k](val);
            
            conditions.push( fieldName + op + '?');
            values.push(val);
            
///// TODO: use node-validator to .xss() the inputs to 'in', so we can place them in the condition 
/////       directly: fieldName + ' IN ( ' + check(values.join(',')).xss() + ')';
        }
        
        
    }
    
    
    var condition = conditions.join(' AND ');
    
    if ('undefined' != typeof obj['or']) {
        
        var thisCondition = conditionParse(fieldName, obj[k], values);
        condition = '('+condition+') OR ' + thisCondition;
        
    }
    
    return '(' + condition + ')';
    
}

var read = function (dataMgr, callback) {
// return a new instance of our DB.

//console.log('--- dataStore.MySQL.read(): dataMgr ---');
//console.log(dataMgr);

    var dbTable = dataMgr.dbTable;
    
    var conditions = [];
    if (dataMgr.cond) conditions.push(dataMgr.cond);
    
    var values = [];
    
    // Which fields to retrieve?
    var select = '*';
    
    if (!dataMgr.selectedFields._empty) {
        delete dataMgr.selectedFields._empty;
        select = '';
        for (var key in dataMgr.selectedFields) {
            
            // These fields all have a tref prepended
            if (select != '') select += ', ';
            select += dataMgr.selectedFields[key].tref+'.'+key;
        }

    }
    
    // Any JOINs required?
    var tableName = dataMgr.dbName+'.'+dbTable;
    if (dataMgr.joinedTables.length > 0) {
        tableName += ' AS p';
        tableName += getJoinedTables(dataMgr.dbName, dataMgr.joinedTables, 'p', values);
    }
//console.log('model:');
//console.log(dataMgr);
 
    // Build up the condition (WHERE) from the model
    for (var key in dataMgr.model) {
    
//        if (condition != '') condition += ' AND ';
        var value = dataMgr.model[key];
        var fieldName = key;
        var op = '=';
        
        if ((typeof dataMgr.model[key] == 'object') && (value !== null)) {
            
            // this is not a simple key = value condition:
            
            //// NOTE: 
            //// values related to table joins will look like:  { value:'xxx', tref:'yyy' }
            //// values related to complex conditions will look like: { '=':value1, '>':value2', ... }
            
            // if this was a table join op
            if ('undefined' != typeof value.tref) {
                
                // More work needed
                value = dataMgr.model[key].value;
                if (typeof dataMgr.model[key].tref != 'undefined') {
                    fieldName = dataMgr.model[key].tref+'.'+fieldName;
                }
                
                // add the condition & values
                conditions.push(fieldName+op+'?');
                values.push( value );
                
            } else {
                
                
                // compile complex condition
                var thisValues = [];
                
                var thisCondition = conditionParse(fieldName, value, thisValues);
                
//console.log('');
//console.log(' :::: thisCondition :::');
//console.log(thisCondition);
//console.log('values:');
//console.log(thisValues);

                
                conditions.push(thisCondition);
                values = values.concat(thisValues);
                
            }
/*
            // if this was an operation based structure:
            if ('undefined' != typeof dataMgr.model[key].op) {
                
                // this is a given {op:'like', value:'value'}
                var currOp = dataMgr.model[key].op.toLowerCase();
                
                // if op is valid:
                if ('undefined' != typeof validOperations[currOp]) {
                    op = validOperations[currOp];
                }
                
            }
*/
            
        } else {
            
            // add the condition & values
            conditions.push(fieldName+op+'?');
            values.push( value );
        
        }
        
    }
    
    var condition = conditions.join(' AND ');
    
    var sql = 'SELECT '+select+' FROM '+tableName;
    if (condition != '') sql += ' WHERE '+condition;
    
//console.log('dataStore.read()  : sql['+sql+']');
//console.log('dataStore.read()  : values --');
//console.log(values);

    myDB.query(sql, values, function( err, results, fields) {

        callback( err, results, fields );
    });
}
exports.read = read;

var getJoinedTables = function getJoinedTables (dbName, joinedTables, joinToTref, values) {
    var joinedTableString = '';
    for (var i = 0; i < joinedTables.length; i++ ) {
        var table = joinedTables[i];
        if (table.joinToTref == joinToTref) {
            // Call recursively to look for other tables joined to this one
            var lowerTables = getJoinedTables(dbName, joinedTables, table.tref, values);
            
            var open = (lowerTables == '') ? '' : '(';
            var close = (lowerTables == '') ? '' : ')';
            joinedTableString += ' ' + table.type+' JOIN '+open;
            joinedTableString += dbName+'.'+table.tableName;
            joinedTableString += ' AS '+table.tref;
            joinedTableString += lowerTables+close;
            joinedTableString += ' ON '+table.joinToTref+'.'+table.foreignKey;
            joinedTableString += ' = '+table.tref+'.'+ (table.referencedKey || table.foreignKey);
            if (typeof table.condition != 'undefined') {
                for (var j = 0; j < table.condition.length; j++ ) {
                    var condition = table.condition[j];
                    joinedTableString += ' AND '+condition.tref+'.'+condition.key+'=?';
                    values.push(condition.value);
                }
            }
        }
    }
    return joinedTableString;
}



var runSQL = function (sql, values, callback) {
// just run the sql and return .

    myDB.query(sql, values, function( err, results, fields) {

        callback( err, results, fields );
    });
}
exports.runSQL = runSQL;





var update = function (dataMgr, callback) {

    var dbTable = dataMgr.dbTable;
    var dbName = dataMgr.dbName || AD.Defaults.dbName;
    
//console.log(dataMgr);    
    var condition = [];
    if((undefined !== dataMgr.cond) && (dataMgr.cond != '')) condition.push(dataMgr.cond);
    
    var values = [];
    var fieldValues = '';
    
    for (var key in dataMgr.model) {
    
        if (fieldValues != '') fieldValues += ', ';
        fieldValues += key+'=?';
        
        values.push( dataMgr.model[key]);
        
    }
    
    if ((undefined !== dataMgr.id ) 
        && (dataMgr.id > -1)) {
        
        condition.push(dataMgr.primaryKey+'=?');
        values.push(dataMgr.id);
        
    }
    

    var sql = ['UPDATE ',dbName,'.',dbTable,' SET ',fieldValues];
    if (condition.length > 0) sql.push(' WHERE ',condition.join(' AND '));
    
//console.log(' -- sql['+sql.join('')+'] ');
//console.log(values);
//console.log(condition);
//console.log('');

    myDB.query(sql.join(''), values, function( err, results, fields) {
    
if (err) {
    console.log(sql.join(''));
}
        callback( err, results );
    });

}
exports.update=update;


var destroy = function(dataMgr, callback) {


    var dbTable = dataMgr.dbTable;
    var dbName = dataMgr.dbName || AD.Defaults.dbName;
    
    
    var condition = [];
    var values = [];
    
    for (var key in dataMgr.model) {
    
//        if (condition != '') condition += ' AND ';
        condition.push( key+'=?');
        
        values.push( dataMgr.model[key]);
        
    }
    
    var sql = ['DELETE FROM ',dbName,'.',dbTable];
    if (condition.length > 0) sql.push(' WHERE ',condition.join(' AND '));
    

    myDB.query(sql.join(''), values, function( err, results, fields) {
    
        callback( err, results );
    });

}
exports.destroy = destroy;



var listDatabases = function (callback) {
    // generate a list of available databases

    var sql = 'SHOW DATABASES';
    myDB.query(sql, [], function( err, results, fields) {

        callback( err, results, fields );
    });
}
exports.listDatabases = listDatabases;



var listTables = function (dbName, callback) {
    // generate a list of available databases

    var sql = 'SHOW TABLES FROM '+dbName;
    myDB.query(sql, [], function( err, results, fields) {

        callback( err, results, fields );
    });
}
exports.listTables = listTables;



var listFields = function (dbName, dbTable, callback) {
    // generate a list of available databases

    var sql = 'SHOW COLUMNS FROM '+dbName+'.'+dbTable;
    myDB.query(sql, [], function( err, results, fields) {

        callback( err, results, fields );
    });
}
exports.listFields = listFields;




