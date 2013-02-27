// Source code is from this demo:
// http://jqueryui.com/demos/autocomplete/#combobox
// Modified to use Bootstrap styling instead of jqueryui styling

				(function( $ ) {
					$.widget( "ui.combobox", {
						_create: function() {
							var input,
								self = this,
								select = this.element.hide(),
								selected = select.children( ":selected" ),
								value = selected.val() ? selected.text() : "",
								wrapper = this.wrapper = $( "<span>" )
									.addClass( "input-append" )
									.insertAfter( select );
							

						    // initialzie our autocomplete to default values
						    var autoDefaults = {
						            autoFocus:false,
						            delay:0,
						            minLength:0
						    };
						    var autoOptions = $.extend(autoDefaults, this.options.autocomplete);
							
						    
							// prepare placeholder value if one is provided
							var placeholderText = '';
							if (('undefined' != typeof this.options.placeholder) 
							        && (this.options.placeholder != null)) {
							    placeholderText = ' placeholder="'+this.options.placeholder+'" ';
							}
							
							// create the input box
							var inputText = "<input adcombo='ci' type='text' "+placeholderText+">";
							input = $( inputText )
								.appendTo( wrapper )
								.val( value )
								.autocomplete({
								    autoFocus: autoOptions.autoFocus,
									delay:     autoOptions.delay,
									minLength: autoOptions.minLength,
									source: function( request, response ) {
										var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
										response( select.children( "option" ).map(function() {
											var text = $( this ).text();
											if ( this.value && ( !request.term || matcher.test(text) ) )
												return {
													label: text.replace(
														new RegExp(
															"(?![^&;]+;)(?!<[^<>]*)(" +
															$.ui.autocomplete.escapeRegex(request.term) +
															")(?![^<>]*>)(?![^&;]+;)", "gi"
														), "<strong>$1</strong>" ),
													value: text,
													option: this
												};
										}) );
									},
									select: function( event, ui ) {
										ui.item.option.selected = true;
										self._trigger( "selected", event, {
											item: ui.item.option
										});
									},
									change: function( event, ui ) {
										if ( !ui.item ) {
											var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
												valid = false;
											select.children( "option" ).each(function() {
												if ( $( this ).text().match( matcher ) ) {
													this.selected = valid = true;
													return false;
												}
											});
											if ( !valid ) {
												// remove invalid value, as it didn't match anything
												$( this ).val( "" );
												select.val( "" );
												input.data( "autocomplete" ).term = "";
												return false;
											}
										}
									}
								});

							input.data( "autocomplete" )._renderItem = function( ul, item ) {
								return $( "<li></li>" )
									.data( "item.autocomplete", item )
									.append( "<a>" + item.label + "</a>" )
									.appendTo( ul );
							};
							
							this._input = input;

							$( "<a adcombo='cb' ><span class='caret'></span></a>" )
								.attr( "tabIndex", -1 )
								.attr( "title", "Show All Items" )
								.appendTo( wrapper )
								.addClass( "btn" )
								.click(function() {
									// close if already visible
									if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
										input.autocomplete( "close" );
										return false;
									}

									// work around a bug (likely same cause as #5265)
									$( this ).blur();

									// pass empty string as value to search for, displaying all results
									input.autocomplete( "search", "" );
									input.focus();
									return false;
								});
						},

						destroy: function() {
							this.wrapper.remove();
							this.element.show();
							$.Widget.prototype.destroy.call( this );
						}
					});
				})( jQuery );
