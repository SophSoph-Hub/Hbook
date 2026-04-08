jQuery( document ).ready( function( $ ) {
	'use strict';

	payment_choice_display();

	function payment_choice_display() {
		if ( $( 'input[name="hb_resa_payment_multiple_choice"]:checked' ).val() == 'yes' ) {
			$( '.hb-resa-payment-choice-multiple' ).slideUp();
			$( '.hb-resa-payment-choice-single' ).slideDown();
		} else {
			$( '.hb-resa-payment-choice-multiple' ).slideDown();
			$( '.hb-resa-payment-choice-single' ).slideUp();
		}
	}

	$( 'input[name="hb_resa_payment_multiple_choice"]' ).on( 'change', function() {
		payment_choice_display();
	});

	$( '.hb-payment-gateway-active input' ).on( 'change', function() {
		hide_show_payment_gateway_options();
	});

	hide_show_payment_gateway_options();

	function hide_show_payment_gateway_options() {
		for ( var i = 0; i < hb_payment_gateways.length; i++ ) {
			if ( $( 'input[name=hb_' + hb_payment_gateways[i] + '_active]:checked' ).val() == 'yes' ) {
				$( '.hb-payment-section-' + hb_payment_gateways[i] ).slideDown();
			} else {
				$( '.hb-payment-section-' + hb_payment_gateways[i] ).slideUp();
			}
		}
	}

	var deposit_amount_label_default_text = $( 'label[for="hb_deposit_amount"]' ).html();
	var deposit_amount_label_nb_night = $( 'label[for="hb_deposit_type_nb_night"]' ).html();
	var deposit_amount_default_value = $( '#hb_deposit_amount' ).val();
	var deposit_type_changed = false;

	$( '.hb-deposit-choice input' ).on( 'change', function() {
		deposit_type_changed = true;
		update_deposit_amount_label();
		hide_show_deposit_options();
		hide_show_deposit_bond_option();
	});

	update_deposit_amount_label();

	function update_deposit_amount_label() {
		switch( $( 'input[name="hb_deposit_type"]:checked' ).val() ) {
			case 'percentage':  $( 'label[for="hb_deposit_amount"]' ).html( hb_text.deposit_percentage ); break;
			case 'nb_night': $( 'label[for="hb_deposit_amount"]' ).html( deposit_amount_label_nb_night ); break;
			case 'fixed': $( 'label[for="hb_deposit_amount"]' ).html( deposit_amount_label_default_text ); break;
		}
		if ( deposit_type_changed ) {
			if ( $( 'input[name="hb_deposit_type"]:checked' ).val() == 'nb_night' ) {
				$( '#hb_deposit_amount' ).val( '1' );
			} else {
				$( '#hb_deposit_amount' ).val( deposit_amount_default_value );
			}
		}
	}

	hide_show_deposit_options();

	function hide_show_deposit_options() {
		if ( $( 'input[name="hb_deposit_type"]:checked' ).val() == 'none' ) {
			$( '.hb-deposit-options' ).slideUp();
		} else {
			$( '.hb-deposit-options' ).slideDown();
		}
	}

	$( '.hb-security-bond-choice input' ).on( 'change', function() {
		hide_show_security_bond_options();
	});

	hide_show_security_bond_options();

	function hide_show_security_bond_options() {
		if ( $( 'input[name="hb_security_bond"]:checked' ).val() == 'no' ) {
			$( '.hb-security-bond-options' ).slideUp();
			$( '#hb_security_bond_online_payment_no' ).prop( 'checked', true );
			hide_show_deposit_bond_option();
		} else {
			$( '.hb-security-bond-options' ).slideDown();
		}
	}

	$( '.hb-security-bond-payment input' ).on( 'change', function() {
		hide_show_deposit_bond_option();
	});

	hide_show_deposit_bond_option();

	function hide_show_deposit_bond_option() {
		if (
			( $( 'input[name="hb_security_bond_online_payment"]:checked' ).val() == 'no' ) ||
			( $( 'input[name="hb_deposit_type"]:checked' ).val() == 'none' )
		) {
			$( '#hb_deposit_bond_no' ).prop( 'checked', true );
			$( '.hb-deposit-bond' ).slideUp();
		} else {
			$( '.hb-deposit-bond' ).slideDown();
		}
	}

});