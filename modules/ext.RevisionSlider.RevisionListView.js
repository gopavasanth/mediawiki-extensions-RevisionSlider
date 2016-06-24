( function ( mw, $ ) {
	/**
	 * @param {RevisionList} revisionList
	 * @constructor
	 */
	var RevisionListView = function ( revisionList ) {
		this.revisionList = revisionList;
	};

	$.extend( RevisionListView.prototype, {
		/**
		 * @type {RevisionList}
		 */
		revisionList: null,

		/**
		 * @type {number}
		 */
		tooltipTimeout: -1,

		/**
		 * @type {jQuery}
		 */
		currentTooltip: null,

		/**
		 * @param {number} revisionTickWidth
		 * @return {jQuery}
		 */
		render: function ( revisionTickWidth ) {
			var $html = $( '<div>' ).addClass( 'mw-revisions' ),
				revs = this.revisionList.getRevisions(),
				maxChangeSizeLogged = Math.log( this.revisionList.getBiggestChangeSize() ),
				self = this,
				i, diffSize, tooltip, relativeChangeSize,
				showTooltip = function () {
					self.showTooltip( $( this ) );
					$( this ).tipsy( 'show' );
				},
				hideTooltip = function () {
					self.hideTooltip( $( this ) );
				};

			for ( i = 0; i < revs.length; i++ ) {
				diffSize = revs[ i ].getRelativeSize();
				relativeChangeSize = diffSize !== 0 ? Math.ceil( 65.0 * Math.log( Math.abs( diffSize ) ) / maxChangeSizeLogged ) + 5 : 0;
				tooltip = this.makeTooltip( revs[ i ] );

				$html
					.append( $( '<div>' )
						.addClass( 'mw-revision-wrapper' )
						.attr( 'title', tooltip )
						.width( revisionTickWidth )
						.tipsy( {
							gravity: 's',
							html: true,
							trigger: 'manual',
							className: 'mw-revision-tooltip'
						} )
						.append( $( '<div>' )
							.addClass( 'mw-revision' )
							.attr( 'data-revid', revs[ i ].getId() )
							.attr( 'data-pos', i + 1 )
							.css( {
								height: relativeChangeSize + 'px',
								width: revisionTickWidth + 'px',
								top: diffSize > 0 ? '-' + relativeChangeSize + 'px' : 0
							} )
							.addClass( diffSize > 0 ? 'mw-revision-up' : 'mw-revision-down' )
							.append( $( '<div>' ).addClass( 'mw-revision-border-box' ) )
						)
						.mouseover( showTooltip )
						.mouseout( hideTooltip )
					);
			}

			this.keepTooltipsOnHover();

			return $html;
		},

		/**
		 * Hides the current tooltip immediately
		 */
		hideCurrentTooltip: function () {
			if ( this.tooltipTimeout !== -1 ) {
				window.clearTimeout( this.tooltipTimeout );
				this.currentTooltip.tipsy( 'hide' );
			}
		},

		/**
		 * Hides the tooltip after 500ms
		 *
		 * @param {jQuery} $rev
		 */
		hideTooltip: function ( $rev ) {
			this.tooltipTimeout = window.setTimeout( function () {
				$rev.tipsy( 'hide' );
			}, 500 );
		},

		/**
		 * Hides the previous tooltip and shows the new one
		 *
		 * @param {jQuery} $rev
		 */
		showTooltip: function ( $rev ) {
			this.hideCurrentTooltip();
			$rev.tipsy( 'show' );
			this.currentTooltip = $rev;
		},

		/**
		 * Sets event handlers on tooltips so they do not disappear when hovering over them
		 */
		keepTooltipsOnHover: function () {
			var self = this;

			$( document )
				.on( 'mouseover', '.mw-revision-tooltip', function () {
					window.clearTimeout( self.tooltipTimeout );
				} )
				.on( 'mouseout', '.mw-revision-tooltip', function () {
					self.hideTooltip( self.currentTooltip );
				} );
		},

		/**
		 * Generates the HTML for a tooltip that appears on hover above each revision on the slider
		 *
		 * @param {Revision} rev
		 * @return {string}
		 */
		makeTooltip: function ( rev ) {
			var $tooltip = $( '<div>' )
				.append(
					$( '<p>' ).append( $( '<b>' ).text( rev.getFormattedDate() ) ),
					rev.getUser() ?
						$( '<bdi>' ).append( $( '<p>' ).text(
							mw.msg( 'revisionslider-label-edited-by', mw.html.escape( rev.getUser() ) )
						) )
						: '',
					this.makeCommentLine( rev ),
					$( '<p>' ).text(
						mw.msg( 'revisionslider-label-article-size', mw.msg( 'revisionslider-revision-bytes', rev.getSize() ) )
					),
					$( '<p>' ).text(
						mw.msg( 'revisionslider-label-change-size', mw.msg( 'revisionslider-revision-bytes', rev.getRelativeSize() ) )
					),
					rev.isMinor() ? $( '<p>' ).text( mw.message( 'minoredit' ).text() ) : '' );

			return $tooltip.html();
		},

		/**
		 * Generates the HTML for the comment label
		 *
		 * @param {Revision} rev
		 * @return {string|jQuery}
		 */
		makeCommentLine: function ( rev ) {
			if ( rev.hasEmptyComment() ) {
				return '';
			}

			return $( '<bdi>' ).append(
				$( '<p>' ).append(
					$( '<i>' ).html(
						mw.msg( 'revisionslider-label-comment', rev.getParsedComment() )
					) )
			);
		}
	} );

	mw.libs.revisionSlider = mw.libs.revisionSlider || {};
	mw.libs.revisionSlider.RevisionListView = RevisionListView;
}( mediaWiki, jQuery ) );
