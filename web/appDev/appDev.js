/**
 * @class AD_Client
 * @parent index 4
 * 
 * ###Client side global AD namespace.
 *
 * This file defines standard functions and calls for appDev
 * objects on the client side.
 */

// Create our Namespace
AD = AppDev =  {};
//AD = AppDev; //// short version AppDev for lazy programmers like me.

/**
 * @class AD.labels
 * @parent AD_Client
 *
 * Repository for javascript based labels.
 */

AppDev.labels = {};

/**
 * @class AD.listLabels
 * @parent AD_Client
 *
 * Repository for javascript based labels.
 */

AppDev.listLabels = {};

//// TODO: refactor how we do labels/listLabels ...

steal(
    // Disable socket.io because it conflicts with the Faye websocket implementation
    /*'//../../../socket.io/socket.io.js',*/
	'//jquery-ui.min.js',
    '/appDev/communications/services/serviceJSON.js',
    '/appDev/communications/notificationCenter/notificationCenter.js',
    '/appDev/communications/siteDispatch/siteDispatch.js',
    '/appDev/communications/api/api.js',
    '/appDev/model/model.js',
    '/appDev/model/service.js',
    '/appDev/model/serviceOld.js',   // Depreciated: will delete soon.
    '/appDev/lang/multilingual.js',
    '/appDev/lang/xlation.js',
    '/appDev/communications/services/serviceModel.js',
    '/appDev/model/listIterator.js',
    '/appDev/controller/controller.js',
    '/appDev/controller/form.js').then(function($) {


    //------------------------------------------------------------
    /**
     * @class AD.setListLabel
     * @parent AD_Client
     *
     * Sets the value for a listLabel
     * @codestart
     * [keyList][id]=[label]
     * @codeend
     *
     * @param {String} keyList
     *      the unique key for which list of labels we are dealing with
     *      usually the primary key of the table (like persontype_id )
     * @param {String} id
     *      the primary key value of an entry
     * @param {String} label
     *      the label to display for that value
     * @return void
     */
    AppDev.setListLabel = function (keyList, id, label) 
    {
        
        if (typeof(AppDev.listLabels[keyList]) == 'undefined') {
            AppDev.listLabels[keyList] = { id:label };
            return;
        }
        
        AppDev.listLabels[keyList][id] = label;

    }



    //------------------------------------------------------------
    /**
     * @class AD.listLabel
     * @parent AD_Client
     *
     * Returns the value for a listLabel
     * @codestart
     * [keyList][id]
     * @codeend
     *
     * @param {String} keyList
     *    the unique key for which list of labels we are dealing with
     *    usually the primary key of the table (like persontype_id )
     * @param {String} id
     *    the primary key value of an entry
     * @param {String} defaultValue
     *    the label to display for that value
     * @return {String}
     */
    AppDev.listLabel = function (keyList, id, defaultValue) 
    {

        if (typeof(AppDev.listLabels[keyList]) == 'undefined') {
            return defaultValue;
        }
        
        if (typeof(AppDev.listLabels[keyList]) == 'undefined') {
            return defaultValue;
        }
        
        return AppDev.listLabels[keyList][id];

    }


    /**
	 * @class AD.extend
	 * @parent AD_Client
	 * 
	 * An extend function for creating subclasses of other objects
     * extend( nameOfChildObject, nameOfParentObject)
	 */
    AppDev.extend = function(subClass, baseClass) {
                           function inheritance() {}
                           inheritance.prototype = baseClass.prototype;

                           subClass.prototype = new inheritance();
                           subClass.prototype.constructor = subClass;
                           subClass.baseConstructor = baseClass;
                           subClass.superClass = baseClass.prototype;
                        }
                        


    /**
	 * @class AD.alert
	 * @parent AD_Client
	 *
	 * More user friendly substitute for the Javascript alert() box.
	 * 
	 * @param {String} message
	 * @param {String/Object} options
	 * 
	 *    This can be a string, to set the title of the dialog box.
	 *    Or it can be an object of options to pass directly to the jquery
	 *    dialog function.
	 */
    AppDev.alert = {};
    $(document).ready(function() {

        // Find the alert box provided by the site template
        var $alertBox = $('#appDev-alert');
        // Or build the alert box from scratch if the template didn't provide one
        if ($alertBox.length == 0) {
            var alertBoxHTML = '\
    <div id="appDev-alert" button_label="OK">\
      <div class="alert-message"></div>\
    </div>';
            $alertBox = $(alertBoxHTML);
        }
        
        // Init the OK button
        var alertButtons = {};
        alertButtons[$alertBox.attr('button_label')] = function() {
            $alertBox.dialog('close');
        };
        
        // Init the alert box with jquery-ui
        var alertBoxTimeout = null;
        $alertBox.dialog({
            autoOpen: false,
            modal: true,
            buttons: alertButtons,
            close: function() {
              if (alertBoxTimeout) {
                  clearTimeout(alertBoxTimeout);
                  alertBoxTimeout = null;
              }
            }
        });
        
        AppDev.alert = function(message, options) {
		
            if (alertBoxTimeout) {
                // Cancel any previously set timeout
                clearTimeout(alertBoxTimeout);
                alertBoxTimeout = null;
            }

            if ($.isPlainObject(options)) {

                // Can set a timeout that closes the dialog automatically
                if (options['timeout']) {
                    options.open = function() {
                        alertBoxTimeout = setTimeout(AppDev.hideAlert, options['timeout']);
                    }
                } else {
                    options.open = null;
                }
            
                $alertBox.dialog('option', options);
            } 
            
            else {
                $alertBox.dialog('option', { 'title' : options });
            }

            // Set the message
            $alertBox.find('.alert-message').html(message);
            $alertBox.dialog('open');
        }


        /**
         * @class AD.hideAlert
         * @parent AD_Client
         *
         * Close the alert dialog box.
         * 
         */
        
        AppDev.hideAlert = function() {
            $alertBox.dialog('close');
        }

    });


    /**
     * @class AD.displayMessage
     * @parent AD_Client
     *
     * Display a message inside a DIV
     * @param {String} message
     *    The message HTML to display.
     * @param {String/jQuery} target
     *    The string ID of the DIV, or a jQuery selection of the DIV.
     */
    AppDev.displayMessage = function(message, target) {

        // If no target specified, then fallback to using a dialog box
        if (!target) {
            AppDev.alert(message);
            return;
        }
      
        var $target;
      
        // Check if target is a string
        if (target.toLowerCase) {
            $target = $('#'+target);
        } 
        // Otherwise assume target is a jQuery object
        else {
            $target = target;
        }
      
        $target
          .html(message)
          .slideDown();
    }


    /**
     * @class AD.hideMessage
     * @parent AD_Client
     *
     * Hide a message that was displayed
     * @param {string/jQuery} target
     *    The string ID of the DIV, or a jQuery selection of the DIV.
     */
    AppDev.hideMessage = function(target) {

        if (!target) {
            // If no target given, then hide the alert box assuming it is
            // currently visible.
            AppDev.hideAlert();
        }
        
        else if (target.toLowerCase) {
            // target is an ID string
            $('#'+target).hide();
        }
        
        else {
            // target is a jQuery object
            target.hide();
        }

    }



    AppDev.timeoutFixDialogUI = null;
    /**
     * @class AD.fixDialogUI
     * @parent AD_Client
     *
     * jQueryUI dialogs don't let you use HTML inside their buttons and will
     * convert all HTML tags into plaintext. This converts them back into
     * proper HTML.
     *
     * This function will keep on repeating every 5 seconds to check for any new
     * dialogs added dynamically.
     */
    AppDev.fixDialogUI = function() {
      // Cancel any other pending calls to this function
      if (AppDev.timeoutFixDialogUI) {
        clearTimeout(AppDev.timeoutFixDialogUI);
        AppDev.timeoutFixDialogUI = null;
      }

      // Process all dialog titles that have not been fixed yet.
      $('.ui-dialog[pdOK!=1]').each(function() {
        var $dialog = $(this);
        // Dialog titles are completely stripped of HTML tags, but we can
        // work around that by embedding the label_id in the dialog's DIV
        // in the PHP template.
        //
        // *** ACTION POINT FOR THE PROGRAMMER: ***
        // When you create the HTML code for a dialog box, add a "label_id"
        // attribute to the overall DIV for the dialog. This label_id will be
        // used here to make the dialog title translatable.

        // Check to see if this dialog has the label_id embedded.
        var labelID = $dialog.find('.ui-dialog-content').attr('label_id');
        if (labelID) {
          var $title = $dialog.find('.ui-widget-header .ui-dialog-title').eq(0);
          var titleText = $title.text();
          $title.html('<span><span class="puxLabel pdLabel" label_id="'+labelID+'">'+titleText+'</span></span>');
        }
        
        // Process the button panes in this dialog.
        $dialog.find('.ui-dialog-buttonpane').each(function() {
          var $buttonPane = $(this);
          // Process all the buttons in this pane.
          $buttonPane.find('button .ui-button-text').each(function() {
            var $button = $(this);
            var buttonText = $button.text();
            // Button text seems to have HTML tags
            if (buttonText.match(/<\/\w+>/)) {
              // Make the button reinterpret the text as HTML.
              $button.html(buttonText);
            }
          });
        });


        // Never process this dialog again.
        $dialog.attr('pdOK', 1);
      });
      
      // Repeat in 5 seconds
      AppDev.timeoutFixDialogUI = setTimeout(AppDev.fixDialogUI, 5000);
      
    }
    $(document).ready(function() {
      // Begin the cycle
      AppDev.timeoutFixDialogUI = setTimeout(AppDev.fixDialogUI, 2000);
    });



    /**
     * @class AD.switchLanguage
     * @parent AD_Client
     *
     * Switch the language labels on the current page.
     * @param {String} destLangCode
     *    The language code of the language to switch the page to:
     * @param {String} urlAction
     *    The urls of the services that will handle the language switch
     */
    AppDev.switchLanguage = function (destLangCode, urlAction, idBusyDiv) {

        var $busyDiv = $('#'+idBusyDiv);
        $busyDiv.showCount = 0;
        $busyDiv.layeredShow = function () {
                if (this.showCount == 0) {this.show()}
                this.showCount = this.showCount + 1;
            }
        $busyDiv.layeredHide = function() {
                this.showCount = this.showCount -1;
                if (this.showCount <= 0) { this.hide() }
            }
            
        $busyDiv.layeredShow();
        
        
        var idString = '';
        var delme='';
        // for each on page label (marked as a 'pdLabel')
        $('.pdLabel').each(function () {
            
                if (idString != '') {idString = idString+','}
                
                idString = idString + $(this).attr('label_id');

            });
            
            
        var onSuccess = function(response) {
            
            // Note:  a little performance data on using vs not using 
            //        these lists:
            //          no optimaztions: 2491ms
            //          listActivator optimazation only: 2331ms
            //          listActivator & listLabel optimizations: 1352ms
            
    //        var startTime = new Date().getTime();
            
            var $listActivators = $('.puxActivator');
            var $listLabels = $('.pdLabel');
            
            // foreach data item
            for( id in response.data) {
            
                // find the matching '.pdLabel' label_id=id
                var $label = $listLabels.filter('[label_id='+id+']');
                if ($label) {
                    // update html with lable
                    $label.html( response.data[id].label );
                    
                    // update label_id=newID
                    $label.attr('label_id', response.data[id].id);
                    
                    // now update any puxTool activators
                    if ($listActivators.length > 0) {
                        var activator = $listActivators.filter('[label_id='+id+']');
                        if (activator.length) {
                            activator.attr('label_id', response.data[id].id);
                        }
                    }
                }
                
                // update any labels stored in the AppDev context
                if (typeof(AppDev.labels[response.data[id].key]) != 'undefined') {
                    AppDev.labels[response.data[id].key] = response.data[id].label;
                }
            }        
            
    //        var endTime = new Date().getTime();
    //        var time = endTime - startTime;

            
            $busyDiv.layeredHide();
            
        }
        
        var onError = function() {
            AppDev.alert('onError ['+destLangCode+']['+idString+']');
            $busyDiv.layeredHide();
        
        }
        var values = {};
        values['listIDs'] = idString;
        values['langCode'] = destLangCode;
        var service = AppDev.ServiceJSON.post({
                        url:urlAction.labelUpdate,
                        params:values,
                        success:onSuccess,
                        failure: onError
                    });
                    
                    
                    
                    
        ////
        //// OK, now spawn updates for each of the multilingual drop lists
        ////
        var $listMultilingualSelects = $('select[pdMLSelect="Y"]');
        $listMultilingualSelects.each( function () {
        
            $busyDiv.layeredShow();
            
            var thisSelect = $(this);
            
            var onSelectSuccess = function(response) {
            
                for(id in response.data.labels) {
                    
                    var label = response.data.labels[id];
                    
                    var option = thisSelect.find('option[value=\''+id+'\']');
                    if (option) {
                        option.html(label);
                    }
                    
                    // now we store this list data in AppDev.labels.lists
                    AppDev.setListLabel(thisSelect.attr('fieldname'), id, label);

                }
           
                $busyDiv.layeredHide();
            }
            
            
            var onSelectError = function (response) {
            
                $busyDiv.layeredHide();
            }
            
            
            var selectValues = {};
            selectValues['t'] = thisSelect.attr('pdMLTable');
            selectValues['langCode'] = destLangCode;
            var service = AppDev.ServiceJSON.post({
                            url:urlAction.selectUpdate,
                            params:selectValues,
                            success:onSelectSuccess,
                            failure: onSelectError
                        });
        });
        
    }



    ///////////////////////////////////////////////////////////////////////
    /**
     * @class AD.winLogin
     * @parent AD_Client
     *
     * This object managed the Re-Login authentication form, which appears
     * when the user initiates an Ajax request after the session has timed
     * out.
     *
     * Its behaviour is different depending on the authentication method.
     * Currently `local` and `CAS` methods are supported. This setting
     * must be stored in a global variable `appDev_authMethod` early on in
     * the page loading sequence.
     */
    AppDev.winLogin = {};
    $(document).ready(function() {
      
      // CAS re-authentication popup
      if (appDev_authMethod == 'CAS') {
        var isVisible = false;
        var $loginForm;
        var loginCallback;
        var interval;
        
        /**
         * @class AD.winLogin.isVisible
         * @parent AD.winLogin
         * 
         * Returns whether or not the Re-Login form is currently visible on
         * the screen.
         *
         * @return {Boolean}
         */
        AppDev.winLogin.isVisible = function() {
            return isVisible;
        };
        
        /**
         * @class AD.winLogin.done
         * @parent AD.winLogin
         *
         * Used in CAS authentication, for the child iframe containing the
         * CAS login page to report back when it has finished.
         */
        AppDev.winLogin.done = function() 
        {
            clearInterval(interval);
            var frameWindow = $loginForm.get(0).contentWindow;
            if (frameWindow && !frameWindow.closed) {
                // Try to stop MSIE from complaining about us closing
                // this iframe that we ourselves opened.
                frameWindow.open('about:blank', '_self', '');
                frameWindow.close();
            }
            $loginForm.dialog('close');
            $loginForm.remove();
            isVisible = false;
            if ($.isFunction(loginCallback)) {
                loginCallback();
            }
        };
        
        /**
         * @class AD.winLogin.show
         * @parent AD.winLogin
         * 
         * Display the Re-Login form on the screen.
         * 
         * @param {Function} callback
         *    (optional) The function to execute one the session has been
         *    successfully reauthenticated.
         */
        AppDev.winLogin.show = function(callback) 
        {
            isLoginFormVisisble = true;
            loginCallback = callback;
            
            // This is a page that will force CAS authentication and then
            // close itself.
            var url = '/page/cas/frame-auth';
            $loginForm = $("<iframe src='" + url + "' width='100%' height='100%'>");
            $loginForm.dialog({
                'title': 'Re-login Required',
                'modal': true,
                'width': 800,
                'height': 600,
                'autoOpen': true,
                'open': function() {
                    $loginForm.css({ width: '750px', height: '550px' });
                }
            });
            
            // Keep polling the CAS login frame to see if it closed.
            interval = setInterval(function() {
                var frameWindow = $loginForm.get(0).contentWindow;
                if (frameWindow && frameWindow.closed) {
                    AppDev.winLogin.done();
                }
            }, 20);
        };
      }
      
      // Local re-authentication popup
      else {

        // See if the site template already has a custom form provided
        var $loginForm = $('#appDev-formLogin');
        // If not, build one now
        if ($loginForm.length == 0) {
            var formHTML = '\
    <div id="appDev-formLogin" button_text="Submit" form_title="Re-login">\
      <form>\
        <table width="100%">\
          <tr>\
            <th>User ID</th>\
            <td><input name="userID" /></td>\
            <td class="error" field_error_msg="userID"></td>\
          </tr>\
          <tr>\
            <th>Password</th>\
            <td><input type="password" name="pWord" /></td>\
            <td class="error" field_error_msg="pWord"></td>\
        </table>\
      </form>\
      <div class="message ui-state-error ui-corner-all"></div>\
    </div>\
    ';
            $loginForm = $(formHTML);
        }

        // This is the message box for errors and such
        $messageBox = $loginForm.find('.message');
        // Title and button label
        var submitButton = $loginForm.attr('button_text');
        var formTitle = $loginForm.attr('form_title');
        // The callback function to execute after reauthenticating
        var loginCallback = null;
        
        // Login form submission handler
        var loginFormSubmit = function() {
            // Clear messages
            $messageBox.hide();
            $loginForm.find('[field_error_msg]').empty();
            
            // Hash the password
            var $pWord = $loginForm.find(':input[name=pWord]');
            $pWord.val(AD.Util.MD5($pWord.val()));
            
            // Access the server
            $.ajax({
                // @see modules/site/interfaces/login/node_login.js
                url: '/service/site/login/authenticate',
                type: 'POST',
                dataType: 'json',
                data: $loginForm.find('form').serialize(),
                error: function(req) {
                    // Did not receive a valid JSON response
                    $messageBox
                      .html("Error:<br/>"+req.responseText)
                      .slideDown();
                },
                success: function(data) {
                    // Received a valid JSON response
                    if (data.success) {
                        // Authentication successful
                        $messageBox
                          .html('Success!')
                          .slideDown();
                        setTimeout(
                          function() { 
                            $loginForm.dialog('close'); 
                            if ($.isFunction(loginCallback)) loginCallback();
                          }, 
                          1000
                        );
                    } else {
                        // Authentication failed
                        for (field in data.errors) {
                            $loginForm.find('[field_error_msg='+field+']')
                              .html(data.errors[field]);
                        }
                    }
                }
            });
        }

        var dialogButtons = {};
        dialogButtons[submitButton] = loginFormSubmit;

        // jQueryUI dialog
        $loginForm.dialog({
            title: formTitle,
            buttons: dialogButtons,
            open: function() {
                // Clear fields and messages
                $loginForm.find('[name=userID], [name=pWord]').val('');
                $loginForm.find('[field_error_msg]').empty();
                $messageBox.hide();
                // Set focus on the user ID field
                $loginForm.find('[name=userID]').focus();
            },
            autoOpen: false,
            modal: true,
            width: 400
        });
        
        // Pressing Enter in the password field should submit the form
        $loginForm.find('[name=pWord]').keypress(function(e) {
            if (e.keyCode == 13 || e.keyCode == 10 || e.keyCode == 3) {
                loginFormSubmit();
            }
        });

        // Populate the winLogin object
        AppDev.winLogin = {
            isVisible: function() { return $loginForm.dialog('isOpen'); },
            show: function(callback) {
                loginCallback = callback;
                $loginForm.dialog('open');
            }
        }
        
      } // end local re-authentication

    }); // ready()
    
    
    /**
     * @class AD_Client.Util
     * @parent AD_Client
     *
     * Provide a copy of the attributes of an object.  No functions allowed.
     * Differs from JavascriptMVC Model::attrs() because this function will return
     * attributes which belong to the model as well as properties that got tacked on later
     * @param {Object} source object
     * @return object
     */
    
    AD.Util = {};
    AD.Util.String = {};
    AD.Util.String.replaceAll = function (origString, replaceThis, withThis) {
        var re = new RegExp(RegExpQuote(replaceThis),"g"); 
        return origString.replace(re, withThis);
    };
    
    AD.Util.String.getCurrencyValue = function(number) {
        if (typeof number == 'string') {
            number = parseFloat(number) || 0;
        } 
        if (typeof number != 'number') {
            number = 0;
        }
        var wholeNumber = Math.floor(number);
        var decimal = Math.floor(number * 100) % 100;
        if (decimal < 10) {
            decimal = '0'+decimal;
        }
        return wholeNumber + '.' + decimal;
    },

    // Try to convert the value to YYYY-MM-DD format
    AD.Util.String.getDate = function(value) {
        var dateStr = '0000-00-00';
        ticks = Date.parse(value);
        if (!isNaN(ticks)) {
            var date = new Date(ticks);
            var dd = date.getDate();
            var mm = date.getMonth()+1; //January is 0!
            var yyyy = date.getFullYear();
            if(dd<10){dd='0'+dd};
            if(mm<10){mm='0'+mm};
            dateStr = yyyy+'-'+mm+'-'+dd;
        } 
        return dateStr;
    },


    RegExpQuote = function(str) {
         return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
    };

    /**
     * @class AD_Client.Util.Object
     * @parent AD_Client.Util
     *
     * Provide a copy of the attributes of an object.  No functions allowed.
     * Differs from JavascriptMVC Model::attrs() because this function will return
     * attributes which belong to the model as well as properties that got tacked on later
     * @param {Object} source object
     * @return object
     */
    
    AD.Util.Object = {};

    /**
     * @class AD.Util.Object.getAttrs
     * @parent AD_Client.Util.Object
     *
     * Provide a copy of the attributes of an object.  No functions allowed.
     * Differs from JavascriptMVC Model::attrs() because this function will return
     * attributes which belong to the model as well as properties that got tacked on later
     * @param {Object} source object
     * @return object
     */
    

    AD.Util.Object.getAttrs = function (data) {
        var attrs = {};
        $.each(data, function(index, value){
            if (!$.isFunction(value)) {
                attrs[index] = value;
            }
        });
        return attrs;
    };
    
    AD.Util.MD5 = function (string) {
        
        function RotateLeft(lValue, iShiftBits) {
            return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
        }
     
        function AddUnsigned(lX,lY) {
            var lX4,lY4,lX8,lY8,lResult;
            lX8 = (lX & 0x80000000);
            lY8 = (lY & 0x80000000);
            lX4 = (lX & 0x40000000);
            lY4 = (lY & 0x40000000);
            lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        }
     
        function F(x,y,z) { return (x & y) | ((~x) & z); }
        function G(x,y,z) { return (x & z) | (y & (~z)); }
        function H(x,y,z) { return (x ^ y ^ z); }
        function I(x,y,z) { return (y ^ (x | (~z))); }
     
        function FF(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };
     
        function GG(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };
     
        function HH(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };
     
        function II(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };
     
        function ConvertToWordArray(string) {
            var lWordCount;
            var lMessageLength = string.length;
            var lNumberOfWords_temp1=lMessageLength + 8;
            var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
            var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
            var lWordArray=Array(lNumberOfWords-1);
            var lBytePosition = 0;
            var lByteCount = 0;
            while ( lByteCount < lMessageLength ) {
                lWordCount = (lByteCount-(lByteCount % 4))/4;
                lBytePosition = (lByteCount % 4)*8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
            lWordArray[lNumberOfWords-2] = lMessageLength<<3;
            lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
            return lWordArray;
        };
     
        function WordToHex(lValue) {
            var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
            for (lCount = 0;lCount<=3;lCount++) {
                lByte = (lValue>>>(lCount*8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
            }
            return WordToHexValue;
        };
     
        function Utf8Encode(string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";
     
            for (var n = 0; n < string.length; n++) {
     
                var c = string.charCodeAt(n);
     
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
     
            }
     
            return utftext;
        };
     
        var x=Array();
        var k,AA,BB,CC,DD,a,b,c,d;
        var S11=7, S12=12, S13=17, S14=22;
        var S21=5, S22=9 , S23=14, S24=20;
        var S31=4, S32=11, S33=16, S34=23;
        var S41=6, S42=10, S43=15, S44=21;
     
        string = Utf8Encode(string);
     
        x = ConvertToWordArray(string);
     
        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
     
        for (k=0;k<x.length;k+=16) {
            AA=a; BB=b; CC=c; DD=d;
            a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
            d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
            c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
            b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
            a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
            d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
            c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
            b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
            a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
            d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
            c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
            b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
            a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
            d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
            c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
            b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
            a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
            d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
            c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
            b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
            a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
            d=GG(d,a,b,c,x[k+10],S22,0x2441453);
            c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
            b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
            a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
            d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
            c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
            b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
            a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
            d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
            c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
            b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
            a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
            d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
            c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
            b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
            a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
            d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
            c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
            b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
            a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
            d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
            c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
            b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
            a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
            d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
            c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
            b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
            a=II(a,b,c,d,x[k+0], S41,0xF4292244);
            d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
            c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
            b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
            a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
            d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
            c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
            b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
            a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
            d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
            c=II(c,d,a,b,x[k+6], S43,0xA3014314);
            b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
            a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
            d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
            c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
            b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
            a=AddUnsigned(a,AA);
            b=AddUnsigned(b,BB);
            c=AddUnsigned(c,CC);
            d=AddUnsigned(d,DD);
        }
     
        var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
     
        return temp.toLowerCase();
    
    };



});


