jQuery( document ).ready( function( $ ) {
	'use strict';

	if ( $( '#hb-later-payment-thank-you-page-redirect' ).length ) {
		$( '#hb-later-payment-thank-you-page-redirect' ).submit();
	}

	if ( typeof hb_payment_confirmation_error !== 'undefined' ) {
		alert( hb_payment_confirmation_error );
	}

	$( 'input[name="hb-payment-gateway"]' ).each( function() {
		var payment_gateway = $( this ).val();
		if ( typeof window['hb_' + payment_gateway + '_update_payment_form'] == 'function' ) {
			window['hb_' + payment_gateway + '_update_payment_form']( $( this ).parents( '.hb-payment-link-form' ) );
		}
	});

	$( '.hb-payment-link-form' ).on( 'submit', function() {
		var $form = $( this );
		if ( $form.hasClass( 'submitted' ) ) {
			return false;
		}
		$form.find( '.hb-confirm-error' ).slideUp();
		var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val();
		var payment_process_function = 'hb_' + gateway_id + '_payment_process';
		if ( typeof window[ payment_process_function ] == 'function' ) {
			disable_form_submission( $form );
			var payment_processing = window[ payment_process_function ]( $form, after_payment_processing );
			if ( ! payment_processing ) {
				enable_form_submission( $form );
				return false;
			}
		} else {
			alert( 'Error: payment gateway does not have a process payment function.' );
			return false;
		}
		return false;
	});

	function after_payment_processing( $form ) {
		$.ajax({
			type : 'POST',
			timeout: hb_payment_link_form_data.ajax_timeout,
			url: hb_payment_link_form_data.ajax_url,
			// action => hb_process_later_payment
			data: $form.serialize(),
			success: function( response_text ) {
				try {
					var response = JSON.parse( response_text );
				} catch ( e ) {
					enable_form_submission( $form );
					$form.find( '.hb-processing-later-payment' ).slideUp();
					$form.find( '.hb-confirm-error' ).html( response_text ).slideDown();
					return false;
				}
				if ( response['success'] ) {
					if ( response['payment_requires_action'] == 'yes' ) {
						var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val();
						var payment_requires_action = 'hb_' + gateway_id + '_payment_requires_action';
						window[ payment_requires_action ]( $form, response );
						return false;
					}
					if ( payment_has_redirection == 'yes' ) {
						var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val();
						var payment_process_redirection = 'hb_' + gateway_id + '_payment_redirection';
						window[ payment_process_redirection ]( $form, response );
					} else {
						var $thank_you_page_form = $form.find( '.hb-thank-you-page-form' );
						if ( $thank_you_page_form.length ) {
							$thank_you_page_form.submit();
							return;
						}
						$form.find( '.hb-processing-later-payment' ).slideUp();
					}
				} else {
					enable_form_submission( $form );
					$form.find( '.hb-processing-later-payment' ).slideUp();
					$form.find( '.hb-confirm-error' ).html( response['error_msg'] ).slideDown();
				}
			},
			error: function( jqXHR, textStatus, errorThrown ) {
				console.log( jqXHR );
				console.log( jqXHR.responseText );
				console.log( textStatus );
				console.log( errorThrown );
			}
		});
	}

	function disable_form_submission( $form ) {
		$form.find( 'input[type="submit"]' ).prop( 'disabled', true );
		$form.addClass('submitted');
	}

	function enable_form_submission( $form ) {
		$form.find( 'input[type="submit"]' ).prop( 'disabled', false );
		$form.removeClass('submitted');
	}

	if ( $( '.hb-later-payment-thank-you-msg' ).length ) {
		var thanks_msg = $( '.hb-later-payment-thank-you-msg' ).html();
		if ( thanks_msg && $( '.hb-later-payment-thank-you-summary-top-js-msg' ).length ) {
			$( '.hb-later-payment-thank-you-summary-top-js-msg' ).html( thanks_msg ).show();
			$( '.hb-later-payment-thank-you-msg' ).hide();
		}
	}

	if ( $( '.hb-resa-summary-payments-history-table-wrapper' ).length ) {
		var payment_history_table = $( '.hb-later-payment-history-table' ).html();
		if ( payment_history_table ) {
			$( '.hb-resa-summary-payments-history-table-wrapper' ).html( payment_history_table );
		}
	}
});