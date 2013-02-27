/*
 * @class appdev_dropdown
 * @parent AD_Client.Controller.Widgets
 * 
 * ###Dropdown widget
 * 
 * A dropdown list widget
 *
 */
 
steal('/appDev/widgets/appdev_dropdown/appdev_dropdown.ejs');

    AD.Controller.extend("AppdevDropdown",
        {
            //-----------------------------------------------------------------
            init: function (el, options) {
                            
                var defaults = {
                      dataManager:null, // the ListIterator of the data to display
					  useAutocomplete: false, // Whether to use jqueryui Autocomplete Combobox
					  autocomplete:null,
					  rowContent: null,
					  onSelection:null,     // callback function when a new item is selected
					  placeholder:null,
					  autoFocus:false,
					  dataBind: ''
                };
                var options = $.extend(defaults, options);
				this.options = options;
				
				if (options.rowContent === null) {
					this.rowContent = this.defaultRowContent;
				} else {
					this.rowContent = options.rowContent;
				}
                
                this.dataManager = options.dataManager;
                
                // insert our DOM elements
                this.insertDOM();
                
                if (this.dataManager != null) {
                    var loaded = this.dataManager.loaded();
                    var self = this;
                    $.when(loaded).done(function (data) {
                        self.loadFromDataManager();
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                    })
                    .fail(function(data) {
                        // do the bind just in case the first load failed
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                    });
                }
                this.initList();
            },
            
            
            
            //---------------------------------------------------------------------
            addListItem: function ( rowMgr ) {
                var $newRow = $('<option class="list-item"></option>');
                $newRow.html( this.rowContent(rowMgr));               
                $newRow.data('ad-model', rowMgr);
                $newRow.attr('value', rowMgr.getID());
                $newRow.appendTo(this._$listContainer);
            },
			
            
            
            //---------------------------------------------------------------------
            defaultRowContent: function( rowMgr ) {
				return rowMgr.getLabel();
			},

			
			
			//---------------------------------------------------------------------
            insertDOM: function() {
                this.element.html(this.view('/appDev/widgets/appdev_dropdown/appdev_dropdown.ejs', {}));
				if (this.options.dataBind) {
					this.element.find('select').attr('data-bind', this.options.dataBind);
				}
            },
            
            
            
            //---------------------------------------------------------------------
            initList: function() {
                var _self = this;
                this._$listContainer = this.element.find('.list-container');
				if ((this.options.useAutocomplete) || (this.options.autocomplete)) {
					this._$listContainer.combobox({ placeholder:this.options.placeholder, autocomplete:this.options.autocomplete });
					this._$listContainer.bind('AD.bindToForm', function(event) {
						$(this).next().find('input').val($(this).find(':selected').text());
					});
				};
				if (this.options.onSelection != null) {
				    this._$listContainer.bind('comboboxselected', function(el, selectedItem, two, three){
				        // find the Model obj that was selected
				        var rowMgr = $(selectedItem.item).data('ad-model');
				        _self.options.onSelection(rowMgr);
				    });
				}
				
				this._$inputBox = this.element.find('[adcombo="ci"]');
				this._$button = this.element.find('[adcombo="cb"]');
				
				// setup autoFocus if requested
//				if (this.options.autoFocus) {
//				    this._$inputBox.autocomplete('option', 'autoFocus', true);
//				}
            },
            
            
            
            //---------------------------------------------------------------------
            clearList: function() {
				if (this._$listContainer) {
					this._$listContainer.find('.list-item').remove();
				}
				if (this._$inputBox) this._$inputBox.val('');
				if (this._$inputBox) this._$inputBox.text('');
			},
			
			
			
			//---------------------------------------------------------------------
            loadFromDataManager: function(){
                var _self = this;
                this.clearList();
                this.dataManager.each(function( row ) {
                    _self.addListItem( row );
                });
            },
            
            
            
            //---------------------------------------------------------------------
            ":input keydown": function (el, event) {  

               switch(event.keyCode) {
                   
                   // pressing [space] is like a click to open the menu
                   case 32:
                       
                       // open our drop list:
                       this._$button.click();
                       
                       
                       //// TODO: if droplist not open  then click();
                       break;
                       
               }
               
            }
			
        });
    
//});
    
