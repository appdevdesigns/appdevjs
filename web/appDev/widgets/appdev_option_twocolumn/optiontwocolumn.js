/**
 * @class optionTwoColumn
 * @parent widgets
 * 
 * ##Option Chooser
 * 
 * JavaScript class for an "Option Chooser" that displays the options
 * to choose in 1 column, and the selected options in another column.
 *
 * This requires jQuery.
 *
 * You must instantiate a new class object for every copy of this widget
 * created on the page.
 *
 * There are several public methods from this class you can call after creating
 * the object:
 *
 * @param object options
 *
 * @author Johnny Hausman
 * @version Oct, 2011
 * @package phpDashboard
 */
var OptionTwoColumn = function(options)
{
    
    var $ = jQuery;

    //// Private class variables
    // fixed:
    var _$widget;

    var _divID;
    
    var _onChange = function () {  };
    
    var _col1Title = 'col 1';
    var _col2Title = 'col 2';
    
    // Reference this class object during times when "this" refers to an
    // event, or something else.
    var _thisObj = this;

	this.getColumn1Elements = function() {
		return _$widget.find('.col1 li');
	}

	this.getColumn2Elements = function() {
		return _$widget.find('.col2 li');
	}

    /**
    * Initializes the class object
    */
    var init = function() {

        // Initialize private class variables
        _divID = options.divID;
        
        if (typeof options.onChange != 'undefined') {
            _onChange = options.onChange;
        }
        
        if (typeof options.col1Title != 'undefined') {
            _col1Title = options.col1Title;
        }
        
        if (typeof options.col2Title != 'undefined') {
            _col2Title = options.col2Title;
        }
        
        
        // jQuery selection of the widget
        _$widget = $('#'+_divID);

        // Make the buttons shiny
        _$widget.find('button').button();

        
        _$widget.find('.col1Title').html( _col1Title );
        _$widget.find('.col2Title').html( _col2Title );
        
        //// Initialize event handlers and UI interactions

        // Enable drag and drop from 1st column
        _$widget.find('.col1 ul').sortable({
            opacity: 0.6,
            distance: 5,
            cursor: 'move',
            handle: 'div.drag-icon',
            connectWith: '#'+_divID+' .col2 ul',
            update: function() {
                // do any ajax here
                // execute callback if it was provided
                //          if (_callbacks.deleteField && $.isFunction(_callbacks.deleteField)) {
                //            _callbacks.deleteField($(this).attr('fieldName'));
                //          }

            }
        });
        
        // Enable drag and drop from 2nd column
        _$widget.find('.col2 ul').sortable({
        opacity: 0.6,
        distance: 5,
        cursor: 'move',
        handle: 'div.drag-icon',
        connectWith: '#'+_divID+' .col1 ul',
        update: function() {
          // AJAX operation to do when dropped onto or dragged from
          // execute callback if it was provided
        //          if (_callbacks.addField && $.isFunction(_callbacks.addField)) {
        //            _callbacks.addField($(this).attr('fieldName'));
        //          }
        //          updateFields();
        	_onChange();
        }
        });


         // Enable selecting list items
        _$widget.find('ul').selectable();

        // Doubleclick list items to add or remove them
        _$widget.find('.col1 li').live('dblclick', addField);
        _$widget.find('.col2 li').live('dblclick', deleteField);
      

        // find button, onclick call xxxx
        _$widget.find('.add-button').live('click', addSelectedFields);
        _$widget.find('.delete-button').live('click', deleteSelectedFields);
        
  }


    
  /**
   * Event handling function only. Moves the field into the 2nd column.
   * This gets called when a field is double-clicked.
   */
  var addField = function() {
    // `this` refers to the field that was dblclicked
    _$widget.find('.col2 ul').append(this);
    
    _onChange();
  }



  /**
   * Event handling function only. Moves the field into the 1st column.
   * This gets called when a field is double-clicked.
   */
  var deleteField = function() {
    // `this` refers to the field that was dblclicked
    _$widget.find('.col1 ul').append(this);

    _onChange();
  }


 /**
   * Click [>>] button to move selected items from 1st column to 2nd column
   */
  var addSelectedFields = function() {
    _$widget.find('.col1 li.ui-selected').appendTo(_$widget.find('.col2 ul'));

    _onChange();
  };


  
  /**
   * Click [<<] button to move selected items from 2nd column to 1st column
   */
  var deleteSelectedFields = function() {
    _$widget.find('.col2 li.ui-selected').appendTo(_$widget.find('.col1 ul'));

    _onChange();
  };





  // Run the constructor when this class object is instantiated
  init();

};
