//
//
//
/*
function OP( cond ) {
    this.left = cond.field;
    this.right = cond.value;
    this.op = cond.op;
}

OP.prototype.sql = function ( ) {


   return this.left + this.op + this.right;

}



function STACK() {

    this.conditions = [];
}

STACK.prototype.add = function ( op ) {

    this.conditions.push(op);

}


function ANDSTACK() {
    var stack = new STACK();
    stack.sql = function ( ) {

        var stack = [];
        for (var i=0; i< this.conditions.length; i++) {
            stack.push( this.conditions[i].sql());
        }
        return '(' +  this.conditions.join(' AND ') + ')';
    }
    return stack;
}


function ORSTACK() {
    var stack = new STACK();
    stack.sql = function ( ) {

        var stack = [];
        for (var i=0; i< this.conditions.length; i++) {
            stack.push( this.conditions[i].sql());
        }
        return '(' +  this.conditions.join(' OR ') + ')';
    }
    return stack;
}
*/





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


var fieldCondition = function(fieldName, obj, values) {

    // should be processing a condition like:
    //    field:{
    //          '>': value,
    //          '!=': value,
    //          'or':{
    //              '<':value
    //              '<=':value
    //          }

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
                 '=':3
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

        var newSet = obj.or;

        var thisCondition = fieldCondition(fieldName, obj[k], values);
        condition = '('+condition+') OR ' + thisCondition;

    }

    return '(' + condition + ')';

}


// A object that processes the provided condition
function ConditionObj( cond ) {

    this.condition = '';
    this.vals = [];

    // cond should be an object like:
    //
    // {
    //    field:value,
    //    field:{
    //          '>': value,
    //          '!=': value,
    //          'or':{
    //              '<':value
    //              '<=':value
    //          }
    //      },
    //    'or':{
    //          field:value
    //    }
    // }
    //

    var stack = [];


    // for each condition
    for (var field in cond) {

        if (field != 'or') {

            var value = cond[field];

            // if field: { '>':value, ... }
            if (typeof value == 'object') {
		if(typeof value.tref == 'undefined')
		{
			
		
                // get the complex field condition
                var condition = fieldCondition(field, value, this.vals);
                stack.push(condition);
		}
		else
		{
			stack.push( value.tref + '.' + field + '=?');
                	this.vals.push(value.value);

		}
 

            } else {

                // field:value
                stack.push( field + '=?');
                this.vals.push(value);

            }

        } // != or

    } // next


    this.condition = stack.join(' AND ');

    if ('undefined' != typeof cond['or']) {

        var newSet = cond.or;

        var newCondition = new ConditionObj(newSet);
        this.condition = '(' + this.condition + ') OR ' + newCondition.sql();

        this.vals = this.vals.concat(newCondition.values());
    }
}

ConditionObj.prototype.sql = function () {

    return this.condition;
}


ConditionObj.prototype.values = function () {

    return this.vals;
}




function Condition(condition) {


   return new ConditionObj(condition);

}
module.exports = Condition;



