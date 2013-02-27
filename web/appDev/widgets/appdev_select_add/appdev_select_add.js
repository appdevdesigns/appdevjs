/*
 * @class AppdevSelectAdd
 * @parent AD_Client.Controller.Widgets
 * 
 * ###Select-Add widget
 * 
 * Select an item to add it to the list.
 *
 * A dropdown list is used to select an item.
 * The item will then appear below.
 * Click on the [x] icon on the item to remove it.
 *
 * Example usage:
 * @codestart
 *  $('.widget').appdev_select_add({
 *      allowDuplicates: TRUE,
 *      items: [ "alpha", "bravo", "charlie" ],
 *      onAdd: function(key, label) {
 *          ...
 *      },
 *      onRemove: function(key) {
 *          ...
 *      }
 *  });
 *
 *  var values = $('.widget').controller().getValuesArray();
 * 
 *  $('.widget').controller().clear();
 * @codeend
 */
 

// This creates the $.fn.appdev_select_add() jQuery widget plugin
$.Controller("AppdevSelectAdd", 
{
    /**
     * @function defaultHTML
     * 
     * You may activate this widget on your own custom HTML.
     * That provides some separation of the logic from the layout
     * and allows you to populate the <SELECT> list beforehand.
     *
     * But if you activate the widget on an empty DIV, this default
     * will be placed inside it.
     */
    defaultHTML: ' \
        <div class="appdev_select_add"> \
            <select> \
                <option value="">--</option> \
            </select> \
            <div class="template-row" style="display:none" key=""> \
                <span></span> \
                <i style="float:right" class="btn-remove-circle"></i> \
            </div> \
        </div> \
    ',
},
{
    
    init: function($el, options)
    {
        // Use the default HTML if this widget was activated on an 
        // empty container.
        if ($el.find('select').length == 0) {
            $el.html(this.Class.defaultHTML);
        }
        // Populate the <SELECT> list if items were provided in the options.
        if (options.items) {
            this.populate(options.items);
        }
    },
    
    /**
     * @function populate
     *
     * Manually set the <OPTION> items in the <SELECT> list. This will
     * replace any existing items that are there.
     * @param {Object} items
     *      key:value pairs
     */
    populate: function(items)
    {
        var $select = this.element.find('select');
        $select.find('option').not(':first').remove();
        for (var key in items) {
            $select.append(
                '<option value="' + key + '>' + items[key] + '</option>'
            );
        }
    },
    
    /**
     * @function add
     *
     * Manually add a single item.
     * @param {String} key
     * @param {String} label
     */
    add: function(key, label)
    {
        // Check for duplicates
        if (!this.options.allowDuplicates) {
            if (this.element.find(".selected-item[key='" + key + "']").length > 0) {
                return;
            }
        }
    
        var $row = this.element.find('.template-row').clone();
        $row
            .removeClass('template-row')
            .addClass('selected-item')
            .attr('key', key)
            .show()
            .find('span').html(label);
        $row.appendTo( this.element );
        this.options.onAdd && this.options.onAdd(key, label);
    },
    
    /**
     * @function remove
     *
     * Manually remove a single item.
     * @param {String} key
     */
     remove: function(key)
     {
        this.element.find(".selected-item[key='" + key + "']").remove();
        this.options.onRemove && this.options.onRemove(key);
     },
    
    /**
     * @function select_change
     * 
     * Select an item from the list to add it.
     */
    "select change": function($el)
    {
        var key = $el.val();
        var label = $el.find('option:selected').text();
        this.add(key, label);
        $el.get(0).selectedIndex = 0;
    },
    
    /**
     * @function selected-item
     * 
     * Click the [x] icon to remove an added item.
     */
    ".selected-item i click": function($el)
    {
        var key = $el.closest('.selected-item').attr('key');
        this.remove(key);
    },
    
    /**
     * @function clear
     *
     * Removes all added rows.
     * @param {Boolean} doTriggerRemove
     *      Set to TRUE to trigger an `onRemove` event for each item.
     */
    clear: function(doTriggerRemove)
    {
        if (doTriggerRemove) {
            this.element.find('.selected-item').find('i').click();
        } else {
            this.element.find('.selected-item').remove();
        }
    },
    
    /** 
     * @function getValuesArray
     *
     * Returns an array of the `key` values from the added items.
     * @return {Array}
     */
    getValuesArray: function()
    {
        var items = [];
        this.element.find('.selected-item').each(function() {
            items.push( $(this).attr('key') );
        });
        return items;
    },
    
    /** 
     * @function getValuesObject
     *
     * Returns a standard object of `key`:`label` pairs from the added items.
     * @return {Object}
     */
    getValuesObject: function()
    {
        var items = {};
        this.element.find('.selected-item').each(function() {
            var key = $(this).attr('key');
            var label = $(this).find('span').text();
            items[key] = label;
        });
        return items;
    },
    
});
    

