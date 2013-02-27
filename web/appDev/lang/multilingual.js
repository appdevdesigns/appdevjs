/**
 * @class AD_Client.Lang
 * @parent AD_Client
 *
 * AD.Lang
 */    


    if (typeof AD.Lang == "undefined") {
        AD.Lang = {};
    }
    
    AD.Lang.Key = {};
    AD.Lang.Key.LANGUAGE_SWITCH = 'site.multilingual.lang.set';
    
steal('/site/models/Labels.js', '/site/models/Language.js').then(function($) {
    
    
    
   /*
    * 
    * @class AD.Lang.Multilingual
    * @parent AD_Client.Lang
    *
    * This is a generic Class for handling Multilingual label data for our
    * pages. 
    * 
    * This object is responsible for :
    *      - Providing a communication mechanism to update/display
    *        multilingual values on the page (think labels).
    *      - Responding to Global Notifications related to switching the
    *        current multilingual language
    *      - Responding to on screen widgets wanting to construct their disply
    *        which includes a multilingual label
    *
    */
    AD.Lang.Multilingual = Base.extend({
    
        constructor : function ( settings ) {


            this.currLangKey = '';
            this.labels = {};            // labels['path/to/label/[key]'].{ objects:[], text:{'langKey':''}
            this.updateTimeOut=null;     // used for TimeOut() calls
            this.queueLabelLoadRequests = [];   // list of label paths we are
                                         // updating from the server
            this.defaultPath = '';                             
            
            this.dfd = null;
            
            for(var s in settings) {
                this[s] = settings[s];
            }
        
        },
        
        
            
        
        //------------------------------------------------------------------
        addLabel: function ( labelObj ) {
            // add a label to the Multilingual Label manager.
            //
            //  labelObj : (object) Definition of a single Label
            //              format: {
            //                          langKey:'en|zh-hans|fr|...',
            //                          key: '[uniqueKey]',
            //                          text: 'Label Text',
            //                          obj: an object that manages this label
            //                          
            //                      }
                
                // insert this data into our current label info
                
                // use defautl language key if one not provided with labelObj
                var langKey = this.currLangKey;
                // if (labelObj.langKey exists)  langKey = labelObj.langKey;
                if (typeof labelObj.langKey != 'undefined') {
                    langKey = labelObj.langKey;
                }
                
                var key = '[undefined]';
                if (typeof labelObj.key != 'undefined') {
                    key = labelObj.key;
                }
                
                
                var text = 'noTextGiven';
                if (typeof labelObj.text != 'undefined') { 
                    text = labelObj.text;
                }
                
                
                var obj = null;
                if (typeof labelObj.obj != 'undefined') {
                    obj = labelObj.obj;
                }
                
                
                // create labels[path] if not exists
                if (typeof this.labels[key] == 'undefined') {
                    this.labels[key] = { objects:[], text:{} };
                }

                    
                // insert label text at langKey
                var currText = this.labels[key].text[langKey];
                this.labels[key].text[langKey] = text;
                if ((langKey == this.currLangKey) 
                    && (text != currText)) {
                    
                    for (var iO=0; iO< this.labels[key].objects.length; iO++) {
                        var obj = this.labels[key].objects[iO];
                        obj.html( text );
                    
                    }
                
                }
                
                if (obj != null) {
                    this.labels[key].objects.push(obj);
                }
                
        },
        
        
        
        //-----------------------------------------------
        doLoad: function (dfd) {
            // perform the actual AJAX call to load our 
            // labels from the server
            
            
            // sanity check:  don't do anything unless we have something
            // in our queue
            if (this.queueLabelLoadRequests.length > 0) {
                
                var labels = new site.Labels();
                var that = this;
                
                
                var listPaths = '';
                var listKeys = '';
                
                // foreach queuedLabelPaths stored
                for (var indx=0; indx < this.queueLabelLoadRequests.length; indx++) {
                
                    // compile dbCond parts
                    var obj = this.queueLabelLoadRequests[indx];
                    switch( obj.type) {
                    
                        case 'path':
                            if (listPaths != '') listPaths += ', ';
                            listPaths += "'"+obj.val+"'";
                            break;
                            
                            
                        case 'key':
                            if (listKeys != '') listKeys += ', ';
                            listKeys += "'"+obj.val+"'";
                            break;
                    }
                    
                } // for each queueLabelLoadRequests
                
                
                // compile dbCond
                var condArray = [];
                if (listPaths != '') {
                    condArray.push('label_path in ('+listPaths+')');
                }
                if (listKeys != '') {
                    condArray.push('label_key in ('+listKeys+')');
                }
                if (window._adminToolbar && !window._adminToolbar.labelsLoaded) {
                    condArray.push("label_path = '/page/site/adminToolbar'");
                    window._adminToolbar.labelsLoaded = true;
                }
                var dbCond = condArray.join(' OR ');
                
                    
                

                // load all the labels for our accumulated requests:
                var curDFD = site.Labels.findAll({ dbCond:dbCond }, function ( data ) { 
                
                		// if we received some data
                		if (data) {
                			
                		
	                        for (var dIndx=0; dIndx < data.length; dIndx++) {
	                        
	                            // create Label Obj
	                            var labelObj = {
	                                  langKey: data[dIndx].language_code,
	                                  key:data[dIndx].label_key,
	                                  text: data[dIndx].label_label
	                             }
	                                
	                            // add that label
	                            that.addLabel( labelObj );
	                            
	                        }
                        
                		}
                  
                    }, function () { /* Labels.findAll() onError */ } 
                );
                
            
                // clear our queued paths list
                this.queueLabelLoadRequests.length = 0;
                
                // reset timer = null
                this.updateTimeOut = null;
                
                $.when(curDFD).done(function() { 
                    dfd.resolve();
                    });
        
        
            } // end if queue.length > 0
        },
            
            
            
        //-----------------------------------------------
        getCurrLangKey: function () {
            // return our current language code setting.
            
            return this.currLangKey;
        },
        
        
        
        //-----------------------------------------------
        // this is now a static fn():
        // var L = AD.Lang.Labels.getLabel;
        // var text = L('[some.key.here]');  // will work
        getLabel: function ( labelInfo ) {
            // return a label object representing the 
            // desired label.
            //
            // labelInfo = {
            //      key:[key],
            //      langKey:[language_code],
            // }
        
        	// in the case of being called with only a key
        	// getLabel('[site.login.username]') 
        	if ( typeof labelInfo == 'string') {
        		labelInfo = { key:labelInfo };
        	}
        	
        
            var key = labelInfo.key;
            var langKey = labelInfo.langKey || AD.Lang.Labels.currLangKey;
            
            
            // language Key hasn't been initialized, so set it based upon 
            // this first element.
            if (AD.Lang.Labels.currLangKey == '') {
            
            	AD.Lang.Labels.currLangKey = langKey;
            }
            
            
            
            var returnLabel = { 
                    label:'unknown',
                    key:'unknownKey'
                };
            

                
            if (typeof AD.Lang.Labels.labels[key] != 'undefined') {
                
                returnLabel.key = key;
                
                if (typeof AD.Lang.Labels.labels[key].text[langKey] != 'undefined') {
            
                    returnLabel.label = AD.Lang.Labels.labels[key].text[langKey];
            
                } else {
                
                    // don't have a value for the curr language:
                    returnLabel.label = '['+langKey+']'+key;
                
                }
            }

            
            return returnLabel;
        
        },
        
        
        
        //------------------------------------------------------------------
        _getLabelHTML: function( params ) {
        
            return '<span class="appLabel" key="'+params.key+'" langKey="'+params.langKey+'" >'+params.text+'</span>';
        
        },
        
        
        getLabelHTML: function(labelInfo) {
        	
        	var labelInfo = AD.Lang.Labels.getLabel(labelInfo);
        	var param = { key: labelInfo.key,
        			langKey:AD.Lang.Labels.currLangKey,
        			text: labelInfo.label
        	};
        	return AD.Lang.Labels._getLabelHTML(param);
        },
        
        
        
        //------------------------------------------------------------------
        getLabelObj: function( labelInfo ) {
            // return a DOM object that shows a multilingual label.
            //
            //  key: [key] 
            //
            
                key = labelInfo.key;
                
                var $domObj = null;
                
                // if this.labels[path] exists
                if (typeof this.labels[key] != 'undefined') {
                
                    // if desired langKey version of label exists
                    if (typeof this.labels[key].text[this.currLangKey] != 'undefined') {
                    
                        // create a $('<span>Label</span>') obj & track it
//                        $domObj = $('<span class="appLabel" key="'+key+'" langKey="'+this.currLangKey+'" >'+this.labels[key].text[this.currLangKey]+'</span>');
                        
                        var labelHTML = this._getLabelHTML({
                            key:key,
                            langKey:this.currLangKey,
                            text:this.labels[key].text[this.currLangKey]
                            });
                        $domObj = $(labelHTML);
                        this.trackLabelObj( key, $domObj);
                        
                    } else {
                    
                        //// key exists, but not current lang version:
                        
                        
                        
                        // create temporary label:
                        var tempLabel = '';
                        if (typeof this.labels[key].text['en'] != 'undefined') {
                            // try to return the english language version 
                            tempLabel = '[en]'+ this.labels[key].text['en'];
                        } else {
                        
                            // just get first lang version we find
                            for (var l in this.labels[key].text) {
                                if (tempLabel != '') break;
                                tempLabel = '['+l+']'+ this.labels[key].text[l];
                            }
                        }
                        
                        
                        // add a label entry for curLangKey
                        this.addLabel({
                            langKey:this.currLangKey,
                            key:key,
                            text: tempLabel
                        });
                        
                        
                        // create a $('<span>'+text+'</span>') placeholder
                        var labelHTML = this._getLabelHTML({
                            key:key,
                            langKey:this.currLangKey,
                            text:tempLabel
                            });
                        $domObj = $(labelHTML);
                        this.trackLabelObj( key, $domObj);
                        
                        // queue up a label refresh from DB
                        this.loadLabelByKey(key); 
                        
                    } // end if desired langKey exists
                    
                } else { 
                
                    // add a label entry for [key][curLangKey]
                    this.addLabel({
                            langKey:this.currLangKey,
                            key:key,
                            text: '?'
                        });
                        
                    // create a $('<span>[langKey][Key]</span>') placeholder 
                    var labelHTML = this._getLabelHTML({
                        key:key,
                        langKey:this.currLangKey,
                        text:'['+this.currLangKey+']'+key+'[?]'
                        });
                    $domObj = $(labelHTML);
                    this.trackLabelObj( key, $domObj);
                    
                    // queue up a label refresh from the DB
                    this.loadLabelByKey(key); 

                } // end if this.labels[key] exists

                return $domObj;
        },
        
        
        
        //-----------------------------------------------
        hasLabel: function(key) {
            
            var langKey = AD.Lang.Labels.currLangKey;
            
            var isFound = false;
            
            if (typeof AD.Lang.Labels.labels[key] != 'undefined') {
                
                if (typeof AD.Lang.Labels.labels[key].text[langKey] != 'undefined') {
            
                    isFound = true;
                
                }
            }

            
            return isFound;
            
        },
          
        
        
        //-----------------------------------------------
        initLabels: function() {
            // scan the current DOM page for any existing 
            // labels and pull them into our managed objects
            
            var self = this;
            
            $('.appLabel').each(function () {
            
            
                var $this = $(this);
                
                var key = $this.attr('key');
                var langKey = $this.attr('langKey');
                var text = '';
                
                if (typeof $this.val != 'undefined') {
                
                    text = $this.val();
                    
                }
                
                if (text == '') {
                    text = $this.html();
                }
                
                var labelObj = {
                      langKey:langKey,
                      key: key,
                      text: text,
                      obj:$this
                      
                 }
                 
                 self.addLabel( labelObj );
                

            });
            
            
            // Now process any initial interface load label requests:
            var queue = AD.Lang.Labels.initialInterfaceLoadQueue;
            var labelLoad = null;
            if (typeof queue != 'undefined') {
                for(var indx=0; indx<queue.length; indx++) {
                    labelLoad = AD.Lang.Labels.loadLabel(queue[indx]);
                }
            }
            
            return labelLoad;
        },
            
            
            
        //-----------------------------------------------
        _loadLabel:  function (obj) {
            // queue up a series of paths to request from 
            // the server
            // 
            // There is potentially a number of calls that 
            // will be requested, so we attempt to delay 
            // ~50ms to gather a number of them to perform
            // all at one time.
            

            if (this.dfd == null) {
                this.dfd = $.Deferred();
                
                $.when(this.dfd).done(function() {
                    this.dfd = null;
                });
                
            }
            var curDFD = this.dfd;

            
            // add path to listPaths
            this.queueLabelLoadRequests.push(obj);
            
            // if timer not set
            if (this.updateTimeOut == null) {
                
                // set timer to call doLabelLoad in 60ms
                var that = this;
                
                this.updateTimeOut = setTimeout( function () { that.doLoad(curDFD) }, 60);
                
            } // end if
            
            return this.dfd;
    
        },
            
            
            
        //-----------------------------------------------
        loadLabel:  function (path) {
            // queue up a series of paths to request from 
            // the server
            
            
            var lookupObj = {
                    type:'path',
                    val:path
                }
                
            return this._loadLabel(lookupObj);
    
        },
            
            
            
        //-----------------------------------------------
        loadLabelByKey:  function (key) {
            // queue up a series of keys to request from 
            // the server
            

            var lookupObj = {
                    type:'key',
                    val:key
                }
            
            return this._loadLabel(lookupObj);
    
        },
            
            
            
        //-----------------------------------------------
        onLanguageSwitch: function( topic, data) {
            // handle changing all the labels to the new 
            // language.
            //
            // This routine is called whenever a 
            // 'site.multilingual.lang.set' message is published.
            
            var langKey = data.language_code;
            this.setCurrLangKey(langKey);
            
            
            // Alert the server to a language change:
            AD.ServiceJSON.post({
                url:  '/site/lang/switch',
                params: {lang:langKey},
                success: null,
                failure: function(data) {
                	console.error('AD.Lang.Labels.onLanguageSwitch : ');
                	console.error('problem communicating with server');
                	console.error(data);
                }

            });
            

            // for each key in our path:
            for (var key in this.labels) {
            
            
                // for each stored object
                for (var oIndx = 0; oIndx < this.labels[key].objects.length; oIndx++) {
                
                    var obj = this.labels[key].objects[oIndx];
                    
                    // if desired language_code exists
                    if (typeof this.labels[key].text[langKey] != 'undefined') {
                    
                        // update object's value/html() with new lang_text
                        obj.html(this.labels[key].text[langKey]);
                        
                    } else {
                        var currText = obj.html();
                        
                        // update object's value with [language_code]+currtext
                        obj.html( '['+langKey+']'+currText);
                        
                        // queue a loadLabel with this path/key
                        this.loadLabelByKey(key);
                        
                    } // end if
                    
                    obj.attr('langkey', langKey);
                    
                } // next object
                
            } // next Key
                

        
        },
            
            
            
        //-----------------------------------------------
        setCurrLangKey: function (key) {
            // set the current language code to the given key
        
                this.currLangKey = key;
            },
            
            
            
        //-----------------------------------------------
        setDefaultPath: function (path) {
            // set the current language code to the given key
        
                this.defaultPath = path;
            },
            
            
            
        //-----------------------------------------------
        trackLabelObj: function( key, obj ) {
        
            this.labels[key].objects.push(obj);
        },
        
        
        
        //-----------------------------------------------
        updateLabel: function (labelInfo, onSuccess, onError) {
            // update the given label.  This should update
            // our local copy as well as the server DB
            
                    
            var key = labelInfo.key;
            var label = labelInfo.label;
            var langKey = this.currLangKey;
//// TODO: see if langKey can be sent via labelInfo!

            if (typeof this.labels[key] != 'undefined') {
            
                var oldLabel = this.labels[key].text[langKey];
                if (oldLabel != label) {
                
                    var me = this;
                    var dbCond = 'label_key="'+key+'" AND language_code="'+langKey+'"';
                    site.Labels.update(
                         -1, // <-- ignore's id value
                         { label_label:label, dbCond:dbCond }, 
                         function ( data ) { 
                              
                                // store this new value in our this.labels
                                me.labels[key].text[langKey] = label;
                                
                                // update any on screen objects with this
                                // new value
                                for(var oIndx = 0; oIndx < me.labels[key].objects.length; oIndx++) {
                                    var obj = me.labels[key].objects[oIndx];
                    
                    
                                    // update object's value/html() with new lang_text
                                    obj.html(me.labels[key].text[langKey]);
                                
                                }
                                
                                // call the onSuccess() handler 
                                onSuccess(data);

                          
                        }, 
                        function (data) { onError(data) } 
                    );
                    
                }
            
            }
            
            
        
        }
    
    
    },{
        Xlation: {
            NONE:'none',
            MISSING:'missing',
            ALL:'all'
        }
    } );


AD.Lang.Labels = new AD.Lang.Multilingual();
OpenAjax.hub.subscribe(AD.Lang.Key.LANGUAGE_SWITCH, function(topic, data) { AD.Lang.Labels.onLanguageSwitch(topic, data); });



AD.Lang.List = null;
var listCallbackQueue = [];
var listLookupDFD = $.Deferred();
/*
 * 
 * @function getList
 *
 * Return a list of the languages installed on this server.
 * 
 * This is an Async operation, so you pass it a callback:
 *  @codestart
 *      AD.Lang.getList(function(list) {
 *      	for(var i=0; i < list.length; i++) {
 *      		// do something with the list item
 *      	}
 *      });
 *  @codeend
 *  
 * or wait for the Deferred to be resolved:
 * @codestart
 *      var listReady = AD.Lang.getList();
 *      $.when(listReady).then(function(list) {
 *      	for(var i=0; i < list.length; i++) {
 *      		// do something with the list item
 *      	}
 *      });
 *  @codeend
 *
 *  The processed list of languages will be an array of json objects:
 *  @codestart
 *      [
 *      	{ language_code:'en', language_label:'english'},
 *      	{ language_code:'ko', language_label:'korean'},
 *      	...
 *      ]
 *  @codeend
 *  
 */
AD.Lang.getList = function ( callback ) {
	
	// make sure callback is a fn()
	if ((callback == null) || (callback === undefined)) { callback = function() {} };
	
	
	if (AD.Lang.List != null) {
	
			callback(AD.Lang.List);
			listLookupDFD.resolve(AD.Lang.List);
			
	} else {
		
	
		// AD.Lang.List is null so queue this callback up and make a call to load the language List
		listCallbackQueue.push(callback);
		
		// only make this call one time (listCallbackQueue.length == 1) on 1st time through
		if (listCallbackQueue.length == 1) {
		
			site.Language.findAll({}, function(list) {
				AD.Lang.List = list;
				for (var i=0; i<listCallbackQueue.length; i++) {
					listCallbackQueue[i](AD.Lang.List);
				}
				listCallbackQueue = [];
				listLookupDFD.resolve(AD.Lang.List);
			});
		
		}
	
	}
	
	return listLookupDFD;
	
}


}); // end steal 
    