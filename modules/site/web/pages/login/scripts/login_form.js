/**
 *  This Controller setups the operation of our login form.
 */



// Keep all variables and functions inside an encapsulated scope
(function() {

    //// Create a controller for the LoginForm:
    $.Controller('LoginForm', {


        init: function (el, data) {
            
            var inputUserID = this.element.find("input[name='userID']");
            
            inputUserID.focus();
            
            this.submitBtn = this.element.find("button.submit");
                            
        }, 


        "button.submit mouseenter": function (el, event) {
        
            $(el).addClass('ui-state-hover');
        },
        
        "button.submit mouseleave": function (el, event) {

            $(el).removeClass('ui-state-hover');
        },
        
        
        "input[name='pWord'] keypress": function (el, event) {
        
            if (event.keyCode == 13 
                || event.keyCode == 10 
                || event.keyCode == 3) {
                this.submitBtn.click();
            }
            return true;
        
        },
        
        "button.submit click": function() {


            // Show busy animation
            $('.busy').show();
            
            
            // Hide any previous messages
            $('#error-message').empty().hide();
            
            
            // Gather form data
            var formData = {};
            this.element.find('form input').each(function() {
                var key = this.name;
                if (key == 'pWord') {
                    var value = AD.Util.MD5(this.value);  // encrypt the pword before sending.
                } else {
                    var value = this.value;
                }
                formData[key] = value;
            });
            
            
            // Submit data
            $.ajax({
                type: 'POST',
                dataType: 'json',
                data: formData,
                url: '/service/site/login/authenticate',
                success: function (data) {
                
                
                    // Hide busy animation
                    $('.busy').hide();
                    
                    
                    // Handle response
                    if (data.success) {
                        // Success! Redirect to new page.
                        //              alert('success!!');
                        var newURL = data.data['url'];
                        if (newURL) {
                            window.location = newURL;
                        } else {
                            window.location = '/page/site/welcome'; // change this to Site.Default:: AD.Settings['defaultURL'];
                        }
                        
                    
                    } else {
                    
                        // Error! Display message.
                        var message;
                        message = data.errorMSG;
                        $('#error-message')
                            .text(message)
                            .fadeIn();
                    }
                    
                },
                cache: false,
                error: function() {
                
                    // Hide busy animation
                    $('.busy').hide();


                    // Unexpected error
                    $('#error-message')
                        .text('Sorry, there was a technical problem. Please try again.')
                        .fadeIn();
                }
            });
            
        } // button submit click()
        

    });

}) ();