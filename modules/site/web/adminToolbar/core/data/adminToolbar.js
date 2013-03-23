/**
 * Client-side code for the Admin Toolbar.
 */

AD.AdminToolbar = {
    isReady: $.Deferred()
};

$(document).ready(function () {
    
    var _toolbarItems = {};
    
    ///
    /// Utility Functions
    ///
    
    /**
     * Toggle the visibility of a toolbar quickmenu.
     * @param {String|Boolean} toolName
     *     The name of the tool. If FALSE, then all quickmenus will be hidden.
     * @param {Boolean} makeVisible
     *      (optional) TRUE for visible, FALSE for invisible.
     *      Leave undefined for a true toggle.
     */
    var toggleQuickMenu = function(toolName, makeVisible)
    {
        if (toolName == false) {
            // Hide all quickmenus
            $('#admin-quick-menu .quick-menu').hide();
            return;
        }
        
        
        var tool = _toolbarItems[toolName];
        if (tool) {
            if (typeof makeVisible == 'undefined') {
                if (tool.$quickmenu.is(':hidden')) {
                    makeVisible = true;
                } else {
                    makeVisible = false;
                }
            }
            // Toggle visibility
            if (makeVisible) {
                // Last minute position adjustment
                tool.$quickmenu.css({
                    left: tool.$icon.offset().left + 'px'
                });
                // Hide all other quickmenus
                $("#admin-quick-menu .quick-menu[tool_name!='" + toolName + "']").hide();
                // Hide tooltip
                tool.$icon.find('img').tooltip('hide');
                // Show this quickmenu
                tool.$quickmenu.slideDown('fast');
                $('#admin-toolbar').addClass('active');
            }
            else {
                tool.$quickmenu.slideUp('fast');
                $('#admin-toolbar').removeClass('active');
            }
        }
    }
    
    
    /**
     * Toggle the visibility of the admin overlay. Tool work areas are
     * contained inside the overlay.
     *
     * @param {Boolean} makeVisible
     *      (optional) TRUE for visible, FALSE for invisible.
     *      Leave undefined for a true toggle.
     */
    var toggleOverlay = function(makeVisible)
    {
        if (typeof makeVisible == 'undefined') {
            // Toggle visibility
            if ($('#admin-overlay').is(':visible')) {
                makeVisible = false;
            } else {
                makeVisible = true;
            }
        } 
        if (makeVisible) {
            // Set to visible
            $('#admin-overlay, #admin-overlay-bg').fadeIn();
            $('#admin-toolbar').addClass('active');
        } else {
            // Set to invisible
            $('#admin-overlay, #admin-overlay-bg').fadeOut();
            $('#admin-toolbar').removeClass('active');
        }
    }
    
    
    /**
     * Toggle the visibility of a toolbar items's work area.
     * Does not affect the visibility of the overlay.
     * @param {String|Boolean} toolName
     *      If FALSE then all work areas will be hidden.
     * @param {Boolean} makeVisible
     *      (optional) TRUE for visible, FALSE for invisible.
     *      Leave undefined for a true toggle.
     */
    var toggleWorkArea = function(toolName, makeVisible)
    {
        if (toolName == false) {
            $('#admin-overlay .work-area').hide();
        }
        else if (_toolbarItems[toolName]) {
            var tool = _toolbarItems[toolName];
            
            if (typeof makeVisible == 'undefined') {
                if (tool.$workarea.is(':hidden')) {
                    makeVisible = true;
                } else {
                    makeVisible = false;
                }
            }
            
            if (makeVisible) {
                // Hide all other workareas
                $("#admin-overlay .work-area[tool_name!='" + toolName + "']").hide();
                // Show the workarea
                //tool.$workarea.fadeIn();
                tool.$workarea.slideDown();
            } else {
                // Hide the workarea
                //tool.$workarea.fadeOut();
                tool.$workarea.slideUp();
            }
        }
    }
    
    
    /**
     * Sets or removes the numeric badge that appears next to a toolbar icon.
     *
     * @var {Integer} value
     *    Setting this to 0 removes the badge.
     * @var {String} toolName
     *    The name of the tool whose badge is being set.
     */
    var setBadgeValue = function(value, toolName)
    {
        var tool = _toolbarItems[toolName];
        if (tool) {
            // Update this tool's notification count
            value = parseInt(value);
            tool.notifications = value;
            tool.$icon.find('.notification').text(value);
            if (value > 0) {
                tool.$icon.removeClass('empty');
            } else {
                tool.$icon.addClass('empty');
            }
            
            // Update the total notification count of all tools,
            // which will appear on the main gear icon.
            var total = 0;
            for (var i in _toolbarItems) {
                total += parseInt(_toolbarItems[i].notifications);
            };
            $('#admin-toolbar li.gear .notification').text(total);
            if (total > 0) {
                $('#admin-toolbar li.gear').removeClass('empty');
            } else {
                $('#admin-toolbar li.gear').addClass('empty');
            }
        }
    }
    
    
    ///
    /// Initialization Begins
    ///
    
    
    var $toolbar = $('#admin-toolbar');
    var isToolbarExpanded = false;
    var minimizedWidth = $toolbar.width();
    
    
    // Handle clicks on the gear icon
    $toolbar.find('li.gear').click(function() {
        isToolbarExpanded = !isToolbarExpanded;
        
        if (isToolbarExpanded) {
            // Expand toolbar
            $toolbar.addClass('animating');
            $toolbar.animate({
                width: '100%'
            }, 'fast', 'swing', function(){
                $toolbar.addClass('maximized');
                $toolbar.removeClass('minimized');
                $toolbar.removeClass('animating');
            });
            
        } else {
            toggleOverlay(false);
            toggleQuickMenu(false);
            // Minimize toolbar
            $toolbar.addClass('animating');
            $toolbar.animate({
                width: minimizedWidth+'px'
            }, 'normal', 'swing', function() {
                $toolbar.addClass('minimized');
                $toolbar.removeClass('maximized');
                $toolbar.removeClass('animating');
            });
        }
    
    });
    
    
    // Initialize the other toolbar icons
    $toolbar.find('li.toolbar-item')
        // Init
        .each(function() {
            var $icon = $(this);
            var toolName = $icon.attr('tool_name');
    
            // Find the tool's DOM elements.
            var $quickmenu = $("#admin-quick-menu .quick-menu[tool_name='" + toolName + "']");
            var $workarea =  $("#admin-overlay .work-area[tool_name='" + toolName + "']");
            
            var tool = {
                "name": toolName,
                "$icon": $icon,
                "$quickmenu": $quickmenu,
                "$workarea": $workarea,
                "notifications": 0
            }
            _toolbarItems[toolName] = tool;
            
            // Init the icon tooltip
            $icon.find('img').tooltip({
                placement: 'bottom',
                title: $icon.attr('title') || toolName,
                selector: $icon
            });
        })
        
        // Handle clicks to the toolbar icons
        .click(function() {
            var $icon = $(this);
            var toolName = $icon.attr('tool_name');
            toggleQuickMenu(toolName);
            return false;
        })

        
    // Handle clicks to the work area trigger
    $('#admin-quick-menu .work-area-trigger').live('click', function() {
        var toolName = $(this).parents('.quick-menu[tool_name]').attr('tool_name');
        if (toolName) {
            toggleQuickMenu(false);
            toggleOverlay(true);
            toggleWorkArea(toolName, true);
            return false;
        }
    });
    
    
    // Handle clicks to the work area dismiss button
    $('#admin-overlay .work-area-dismiss i').click(function() {
        var toolName = $(this).parents('.work-area[tool_name]').attr('tool_name');
        if (toolName) {
            toggleWorkArea(toolName, false);
            toggleOverlay(false);
            return false;
        }
    });
    
    // Clicking on any part of the work area should hide
    // the quickmenu if it is visible.
    $('#admin-overlay').click(function() {
        toggleQuickMenu(false);
    });
    
    
    // Individual tools can update their notifications badge number by
    // publishing an event.
    OpenAjax.hub.subscribe(
        'AD.AdminInterface.Toolbar.SetNotifications',
        function(name, publisherData, subscriberData) {
            var toolName = publisherData.toolName;
            var number = publisherData.notifications;
            setBadgeValue(number, toolName);
        },
        null,
        null
    );
    AD.AdminToolbar.isReady.resolve();


    // Test
    OpenAjax.hub.publish('AD.AdminInterface.Toolbar.SetNotifications', {
        'toolName': 'Example Tool',
        'notifications': 1
    });
        
    
    
}); // end ready()
