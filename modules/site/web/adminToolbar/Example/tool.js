/**
 * This is a sample Admin Toolbar module. It adds a new button to the toolbar.
 */


// You may want to enable or disable the tool depending on the viewer's
// permissions.
exports.hasPermissions = function(req)
{
    return true;
}


// Add any required CSS files here.
exports.listCSS = [];

// Add any required client side Javascript files here.
exports.listJavascripts = [];


// Example static definition:
exports.toolDefinition = {
    name: 'Example Tool',
    image: '/adminToolbar/Example/images/blockquote.png',
    quickMenuHTML: '<a href="#" class="work-area-trigger">Open Work Area</a>',
    workAreaHTML: '<p>Example Tool Work Area</p>'
}



// Example dynamic definition:
/*

exports.toolDefinition = function(req, callback)
{
    var definition = {
        name: 'Example Tool',
        image: '/adminToolbar/Test/images/blah.png'
    };
    
    if (req.aRAD.viewer.hasRole('blah')) {
        // Render the HTML using a template
        ejs.renderFile(
            __dirname+'/test.ejs',
            { locals: {
                username: req.aRAD.viewer.viewer_userID,
                pageURL: req.url
            } },
            function(err, html) {
                definition.quickMenuHTML = html;
                // Return the results through a callback
                callback(definition);
            }
        );
    } else {
        definition.quickMenuHTML = '<p>hello world</p>';
        callback(definition);
    }
}

*/


// Create routes for your tool here if needed.
/*

exports.createRoutes = function(app)
{

    app.get('/blah/foo', function(req, res) {
        res.send('This is a route created by the Example Tool from the admin toolbar.');
    });

}

*/