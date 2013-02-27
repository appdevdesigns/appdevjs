/**
 * This is the client-side script for the Accounts tool.
 *
 * The tool consists of several tabs: "Create New", "Import", "Approve", 
 * "View List", and "Authorization". There is also the QuickMenu, which
 * is a shortcut to the same functionality in the "Approve" tab.
 * 
 * The "Import" tab has several of its own sub-tabs, corresponding to the
 * steps in the CSV import process.
 */

$('document').ready(function() {

    // Stop if the toolbar is not present.
    if ($('#admin-toolbar').length == 0) return;

    /**
     * Splits a single CSV line into an array of values.
     * @download: http://www.greywyvern.com/?post=258
     *
     * @param {String} line
     * @param {String} sep Default field separator is a comma ","
     * @return {Array}
     *    [ "value1", "value2", ... ]
     */
    var csvLine = function(line, sep) 
    {
      for (var foo = line.split(sep = sep || ","), x = foo.length - 1, tl; x >= 0; x--) {
        if (foo[x].replace(/"\s+$/, '"').charAt(foo[x].length - 1) == '"') {
          if ((tl = foo[x].replace(/^\s+"/, '"')).length > 1 && tl.charAt(0) == '"') {
            foo[x] = foo[x].replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
          } else if (x) {
            foo.splice(x - 1, 2, [foo[x - 1], foo[x]].join(sep));
          } else foo = foo.shift().split(sep).concat(foo);
        } else foo[x].replace(/""/g, '"');
      } return foo;
    };
    
    /**
     * Parses a multi-line CSV string into an array of standard name:value 
     * objects. The first line is used as field names.
     *
     * @param {String} lines
     * @param {String} sep
     * @return {Array}
     *     [
     *          { "field1": "value1", "field2": "value2", ... },
     *          { "field1": ... },
     *          ...
     *     ]
     */
    var csvLines = function(lines, sep) 
    {
        var fields = null;
        var data = [];
        var lineArr = lines.split(/\n|\r\n|\r/g);
        for (var i=0; i<lineArr.length; i++) {
            var csv = csvLine(lineArr[i], sep);
            // Use first line as field names
            if (!fields) {
                fields = csv;
            } 
            else {
                var row = {};
                for (var j=0; j<fields.length; j++) {
                    row[ fields[j] ] = csv[j] || '';
                }
                data.push(row);
            }
        }
        return data;
    }

    /**
     * Gets the text label that matches a given language, role, or status key.
     * That is, pass in the `language_key` and get the `language_label`.
     * Or pass in the `role_id` and get the `role_label`.
     * 
     * For example:
     *   dataLabel('language', 'en') ==> 'English'
     *   dataLabel('status', '0') ==> 'Inactive'
     *
     * This relies on the global variable `_adminToolbar` being there.
     * It should have been generated together with the toolbar HTML 
     * at the end of workarea.ejs.
     *
     * @param {String} type
     *      "language", "role", or "status"
     * @param {Integer} key
     * @return {String}
     */
    var dataLabel = function(type, key)
    {
        var data = window._adminToolbar.accounts_dataLists[type][key];
        return data;
    }

    ///
    /// Quick Menu
    ///

    var $menu = $('#accounts-quickmenu');
    var $table = $menu.find('table');
    
    /**
     * Adds a new row to the Pending Account Requests table in the quickmenu,
     * and also to the table in the "Approve Accounts" tab.
     *
     * This does not update the database.
     *
     * @param {Object} rowData
     *  {
     *      "id": {Integer}
     *      "username": {String},
     *      "lang": {String},
     *      "date": {String}
     *  }
     */
    var addAccountRequestRow = function(rowData)
    {
        $('table.pending-account-requests').each(function() {
            var $table = $(this);
            // Create a new row from the hidden template
            var $row = $table.find('.template-row').clone();
            $row.removeClass('template-row');
            $row.addClass('pending-account-row');
            // Populate the new row
            $row.attr('viewer_id', rowData.viewer_id);
            $row.find('td.username').text( rowData.viewer_userID );
            $row.find('td.lang').text( rowData.language_key );
            $row.find('td.date').text( rowData.viewer_lastLogin );
            $row.model(rowData);
            // Add the new row to the table
            $table.append($row);
        });
        var count = $table.find('tr').not('.template-row').length;
        $.when(AD.AdminToolbar.isReady).then(function() {
            // Update the total number of pending requests
            OpenAjax.hub.publish('AD.AdminInterface.Toolbar.SetNotifications', {
                'toolName': 'Accounts',
                'notifications': count
            });
        });
    }
    
    
    /**
     * Clears a row from the list of pending account requests.
     *
     * This does not update the database.
     *
     * @param {Integer} requestID
     */
    var removeAccountRequestRow = function(viewerID)
    {
        $("table.pending-account-requests tr[viewer_id='"+viewerID+"']").remove();
        var count = $('table.pending-account-requests tr.pending-account-row').length;
        $.when(AD.AdminToolbar.isReady).then(function() {
            // Update the total number of pending requests
            OpenAjax.hub.publish('AD.AdminInterface.Toolbar.SetNotifications', {
                'toolName': 'Accounts',
                'notifications': count
            });
        });
    }
    
    
    // Update the server when the admin clicks the "Confirm" or "Deny" button
    $('tr.pending-account-row td.operations button').live('click', function() {
        var $button = $(this);
        var $row = $button.parent().parent();
        var viewerID = $row.attr('viewer_id');
        var operation = $button.attr('operation');
        // Need to update the viewer_isActive status and also assign new roles.
        AD.ServiceJSON.request({
            method: 'POST',
            url: '/service/site/viewer/pending/'+operation+'/'+viewerID,
            params: {},
            success: function(response) {
                removeAccountRequestRow(viewerID);
            }
        });
    });

    
    /**
     * Refreshes the list of pending accounts from the server.
     */
    var refreshPendingAccounts = function()
    {
        $('table.pending-account-requests tr.pending-account-row').remove();
        site.Viewer.findAll(
            { 'viewer_isActive': '8' },
            function(data) {
                // Populate the quickmenu table with data
                for (var i=0; i<data.length; i++) {
                    addAccountRequestRow(data[i]);
                }
            }
        );
    }

    // This is the initial fetch of pending accounts from the server
    refreshPendingAccounts();
    
    
    ///
    /// "Create New" tab
    ///
    (function() {
        // Enable the roles selector widget
        var $roleContainer = $('#accounts-createnew div.account-roles');
        $roleContainer.appdev_select_add();
        
        /**
         * Reset the form to a blank state
         */
        var resetForm = function()
        {
            $('#accounts-createnew :text').val('');
            $('#accounts-createnew :password').val('');
            $('#accounts-createnew select option:selected').removeAttr('selected');
            $('#accounts-createnew .error').removeClass('error');
            if ($roleContainer.length > 0) $roleContainer.controller().clear();
        }
        
        // Clicking on the "Cancel" button resets the form
        $('#accounts-createnew-cancel-button').click(resetForm);
        
        // Clicking on the "Add" button submits the data to the server
        $('#accounts-createnew-add-button').click(function() {
            var $form = $('#accounts-createnew .account-form');
            var $messages = $('#accounts-createnew .account-form-errors');
            $form.find('.error').removeClass('error');
            $messages.empty();

            // Simple client side validation
            var errors = [];
            var userID = $.trim($('#accounts-createnew-userid').val());
            var password = $('#accounts-createnew-password').val();
            var password2 = $('#accounts-createnew-password2').val();
            var langKey = $('#accounts-createnew-language').val();
            if (userID == '') {
                $form.find("label[for='accounts-createnew-userid']").addClass('error');
                errors.push("User ID is required.");
            }
            if (password != password2) {
                $form.find("label[for='accounts-createnew-password']").addClass('error');
                errors.push("The passwords do not match.");
            }
            if (langKey == '') {
                $form.find("label[for='accounts-createnew-language']").addClass('error');
                errors.push("Default language is required.");
            }
            if (errors.length > 0) {
                $.each(errors, function(index, message) {
                    $messages.append(
                        '<div class="alert alert-error">'
                        //+ '<a class="close" data-dismiss="alert" href="#">x</a>'
                        + message 
                        + '</div>'
                    );
                });
            }
            
            // Submit the request if no errors
            else {
                // Gather all the assigned roles into an array
                var roleID = $roleContainer.controller().getValuesArray();
            
                AD.ServiceJSON.request({
                    method: 'PUT',
                    url: '/service/site/viewer/extended',
                    params: {
                        viewer_userID: userID,
                        viewer_passWord: password,
                        language_key: langKey,
                        role_id: roleID.join(',')
                    },
                    success: function(response) {
                        $messages.html(
                            '<div class="alert alert-success">'
                            //+ '<a class="close" data-dismiss="alert" href="#">x</a>'
                            + 'Account created'
                            + '</div>'
                        );
                        // Reset the form on success
                        resetForm();
                    },
                    failure: function(response) {
                        $messages.html(
                            '<div class="alert alert-error">'
                            + (response.errorMSG || 'Error')
                            + '</div>'
                        );
                    }
                });
            }
        });

        
        //// Final init for the "Create New" tab
        
        // Reset the form on page init
        resetForm();
    
    })();



    ///
    /// "Import" tab
    ///
    (function() {
        
        // Make sure browser supports HTML5 File features
        if (window.File && window.FileReader && window.FileList && window.Blob) {
          // Success! All the File APIs are supported.
        } else {
          $('#accounts-import-main .tab-content').html(
            '<div class="alert alert-block>'
            + '<h4 class="alert-heading">Sorry</h4> '
            + 'This feature is not supported by your web browser. Maybe try Firefox?'
            + '</div>'
          );
          return;
        }

        var resetImport = function()
        {
            // Disable all the "Next" buttons that require validation
            $('#accounts-import button.need-valid').attr('disabled', 1);
            
            // Unhide the navigation sidebar
            $('#accounts-import-nav li').not(':first').addClass('hidden');
            $('#accounts-import-nav').show();
            
            // Clear form fields
            $('#accounts-import select option:selected').removeAttr('selected');
            $('#accounts-import [checked]').removeAttr('checked');
            $('#accounts-import input:file').val('');
            $('#accounts-import .appdev_select_add').controller().clear();
        }
        
        // The variables are referenced throughout the different steps
        var csvData = [];
        var hasDataChanged = true;
        var accounts = [];
        

        //// Step 1: Load File
        
        $('#accounts-import-load input').on('change', function(evt) {
            // With HTML5 we can read the file directly on the client side.
            var selectedFile = evt.target.files[0]; // HTML5
            if (selectedFile) {
                var reader = new FileReader(); // HTML5
                reader.onload = function(e) {
                    // Get file contents
                    hasDataChanged = true;
                    $('#accounts-import-data').val(reader.result);
                    // Enable the "Next" button
                    $('#accounts-import-load button').removeAttr('disabled');
                }
                reader.readAsText(selectedFile);
            }
        });
        // "Next" button
        $('#accounts-import-load button.next').on('click', function() {
            // Reveal the next step
            $('#accounts-import-nav li').eq(1)
                .removeClass('hidden')
                .find('a').click();
        });
        
        
        //// Step 2: Review Data
        
        // "Previous" button
        $('#accounts-import-review button.prev').on('click', function() {
            // Go back one step
            $('#accounts-import-nav li a').eq(0).click();
        });
        // "Next" button
        $('#accounts-import-review button.next').on('click', function() {
            // Reveal the next step
            $('#accounts-import-nav li').eq(2)
                .removeClass('hidden')
                .find('a').click();
            
        });
        
        $('#accounts-import-data').on('change', function() {
            hasDataChanged = true;
        });
        
        var parseCsvData = function() 
        {
            // Parse the CSV data only if it changed
            if (hasDataChanged) {
                csvData = csvLines( $('#accounts-import-data').val() );
                if (csvData[0]) {
                    // Populate the fields config droplists
                    $('#accounts-import-configure select').each(function() {
                        var $select= $(this);
                        $select.find('option').not(':first').remove();
                        for (var fieldName in csvData[0]) {
                            $select.append('<option>' + fieldName + '</option>');
                        }
                    });
                }
                hasDataChanged = false;
            }
        }
        
        //// Step 3: Configure
        
        // Enable/disable the "Next" button depending on whether all the
        // columns have been linked to fields yet.
        var validateConfig = function()
        {
            // Just check if any select lists are still empty
            var numRemaining = $('#accounts-import-configure option:selected')
                    .filter("[value='']").length;
            if (numRemaining == 0) {
                $('#accounts-import-configure button.next').removeAttr('disabled');
            } else {
                $('#accounts-import-configure button.next').attr('disabled', 1);
            }
        }
        $('#accounts-import-configure select').on('change', validateConfig);
        // Re-parse the CSV data whenever this tab is shown
        $('#accounts-import-nav a').eq(2).on('show', function() {
            parseCsvData();
            validateConfig();
        });
        // "Previous" button
        $('#accounts-import-configure button.prev').on('click', function() {
            // Go back one step
            $('#accounts-import-nav li a').eq(1).click();
        });
        // "Next" button
        $('#accounts-import-configure button.next').on('click', function() {
            // Reveal the next step
            $('#accounts-import-nav li').eq(3)
                .removeClass('hidden')
                .find('a').click();
        });
        
        
        //// Step 4: Roles
        
        // Enable the roles selector widget
        var $accountImportRoles = $('#accounts-import-roles .account-roles');
        $accountImportRoles.appdev_select_add();
        // "Previous" button
        $('#accounts-import-roles button.prev').on('click', function() {
            // Go back one step
            $('#accounts-import-nav li a').eq(2).click();
        });
        // "Next" button
        $('#accounts-import-roles button.next').on('click', function() {
            // Reveal the next step
            $('#accounts-import-nav li').eq(4)
                .removeClass('hidden')
                .find('a').click();
        });
        
        
        //// Step 5: Verify Import
        
        // Refresh data whenever this tab is shown
        $('#accounts-import-nav a').eq(4).on('show', function() {
            // These are the field names chosen in the "Configure" step
            var fieldUserID = $('#accounts-import-config-userid').val();
            var fieldPassword = $('#accounts-import-config-password').val();
            var fieldLanguage = $('#accounts-import-config-language').val();
            // Populate the table with the CSV data entries
            var $table = $('#accounts-import-verify table');
            $table.find('tbody tr').not('.template-row').remove();
            accounts = [];
            for (var i=0; i< csvData.length; i++) {
                // Skip incomplete CSV lines
                if (!csvData[i][fieldUserID]) continue;
                if (typeof csvData[i][fieldPassword] == 'undefined') continue;
                if (typeof csvData[i][fieldLanguage] == 'undefined') continue;
                // Show account in the table
                var $row = $table.find('tr.template-row').clone();
                $row.removeClass('template-row');
                $row.find('.viewer_userID').text( csvData[i][fieldUserID] );
                $row.find('.viewer_passWord').text( csvData[i][fieldPassword] );
                $row.find('.language_key').text( csvData[i][fieldLanguage] );
                $table.find('tbody').append($row);
                // Also store in the accounts array
                accounts.push({
                    'viewer_userID': csvData[i][fieldUserID],
                    'viewer_passWord': csvData[i][fieldPassword],
                    'language_key': csvData[i][fieldLanguage]
                });
            }
            // Display roles
            var roles = $accountImportRoles.controller().getValuesObject();
            $('#accounts-import-verify .account-roles .role-row').remove();
            for (var roleID in roles) {
                var $row = $('#accounts-import-verify .account-roles .template-row').clone();
                $row
                    .removeClass('template-row')
                    .addClass('role-row')
                    .find('span').text(roles[roleID]);
                $row.appendTo('#accounts-import-verify .account-roles');
            }
            // Display approval option
            if ($('#accounts-import-auto-approve').is(':checked')) {
                $('#accounts-import-verify-approved-msg').show();
                $('#accounts-import-verify-pending-msg').hide();
            } else {
                $('#accounts-import-verify-approved-msg').hide();
                $('#accounts-import-verify-pending-msg').show();
            }
        });
        // "Previous" button
        $('#accounts-import-verify button.prev').on('click', function() {
            // Go back one step
            $('#accounts-import-nav li a').eq(3).click();
        });
        // "Next" button
        $('#accounts-import-verify button.next').on('click', function() {
            // Reveal the next step
            $('#accounts-import-nav li').eq(5)
                .removeClass('hidden')
                .find('a').click();
        });
        
        
        //// Step 6: Import
        
        var $progressBar = $('#accounts-import-import .progress .bar');

        // Activate when this tab is shown
        $('#accounts-import-nav a').eq(5).on('show', function() {
            // Clear any previous messages
            $('#accounts-import-import .import-status .account-row').remove();
            // Reset progress bar
            $progressBar.width(0).empty();
            $progressBar.parent()
                .addClass('progress-striped')
                .addClass('active')
                .removeClass('progress-success');
            // Hide the navigation sidebar.
            // Don't want users to interrupt the import by changing the data
            // halfway.
            $('#accounts-import-nav').hide();
            // Populate the accounts status list
            for (var i=0; i<accounts.length; i++) {
                var $row = $('#accounts-import-import .import-status .template-row').clone();
                $row
                    .removeClass('template-row')
                    .addClass('account-row')
                    .attr('userid', accounts[i]['viewer_userID']);
                $row.find('.viewer_userID').text(accounts[i]['viewer_userID']);
                $row.find('.language_key').text(accounts[i]['language_key']);
                $('#accounts-import-import .import-status').append($row);
            }
            // Begin import
            var concurrency = 5; // how many simultaneous requests to server
            var totalAccounts = accounts.length;

            /**
             * This takes data from one potential account, and submits it to
             * the server for creation.
             * Used internally by processQueue(), and references external
             * variables: `concurrency`, `accounts`, `totalAccounts`,
             * `$progressBar`, and `$accountImportRoles`.
             */
            var importAccount = function(accountData) 
            {
                // Initialize
                concurrency -= 1;
                var $row = $(
                    "#accounts-import-import .account-row[userid='" 
                    + accountData['viewer_userID'] + "']"
                );
                $row.append('<span class="label pull-right">Submitting...</span>');
                // Set roles
                var roles = $accountImportRoles.controller().getValuesArray();
                if (roles.length > 0) {
                    accountData['role_id'] = roles.join(',');
                }
                // Set approved/pending status
                if ($('#accounts-import-auto-approve').is(':checked')) {
                    accountData['viewer_isActive'] = 1;
                } else {
                    accountData['viewer_isActive'] = 0;
                }
                // Submit
                AD.ServiceJSON.request({
                    method: 'PUT',
                    url: '/service/site/viewer/extended',
                    params: accountData,
                    complete: function() {
                        // Update progress
                        var percentage = Math.round(
                            (totalAccounts - accounts.length)/totalAccounts*100
                        );
                        $progressBar.width(percentage+'%');
                        if (percentage > 10) {
                            $progressBar.text(percentage+'%');
                        }
                        concurrency += 1;
                    },
                    success: function(response) {
                        $row.remove();
                    },
                    failure: function(response) {
                        $row.find('span.label')
                            .addClass('label-important')
                            .text('Error: ' + response.errorMSG);
                    }
                });
            }
            
            /**
             * Concurrently process X accounts at a time, while updating
             * the progress bar.
             */
            var processQueue = function(callback) 
            {
                // Not done, have concurrency
                if (concurrency > 0 && accounts.length > 0) {
                    importAccount(accounts.shift());
                    processQueue(callback);
                }
                // Not done, no concurrency
                else if (concurrency == 0 && accounts.length > 0) {
                    // Wait and try again
                    setTimeout(function() {
                        processQueue(callback);
                    }, 0);
                }
                // Done
                else {
                    $progressBar.parent()
                        .removeClass('progress-striped')
                        .removeClass('active')
                        .addClass('progress-success');
                    $('#accounts-import-import button.next').removeAttr('disabled');
                    callback && callback();
                }
            }
            
            processQueue(refreshPendingAccounts);
        });
        // "Done" button
        $('#accounts-import-import button.next').on('click', function() {
            resetImport();
            $('#accounts-import-nav li a').eq(0).click();
        });
        
    })();



    ///
    /// "Approve" tab
    ///
    (function() {
        
        // Refresh data whenever this tab is shown
        $("#accounts-tab-selector a[href='#accounts-approve']").on('show', refreshPendingAccounts);

        // The rest already handled by the QuickMenu code
    
    })();
    


    ///
    /// "View List" tab
    ///
    (function() {
    
        var filterCount = 0;
        var $filterList = $('#accounts-view-current-filters');
        
        /**
         * This object manages the "Language", "Roles", and "Status" 
         * sidebar panels.
         */
        var sidebarPanels = {
            
            /**
             * Will contain timers from setTimeout() used in redrawPanel()
             */
            timers: { },
        
            /**
             * Clears all panels.
             */
            reset: function() {
                $('#accounts-view-language .panel-block').remove();
                $('#accounts-view-roles .panel-block').remove();
                $('#accounts-view-status .panel-block').remove();
            },
            
            /**
             * Updates the appearance of the blocks in a panel based on 
             * the accounts that have been added/removed to it.
             * @param {String} panelType
             *      "language", "roles", or "status"
             */
            redrawPanel: function(panelType) {
                if (this.timers[panelType]) {
                    clearTimeout(this.timers[panelType]);
                }
                // Wait 100 milliseconds in case multiple update requests
                // come in consecutively.
                this.timers[panelType] = setTimeout(function() {
                    var numSelected = $('#accounts-view-list tr.account-row td.select-row :checked').length;
                    // Go through each language block and check for partial representations
                    $('#accounts-view-'+panelType +' .panel-block').each(function() {
                        var $block = $(this);
                        var count = $block.data('accounts').length;
                        if (count == 0) {
                            $(this).remove();
                        }
                        else if (count < numSelected) {
                            $(this).addClass('partial');
                        } 
                        else {
                            $(this).removeClass('partial');
                        }
                    });
                }, 100);
                return this;
            },

            /**
             * Adds an account's property to the panel. 
             * Called when an account is selected.
             * @param {String} panelType
             *      "language", "roles", or "status"
             * @param {String} key
             * @param {String} label
             * @param {Integer} viewerID
             */
            add: function(panelType, key, label, viewerID) {
                viewerID = parseInt(viewerID);
                var $block = $("#accounts-view-"+panelType+" div[key='" + key + "']");        
                if ($block.length > 0) {
                    // This account's panel block is already present
                    // so record this viewerID there.
                    $block.data('accounts').push(viewerID);
                } else {
                    // Panel block not yet present so create it.
                    $block = $('#accounts-view-'+panelType+' .template-row').clone();
                    $block.removeClass('template-row');
                    $block.addClass('panel-block');
                    $block.attr('key', key);
                    $block.find('span').text(label);
                    $block.data('accounts', [viewerID]); // array created
                    $('#accounts-view-'+panelType).append($block);
                }
                return this.redrawPanel(panelType);
            },

            /**
             * Removes an account's language from the panel. 
             * Called when an account is deselected.
             * @param {String} panelType
             *      "language", "roles", or "status"
             * @param {String} key
             * @param {Integer} viewerID
             */
            remove: function(panelType, key, viewerID) {
                viewerID = parseInt(viewerID);
                var $block = $("#accounts-view-"+panelType+" div[key='" + key + "']");          
                // This account's panel block is present
                // so remove this account from the list.
                if ($block.length > 0) {
                    var accountList = $block.data('accounts');
                    var index = accountList.indexOf(viewerID);
                    if (index >= 0) {
                        accountList.splice(index, 1);
                    }
                }
                return this.redrawPanel(panelType);
            }

        } // end of sidebarPanels object

        
        
        /**
         * Fetches the list of viewer accounts from the server. Filters
         * will be applied.
         */
        var refreshList = function()
        {
            // Get the current filters
            var filters = [];
            var querystring = '';
            $filterList.children().not('.template-row').each(function() {
                var $this = $(this);
                var fieldname = $this.find('.fieldname').text();
                var operator = $this.find('.operator').text();
                var value = $this.find('.value').text();
                
                var filter = fieldname + "/" + operator + "/" + value;
                // e.g. "viewer_isActive/is/1"
                filters.push(filter);
            });
            if (filters.length > 0) {
                querystring = "?filter=" + filters.join('&filter=');
            }
            
            // Fetch viewer list from the server
            AD.ServiceJSON.request({
                method: 'GET',
                url: '/service/site/viewer/extended' + querystring,
                success: function(response) {
                    var data = response.data;
                    
                    // Clear the list
                    $('#accounts-view-list table tr.account-row').remove();
                    // Clear the sidebar panels
                    sidebarPanels.reset();
                    
                    $.each(data, function(index, value) {
                        var modelViewer = new site.Viewer(value);
                        addAccountRow(modelViewer, value.roles);
                    });
                }
            });
        }
        
        
        /**
         * For handling the right side columns when an account's checkbox
         * is selected or deselected.
         * @param {Element} checkbox The checkbox DOM element
         */
        var accountSelected = function(checkbox)
        {
            var $row = $(checkbox).parents('tr.account-row');
            var viewerID = $row.attr('viewer_id');
            var roles = $row.data('roles');
            var langKey = $row.find('.lang').text();
            var langLabel = dataLabel('language', langKey);
            var status = $row.find('.status :checkbox').is(':checked') ? '1' : '0';
            var statusLabel = dataLabel('status', status);
            
            // Selecting an account
            if (checkbox.checked) {
                // Include its language in the sidebar
                var langLabel = dataLabel('language', langKey);
                sidebarPanels.add('language', langKey, langLabel, viewerID);
                // Include its status in the sidebar
                sidebarPanels.add('status', status, statusLabel, viewerID);
                // Include its roles in the sidebar
                $.each(roles, function(roleID, data) {
                    sidebarPanels.add('roles', roleID, data['role_label'], viewerID);
                });
            } 
            // Deselecting an account
            else {
                // Remove its language from the sidebar
                sidebarPanels.remove('language', langKey, viewerID);
                // Remove its status from the sidebar
                sidebarPanels.remove('status', status, viewerID);
                // Remove its roles from the sidebar
                $.each(roles, function(roleID, data) {
                    sidebarPanels.remove('roles', roleID, viewerID);
                });
            }
            // Needed for accounts that have 0 roles
            sidebarPanels.redrawPanel('roles');
        }
        
        // Init the "select all" checkbox in the View List tab
        $('#accounts-view-list-select-all').change(function() {
            // Change all the rows to have the same checked state as the "select all"
            var isSelectAllChecked = $(this).is(':checked');
            $('#accounts-view-list tr.account-row td.select-row input:checkbox').each(function() {
                if (this.checked != isSelectAllChecked) {
                    this.checked = isSelectAllChecked;
                    accountSelected(this);
                }
            });
        });
        
        // When you select the checkbox of one of the account rows it will
        // update the "Roles" and "Language" columns on the right side.
        $('#accounts-view-list tr.account-row td.select-row :checkbox')
            .live('click', function() {
                accountSelected(this);
            });
        
        
        /**
         * Adds a new filter to the accounts list view.
         * @param {Object} filterData
         *      {
         *          "field": {String},
         *          "operator": {String},
         *          "value": {String}
         *      }
         * @return {Integer}
         *      The filterID of the newly added filter. (any use for this?)
         */
        var addFilter = function(filterData)
        {
            // Create a new filter based on the hidden template
            $filter = $filterList.find('.template-row').clone();
            $filter.removeClass('template-row');
    
            // Populate the new filter
            filterCount += 1;
            $filter.attr('filter_id', filterCount);
            $filter.find('.fieldname').text(filterData.field);
            $filter.find('.operator').text(filterData.operator);
            $filter.find('.value').text(filterData.value);
            
            // Add it to the container
            $filterList.append($filter);
            
            refreshList();
            return filterCount;
        }
        
        /**
         * Removes an existing filter from the accounts list view.
         * @param {Integer} filterID
         */
        var removeFilter = function(filterID)
        {
            $filterList.find("div[filter_id='" + filterID + "']").remove();
            refreshList();
        }
        
        // Clicking on the "remove" icon of a filter will remove it
        $filterList.find('div.rounded-box i.icon-remove-circle').live('click', function() {
            var filterID = $(this).parent().attr('filter_id');
            removeFilter(filterID);
        });
        
        
        // Selecting an option from List Filter panel will add a new filter
        $('#accounts-view-filter select').change(function() {
            if (this.selectedIndex > 0) {
                addFilter({
                    field: $(this).attr('filter_field'),
                    operator: $(this).attr('filter_op'),
                    value: $(this).val()
                });
                // Reset the select box
                this.selectedIndex = 0;
            }
        });
        // Pressing "Enter" from a textbox in the List Filter panel will add a new filter
        $('#accounts-view-filter :text').keyup(function(event) {
            switch (event.which) {
                case 10:
                case 13:
                    addFilter({
                        field: $(this).attr('filter_field'),
                        operator: $(this).attr('filter_op'),
                        value: $(this).val()
                    });
                    // clear the textbox
                    $(this).val('');
                    event.preventDefault();
                    return false;
                    break;
            }
        });
        
        
        /**
         * Adds a row to the Accounts List table.
         *
         * Does not affect the database. Also note the difference from
         * the *Pending* Account Requests list.
         *
         * @param {$.Model} accountData
         *      An JavacsriptMVC Model object containing the account data.
         * @param {Object} roles [optional]
         *      {
         *          123: { role_id: 123, role_label: "foo" },
         *          234: { role_id: 234, role_label: "bar" }
         *      }
         */
        var addAccountRow = function(accountData, roles)
        {
            // Create a new row based on the hidden template
            var $table = $('#accounts-view-list table');
            var $row = $table.find('.template-row').clone();
            $row.removeClass('template-row');
            $row.addClass('account-row');
            
            // Populate the new row
            $row.attr('viewer_id', accountData.viewer_id);
            $row.find('td.userID').text(accountData.viewer_userID);
            $row.find('td.lang').text(accountData.language_key);
            $row.model(accountData);
            $row.data('roles', roles);
    
            // Init the Active/Inactive slider (pt 1)
            var $checkbox = $row.find('td.status input:checkbox');
            if (parseInt(accountData.viewer_isActive) > 0) {
                $checkbox.attr('checked', '1');
            } else {
                $checkbox.removeAttr('checked');
            }
    
            // Add the new row to the table
            $table.append($row);
    
            // Init the Active/Inactive slider (pt 2)
            $checkbox.iphoneStyle({
                checkedLabel: dataLabel('status', 1),
                uncheckedLabel: dataLabel('status', 0),
                resizeHandle: false,
                // Handler function for when user toggles the status
                onChange: function($elem, isChecked) {
                    var value;
                    var oldValue;
                    if (isChecked) {
                        value = '1';
                        oldValue = '0';
                    } else {
                        value = '0';
                        oldValue = '1';
                    }
                    // Use the Viewer model to update status to server
                    accountData['viewer_isActive'] = value;
                    accountData.save();
                    // Then update the sidebar panel if current row's checkbox is marked
                    if ($elem.parents('tr.account-row').find('td.select-row :checked').length > 0) {
                        var statusLabel = dataLabel('status', value);
                        sidebarPanels.remove('status', oldValue, accountData['viewer_id']);
                        sidebarPanels.add('status', value, statusLabel, accountData['viewer_id']);
                    }
                }
            });
    
        }
        
        /**
         * Removes an existing row from the Accounts List table.
         * Does not affect the database.
         *
         * @param {String} userID
         */
        var removeAccountRow = function(viewerID)
        {
            var $row = $("#accounts-view-list tr[viewer_id='" + viewerID + "']");
            if ($row.find('.select-row :checkbox').is(':checked')) {
                // Uncheck the box first to update the sidebar panels
                $row.find('.select-row :checkbox').click();
            }
            $row.remove();
        }
        
        
        /**
         * Update the attributes of one or more accounts on the server.
         *
         * @param {jQuery} $rows
         *     This should contain the table <TR> rows of the accounts
         * @param {Object} attributes
         *     The new properties to update the accounts with.
         *     {
         *         language_key: {String}
         *         role_id: {Integer}
         *         role_label: {String} for updating the sidebar only
         *         viewer_isActive: {Integer}
         *     }
         * @param {Function} callback [optional]
         */
        var setAccountAttribute = function($rows, attributes, callback)
        {
            // Make an array of just the viewer_id values
            var listViewerIDs = [];
            $rows.each(function() {
                listViewerIDs.push($(this).attr('viewer_id'));
            });
            attributes['viewer_id'] = listViewerIDs.join(',');

            // Updates the accounts all at once.
            AD.ServiceJSON.request({
                method: 'POST',
                url: '/service/site/viewer/extended',
                params: attributes,
                success: function(response) {
                    // Now that the server data is updated, we should also 
                    // update the rows on the page.
                    $rows.each(function() {
                        var $row = $(this);
                        var viewerID = $row.attr('viewer_id');
                        $.each(attributes, function(field, value) {
                            switch (field) {
                                case 'role_id':
                                    var roleID = value;
                                    var roleLabel = attributes['role_label'];
                                    $row.data('roles')[value] = { 
                                        role_id: roleID,
                                        role_label: roleLabel
                                    };
                                    sidebarPanels.add('roles', value, roleLabel, viewerID);
                                    break;
                                case 'viewer_isActive':
                                    // Update the hidden checkbox
                                    $checkbox = $row.find('td.status :checkbox');
                                    if (value == 1) {
                                        $checkbox.attr('checked', 1);
                                        var status = '1';
                                        var oldStatus = '0';
                                    } else {
                                        $checkbox.removeAttr('checked');
                                        var status = '0';
                                        var oldStatus = '1';
                                    }
                                    // Update the iOS checkbox slider
                                    // (but prevent another server update)
                                    $checkbox.data('iphoneStyle').refresh(false);
                                    // Update the sidebar panel
                                    var statusLabel = dataLabel('status', value);
                                    sidebarPanels
                                        .remove('status', oldStatus, viewerID)
                                        .add('status', status, statusLabel, viewerID);
                                    break;
                                case 'language_key':
                                    var $lang = $row.find('td.lang');
                                    var oldLangKey = $lang.text();
                                    var langLabel = dataLabel('language', value);
                                    sidebarPanels
                                        .remove('language', oldLangKey, viewerID)
                                        .add('language', value, langLabel, viewerID);
                                    $lang.text(value);
                                    break;
                            }
                        });
                    });
                    callback && callback();
                }
            });
        }
        
        
        /**
         * Remove an attribute from one or more accounts.
         *
         * @param {jQuery} $rows
         *     This should contain the table <TR> rows of the accounts
         * @param {Object} attributes
         *     The properties to remove from the account.
         *     {
         *         role_id: {Integer}
         *     }
         * @param {Function} callback [optional]
         */
        var unsetAccountAttribute = function($rows, attributes, callback)
        {
            // Make an array of just the viewer_id values
            var listViewerIDs = [];
            $rows.each(function() {
                listViewerIDs.push($(this).attr('viewer_id'));
            });
            attributes['viewer_id'] = listViewerIDs.join(',');
            
            // HTTP DELETE doesn't support body?
            // So put the params in the querystring.
            var querystring = "?viewer_id=" + attributes['viewer_id'];
            querystring += "&role_id=" + attributes['role_id'];

            // Updates the accounts all at once.
            AD.ServiceJSON.request({
                method: 'DELETE',
                url: '/service/site/viewer/extended' + querystring,
                //params: attributes,
                success: function(response) {
                    // Now that the server data is updated, we should also 
                    // update the rows on the page.
                    $rows.each(function() {
                        var $row = $(this);
                        var viewerID = $row.attr('viewer_id');
                        $.each(attributes, function(field, value) {
                            if (field == 'role_id') {
                                var roles = $row.data('roles');
                                delete roles[value];
                                sidebarPanels.removeRole(value, viewerID);
                            }
                        });
                    });
                    callback && callback();
                }
            });
        }


        // Selecting a status from the Status panel on the right side
        // will assign it to all currently selected (i.e. checkboxed) accounts.
        $('#account-view-status-select').change(function() {
            if (this.selectedIndex > 0) {
                var status = $(this).val();
                
                // Get all selected accounts
                var $selectedRows = 
                    $('#accounts-view-list tr.account-row .select-row :checked')
                        .parent().parent();
                if ($selectedRows.length > 0) {
                    setAccountAttribute($selectedRows, { viewer_isActive: status });
                }
                this.selectedIndex = 0;
            }
        });

        // Selecting a language from the Language panel on the right side
        // will assign it to all currently selected (i.e. checkboxed) accounts.
        $('#account-view-lang-select').change(function() {
            if (this.selectedIndex > 0) {
                var langKey = $(this).val();
                var langLabel = dataLabel('language', langKey);
                
                // Get all selected accounts
                var $selectedRows = 
                    $('#accounts-view-list tr.account-row .select-row :checked')
                        .parent().parent();
                if ($selectedRows.length > 0) {
                    setAccountAttribute($selectedRows, { language_key: langKey });
                }
                this.selectedIndex = 0;
            }
        });

        // Selecting a role from the Roles panel on the right side
        // will assign it to all currently selected (i.e. checkboxed) accounts.
        $('#account-view-roles-select').change(function() {
            if (this.selectedIndex > 0) {
                var roleID = $(this).val();
                var roleLabel = dataLabel('role', roleID);
                
                // Get all selected accounts
                var $selectedRows = 
                    $('#accounts-view-list tr.account-row .select-row :checked')
                        .parent().parent();
                if ($selectedRows.length > 0) {
                    setAccountAttribute($selectedRows, { 
                        "role_id": roleID, 
                        "role_label": roleLabel 
                    });
                }
                this.selectedIndex = 0;
            }
        });
        
        // Clicking on the "x" close icon of a Role panel block will remove 
        // that role from all selected accounts.
        $('#accounts-view-roles .role-block i').live('click', function() {
            var $selectedRows = 
                $('#accounts-view-list tr.account-row .select-row :checked')
                    .parent().parent();
            var roleID = $(this).parent().attr('role_id');
            unsetAccountAttribute($selectedRows, { role_id: roleID });
        });

        
        ////
        //// Final init for "View List" tab
        ////
        
        // Refresh the list whenever the ViewList tab is shown
        $("#accounts-tab-selector a[href='#accounts-view']").on('show', function() {
            refreshList();
        });
        
        
    })(); // end of ViewList
    
    
    
    ///
    /// "Authorization" tab
    ///
    (function() {
        
        /**
         * Fetch the current settings from the server
         */
        var refreshSettings = function() 
        {
            // We are looking for these settings:
            var keysTodo = [
                'siteAuthorizationDefault-pendingUserPage',
                'siteAuthorizationDefault-newUserPage',
                'siteAuthorizationDefault-newUserRole',
                'siteAuthorizationDefault-pendingUserRole',
                'siteAuthorizationDefault-accountApproval'
            ];
            
            site.Settings.findAll(
                { 
                    // This is not the security hole you are looking for (*wave hand*)
                    dbCond: "`settings_key` LIKE 'siteAuthorizationDefault-%'",
                },
                // Success
                function(data) {
                    // First pass: check for missing settings
                    for (var i=0; i<keysTodo.length; i++) {
                        for (var j=0; j<data.length; j++) {
                            if (data[j]['settings_key'] == keysTodo[i]) {
                                break;
                            }
                        }
                        if (j == data.length) {
                            // This setting is missing. Create it now
                            // (will only get saved to DB when user specifies
                            //  a value).
                            data.push(new site.Settings({
                                settings_key: keysTodo[i],
                                settings_value: ""
                            }));
                        }
                    }
                    
                    // Second pass: attach the settings to their form controls
                    for (var i=0; i<data.length; i++) {
                        var key = data[i]['settings_key'];
                        // Init the "Account Approval Options" radio buttons
                        $("#account-approval-options [name='" + key + "']").each(function() {
                            var $option = $(this);
                            $option.model(data[i]);
                            if ($option.val() == data[i]['settings_value']) {
                                $option.attr('checked', '1');
                            }
                        });
                        // Init the "Default Values"
                        var $elem = $("#default-role-page-options [name='" + key + "']");
                        if ($elem.length) {
                            $elem
                                .model(data[i])
                                .val(data[i]['settings_value']);
                        }
                    }
                    
                },
                // Error
                function(stuff) {
                    console.log("Error fetching site settings");
                    console.log(stuff);
                }
            );
        };

        /**
         * This sends a request to the server to update a default value.
         * @param {DOM element} elem
         *      Either a textbox INPUT or a SELECT list.
         *      The name and value properties of the element will be used
         *      for the `settings_key` and `settings_value`.
         */
        var saveDefaultValue = function(elem)
        {
            var $elem = $(elem);
            var settingValue = $elem.val();
            var model = $elem.model();
            model.attr('settings_value', settingValue);
            model.save();
        }

        // User updated the Account Approval options
        $('#account-approval-options input').click(function() {
            saveDefaultValue(this);
        });
        
        // Event handling for when user updates one of the Default values
        $('#default-role-page-options select').change(function() {
            if (this.selectedIndex > 0) {
                saveDefaultValue(this);
            }
        });
        $('#default-role-page-options :text').blur(function() {
            saveDefaultValue(this);
        });
        $('#default-role-page-options :text').keyup(function(event) {
            if (event.which == 13 || event.which == 10) {
                $(this).blur();
                return false;
            }
        });
        
        // Refresh the settings whenever the "Authorizations" tab is shown
        $("#accounts-tab-selector a[href='#accounts-authorization']").on('show', function() {
            refreshSettings();
        });
        
    
    
    })(); // end of Authorization
    
    
    
});