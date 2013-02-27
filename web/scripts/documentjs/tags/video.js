steal.then(function() {
	/**
	 * @hide
	 * @class DocumentJS.tags.video
	 * @tag documentation
	 * @parent DocumentJS.tags 
	 * 
	 * Adds a video.
	 * 
	 * ###Example:
	 * 
	 * @codestart
	 * /* 
	 *  * @video http://www.youtube-nocookie.com/embed/jo_B4LTHi3I?rel=0&start=23 640 480
	 *  *|
	 * @codeend
	 */
	DocumentJS.tags.video = {
		add: function( line ) {
			var m = line.match(/^\s*@video\s*([^\s]+)\s*([\w]*)\s*([\w]*)\s*(.*)/)

			if ( m ) {
				var src = m[1] ? m[1] : '';
				this.comment += "<iframe frameborder=0 allowfullscreen ";
				this.comment += "src='" + src + "' ";
				m[2] ? this.comment += "width='" + m[2] + "' " : true;
				m[3] ? this.comment += "height='" + m[3] + "' " : true;
				this.comment += "></iframe>";
			}
		}
	};
})