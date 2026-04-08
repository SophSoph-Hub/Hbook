'use strict';

var hb_stripe_class = Stripe( hb_stripe_key, { 'locale': hb_stripe_locale } );
var hb_stripe_elements = [];
var hb_stripe_payment_elements = [];
var hb_stripe_confirm_type = 'confirmSetup';

jQuery( document ).ready( function( $ ) {
	var show_country_field_alert = false;
	$( '.hb-booking-details-form' ).each( function() {
		if (
			! $( this ).find( '.hb-country-iso-select' ).length ||
			( $( this ).find( '.hb-country-iso-select' ).data( 'validation' ) != 'required' )
		) {
			show_country_field_alert = true;
		}
	});
	if ( show_country_field_alert ) {
		alert( hb_stripe_requires_country_field_msg );
	}

	$( '.hb-booking-details-form, .hb-payment-link-form' ).each( function() {
		if ( ! $( this ).find( 'input[name="hb-current-url"]' ).length ) {
			$( this ).append( $( '<input type="hidden" name="hb-current-url" />' ) );
		}
	});

	$( 'input[name="hb-payment-type"], input[name="hb-payment-gateway"]' ).change( function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		if ( $booking_wrapper.find( 'input[name="hb-payment-gateway"]:checked' ).val() != 'stripe' ) {
			return;
		}
		if ( hb_stripe_payment_elements[ $booking_wrapper.attr( 'id' ) ] ) {
			try {
				hb_stripe_payment_elements[ $booking_wrapper.attr( 'id' ) ].destroy();
			} catch ( e ) {
			}
		}
		hb_stripe_update_payment_form( $booking_wrapper );
	});
});

function hb_stripe_update_payment_form( $booking_wrapper ) {
	$booking_wrapper.find( '.hb-stripe-loading-form' ).show();
	var stripe_payment_types = ['store_credit_card', 'deposit', 'full'];
	var payment_type = $booking_wrapper.find( 'input[name="hb-payment-type"]:checked' ).val();
	if ( stripe_payment_types.indexOf( payment_type ) >= 0 ) {
		$booking_wrapper.find( 'input[name="hb-current-url"]' ).val( document.URL );
		var $payment_data = $booking_wrapper.find( '.hb-payment-data-summary' );
		var mode = 'setup';
		var amount = 0;
		var setup_future_usage = '';
		if ( payment_type == 'deposit' ) {
			mode = 'payment';
			hb_stripe_confirm_type = 'confirmPayment';
			amount = $payment_data.data( 'charged-deposit-raw' );
		} else if ( payment_type == 'full' ) {
			mode = 'payment';
			hb_stripe_confirm_type = 'confirmPayment';
			amount = $payment_data.data( 'charged-total-price-raw' );
		}
		if ( hb_stripe_zero_decimal_currency == 'no' ) {
			amount = amount * 100;
		}
		amount = Math.round( amount );
		if ( amount == 0 ) {
			setup_future_usage = 'off_session';
			mode = 'setup';
			hb_stripe_confirm_type = 'confirmSetup';
		}
		if ( hb_stripe_store_credit_card == 'yes' ) {
			setup_future_usage = 'off_session';
		}
		var create_elements_options = {
			mode: mode,
			currency: hb_stripe_currency.toLowerCase(),
		}
		if ( setup_future_usage ) {
			create_elements_options['setupFutureUsage'] = setup_future_usage;
		}
		if ( mode == 'payment' ) {
			create_elements_options['amount'] = amount;
		}
		if ( hb_stripe_payment_methods != 'all' ) {
			create_elements_options['paymentMethodTypes'] = ['card'];
		}
		try {
			hb_stripe_elements[ $booking_wrapper.attr( 'id' ) ] = hb_stripe_class.elements( create_elements_options );
			hb_stripe_payment_elements[ $booking_wrapper.attr( 'id' ) ] = hb_stripe_elements[ $booking_wrapper.attr( 'id' ) ].create( 'payment', { layout: 'tabs', fields: { billingDetails: 'never' } } );
			hb_stripe_payment_elements[ $booking_wrapper.attr( 'id' ) ].on( 'ready', function( event ) {
				$booking_wrapper.find( '.hb-stripe-loading-form' ).hide();
			});
			hb_stripe_payment_elements[ $booking_wrapper.attr( 'id' ) ].mount( '#' + $booking_wrapper.attr( 'id' ) + ' .hb-stripe-payment-element-wrapper' );
		} catch ( e ) {
			console.log( 'Stripe error.' );
			console.log( e );
			alert( 'Stripe error: ' + e.message );
		}
	}
}

