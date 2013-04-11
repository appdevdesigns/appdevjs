/*
 * @class AD_Client.Form
 * @parent AD_Client
 * 
 * ###AppDev Form Object
 * 
 * Our ADForm controller allows you to manage a form submission.  It allows you to specify the 
 * order of form elements that get tabbed through.  
 * 
 * There are 2 primary ways an ADForm is intended to be used.
 * 
 * ### Option 1: with a dataManager:
 * 
 * @codestart
 * var modelInstance = new app.Model();
 * $('#myFormDiv').ad_form({
 *      dataManager:modelInstance
 * });
 * @codeend
 * 
 * In this method, dataManager should be an *instance* of a model. ADForm 
 * expects your form elements to each have a data-bind="modelField" attribute.
 * For example:
 * 
 * @codestart
 * &lt;input type="text" name="surname"  data-bind="ren_surname" &gt;
 * @codeend
 *
 * will synchronize the value in :input.surname with dataManager.ren_surname.
 * 
 * The default submit action will be to load the dataManager from the form and 
 * perform a dataManager.save() action.
 * 
 * If you wish to override the default action you can provide an 
 * onSubmit(dataManager) function.  In order to prevent the default action your
 * onSubmit() function should return a bool false. A non false return value 
 * will allow the ADForm default action to occur after your onSubmit is completed.
 * For example:
 * 
 * @codestart
 * var modelInstance = new app.Model();
 * $('#myFormDiv').ad_form({
 *      dataManager:modelInstance,
 *      onSubmit:function( model) {
 *      
 *          // save with a diff model instead:
 *          other.Model.create({
 *              val1:model.val1,
 *              val2:model.val2
 *         });
 *         
 *         return false;  // prevent the ADForm default submission action
 *      }
 * });
 * @codeend
 * 
 * In this method, you can specify the order of the form elements by providing
 * a fields array.  The ADForm will tab through these fields in the given order.
 * For example:
 * 
 * @codestart
 * var modelInstance = new app.Model();
 * $('#myFormDiv').ad_form({
 *      dataManager:modelInstance,
 *      fields: ['model_field3', 'model_field1', 'model_field2']
 * });
 * @codeend
 * 
 * If no fields:[] array is given, the ADForm will simply attempt to follow the 
 * order of the fields as they exist in the DOM.
 * 
 * 
 * You can also specify a validation routine to make sure the data is valid before
 * submitting:
 *
 * @codestart
 * var modelInstance = new app.Model();
 * $('#myFormDiv').ad_form({
 *      dataManager:modelInstance,
 *      fields: ['model_field3', 'model_field1', 'model_field2'],
 *      dataValid:function(data){
 *          var isValid = true;
 *      
 *          if (data.ren_surname == '') isValid = false;
 *          
 *          return isValid;
 *      }
 * });
 * @codeend
 * 
 * You can get the ADForm object by accessing the object from the 'data' property:
 * @codestart
 * var modelInstance = new app.Model();
 * $('#myFormDiv').ad_form({
 *      dataManager:modelInstance,
 *      fields: ['model_field3', 'model_field1', 'model_field2'],
 *      dataValid:function(data){
 *          var isValid = true;
 *      
 *          if (data.ren_surname == '') isValid = false;
 *          
 *          return isValid;
 *      }
 * });
 * var ADForm = $('#myFormDiv').data('ADForm');
 * @codeend
 * 
 * Using the reference to the Form Object, you can provide more specific 
 * error messages in your dataValid() routine:
 * 
 * @codestart
 * var modelInstance = new app.Model();
 * $('#myFormDiv').ad_form({
 *      dataManager:modelInstance,
 *      fields: ['model_field3', 'model_field1', 'model_field2'],
 *      dataValid:function(data){
 *          var isValid = true;
 *      
 *          if (data.ren_surname == '') {
 *              isValid = false;
 *              ADForm.validationErrorField('ren_surname','[site.error.Required]');
 *          }    
 *          
 *          return isValid;
 *      }
 * });
 * var ADForm = $('#myFormDiv').data('ad-form');
 * @codeend
 * 
 * 
 * ### Option 2: using the form elements directly:
 * 
 * @codestart
 * $('#myFormDiv').ad_form({
 *      onSubmit:function(formObj) {
 *      
 *          $.ajax({
 *              url:'some/url/here',
 *              type:'GET',
 *              data: formObj,  // json key=>value pairs
 *              error: function(req, status, statusText) {},
 *              success: function(data) {  }
 *          });
 *          
 *      }
 * });
 * @codeend
 * 
 * In this method, ADForm will search all :input elements it contains
 * and return those as a json obj to your onSubmit() callback.
 * 
 * You can also specify an order of form fields to progress through by 
 * providing an array of jQuery selectors.  For example:
 * 
 * @codestart
 * $('#myFormDiv').ad_form({
 *      fields:[
 *          '#name-given',          //  id="name-given"
 *          '.surname',             //  class="surname"
 *          '[preferred='YES']'     //  attribute 
 *      ],
 *      onSubmit:function(formObj) {
 *          // submit data here
 *      }
 * });
 * @codeend
 * 
 * 
 * 
 * ### Submit and Cancel
 * 
 * In both methods, ADForm will look for objects that have 
 * class="ADForm-btn-submit" or class="ADForm-btn-cancel" to find the submit
 * and cancel buttons.  If you need to override these selectors, then you can 
 * provide them in the options:
 * 
 * @codestart
 * $('#myFormDiv').ad_form({
 *      submit:'#btn-submit',
 *      cancel:'#btn-cancel'
 * });
 * @codeend
 * 
 * 
 * 
 * ### Error Displays
 * 
 * The ADForm object will also look for a .ADForm-msg-error  element to display
 * any errors it receives from it's operations.  If you wish to override this
 * selector, then you can specify one like this:
 * 
 * @codestart
 * $('#myFormDiv').ad_form({
 *      error:'#msg-error'
 * });
 * @codeend
 * 
 * 
 */
