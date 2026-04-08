jQuery( document ).ready( function( $ ) {
	'use strict';

	$( '#hb-import-file-form' ).on( 'submit', function() {
		$( '#hb-import-lang-submit' ).blur();
		if ( $( '#hb-import-lang-code' ).val() == '' ) {
			alert( hb_text.select_language );
			return false;
		}
		if ( $( '#hb-import-lang-file' ).val() == '' ) {
			alert( hb_text.choose_file );
			return false;
		}
	});

	$( '.hb-export-lang-file' ).on( 'click', function() {
		$( this ).blur();
		$( '#hb-locale-export' ).val( $( this ).data( 'locale' ) );
		$( '#hb-export-lang-form' ).submit();
		return false;
	});

	$( '#hb-untranslated-strings' ).prop( 'checked', false);
	$( '#hb-untranslated-strings' ).change( function() {
		if ( this.checked ) {
			$( '.hb-translated-string' ).slideUp();
			$( '.hb-translated-section' ).slideUp();
		} else {
			$( '.hb-translated-string' ).slideDown();
			$( '.hb-translated-section' ).slideDown();
		}
	} );

	$( '.hb-saved' ).html( hb_text.form_saved );

	$( '.hb-options-save' ).on( 'click', function() {
		$( this ).blur();
		var $save_section = $( this ).parent().parent();
		$save_section.find( '.hb-ajaxing' ).css( 'display', 'inline' );
		$( '#hb-action' ).val( 'hb_update_strings' );
		$( '#hb-nonce' ).val( $( '#hb_nonce_update_db' ).val() );
		$.ajax({
			data: $( '#hb-admin-form' ).serialize(),
			url: ajaxurl,
			type: 'POST',
			timeout: hb_ajax_settings.timeout,
			success: function( ajax_return ) {
				$save_section.find( '.hb-ajaxing' ).css( 'display', 'none' );
				if ( ajax_return.trim() != 'form saved' ) {
					alert( ajax_return );
				} else {
					form_saved = true;
					$save_section.find( '.hb-saved' ).show();
					setTimeout( function() {
						$save_section.find( '.hb-saved ' ).fadeOut();
					}, 4000 );
				}
			},
			error: function( jqXHR, textStatus, errorThrown ) {
				$save_section.find( '.hb-ajaxing' ).css( 'display', 'none' );
				alert( 'Connection error: ' + errorThrown );
			}
		});
		return false;
	});

	var form_saved = true;

	$( '#hb-admin-form input').on( 'change', function() {
		form_saved = true;
	});

	window.onbeforeunload = function() {
		if ( ! form_saved ) {
			return hb_text.unsaved_warning;
		}
	}

} );