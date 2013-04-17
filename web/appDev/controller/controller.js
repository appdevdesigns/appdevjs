/**
 * @class AD_Client.Controller
 * @parent AD_Client
 *
 * ###AppDev Controller Object
 *
 * The JavascriptMVC framework wants to look in predefined locations for views
 * that don't always agree with our AppDevJS layout.  So we override their view()
 * method to actually use the url we send it.
 *
 * So when creating a client side Controller object, do this:
 * @codestart
 *      //// Setup Widget:
 *       AD.Controller.extend('t1000', {
 *
 *           init: function (el, options) {
 *               //// Setup your targets here:
 *
 *           },
 *           query:function() {
 *              return 'Are you Sarah Connor?';
 *           }
 *       });
 * @codeend
 *
 * In addition this object provides several convenience methods to manage
 * keyboard input, and loading ListIterators to manage data.
 *
 */


$.Controller.extend("ADController",
{

    init: function (el, options) {
        // make sure defaults are taken care of
        var defaults = {
            uid:null,
            hasKeyboardFocus: false
        };

        var opt = $.extend(defaults, options);

        this.uid = opt.uid;
        this.hasKeyboardFocus = opt.hasKeyboardFocus;


    },



    //------------------------------------------------------------
    /**
     * @function dataReady
     *
     * For controllers that have a ListIterator and need to setup
     * their data once the ListIterator is ready, this method
     * provides a mechanism to safely manage the timing of the
     * events.
	 *
     * @codestart
     * this.dataReady( objList, onSuccess, onError);
     * @codeend
     *
     * @param {object} listIterator
     *      the ListIterator that we are working with
     * @param {fn} onSuccess
     *      a callback fn to call once the list is ready
     * @param {fn} onError
     *      a callback fn to call if an error happened with the
     *      ListIterator.loaded() operation.
     * @return {object} a deferred indicating status of the listIterator's loading.
     */
    dataReady: function(listIterator, onSuccess, onError) {

         var loaded = null;

         if (listIterator) {

             loaded = listIterator.loaded();
             $.when(loaded).done(function (data) {

                 if (onSuccess)  onSuccess(data);
             })
             .fail(function(data) {

                 if (onError)  onError(data);
             });
         }

         return loaded;
	},



    //------------------------------------------------------------
    /**
     * @function onKeyDown
     *
     * default handler for Keydown events. This needs to be
     * overridden by child objects to manage what happens on keydown
     * events.
     *
     *
     * @param {object} el
     *      DOM element that received the event
     * @param {object} event
     *      The event object that contains more info about the keypress.
     */
    onKeyDown: function(el, event) {


    },



    //------------------------------------------------------------
    /**
     * @function onKeypress
     *
     * default handler for Keypress events.  This needs to be
     * overridden by child objects to manage what happens on keypress
     * events.
     *
     *
     * @param {object} el
     *      DOM element that received the event
     * @param {object} event
     *      The event object that contains more info about the keypress.
     */
    onKeypress: function(el, event) {


    },



    //------------------------------------------------------------
    /**
     * @function setKeyboardFocus
     *
     * send a notice to change the widget that has keyboard focus
     *
     * @codestart
     * this.setKeyboardFocus( uid );
     * @codeend
     *
     * @param {string} uid
     *      the unique ID of the widget that is supposed to pay
     *      attention to the keyboard inputs.
     */
    setKeyboardFocus: function(uid) {

         if ('undefined' == typeof uid) uid = '';
         AD.Comm.Notification.publish('ad.keyboard.focus', {uid:uid});
    },



    //------------------------------------------------------------
    /**
     * @function view
     *
     * Return the compiled javascript view data.
     *
     * The Default JavascriptMVC Controller object's view() will
     * modify the given url according to their layout guidelines.
     * here we'll just pass the url on as we get it.
     *
     * @codestart
     * this.element.html(this.view('/url/to/view.ejs', { view:data }));
     * @codeend
     *
     * @param {String} viewURL
     *      the url that references the view file to compile.
     * @param {JSON} data
     *      the set of data to use within the view. if no data given,
     *      this object will be sent as the data.
     * @return {String} compiled HTML from the view
     */
     view: function(viewURL, data) {

        //calculate data
        data = data || this;

        //calculate helpers
        var helpers ={};

        return jQuery.View(viewURL, data, helpers);
    },



	//------------------------------------------------------------
    /**
     * @function xlateLabels
     *
     * Search our attached DOM element for any DOM elements that have
     * an attribute "adLabelKey='xxx'" and replaces their content with
     * a multilingual label.
	 *
	 * For example:
     * @codestart
     * <a class="label-cancel btn btn-medium btn-danger " href="#" appdLabelKey='[appRad.portal.labelwidget.Cancel]'></a>
     * @codeend
     *
     * @return {undefined}
     */
    xlateLabels: function() {

    	// find any element with our special 'appdLabelKey' property
    	this.element.find('[appdLabelKey]').each(function(index, elem){
    		var $elem = $(elem);
    		var key = $elem.attr('appdLabelKey');

    		$elem.html( AD.Lang.Labels.getLabelHTML(key));
    	});


    	// find any element with our special 'appdTitleKey' property
        this.element.find('[appdTitleKey]').each(function(index, elem){

//// TODO: pull this into AD.Lang.Labels.addTitleObject(elem);
////       and keep this object tracked on multilingual changes

            var $elem = $(elem);
            var key = $elem.attr('appdTitleKey');

            var labelObj = AD.Lang.Labels.getLabel(key);

            $elem.attr( 'title', labelObj.label);
        });


    	// find any element with a 'placeholder' attrib and see if we have a label for it's value
    	this.element.find('[placeholder]').each(function(index, elem) {

//// TODO: pull this into AD.Lang.Labels.addPlaceholderObject(elem);
////        and keep this object tracked on multilingual changes
    		var $elem = $(elem);
    		var key = $elem.attr('placeholder');

    		var labelObj = AD.Lang.Labels.getLabel(key);

    		if (labelObj.label != 'unknown') {
    			$elem.attr('placeholder', labelObj.label);
    		}
    	});
    },



    'ad.keyboard.focus subscribe': function(message, data){
        // data: { uid:'widget.uid' }

        // if our uid is a match then we have keyboard focus
        var myUID = this.uid || null;

        this.hasKeyboardFocus = (myUID == data.uid);

    },



    //---------------------------------------------------------------------
    "{document} keydown": function (el, event) {

        if (this.hasKeyboardFocus) {

            this.onKeyDown(el, event);

        } // end if has focus

    },



    //---------------------------------------------------------------------
    "{document} keypress": function (el, event) {

        if (this.hasKeyboardFocus) {

            this.onKeypress(el, event);

        } // end if has focus

    }
});
AD.Controller = ADController;


/*
 * @class AD_Client.Controller.Widgets
 * @parent AD_Client.Controller
 *
 * ##AD.Controller Widgets
 *
 * The AppDevJS client side libraries provide several generic Widgets for use on
 * web displays.
 *
 */