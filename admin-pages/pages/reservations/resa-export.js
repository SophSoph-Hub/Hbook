jQuery( document ).ready( function( $ ) {
	'use strict';

	$( '#hb-export-resa-cancel' ).on( 'click', function() {
		$( '#hb-export-resa' ).slideUp( function() {
			$( '#hb-export-resa-toggle .dashicons-arrow-down' ).css( 'display', 'inline-block' );
			$( '#hb-export-resa-toggle .dashicons-arrow-up' ).hide();
		});
		return false;
	});

	$( '#hb-export-resa-select-all-accom' ).on( 'click', function() {
		$( this ).blur();
		$( 'input[name="hb-export-resa-accom[]"]' ).prop( 'checked', true );
		return false;
	});

	$( '#hb-export-resa-unselect-all-accom' ).on( 'click', function() {
		$( this ).blur();
		$( 'input[name="hb-export-resa-accom[]"]' ).prop( 'checked', false );
		return false;
	});

	$( '#hb-export-resa-select-all-status' ).on( 'click', function() {
		$( this ).blur();
		$( 'input[name="hb-export-resa-status[]"]' ).prop( 'checked', true );
		return false;
	});

	$( '#hb-export-resa-unselect-all-status' ).on( 'click', function() {
		$( this ).blur();
		$( 'input[name="hb-export-resa-status[]"]' ).prop( 'checked', false );
		return false;
	});

	$( '#hb-export-resa-select-all-data' ).on( 'click', function() {
		$( this ).blur();
		$( 'input[name="hb-resa-data-export[]"]' ).prop( 'checked', true );
		return false;
	});

	$( '#hb-export-resa-unselect-all-data' ).on( 'click', function() {
		$( this ).blur();
		$( 'input[name="hb-resa-data-export[]"]' ).prop( 'checked', false );
		return false;
	});

	$( '#hb-export-resa-selection-received-date-from-formatted, #hb-export-resa-selection-received-date-to-formatted' ).on( 'focus', function() {
		$( '#hb-export-resa-selection-received-date' ).prop( 'checked', true );
	});

	$( '#hb-export-resa-selection-check-in-date-from-formatted, #hb-export-resa-selection-check-in-date-to-formatted' ).on( 'focus', function() {
		$( '#hb-export-resa-selection-check-in-date' ).prop( 'checked', true );
	});

	$( '#hb-export-resa-selection-check-out-date-from-formatted, #hb-export-resa-selection-check-out-date-to-formatted' ).on( 'focus', function() {
		$( '#hb-export-resa-selection-check-out-date' ).prop( 'checked', true );
	});

	$( '.hb-export-resa-date' ).on( 'change', function() {
		var hidden_input_name = $( this ).attr( 'id' ).replace( '-formatted', '' );
		var db_formatted_date = hb_db_formatted_date( $( this ).val() );
		$( 'input[name="' + hidden_input_name + '"]' ).val( db_formatted_date );
	});

	$( '#hb-export-resa-download' ).on( 'click', function() {
		$( this ).blur();
		if ( ! $( 'input[name="hb-resa-data-export[]"]:checked').length ) {
			alert( hb_text.no_export_data_selected );
			return false;
		}
		if (
			$( 'input[name="hb-export-resa-accom[]"]' ).length &&
			! $( 'input[name="hb-export-resa-accom[]"]:checked').length
		) {
			alert( hb_text.no_export_accom_selected );
			return false;
		}
		if ( ! $( 'input[name="hb-export-resa-status[]"]:checked').length ) {
			alert( hb_text.no_export_status_selected );
			return false;
		}
		$( '#hb-export-resa-form' ).submit();
		return false;
	});

});