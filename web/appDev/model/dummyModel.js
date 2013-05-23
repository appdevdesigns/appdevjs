   /**
    *
    * @class AD_Client.DummyModel
    * @parent AD_Client.Model
    *
    * A dummy client side model class that does not make any ajax calls back
    * to the server. Intended for use while unit testing. Compatible with
    * the ListIterator class, just like a normal model.
    *
    * How to use:
    *  to make a new Viewer Model obj:
    *  @codestart
    *        AD.DummyModel.extend("Viewer",
    *        {
    *            _adModule:'test',
    *            _adModel:'viewer',
    *            id:'viewer_id',
    *            labelKey:'viewer_guid',
    *            _isMultilingual:false
    *
    *        },
    *        {});
    *  @codeend
    *
    */
    AppDev.Model.extend("AppDev.DummyModel",
    {
        // Default data properties that can be overridden if you
        // extend with your own class.
        id: 'id',
        labelKey: 'value',
        
        // This is the dummy data that can be set to simulate what the
        // server would have returned in a findAll operation.
        // Feel free to manipulate this directly, or use the setData()
        // static function to do so.
        fakeData: [
        /*
            { id: 1, value: "Alice" },
            { id: 2, value: "Bob" },
            ...
        */
        ],
    
        ////
        //// Class Methods
        ////
        
        setData: function(data) {
            this.fakeData = data;
        },
        
        // params have no effect at this time, and the full data set will
        // always be returned.
        findAll: function(params, onSuccess, onError) {
            var dfd = $.Deferred();
            dfd.then(onSuccess).fail(onError);
            
            var data = [];
            for (var i=0; i<this.fakeData.length; i++) {
                data.push( new this(this.fakeData[i]) );
            }
            
            dfd.resolve(data);
            return dfd;
        },
        
        
        // params can be used
        findOne : function(params, onSuccess, onError) {
            var dfd = $.Deferred();
            dfd.then(onSuccess).fail(onError);
            
            // Build an array of condition functions from the `params`
            var conds = [];
            var attrs = this.attrs();
            for (var key in attrs) {
                if (params.key) {
                    conds.push(function(item) {
                        if (item[key] == params[key]) {
                            return true;
                        }
                        return false;
                    });
                }
            }
            
            var data = {};
            // Step through every data item
            for (var i=0; i<this.fakeData.length; i++) {
                var isMatch = true;
                // Check if any `params` condition doesn't match the data item
                for (var j=0; j<conds.length; j++) {
                    if (!conds[j](this.fakeData[i])) {
                        isMatch = false;
                    }
                }
                if (isMatch == true) {
                    // All conditions match this data item
                    data = this.fakeData[i];
                    break;
                }
            }
            
            dfd.resolve(new this(data));
            return dfd;
        },



        create: function(attr, onSuccess, onError) {
            var dfd = $.Deferred();
            dfd.then(onSuccess).fail(onError);
            
            if (typeof attr[this.id] != 'undefined') {
                dfd.reject(new Error('Cannot set primary key value'));
            }
            else {
                this.fakeData.push(attr);
                dfd.resolve([ new this(attr) ]);
            }
            
            return dfd;
        },



        update: function(id, attr, onSuccess, onError) {
            var dfd = $.Deferred();
            dfd.then(onSuccess).fail(onError);

            for (var i=0; i<this.fakeData.length; i++) {
                if (this.fakeData[i][this.id] == id) {
                    // Update the dummy data
                    for (var key in attr) {
                        this.fakeData[i][key] = attr[key];
                    }
                    break;
                }
            }
            
            if (i < this.fakeData.length) {
                dfd.resolve([ new this(this.fakeData[i]) ]);
            }
            else {
                dfd.reject(new Error("entry not found: " + id));
            }
            
            return dfd;
        },



        destroy: function (id, onSuccess, onError ) {
            var dfd = $.Deferred();
            dfd.then(onSuccess).fail(onError);

            for (var i=0; i<this.fakeData.length; i++) {
                if (this.fakeData[i][this.id] == id) {
                    // Remove the matching dummy data
                    this.fakeData.splice(i, 1);
                    break;
                }
            }
            
            if (i < this.fakeData.length) {
                dfd.resolve();
            }
            else {
                dfd.reject(new Error("entry not found: " + id));
            }
            
            return dfd;
        },

    },
    {

        ////
        //// Instance Methods:
        //// each instance of this object will have these methods defined.
        ////
        //// inside these fn() the this refers to the instanced object.

    });
