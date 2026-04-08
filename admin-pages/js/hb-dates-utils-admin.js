function hb_formatted_date( date ) {
	if ( ! date || ( date == '0000-00-00' ) ) {
		return '';
	} else {
		var hour = '';
		if ( ( date.length > 10 ) && ( date.charAt( 10 ) == ' ' ) ) {
			var splitted_date_hour = date.split( ' ' );
			date = splitted_date_hour[0];
			hour = splitted_date_hour[1];
			if ( hour.length > 5) {
				hour = hour.substring( 0, 5 );
			}
		}
		date = date.split( '-' );
		date = new Date( date[0], date[1] - 1, date[2] );
		var formatted_date = jQuery.datepick.formatDate( hb_date_format, date );
		if ( hour ) {
			formatted_date += ' ' + hour;
		}
		return formatted_date;
	}
}

function hb_db_formatted_date( date ) {
	try {
		date = jQuery.datepick.parseDate( hb_date_format, date );
	} catch( e ) {
		date = false;
	}
	if ( date ) {
		return  jQuery.datepick.formatDate( 'yyyy-mm-dd', date );
	} else {
		return '0000-00-00';
	}
}