steal.then(function() {
	
	DocumentJS.Type("directory",
	
	{
		codeMatch: /([\w\.\$]+?).extend\(\s*["']([^"']*)["']/,

		code: function( code ) {
			var parts = code.match(this.codeMatch);
			if ( parts ) {
				return {
					name: parts[2],
					inherits: parts[1].replace(/^\$./, "jQuery."),
					type: "class"
				}
			}
		},
	
		useName: true,
		hasChildren: true
	})
})