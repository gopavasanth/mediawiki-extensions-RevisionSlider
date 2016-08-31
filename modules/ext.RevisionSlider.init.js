( function ( mw, $ ) {
	var autoExpand = mw.user.options.get( 'userjs-revslider-autoexpand' ) === '1',
		expanded = autoExpand,
		initialized = false,
		autoExpandButton,
		/*jshint -W024 */
		toggleButton = OO.ui.ButtonWidget.static.infuse( $( '.mw-revslider-toggle-button' ) ),
		/*jshint +W024 */
		initialize = function () {
			var startTime = mw.now(),
				api = new mw.libs.revisionSlider.Api( mw.util.wikiScript( 'api' ) );

			mw.track( 'counter.MediaWiki.RevisionSlider.event.init' );
			mw.libs.revisionSlider.userOffset = mw.user.options.values.timecorrection ? mw.user.options.values.timecorrection.split( '|' )[ 1 ] : mw.config.values.extRevisionSliderTimeOffset;

			api.fetchRevisionData( mw.config.get( 'wgPageName' ), {
				startId: mw.config.values.extRevisionSliderNewRev,
				limit: mw.libs.revisionSlider.calculateRevisionsPerWindow( 160, 16 )
			} ).then( function ( data ) {
				var revs,
					revisionList,
					$container,
					slider;

				mw.track( 'timing.MediaWiki.RevisionSlider.timing.initFetchRevisionData', mw.now() - startTime );

				try {
					revs = data.revisions;
					revs.reverse();

					revisionList = new mw.libs.revisionSlider.RevisionList( mw.libs.revisionSlider.makeRevisions( revs ) );

					$container = $( '.mw-revslider-slider-wrapper' );
					slider = new mw.libs.revisionSlider.Slider( revisionList );
					slider.getView().render( $container );

					window.addEventListener( 'resize', function () {
						slider.getView().render( $container );
					} );

					if ( !mw.user.options.get( 'userjs-revslider-hidehelp' ) ) {
						mw.libs.revisionSlider.HelpDialog.show();
						( new mw.Api() ).saveOption( 'userjs-revslider-hidehelp', true );
					}

					$( '.mw-revslider-placeholder' ).remove();
					mw.track( 'timing.MediaWiki.RevisionSlider.timing.init', mw.now() - startTime );
				} catch ( err ) {
					$( '.mw-revslider-placeholder' )
						.text( mw.message( 'revisionslider-loading-failed' ).text() );
					console.log( err );
					mw.track( 'counter.MediaWiki.RevisionSlider.error.init' );
				}

				initialized = true;
			}, function ( err ) {
				$( '.mw-revslider-placeholder' )
					.text( mw.message( 'revisionslider-loading-failed' ).text() );
				console.log( err );
				mw.track( 'counter.MediaWiki.RevisionSlider.error.init' );
			} );
		};

	mw.track( 'counter.MediaWiki.RevisionSlider.event.load' );

	autoExpandButton = new OO.ui.ToggleButtonWidget( {
		icon: 'pin',
		classes: [ 'mw-revslider-auto-expand-button' ],
		title: mw.message( autoExpand ?
			'revisionslider-turn-off-auto-expand-title' :
			'revisionslider-turn-on-auto-expand-title'
		).text(),
		value: autoExpand
	} );

	autoExpandButton.connect( this, {
		click: function () {
			autoExpand = !autoExpand;
			( new mw.Api() ).saveOption( 'userjs-revslider-autoexpand', autoExpand ? '1' : '0' );
			if ( autoExpand ) {
				autoExpandButton.setTitle( mw.message( 'revisionslider-turn-off-auto-expand-title' ).text() );
				mw.track( 'counter.MediaWiki.RevisionSlider.event.autoexpand.on' );
			} else {
				autoExpandButton.setTitle( mw.message( 'revisionslider-turn-on-auto-expand-title' ).text() );
				mw.track( 'counter.MediaWiki.RevisionSlider.event.autoexpand.off' );
			}
		}
	} );

	$( '.mw-revslider-container' ).append( autoExpandButton.$element );

	if ( autoExpand ) {
		initialize();
	}

	toggleButton.connect( this, {
		click: function () {
			expanded = !expanded;
			$( '.mw-revslider-slider-wrapper' ).toggle();
			if ( expanded ) {
				toggleButton.setIcon( 'collapse' ).setTitle( mw.message( 'revisionslider-toggle-title-collapse' ).text() );
				mw.track( 'counter.MediaWiki.RevisionSlider.event.expand' );
			} else {
				toggleButton.setIcon( 'expand' ).setTitle( mw.message( 'revisionslider-toggle-title-expand' ).text() );
				mw.track( 'counter.MediaWiki.RevisionSlider.event.collapse' );
			}
			if ( initialized ) {
				return;
			}
			initialize();
		}
	} );
}( mediaWiki, jQuery ) );
