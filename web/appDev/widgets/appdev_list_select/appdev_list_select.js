/*
 * @class appdev_list_select
 * @parent AD_Client.Controller.Widgets
 * 
 * ###Select list widget
 * 
 * A Select list widget.
 * It can use a static list of options, or it can be based on a data manager 
 * which can change the contents of the list.
 * 
 * Some special options are:
 *      attrs -- an associative array of attributes for the select list
 *      options -- an associative array of the list items
 *      value -- the default selected value in the list
 *      hasBlank -- if set to true then a '-' option will be added
 *      multiple -- allows multiple items to be selected at once
 *
 */
 


steal('/appDev/widgets/appdev_list_select/appdev_list_select.ejs');

    AD.Controller.extend("AppdevListSelect", 
        {
            //-----------------------------------------------------------------
            init: function (el, options) {
            
                
                var defaults = {
                      gid:'appdev_list_select_uuid_notGiven',
                      title: null,      // the MultilingualLabel Key for the title
                      dataManager:null, 
                      onSelection:null,
                      onUpdate:null,
                      options:null,
                      attrs:null,
                      value:null,
                      hasBlank:false,
                      blankIsNull:false,
                      blankText:'',
                      multiple:false
                };
                var options = $.extend(defaults, options); 
                
                
                
                
                // Init our default values:
                this.attrs = options.attrs;
                this.options = options.options;
                this.value = options.value;
                this.hasBlank = options.hasBlank;
                this.blankIsNull = options.blankIsNull;
                this.blankText = options.blankText;
                this.multiple = options.multiple;
                this.dataManager = options.dataManager;
                if (!this.onSelection)
                    this.onSelection = options.onSelection;
               
                // insert our DOM elements
                this.insertDOM();
                
                // setup any internal panels (delete confirmation, etc..)
                
                
                // setup our title (multilingual)
                this.initTitle(options);
                
                // initialize our list
                this.initList(options);
            }, 
            
            
            
            clear: function() {
                // Empty out the options.
                this._$selectEl.empty();
                this.options = {};
            },
            

            
            clearSelection: function() {
                this.element.find("option:selected").each(function(){
                    // Clear the selected attribute
                    $(this).removeAttr('selected');
                });
                // Trigger a selection event
                this.selectionChanged();
            },
            
            
            
            // Provide a new set of parameters to search on
            findAll:function(params) {
                
                this.dataManager.findAll(params);
            },
            
            
            
            insertDOM: function() {
                var _self = this;
                this.element.html(this.view('/appDev/widgets/appdev_list_select/appdev_list_select.ejs', {}));
                this._$selectEl = this.element.find('select');
                this._$selectEl.change(function(ev) { _self.selectionChanged(ev); });
            },
            
            
            
            initList: function() {
                // Any attributes for the select element?
                if (this.attrs) {

                    for (var key in this.attrs) {
                        this._$selectEl.attr(key, this.attrs[key]);
                    }
                }
                if (this.multiple) {
                    this._$selectEl.attr('multiple', this.multiple);
                }
                    
                // Set up the data manager
                if (this.dataManager != null) {
                    
                    // Handle the initial load from the data manager
                    var loaded = this.dataManager.loaded();
                    var self = this;
                    $.when(loaded).done(function (data) {
                        self.loadFromDataManager();
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                        self.dataManager.bind('error', self.resetData, self);
                    })
                    .fail(function (data) {
                        self.resetData();
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                        self.dataManager.bind('error', self.resetData, self);
                    })
                    
                    
                
                } else if (this.options) {
                    // or just initialize the list
                    this.loadList();
                }
            },
            
            
            
            
            //-----------------------------------------------
            initTitle: function(options) {
             // setup the Title
                this._$title = this.element.find('.appdev-list-select-title');
                
                if ((options.title != null) 
                        && (options.title != '')) {

                    // if title is a key
                    var firstChar = options.title[0];

                    if (firstChar == '[') {

                        // this should be a key to lookup in labels
                        this._$title.html('');
                        this._$title.append( AD.Lang.Labels.getLabelObj({ key:options.title}));

                    } else {

                        // I guess this is supposed to be the title
                        this._$title.html(options.title);

                    }
                
                } else {
                    
                    // let's make sure the title div is hidden
                    this._$title.hide();
                }
                
            },
            
            
            //------------------------------------------------------------------
            loadFromDataManager: function(){
                
                // get our dataManager
                // apply it to our list
                this.clear();
                var _self = this;
                this.dataManager.each(function(row){
                    var label = row.getLabel();
                    var id = row.getID();
                    _self.options[id] = label;
                });
                
                this.loadList();
            },
            
            // Determine whether the provided value matches (one of) our value(s)
            matchesValue: function(value){
                var match = false;
                if (this.value !== null) {
                    if (typeof this.value != 'object') {
                        // We have a normal value
                        match = (value == this.value);
                    } else {
                        // Assume it's an array-ish thing
                        var _self = this;
                        $.each(this.value, function(key, thisVal){
                            match = (value == thisVal);
                            return !match && _self.multiple; // exits each loop if false
                        });
                    }
                } 
                return match;
            },
            
            getDisplayLabel: function(label) {
                // The label could be 'raw' or it could require a lookup
                
                // If the first character is a square bracket, assume a lookup
                if (label[0] =='['){
                    // Use it as a key to lookup in labels
                    label = AD.Lang.Labels.getLabel({ key:label}).label;
                }
                return label;
            },
            
            loadList: function(){
                if (this.hasBlank) {
                    if (this.blankText !== '') {
                        // Optionally display something besides '-'
                        var blankText = this.getDisplayLabel(this.blankText);
                        this._$selectEl.append("<option value='-'>"+blankText+"</option>");
                    } else {
                        this._$selectEl.append('<option>-</option>');
                    }
                }
                for (var id in this.options) {
                    var selected = this.matchesValue(id);

                    // Build the HTML
                    var optionStr = "<option value='"+id+"'";
                    optionStr += (selected) ? " selected" : "";
                    optionStr += ">"+this.options[id]+"</option>";
                    this._$selectEl.append(optionStr);
                }
                
                // Trigger a selection event
                this.selectionChanged();
            },
            
            
            
            selectionChanged: function(ev) {
                if (this.onSelection != null) {
                    
                    // get the selected item
                    var _self = this;
                    _self.value = _self.multiple ? [] : null;
                    var selected = this.element.find("option:selected");
                    if (selected.length > 0) {
                        selected.each(function() {
                            // pass that item's value to the provided callback
                            var value = $(this).attr('value');
                            var item = {id: value, label: $(this).text()};
                            
                            // Handle the blank value special
                            if ((value == '-') && _self.hasBlank && _self.blankIsNull) {
                                item = null;
                            }
                            
                            // Save off the value
                            if (_self.multiple) {
                                _self.value.push(value);
                            } else {
                                _self.value = value;
                            }
                            
                            // Call the onSelection function
                            _self.onSelection(item);
                        });
                    }
                    else {
                        // Select null
                        _self.onSelection(null);
                    }
                }
                
            },
            
            
            
            resetData: function() {
                // reset the list
                this.clear();
                this.loadList();
            },
            
            
            
            //---------------------------------------------------------------------
            "select keydown": function (el, event) {  

               switch(event.keyCode) {
                   case 32:
                       //   32: [space] : act if we were clicked
                       this._$selectEl.click();
                       return false;
                       break;
               }
               
               
            }   
            
            
        });
    
    
//});
    