$.Controller.extend("ADForm", 
{

    init: function (el, options) {

        //// Setup your controller here:
        
        // make sure defaults are taken care of
        var defaults = {
              uid:null,
              dataManager:null, // a Model Object that drives this form
              dataValid:null,   // {fn} a function to call to verify data is correct; returns true/false
              fields:null,      // {array} of form elements to progress through
              submit:'.ADForm-btn-submit',  // {string} selector of the submit button
              cancel:'.ADForm-btn-cancel',  // {string} selector of the cancel button
              error :'.ADForm-msg-error',   // {string} selector of the error message area
              busy  :'.busyicon-inline',    // {string} selector of the busy icon
              onSubmit:null,    // {fn} a callback fn when a form submit is processed
              onError:null      // {fn} a callback fn in case there is an error
        };
        var options = $.extend(defaults, options);
//        this._super(el, options);
        
        this.uid = options.uid;
        this.selected = null;
        this.addInProcess = false;
        this.isEnabled = true;
        this.validation = {valid:true, errMsg:[]};
        
        this.inputNum = 0;
        
        this.options = options;
        var self = this;
        
        // find our buttons if they are provided:
        this.buttons = {};
        this.buttons.submit = null;
        this.buttons.cancel = null;
        if (options.submit) this.buttons.submit = this.element.find(options.submit);
        if (options.cancel) this.buttons.cancel = this.element.find(options.cancel);
        
        if (this.buttons.submit) {
            this.buttons.submit.click(function(ev, el) { self.onSubmit(ev); });
        }
        
        if (this.buttons.cancel) {
            this.buttons.cancel.click(function(ev, el) { self.onCancel(ev); });
        }
        
        
        // find our error message area(s)
        this.msg = {};
        this.msg.generalError = null;
        if (options.error) {
            var errDiv = this.element.find(options.error);
            if (errDiv.length>0) {
                this.msg.generalError = errDiv;
                this.msg.generalError.html(''); // clear it out
            }
        }
        
        // find our busy icon 
        this.busyIcon = null;
        var bI = this.element.find(options.busy);
        if (bI.length > 0){
            this.busyIcon = bI;
            this.busyIcon.hide();
        }
        
        
        // figure out our inputs
        this.allInputs = this.element.find(':input');
        this.fields = options.fields;
        if (this.fields == null) {
            this.fields = [];
            var self = this;
            this.allInputs.each(function(indx, el){
                
                // ignore our buttons:
                //// NOTE: .submit & .cancel are jQuery arrays of matching el's. 
                ////       so for this check to work, we need to check the el themselves
                if ((el != self.buttons.submit[0]) && (el != self.buttons.cancel[0])) {
                    
                    // ok, this should be an element we care about:
                    var name = self.elementID(el);
                    self.fields.push( {name:name, el:$(el) });
                }
            });
            
        }
        
        
        // add our buttons in order: submit, cancel
        if (this.buttons.submit){
            this.fields.push({name:this.elementID(this.buttons.submit), el:this.buttons.submit})
        }
        if (this.buttons.cancel){
            this.fields.push({name:this.elementID(this.buttons.cancel), el:this.buttons.cancel})
        }
        
        
        // now create a lookup with [name] => # (index to fields[]) 
        this.nameIndex = {};  // [name] => index
        for(var f=0; f<this.fields.length; f++) {
            this.nameIndex[this.fields[f].name] = f;
        }
        
        this.element.data('ADForm', this);
        
        // tell our keyboardInput about us:
        AD.Comm.Notification.publish('apprad.widget.keyinput',{widget:this});

    },
    
    
    
    //---------------------------------------------------------------------
    busyOff: function () {
        // hide our busy indicator
        
        if (this.busyIcon) {
            this.busyIcon.hide();
        }
        
    },
    
    
    
    //---------------------------------------------------------------------
    busyOn: function () {
        // hide our busy indicator
        
        if (this.busyIcon) {
            this.busyIcon.show();
        }
        
    },
    
    
    
    //---------------------------------------------------------------------
    clear: function () {
        // clear our form
        
        if (this.busyIcon) {
            this.busyIcon.hide();
        }
        
        this.element.find(':input').val('');
        
        this.element.find(':checkbox').attr('checked',false);
        
        this.errorMsg();
        
    },
    
    
    
    //---------------------------------------------------------------------
    disable: function () {
        // disable our form for operation
        
        this.isEnabled = false;
        if (this.buttons.submit) {
            this.buttons.submit.addClass('disabled');
        }
        
        if (this.buttons.cancel) {
            this.buttons.cancel.addClass('disabled');
        }
        
        this.allInputs.each(function(el){
            this.disabled = true;
        });
        
        
        // lose focus:
        var firstElement = this.element.find('*:focus');
        firstElement.blur();
    },
    
    
    
    //---------------------------------------------------------------------
    elementID: function (el) {
        // return our id for this element
        
        var $el = $(el);
        var key = 'adform-name';
        
        var name = $el.data(key);
        if (name) {
            return name;
        }
        
        // else attach an id to this element:
        var name = $el.attr('name');
        if ('undefined' == typeof name) {
            name = $el.attr('id');
            if ('undefined' == typeof name) {
                
                // seriously? who does this?
                name = this.inputID();
                $el.data(key,name);
            }
        }
        return name;
    },
    
    
    
    //---------------------------------------------------------------------
    enable: function () {
        // enable our form for operation
        
        this.isEnabled = true;
        if (this.buttons.submit) {
            this.buttons.submit.removeClass('disabled');
        }
        
        if (this.buttons.cancel) {
            this.buttons.cancel.removeClass('disabled');
        }
        
        this.allInputs.each(function() {
            this.disabled = false;
        });
    },
    
    
    
    //---------------------------------------------------------------------
    errorMsg: function( string ) {
        
        string = string || ''; 
        
        if (this.msg.generalError) {
            this.msg.generalError.html(string);
        }
    },
    
    
    
    //---------------------------------------------------------------------
    focus: function() {
        
      var firstElement = this.firstInput();
      firstElement.focus();
      
    },
    
    
    
    //---------------------------------------------------------------------
    firstInput: function() {
        
        return this.fields[0].el;
    },
    
    
    
    //---------------------------------------------------------------------
    inputID: function() {
      
        return 'adForm-'+this.inputNum++;
    },
    
    
    
    //---------------------------------------------------------------------
    nextInput: function( currInput ) {
        // attempt to find the input control after the given one.
        
        var currentName = this.elementID(currInput);
        
        var currIndx = -1;
        if ('undefined' != this.nameIndex[currentName]) {
            currIndx = this.nameIndex[currentName];
        }
        
        var nextIndx = currIndx+1;
        
        if (nextIndx >= this.fields.length) nextIndx = 0;
        
        // if there is another field to move to
        if ('undefined' != typeof this.fields[nextIndx]) {
            
            return this.fields[nextIndx].el;
        
        } else {
            
            if (this.buttons.submit != null)  return(this.buttons.submit); 
        }
        
        // if we get to here, then we can't figure out what to do!
        return null;
        
    },
    
    
    
    //---------------------------------------------------------------------
    onCancel: function( ev, arg1 ) {
        
        var defaultAction = true;
        
        this.resetValidation();
        this.errorMsg();
        this.busyOff();
        
        // if an onCancel is provided then 
        if (this.options.onCancel) {
            defaultAction = this.options.onCancel();
        }
        
        if (defaultAction) {
            
            // perform our default Action: dataManager.save();
            this.options.dataManager.clear();
            this.element.find(':input').val('');
            
            this.element.trigger('canceled', {});
            
        }
    },
        
        
        
    //---------------------------------------------------------------------
    fieldError: function( fieldName, message ) {
        
        // find the input for this field
        var field = this.element.find('[data-bind='+fieldName+']');
        
        if (field.length > 0) {
            
            // add a <span> behind it
            var parent = field.parent();
            var errorMsg = $('<span class="help-inline text-error">'+message+'</span>');
            parent.append(errorMsg);
            
            // make sure parent control-group is marked with 'error'
            while( (!parent.hasClass('control-group')) && (parent != window) && (parent.length > 0)) parent = parent.parent();
            if (parent != window) {
                parent.addClass('error');
            }
        
        } else {
            
            this.errorMsg(fieldName + ' : ' + message);
        }
    },

    
    
    //---------------------------------------------------------------------
    fieldNormal: function( fieldName ) {
        
        // find the input for this field
        var field = this.element.find('[data-bind='+fieldName+']');
        

        if (field.length > 0) {
            // remove the added <span>
            var parent = field.parent();
            parent.find('span.text-error').remove();
            
            // make sure parent control-group is marked with 'error'
            while( (!parent.hasClass('control-group')) && (parent != window) && (parent.length > 0)) parent = parent.parent();
            if (parent != window) {
                parent.removeClass('error');
            }
        }

    },
        
        
        
    //---------------------------------------------------------------------
    onSubmit: function( ev, arg1 ) {
        
        
        var self = this;
        var formObj = null;
        
        
        if (this.isEnabled) {
            
       
            this.errorMsg();
            this.busyOn();
            
            var isValid = true;  // assume good (so optimistic!)
            this.resetValidation();
            
            
             // if we have a dataManager
            if (this.options.dataManager) {
    
                // load dataManager from the form
                formObj = this.options.dataManager;
                formObj.loadFromDOM(this.element); // load by data-bind attributes
                
                // formObj load from form elements
                if (this.options.dataValid) {
                    var data = formObj.attrs();
                    isValid = this.options.dataValid(data);
                }
                
                if (isValid) {
                    
                    var retVal = true;
                    
                    // if an onSubmit is provided then 
                    if (this.options.onSubmit) {
                        retVal = this.options.onSubmit(formObj);
                    }
                    
                    if (retVal) {
                        
                        // perform our default Action: dataManager.save();
                        var saveDone = this.options.dataManager.save();
                        $.when(saveDone).then(function(){
                            
                            self.busyOff();
                            
                            self.element.trigger('saveDone', self.options.dataManager);
                            
                        }).fail(function(err){
                           
                            self.busyOff();
                            
                            var errRet = true;
                            if (self.options.onError) {
                                errRet = self.options.onError(err);
                            } 
                            
                            if (errRet) {
                                
                                // if we have an error message area
                                if (self.msg.generalError) {
                                    self.errorMsg(AD.Comm.Error.message(err));
                                } else {
console.warn('ADForm onSubmit Error : add in a popup for this error message!');
console.error( AD.Comm.Error.message(err) );
                                }
                            }
                            
                        });
                        
                    } else {
                        
                        // The provided onSubmit() routine says we are finished, so
                        this.busyOff();
                        
                    }
                
                } else {
                    
                    // data isn't valid!
                    this.busyOff();
                    
                    // if our validation has error messages:
                    if (this.validation.errMsg.length > 0) {
                        
                        for (var vm=0; vm < this.validation.errMsg.length; vm++) {
                            var msg = this.validation.errMsg[vm];
                            
                            if (msg.field) {
                                this.fieldError(msg.field, msg.msg);
                            } else {
                                this.errorMsg(msg.msg);
                            }
                        }

                    } else {
                        this.errorMsg('Error!');
                    }
                } // end if isValid
                
            } else { 
                // create an obj from our inputs
                
                // formObj load from form elements
                if (this.options.dataValid) {
                    isValid = this.options.dataValid()
                }
                
                if (isValid) {
                    // if onSubmit provided
                        // call onSubmit(formObj)
                    // else
                        // error('??? No dataManager and no onSubmit() ... this ins\'t right!');
                } else {
                    this.busyOff();
                    
                    // what do you do here?
                }
                
console.error('ADForm.onSubmit(): non-Model onSubmit not implemented yet!');
                
            }
        
        } // end if enabled
        
    },
    
    
    
    //---------------------------------------------------------------------
    prevInput: function( currInput ) {
        // attempt to find the input control before the given one
        
        var currentName = this.elementID(currInput);
        
        var currIndx = -1;
        if ('undefined' != this.nameIndex[currentName]) {
            currIndx = this.nameIndex[currentName];
        }
        
        var nextIndx = currIndx-1;
        
        if (nextIndx < 0) nextIndx = this.fields.length -1;
        
        // if there is another field to move to
        if ('undefined' != typeof this.fields[nextIndx]) {
            
            return this.fields[nextIndx].el;
        
        } else {
            
            if (this.buttons.submit != null)  return(this.buttons.submit); 
        }
        
        // if we get to here, then we can't figure out what to do!
        return null;
        
    },
    
    
    
    //---------------------------------------------------------------------
    resetValidation: function () {
        
        // if we have any fields that were given errors: undo them
        for (var vm=0; vm < this.validation.errMsg.length; vm++) {
            var msg = this.validation.errMsg[vm];
            
            if (msg.field) {
                this.fieldNormal(msg.field);
            }
        }
        
        // now clear it all out!
        this.validation = {valid:true, errMsg:[]};
    },
    
    
    
    //---------------------------------------------------------------------
    setModel: function (model) { 
        
        this.options.dataManager = model;
        model.bindToForm(this.element);
        
    },
    
    
    
    //---------------------------------------------------------------------
    /**
     * @function validationError
     *
     * Register an error message to be displayed in the general error message
     * area of a form.
     * 
     * NOTE: This will only be displayed if a error selector has been found.
     * 
     * @param {string} labelKey
     *      A string or a multilingual key to display for the error.  If the 
     *      provided string isn't found in the AD.Lang.Labels.hasLabel()
     *      method, then the text will be displayed as is.
     */
    validationError: function (labelKey) { 
        
        var error = labelKey;
        
        if (typeof labelKey == 'string') {
            var label = labelKey;
            if (AD.Lang.Labels.hasLabel(labelKey)) {
                label =  AD.Lang.Labels.getLabelHTML(labelKey);
            }

            error = { msg: label };
        }
        
        this.validation.errMsg.push(error);
        
    },
    
    
    
    //---------------------------------------------------------------------
    /**
     * @function validationErrorField
     *
     * Register an error associated with an input field.
     * 
     * NOTE: field will be looked for in the data-bind attribute values
     * 
     * @param {string} field
     *      the field name to look for to display this error for
     * @param {string} labelKey
     *      A string or a multilingual key to display for the error.  If the 
     *      provided string isn't found in the AD.Lang.Labels.hasLabel()
     *      method, then the text will be displayed as is.
     */
    validationErrorField: function (field, labelKey) { 
        
        if (typeof labelKey == 'undefined') {
            labelKey = field;
            field = 'gen';
            
        }
        
        var label = labelKey;
        if (AD.Lang.Labels.hasLabel(labelKey)) {
            label =  AD.Lang.Labels.getLabelHTML(labelKey);
        }
        
        error = { field:field, msg: label };
        this.validation.errMsg.push(error);
        
    },
    
    
    
    
    
    
    
    //---------------------------------------------------------------------
    ":input keydown": function (el, event) {  

       switch(event.keyCode) {
               
           case 9:
               //   9: [tab] : switch to next input
               var nextFocus = null;
               
               // if currently on our submit button, then go back to 1st element
 //              if (event.currentTarget == this.buttons.submit) {
                   
 //                  nextFocus = this.firstInput();
               
 //              } else {

                   if (event.shiftKey){
                       
                       // [tab] + [shift] goes in reverse order
                       nextFocus = this.prevInput(event.currentTarget);
                       
                       // we might have picked up an invisible element, so skip
                       while(!$(nextFocus).is(':visible')){
                           nextFocus = this.prevInput(nextFocus);
                       }
                       
                   } else {
                       
                       // [tab] goes in order
                       nextFocus = this.nextInput(event.currentTarget);
                       
                       // we might have picked up an invisible element, so skip
                       while(!$(nextFocus).is(':visible')){
                           nextFocus = this.nextInput(nextFocus);
                       }
                   }
 //              }
               
               $(nextFocus).focus();
               return false;
               break;
               
           case 32:
               //  32: [space]  : if element is a checkbox, then toggle
//               return false;
               break;
               
           case 27:
               //  27: [esc]    : cancels a form 
               this.onCancel();
               break;
       }
       // special keys:
       
       //  13: [enter]  : submit form if on last element or [tab]
       //  xx: [return] : submit form if on last element or [tab]
       
        
    },
    
    
});


/////
///// LEFT OFF :   Hey!  /web/appDev/communications/API/ !!! should be lower case /api/ !!! 
/////

