/*
 * @class appdev_codemirror
 * @parent AD_Client.Controller.Widgets
 * 
 * ###Code Editor widget
 * 
 * A Code Editor widget
 *
 */
 

steal('CodeMirror/mode/javascript/javascript.js',
        '/appDev/widgets/appdev_codemirror/appdev_codemirror.ejs').then(function() {
        	


    AD.Controller.extend("AppdevCodemirror", 
        {
            // This object will transform the data in a menu 
            
            init: function (el, options) {
            
                
                var defaults = {
                      gid:'appdev_codemirror_uuid_notGiven',
                      title: null,      // the MultilingualLabel Key for the title
                      modelInstance: null,
                      onSubmit:	null
                };
                
                var options = $.extend(defaults, options);
                
                this.options = options;
                this._codeMirror = null;
                this.codeMirrorDiv = null;
                this.header = null;
                this.modified = false;
                
                // insert our DOM elements
                this.insertDOM();
                
                this.initSubmitButton();            
            }, 
            
            setModel: function(model){
            	this.busyOn();
            	this.element.data('model',model);
            	this._codeMirror.setValue(model.fileContent);
            	this.header.html('<h4>Editor: '+model.id+' </h4>');
            	this.busyOff();
            },
            
            insertDOM: function() {
                var _self = this;
                this.element.html(this.view('/appDev/widgets/appdev_codemirror/appdev_codemirror.ejs', {}));
                _self.codeMirrorDiv = this.element.find('#codeMirror');
                _self._codeMirror = CodeMirror(function(el) {
                        _self.codeMirrorDiv.html(el);
                    }, 
                    {
                        lineNumbers:false,
                        matchBrackets:true,
                        indentUnit:4,
                        onChange:function(from, to, text, next) {
                            _self.onChange(from, to, text, next);
                        }
                    
                });
                this.header = this.element.find('#editorHeader');
                this._$busyDiv = this.element.find('#addBusy');
                this.busyOff();

            },
            
            initSubmitButton:function(){
            	var _self = this;
                var submitButton = this.element.find('#submitButton');
                submitButton.bind('click',function(){
                	_self.onSubmit();
                });
            },
            
            onSubmit:function(){
            	if (this.isModified()){
            		model = this.element.data('model');
            		content = this._codeMirror.getValue();
            		model.fileContent = content;
            		this.element.data('model',model);
            	}
            	this.options.onSubmit(this.element.data('model'));
            },
            
            //-----------------------------------------------
            busyOff: function () {
                // show the busy indicator on this widget
            
                this._$busyDiv.removeClass('busy-icon');
            
            },
            
            //-----------------------------------------------
            busyOn: function () {
                // show the busy indicator on this widget
            
                this._$busyDiv.addClass('busy-icon');
            
            },
            
            onChange: function(from, to, text, next) {
                this.modified = true;
            },
            
            isModified: function() {
                return this.modified;
            }
        });
    
    
});
    
