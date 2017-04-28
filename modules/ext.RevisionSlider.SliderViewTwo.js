( function ( mw, $ ) {
	/**
	 * Module handling the view logic of the RevisionSlider slider with two slides
	 *
	 * @param {Slider} slider
	 * @constructor
	 */
	var SliderViewTwo = function ( slider ) {
		this.slider = slider;
		this.diffPage = new mw.libs.revisionSlider.DiffPage( this.slider.getRevisions() );
	};

	OO.inheritClass( SliderViewTwo, mw.libs.revisionSlider.SliderView );

	$.extend( SliderViewTwo.prototype, {
		/**
		 * Renders the pointer container and adds the pointers to it
		 *
		 * @param {number} containerWidth
		 * @return {jQuery} the pointer container
		 */
		renderPointerContainer: function ( containerWidth ) {
			var pointerContainerPosition = 53,
				pointerContainerWidth = containerWidth + this.revisionWidth - 1,
				pointerContainerStyle, lastMouseMoveRevisionPos,
				self = this;

			pointerContainerStyle = { left: pointerContainerPosition + 'px', width: pointerContainerWidth + 'px' };
			if ( this.dir === 'rtl' ) {
				// Due to properly limit dragging a pointer on the right side of the screen,
				// there must some extra space added to the right of the revision bar container
				// For this reason right position of the pointer container in the RTL mode is
				// a bit moved off right compared to its left position in the LTR mode
				pointerContainerPosition = pointerContainerPosition - this.revisionWidth + 1;
				pointerContainerStyle = { right: pointerContainerPosition + 'px', width: pointerContainerWidth + 'px' };
			}

			return $( '<div>' )
				.addClass( 'mw-revslider-pointer-container' )
				.css( pointerContainerStyle )
				.append( this.renderPointerContainers() )
				.mousemove( function ( event ) {
					if ( !self.isDragged ) {
						lastMouseMoveRevisionPos = self.showTooltipsOnMouseMoveHandler(
							event,
							lastMouseMoveRevisionPos
						);
					}
				} );
		},

		renderPointerContainers: function () {
			var self = this;

			return [
				$( '<div>' )
					.addClass( 'mw-revslider-pointer-container-newer' )
					.click( function ( event ) {
						self.sliderLineClickHandler( event, $( this ) );
					} )
					.append(
						$( '<div>' ).addClass( 'mw-revslider-slider-line' ),
						this.pointerNewer.getView().render()
					),
				$( '<div>' )
					.addClass( 'mw-revslider-pointer-container-older' )
					.click( function ( event ) {
						self.sliderLineClickHandler( event, $( this ) );
					} )
					.append(
						$( '<div>' ).addClass( 'mw-revslider-slider-line' ),
						this.pointerOlder.getView().render()
					)
			];
		},

		/**
		 * Initializes the pointer dragging logic
		 *
		 * @param {jQuery} $revisions
		 */
		initPointers: function ( $revisions ) {
			var $pointers,
				$pointerOlder = this.pointerOlder.getView().getElement(),
				$pointerNewer = this.pointerNewer.getView().getElement(),
				escapePressed = false;

			$pointers = this.$element.find( '.mw-revslider-pointer' );

			$( 'body' ).keydown( function ( e ) {
				if ( e.which === 27 ) {
					escapePressed = true;
					$pointers.trigger( 'mouseup' );
				}
			} );

			$pointerOlder.draggable( this.buildDraggableOptions(
				escapePressed, $revisions,
				'.mw-revslider-pointer-container-older'
			) );
			$pointerNewer.draggable( this.buildDraggableOptions(
				escapePressed, $revisions,
				'.mw-revslider-pointer-container-newer'
			) );

			$pointerNewer.on(
				'touchstart touchmove touchend touchcancel touchleave',
				mw.libs.revisionSlider.touchEventConverter
			);
			$pointerOlder.on(
				'touchstart touchmove touchend touchcancel touchleave',
				mw.libs.revisionSlider.touchEventConverter
			);

			SliderViewTwo.super.prototype.resetPointerStylesBasedOnPosition.call( this );
		},

		draggableDragAction: function ( event, ui, pointer, lastValidLeftPos ) {
			var pos, $revisions, $hoveredRevisionWrapper;

			pos = this.getRevisionPositionFromLeftOffset(
				$( pointer ).offset().left + this.revisionWidth / 2
			);

			if ( pos === lastValidLeftPos ) {
				return pos;
			}

			$revisions = this.getRevisionsElement();
			$hoveredRevisionWrapper = this.getRevElementAtPosition( $revisions, pos ).parent();
			this.slider.getRevisions().getView().showTooltip( $hoveredRevisionWrapper );

			return pos;
		},

		setPointerDragCursor: function () {
			$( '.mw-revslider-pointer, ' +
				'.mw-revslider-pointer-container, ' +
				'.mw-revslider-pointer-container-newer, ' +
				'.mw-revslider-pointer-container-older, ' +
				'.mw-revslider-pointer-line, ' +
				'.mw-revslider-revision-wrapper' )
				.addClass( 'mw-revslider-pointer-grabbing' );
		},

		removePointerDragCursor: function () {
			$( '.mw-revslider-pointer, ' +
				'.mw-revslider-pointer-container, ' +
				'.mw-revslider-pointer-container-newer, ' +
				'.mw-revslider-pointer-container-older, ' +
				'.mw-revslider-pointer-line, ' +
				'.mw-revslider-revision-wrapper' )
				.removeClass( 'mw-revslider-pointer-grabbing' );
		},

		showTooltipsOnMouseMoveHandler: function ( event, lastValidPosition ) {
			var pos = this.getRevisionPositionFromLeftOffset( event.pageX ),
				$hoveredRevisionWrapper;

			if ( pos === lastValidPosition ) {
				return pos;
			}

			$hoveredRevisionWrapper = this.getRevElementAtPosition( this.getRevisionsElement(), pos ).parent();
			this.slider.getRevisions().getView().showTooltip( $hoveredRevisionWrapper );

			return pos;
		},

		sliderLineClickHandler: function ( event, $line ) {
			var pos = this.getRevisionPositionFromLeftOffset( event.pageX ),
				$clickedRev, pointerMoved, pointerOther, $revisions;

			if ( $line.hasClass( 'mw-revslider-pointer-container-newer' ) ) {
				pointerMoved = this.pointerNewer;
				pointerOther = this.pointerOlder;
			} else {
				pointerMoved = this.pointerOlder;
				pointerOther = this.pointerNewer;
			}

			if ( pos === pointerOther.getPosition() ) {
				return;
			}

			$revisions = this.getRevisionsElement();
			$clickedRev = this.getRevElementAtPosition( $revisions, pos );

			pointerMoved.setPosition( pos );
			this.updatePointerPositionAttributes();
			this.refreshRevisions(
				this.getRevElementAtPosition( $revisions, pointerOther.getPosition() ).attr( 'data-revid' ),
				$clickedRev.attr( 'data-revid' )
			);
			this.resetRevisionStylesBasedOnPointerPosition( $revisions );
			this.alignPointers();
		},

		getRevisionPositionFromLeftOffset: function ( leftOffset ) {
			var $revisions = this.getRevisionsElement(),
				revisionsX = mw.libs.revisionSlider.correctElementOffsets( $revisions.offset() ).left,
				pos = Math.ceil( Math.abs( leftOffset - revisionsX ) / this.revisionWidth );

			if ( this.dir === 'rtl' ) {
				// pre-loading the revisions on the right side leads to shifted position numbers
				if ( this.slider.isAtStart() ) {
					pos = this.slider.getRevisionsPerWindow() - pos + 1;
				} else {
					pos += this.slider.getRevisionsPerWindow();
				}
			}

			return pos;
		},

		resetPointerStylesBasedOnPosition: function () {
			this.updateOlderSliderLineCSS();
			this.updateNewerSliderLineCSS();
		},

		resetPointerColorsBasedOnValues: function () {
		},

		updateOlderSliderLineCSS: function () {
			var widthToSet = ( this.getOlderDistanceToOldest() + this.getDistanceBetweenPointers() ) *
					this.revisionWidth,
				marginToSet = -this.revisionWidth / 2;

			widthToSet = Math.min( widthToSet, this.calculateSliderContainerWidth() + this.revisionWidth );

			this.setSliderLineCSS(
				$( '.mw-revslider-pointer-container-older' ), widthToSet, marginToSet
			);
		},

		updateNewerSliderLineCSS: function () {
			var widthToSet = ( this.getNewerDistanceToNewest() + this.getDistanceBetweenPointers() + 2 ) *
					this.revisionWidth,
				marginToSet = ( this.getOlderDistanceToOldest() * this.revisionWidth ) -
					this.revisionWidth / 2;

			widthToSet = Math.min( widthToSet, this.calculateSliderContainerWidth() + this.revisionWidth );
			marginToSet = Math.max( marginToSet, -0.5 * this.revisionWidth );

			this.setSliderLineCSS(
				$( '.mw-revslider-pointer-container-newer' ), widthToSet, marginToSet
			);
		},

		setSliderLineCSS: function ( $lineContainer, widthToSet, marginToSet ) {
			if ( this.dir === 'ltr' ) {
				$lineContainer.css( {
					width: widthToSet,
					'margin-left': marginToSet
				} );
			} else {
				$lineContainer.css( {
					width: widthToSet,
					'margin-right': marginToSet + this.revisionWidth
				} );
			}
		},

		getOlderDistanceToOldest: function () {
			return this.pointerOlder.getPosition() - this.slider.getOldestVisibleRevisionIndex();
		},

		getNewerDistanceToNewest: function () {
			return this.slider.getNewestVisibleRevisionIndex() - this.pointerNewer.getPosition();
		},

		getDistanceBetweenPointers: function () {
			return this.pointerNewer.getPosition() - this.pointerOlder.getPosition();
		},

		getRevisionsElement: function () {
			return this.slider.getRevisions().getView().getElement();
		},

		revisionWrapperClickHandler: function () {
		}
	} );

	mw.libs.revisionSlider = mw.libs.revisionSlider || {};
	mw.libs.revisionSlider.SliderViewTwo = SliderViewTwo;
}( mediaWiki, jQuery ) );