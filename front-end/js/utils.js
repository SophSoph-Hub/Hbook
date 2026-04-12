'use strict';

/* ------------------------------------------------------------------------------------------- */

/* currency support */

var hb_selected_currency = localStorage.getItem( 'hb_selected_currency' ) || 'CHF';

function hb_get_currency_data() {
	if ( typeof hb_booking_form_data !== 'undefined' ) { return hb_booking_form_data; }
	if ( typeof hb_currency_data !== 'undefined' ) { return hb_currency_data; }
	return null;
}

function hb_get_currency_rate() {
	if ( hb_selected_currency !== 'EUR' ) { return 1; }
	var d = hb_get_currency_data();
	return d ? ( parseFloat( d.eur_chf_rate ) || 1 ) : 1;
}

function hb_get_active_currency_symbol() {
	var d = hb_get_currency_data();
	if ( ! d ) { return hb_selected_currency + ' '; }
	return hb_selected_currency === 'EUR' ? d.eur_symbol : d.chf_symbol;
}

function hb_get_active_currency_position() {
	var d = hb_get_currency_data();
	if ( hb_selected_currency === 'EUR' ) {
		return ( d && d.eur_position ) ? d.eur_position : 'after';
	}
	return 'before';
}

function hb_format_price_num( price ) {
	var d = hb_get_currency_data();
	var precision    = d ? d.price_precision : 'two_decimals';
	var decimal_pt   = d ? d.decimal_point   : '.';
	var thousands    = d ? d.thousands_sep   : '';
	var formatted;
	if ( precision === 'no_decimals' ) {
		formatted = Math.round( price ).toString();
	} else {
		formatted = parseFloat( price ).toFixed( 2 );
	}
	var parts = formatted.split( '.' );
	if ( thousands ) {
		parts[0] = parts[0].replace( /\B(?=(\d{3})+(?!\d))/g, thousands );
	}
	return parts.join( decimal_pt );
}

function hb_format_price_with_symbol( raw_price ) {
	var rate      = hb_get_currency_rate();
	var converted = Math.abs( parseFloat( raw_price ) ) * rate;
	var num_str   = hb_format_price_num( converted );
	var symbol    = hb_get_active_currency_symbol();
	var position  = hb_get_active_currency_position();
	var negative  = parseFloat( raw_price ) < 0 ? '-' : '';
	if ( position === 'after' ) {
		return negative + num_str + '\u00a0' + symbol;
	} else {
		return negative + symbol + num_str;
	}
}

function hb_apply_currency_to_prices( context ) {
	var $ctx = context ? jQuery( context ) : jQuery( 'body' );
	$ctx.find( '.hb-currency-price[data-raw-price]' ).each( function() {
		jQuery( this ).html( hb_format_price_with_symbol( jQuery( this ).data( 'raw-price' ) ) );
	} );
	jQuery( 'body' ).find( '.hb-price-currency-symbol' ).html( hb_get_active_currency_symbol() );
	jQuery( '.hb-currency-btn' ).removeClass( 'hb-currency-active' );
	jQuery( '.hb-currency-btn[data-currency="' + hb_selected_currency + '"]' ).addClass( 'hb-currency-active' );
}

/* end currency support */

/* ------------------------------------------------------------------------------------------- */

function hb_date_str_2_obj( str_date ) {
	if ( str_date ) {
		var array_date = str_date.split( '-' );
		return new Date( array_date[0], array_date[1] - 1, array_date[2] );
	} else {
		return false;
	}
}

function hb_date_obj_2_str( obj_date ) {
	if ( obj_date ) {
		var y = obj_date.getFullYear(),
			m = obj_date.getMonth() + 1,
			d = obj_date.getDate();
		m = m + '';
		d = d + '';
		if ( m.length == 1 ) {
			m = '0' + m;
		}
		if ( d.length == 1 ) {
			d = '0' + d;
		}
		return y + '-' + m + '-' + d;
	} else {
		return false;
	}
}

function hb_format_date() {
	jQuery( '.hb-format-date' ).each( function() {
		var str_date = jQuery( this ).html();
		if ( str_date.indexOf( '-' ) > -1 ) {
			var date = hb_date_str_2_obj( str_date );
			jQuery( this ).html( jQuery.datepick.formatDate( hb_date_format, date ) ).removeClass( 'hb-format-date' );
		}
	});
}

function hb_get_season_id( date ) {
	var seasons = hb_booking_form_data.seasons,
		nb_day,
		copied_date = new Date( date.valueOf() );

	copied_date.setHours( 0, 0, 0, 0 );

	nb_day = date.getDay();
	if ( nb_day == 0 ) {
		nb_day = 6;
	} else {
		nb_day = nb_day - 1;
	}
	nb_day += '';

	var priorities = ['high', '', 'low'];
	for ( var i = 0; i < 3; i++ ) {
		for ( var j = 0; j < seasons.length; j++ ) {
			var start = hb_date_str_2_obj( seasons[ j ]['start_date'] );
			var end = hb_date_str_2_obj( seasons[ j ]['end_date'] );
			start.setHours( 0, 0, 0, 0 );
			end.setHours( 0, 0, 0, 0 );
			if (
				( seasons[ j ]['priority'] == priorities[ i ] ) &&
				( copied_date >= start ) &&
				( copied_date <= end ) &&
				( seasons[ j ]['days'].indexOf( nb_day ) != -1 )
			) {
				return seasons[ j ]['season_id'];
			}
		}
	}
	return false;
}

jQuery( document ).ready( function( $ ) {
	/* currency switcher init */
	$( document ).on( 'click', '.hb-currency-btn', function() {
		hb_selected_currency = $( this ).data( 'currency' );
		localStorage.setItem( 'hb_selected_currency', hb_selected_currency );
		hb_apply_currency_to_prices( null );
		$( document ).trigger( 'hb_currency_changed' );
	} );
	hb_apply_currency_to_prices( null );
} );