var page = require('webpage').create();
page.onUrlChanged = function(targetUrl) {
        console.log('New URL: ' + targetUrl);
};

page.open("http://localhost:8088/page/site/unitTests", function () {
    page.includeJs('http://code.jquery.com/jquery-1.8.3.min.js', function(){
        page.evaluate(function() {
            $('#loginForm input[name=userID]').val('admin');
            $('#loginForm input[name=pWord]').val('admin');
            $('#loginForm button').click();
        });
        console.log('finished');

    });

});

window.setTimeout(function () {
    phantom.exit();
}, 3000);