function hb_stripe_payment_process( $form, callback_func ) {
	$form.find( 'input[type="submit"]' ).blur().prop( 'disabled', true );
	if ( $form.hasClass( 'hb-payment-link-form' ) ) {
		var booking_wrapper_id = 'hb-payment-link-form';
	} else {
		var booking_wrapper_id = $form.parents( '.hbook-wrapper' ).attr( 'id' );
	}
	try {
		hb_stripe_elements[ booking_wrapper_id ].submit().then( function( result ) {
			if ( result.error ) {
				console.log( result.error );
				$form.removeClass( 'submitted' );
				$form.find( 'input[type="submit"]' ).prop( 'disabled', false );
				return false;
			} else {
				$form.find( '.hb-saving-resa, .hb-processing-later-payment' ).slideDown();
				callback_func( $form );
			}
		});
		return true;
	} catch( e ) {
		console.log( e );
		$form.removeClass( 'submitted' );
		$form.find( 'input[type="submit"]' ).prop( 'disabled', false );
		return false;
	}
}

function hb_stripe_payment_requires_action( $form, response ) {
	var customer_info = {};
	var customer_details_list = ['first_name', 'last_name', 'email', 'phone', 'address_1', 'address_2', 'city', 'state_province', 'zip_code'];
	for ( var i = 0; i < customer_details_list.length; i++ ) {
		if ( $form.hasClass( 'hb-payment-link-form' ) ) {
			if ( typeof hb_customer_info[ customer_details_list[ i ] ] !== 'undefined' ) {
				customer_info[ customer_details_list[ i ] ] = hb_customer_info[ customer_details_list[ i ] ];
			} else {
				customer_info[ customer_details_list[ i ] ] = '';
			}
		} else {
			var customer_input = 'input[name="hb_' + customer_details_list[ i ] + '"]';
			if ( $form.find( customer_input ).length ) {
				customer_info[ customer_details_list[ i ] ] = $form.find( customer_input ).val();
			} else {
				customer_info[ customer_details_list[ i ] ] = '';
			}
		}
	}
	var customer_name_sep = '';
	if ( customer_info['first_name'] && customer_info['last_name'] ) {
		customer_name_sep = ' ';
	}
	customer_info['name'] = customer_info['first_name'] + customer_name_sep + customer_info['last_name'];
	if ( $form.hasClass( 'hb-payment-link-form' ) ) {
		var booking_wrapper_id = 'hb-payment-link-form';
		if ( ( typeof hb_customer_info['country_iso'] !== 'undefined' ) && ( hb_customer_info['country_iso'] != '' ) ) {
			customer_info['country'] = hb_customer_info['country_iso'];
		} else {
			customer_info['country'] = $form.find( '.hb-country-iso-select' ).val();
		}
	} else {
		var booking_wrapper_id = $form.parents( '.hbook-wrapper' ).attr( 'id' );
		customer_info['country'] = $form.find( '.hb-country-iso-select' ).val();
	}

	hb_stripe_class[ hb_stripe_confirm_type ]({
		elements: hb_stripe_elements[ booking_wrapper_id ],
		clientSecret: response['client_secret'],
		confirmParams: {
			return_url: response['return_url'],
			payment_method_data: {
				billing_details: {
					name: customer_info['name'],
					email: customer_info['email'],
					phone: customer_info['phone'],
					address: {
						line1: customer_info['address_1'],
						line2: customer_info['address_2'],
						city: customer_info['city'],
						state: customer_info['state_province'],
						country: customer_info['country'],
						postal_code: customer_info['zip_code'],
					}
				}
			}
		},
	}).then( function( result ) {
		if ( result.error ) {
			hb_stripe_handle_error( response, $form, result.error );
		}
	}).catch( function ( e ) {
		hb_stripe_handle_error( response, $form, e );
	});
}

function hb_stripe_handle_error( response, $form, error ) {
	$form.find( '.hb-saving-resa, .hb-processing-later-payment' ).slideUp();
	$form.removeClass( 'submitted' );
	$form.find( 'input[type="submit"]' ).prop( 'disabled', false );
	$form.find( '.hb-confirm-error' ).html( error.message ).slideDown();
	console.log( error );
	var ajax_timeout = 40000;
	if ( typeof hb_booking_form_data != 'undefined' ) {
		ajax_timeout = hb_booking_form_data.ajax_timeout;
	} else if ( typeof hb_payment_link_form_data != 'undefined' ) {
		ajax_timeout = hb_payment_link_form_data.ajax_timeout;
	}
	var ajax_url = '';
	if ( typeof hb_booking_form_data != 'undefined' ) {
		ajax_url = hb_booking_form_data.ajax_url;
	} else if ( typeof hb_payment_link_form_data != 'undefined' ) {
		ajax_url = hb_payment_link_form_data.ajax_url;
	}
	jQuery.ajax({
		data: {
			'action': 'hb_stripe_declined_payment',
			'payment_token': response['payment_token'],
		},
		success: function( ajax_response ) {
			if ( ajax_response != 'stripe_declined_payment' ) {
				console.log( ajax_response );
			}
		},
		type : 'POST',
		timeout: ajax_timeout,
		url: ajax_url,
		error: function( jqXHR, textStatus, errorThrown ) {
			console.log( jqXHR );
			console.log( textStatus );
			console.log( errorThrown );
		}
	});
}