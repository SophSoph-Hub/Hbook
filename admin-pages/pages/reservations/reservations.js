'use strict';

jQuery( document ).ready( function( $ ) {

	$( '.hb-sync-errors-msg .notice-dismiss' ).on( 'click', function() {
		if ( confirm( hb_text.confirm_delete_sync_errors ) ) {
			hb_resa_ajax({
				data: {
					'action': 'hb_delete_sync_errors',
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {},
				error: function( jqXHR, textStatus, errorThrown ) {
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}
	});

	$( '.hb-input-date' ).datepick( hb_datepicker_calendar_options );

	$( '.hb-input-date' ).datepick( 'option', {
		onSelect: function() {
			$( this ).change();
		}
	});

	$( '.hb-admin-search-type' ).on( 'change', function() {
		if ( $( '.hb-admin-search-type' ).val() == 'multiple_accom' ) {
			$( '.hb-booking-search-form' ).addClass( 'hb-search-form-admin-multiple-accom' );
		} else {
			$( '.hb-booking-search-form' ).removeClass( 'hb-search-form-admin-multiple-accom' );
		}
	});

	$( '#hb-block-accom-from-date' ).on( 'change', function () {
		var from_date = $( this ).datepick( 'getDate' )[0],
			to_date = $( '#hb-block-accom-to-date' ).datepick( 'getDate' )[0];
		if ( from_date && to_date && ( from_date.getTime() >= to_date.getTime() ) ) {
			$( '#hb-block-accom-to-date' ).datepick( 'setDate', null ).focus();
		}
		if ( from_date ) {
			var min_to_date = new Date( from_date.getTime() );
			min_to_date.setDate( min_to_date.getDate() + 1 );
			$( '#hb-block-accom-to-date' ).datepick( 'option', 'minDate', min_to_date );
			if ( ! to_date) {
				$( '#hb-block-accom-to-date' ).focus();
			}
		}
		$( '#hb-block-accom-from-date-hidden' ).val( hb_db_formatted_date( $( this ).val() ) );
	});

	$( '#hb-block-accom-to-date' ).on( 'change', function () {
		$( '#hb-block-accom-to-date-hidden' ).val( hb_db_formatted_date( $( this ).val() ) );
	});

	var customer_id_last_valid_selection = null;
	$( '.wrap' ).on( 'change', '.hb-customer-id-list', function( e ) {
		if ( $( this ).val() && $( this ).val().length > 1 ) {
			$( this ).val( customer_id_last_valid_selection );
		} else {
			customer_id_last_valid_selection = $( this ).val();
		}
	});

	hb_section_toggle( 'block-accom' );
	hb_section_toggle( 'admin-add-resa' );
	hb_section_toggle( 'archived-resa' );
	hb_section_toggle( 'export-resa' );

	$( window ).resize();
	setTimeout( function() {
		$( '#hb-admin-add-resa' ).css( 'display', 'none' );
	}, 2000 );

	$( '#hb-new-resa-status-' + hb_new_resa_status ).prop( 'checked', true );

	$( '#hb-select-blocked-accom-type' ).on( 'change', function() {
		var blocked_accom_num_options = '';
		if ( accoms[ $( '#hb-select-blocked-accom-type' ).val() ] && accoms[ $( '#hb-select-blocked-accom-type' ).val() ].number > 1 ) {
			blocked_accom_num_options += '<option value="all">' + hb_text.all + '</option>';
			$( '#hb-select-blocked-accom-num' ).parent().show();
		} else {
			$( '#hb-select-blocked-accom-num' ).parent().hide();
		}
		if ( accoms[ $( '#hb-select-blocked-accom-type' ).val() ] ) {
			$.each( accoms[ $( '#hb-select-blocked-accom-type' ).val() ].num_name, function( accom_num_id, accom_num_name ) {
				blocked_accom_num_options += '<option value="' +  accom_num_id + '">' + accom_num_name + '</option>';
			});
		}
		$( '#hb-select-blocked-accom-num' ).html( blocked_accom_num_options );
	}).change();

	$( '.wrap' ).on( 'change', '.hb-filter-accom-list', function() {
		if ( $( '#hb-show-unavailable-accom' ).is( ':checked' ) && $( '#hb-show-people-unsuitable-accom' ).is( ':checked' ) ) {
			$( '.hb-accom-list .hb-accom' ).slideDown();
		} else if ( ! $( '#hb-show-unavailable-accom' ).is( ':checked' ) && ! $( '#hb-show-people-unsuitable-accom' ).is( ':checked' ) ) {
			$( '.hb-accom-list .hb-accom:not(.hb-accom-available)' ).slideUp();
			$( '.hb-accom-list .hb-accom:not(.hb-accom-suits-people)' ).slideUp();
		} else if ( $( '#hb-show-unavailable-accom' ).is( ':checked' ) ) {
			$( '.hb-accom-list .hb-accom.hb-accom-suits-people:not(.hb-accom-available)' ).slideDown();
			$( '.hb-accom-list .hb-accom:not(.hb-accom-suits-people)' ).slideUp();
		} else if ( $( '#hb-show-people-unsuitable-accom' ).is( ':checked' ) ) {
			$( '.hb-accom-list .hb-accom.hb-accom-available:not(.hb-accom-suits-people)' ).slideDown();
			$( '.hb-accom-list .hb-accom:not(.hb-accom-available)' ).slideUp();
		}
	});

	function hb_resa_ajax( ajax_param ) {
		$.ajax({
			url: ajaxurl,
			type: 'POST',
			data: ajax_param['data'],
			timeout: hb_ajax_settings.timeout,
			success: function( ajax_return ) {
				ajax_return = ajax_return.trim();
				ajax_param['success']( ajax_return );
			},
			error: ajax_param['error']
		});
	}

	function format_price( price ) {
		if ( hb_price_precision == 'no_decimals' ) {
			var formatted_price = Math.round( price );
		} else {
			var formatted_price = parseFloat( price ).toFixed( 2 );
		}
		return formatted_price;
	}

	function round_price_for_compare( price ) {
		return Math.round( price * 100 );
	}

	function hb_calculate_admin_options_price( resa_id ) {
		var $options_wrappers = $( '.hb-options-editor-resa-' + resa_id );
		$options_wrappers.each( function() {
			var $options_wrapper = $( this );
			var accom_id = $options_wrapper.data( 'accom-id' );
			var options_price = 0;

			$options_wrapper.find( '.hb-option' ).each( function() {
				if (
					$( this ).hasClass( 'hb-option-accom-' + accom_id ) ||
					( ( accom_id == 0 ) && $( this ).hasClass( 'hb-option-global' ) )
				) {
					if ( $( this ).hasClass( 'hb-quantity-option' ) ) {
						if ( $( this ).find( 'input' ).val() < 0 ) {
							$( this ).find( 'input' ).val( 0 );
						}
						options_price += parseFloat( $( this ).find( 'input' ).data( 'price' ) * $( this ).find( 'input' ).val() );
					} else if ( $( this ).hasClass( 'hb-multiple-option' ) && $( this ).find( 'input:checked' ).length ) {
						options_price += parseFloat( $( this ).find( 'input:checked' ).data( 'price' ) );
					} else if ( $( this ).hasClass( 'hb-single-option' ) && $( this ).find( 'input' ).is(':checked' ) ) {
						options_price += parseFloat( $( this ).find( 'input' ).data( 'price' ) );
					}
				}
			});

			if ( options_price != 0 ) {
				options_price = format_price( options_price );
				if ( options_price < 0 ) {
					options_price = format_price( options_price * -1 );
					$options_wrapper.find( '.hb-options-total-price .hb-price-placeholder-minus' ).css( 'display', 'inline' );
				} else {
					$options_wrapper.find( '.hb-options-total-price .hb-price-placeholder-minus' ).css( 'display', 'none' );
				}
				$options_wrapper.find( '.hb-options-total-price .hb-price-placeholder' ).html( options_price );
				$options_wrapper.find( '.hb-options-total-price' ).show();
			} else {
				$options_wrapper.find( '.hb-options-total-price' ).hide();
			}
		});
	}

	function hb_children_resa_identical_values( children_resa, value_type ) {
		var value = '';
		if ( children_resa.length ) {
			value = children_resa[0][ value_type ]();
			for ( var i = 0; i < children_resa.length - 1; i++ ) {
				if ( children_resa[i][ value_type ]() != children_resa[i+1][ value_type ]() ) {
					return '';
				}
			}
		}
		return value;
	}

	$( 'input[name="hb-admin-customer-type"]' ).on( 'change', function() {
		if ( $( 'input[name="hb-admin-customer-type"]:checked' ).val() == 'id' ) {
			$( '#hb-resa-customer-details' ).slideUp();
			$( '#hb-resa-customer-id' ).slideDown();
		} else {
			$( '#hb-resa-customer-details' ).slideDown();
			$( '#hb-resa-customer-id' ).slideUp();
		}
	});

	$( '.wrap' ).on( 'click', '.hb-option', function() {
		hb_calculate_admin_options_price( $( this ).parents( '.hb-options-editor' ).data( 'resa-id' ) );
	});

	$( '.wrap' ).on( 'click', '.hb-resa-more-info-toggle', function() {
		$( this ).parent().find( '.hb-resa-more-info-content' ).slideToggle( 100 );
		$( this ).toggleClass( 'hb-less-info-toggle-link' );
		return false;
	});

	$( '.wrap' ).on( 'click', '.hb-resa-abbr-accom-name a', function() {
		if ( $( this ).hasClass( 'hb-accom-num-name-shown' ) ) {
			$( this ).removeClass( 'hb-accom-num-name-shown' );
			$( this ).find( '.hb-resa-abbr-accom-num-name' ).css( 'display', 'none' );
			$( this ).parents( 'td' ).css( 'overflow', 'hidden' );
		} else {
			$( this ).addClass( 'hb-accom-num-name-shown' );
			$( this ).find( '.hb-resa-abbr-accom-num-name' ).css( 'display', 'inline' );
			$( this ).parents( 'td' ).css( 'overflow', 'visible' );
		}
		return false;
	});

	$( '.wrap' ).on( 'click', 'a:not(.hb-resa-follow-link):not(.hb-resa-customer-resa-link):not(.hb-open-document):not(.hb-origin-url-link)', function( e ) {
		$( this ).blur();
		e.preventDefault();
	});

	var displayed_accoms = accoms;

	$( '#hb-resa-cal-accommodation' ).on( 'change', function() {
		var accom_selected = $( this ).val();
		if ( accom_selected == 'all' ) {
			displayed_accoms = accoms;
		} else {
			displayed_accoms = {};
			displayed_accoms[ accom_selected ] = accoms[ accom_selected ];
		}
		hb_resa_cal_tables( $( '#hb-resa-cal-table' ).data( 'first-day'), displayed_accoms );
		resaViewModel.redraw_calendar();
	});

	$( '#hb-resa-cal-wrapper' ).on( 'click', '.hb-go-to-previous-two-weeks, .hb-go-to-next-two-weeks', function() {
		hb_resa_cal_tables( $( this ).data( 'day' ), displayed_accoms );
		resaViewModel.redraw_calendar();
		return false;
	});

	$( 'body' ).on( 'click', '.hb-month.button', function() {
		$( this ).parents( '.hb-month-picker').slideUp();
		hb_resa_cal_tables( $( this ).data( 'day' ), displayed_accoms );
		resaViewModel.redraw_calendar();
		return false;
	});

	function Resa( id, alphanum_id, parent_id, is_parent, status, price, previous_price, legacy_paid, accom_price, old_currency, check_in, check_out, adults, children, accom_id, accom_num, options_info, non_editable_info, admin_comment, accom_discount_amount, accom_discount_amount_type, global_discount_amount, global_discount_amount_type, customer_id, received_on, email_logs, nb_emails_sent, payments_logs, origin, origin_url, additional_info, lang, view_model ) {
		this.id = id;
		this.alphanum_id = alphanum_id;
		this.parent_id = parent_id;
		this.is_parent = is_parent;
		this.price = ko.observable( price );
		this.price_tmp = ko.observable();
		this.previous_price = ko.observable( previous_price );
		this.legacy_paid = legacy_paid;
		this.accom_price = accom_price;
		this.accom_discount_amount = ko.observable( accom_discount_amount );
		if ( ! accom_discount_amount_type ) {
			accom_discount_amount_type = 'fixed';
		}
		this.accom_discount_amount_type = ko.observable( accom_discount_amount_type );
		this.global_discount_amount = ko.observable( global_discount_amount );
		if ( ! global_discount_amount_type ) {
			global_discount_amount_type = 'fixed';
		}
		this.global_discount_amount_type = ko.observable( global_discount_amount_type );
		this.accom_discount_amount_tmp = ko.observable();
		this.accom_discount_amount_type_tmp = ko.observable();
		this.global_discount_amount_tmp = ko.observable();
		this.global_discount_amount_type_tmp = ko.observable();
		this.old_currency = old_currency;
		this.check_in = ko.observable( check_in );
		this.check_out = ko.observable( check_out );
		this.check_in_tmp_input = ko.observable();
		this.check_out_tmp_input = ko.observable();
		this.adults = ko.observable( adults );
		this.children = ko.observable( children );
		this.adults_tmp = ko.observable();
		this.children_tmp = ko.observable();
		this.additional_info = ko.observable( additional_info );
		this.origin = origin;
		this.origin_url = origin_url;
		this.accom_id = ko.observable( accom_id );
		this.accom_num = ko.observable( accom_num );
		this.avai_accom_same_dates = ko.observableArray();
		this.customer_id = ko.observable( customer_id );
		this.select_customer_id = ko.observable();
		this.received_on = received_on;
		this.received_on_formatted = hb_formatted_date( received_on );
		this.email_logs = ko.observableArray( email_logs );
		this.nb_emails_sent = nb_emails_sent;
		var knockout_payments = [];
		for ( var i = 0; i < payments_logs.length; i++ ) {
			knockout_payments[ i ] = new Payment( payments_logs[ i ] );
		}
		this.payments_logs = ko.observableArray( knockout_payments );
		this.payment_received_on_input = ko.observable();
		this.payment_amount = ko.observable( '' );
		this.payment_method = ko.observable( hb_offline_payment_methods[0].input_value );
		this.payment_comment = ko.observable();
		this.options_info = ko.observable( options_info );
		this.non_editable_info = non_editable_info;
		this.lang = ko.observable( lang );
		this.lang_tmp = ko.observable();
		this.admin_comment = ko.observable( admin_comment );
		this.admin_comment_tmp = ko.observable( '' );
		this.status = ko.observable( status );
		this.origin = ko.observable( origin );
		this.email_customer_template = ko.observable();
		this.email_customer_to_address = ko.observable();
		this.email_customer_subject = ko.observable();
		this.email_customer_message = ko.observable();
		this.email_customer_attachment_ids = ko.observable();
		this.email_customer_delete_attachments_after = ko.observable( false );
		this.payment_link_type = ko.observable( 'total_price' );
		this.payment_link_custom_amount = ko.observable();
		this.action_processing = ko.observable( false );
		this.email_sent = ko.observable( false );
		this.fetching_email_logs = ko.observable( false );
		this.deleting_anim = ko.observable( false );
		this.editing_resa_info = ko.observable( false );
		this.editing_options = ko.observable( false );
		this.options_editor = ko.observable( '' );
		this.editing_comment = ko.observable( false );
		this.editing_accom = ko.observable( false );
		this.fetching_accom = ko.observable( false );
		this.editing_accom_no_accom = ko.observable( false );
		this.creating_customer = ko.observable( false );
		this.selecting_customer = ko.observable( false );
		this.editing_customer = ko.observable( false );
		this.saving_accom = ko.observable( false );
		this.saving_resa_info = ko.observable( false );
		this.saving_options = ko.observable( false );
		this.saving_comment = ko.observable( false );
		this.saving_customer = ko.observable( false );
		this.saving_selected_customer = ko.observable( false );
		this.editing_price = ko.observable( false );
		this.saving_price = ko.observable( false );
		this.editing_discount = ko.observable( false );
		this.saving_discount = ko.observable( false );
		this.charging = ko.observable( false );
		this.refunding = ko.observable( false );
		this.editing_payments = ko.observable( false );
		this.saving_payment = ko.observable( false );
		this.editing_dates = ko.observable( false );
		this.saving_dates = ko.observable( false );
		this.preparing_email = ko.observable( false );
		this.adding_payment_link = ko.observable( false );
		this.opening_documents = ko.observable( false );
		this.opening_email_logs = ko.observable( false );
		this.is_selected = ko.observable( false );
		this.is_disabled = ko.observable( false );
		this.anim_class = ko.observable( '' );
		this.parent_child_class = '';
		if ( is_parent ) {
			this.parent_child_class = 'hb-resa-parent';
		}
		if ( parent_id != 0 ) {
			this.parent_child_class = 'hb-resa-child';
			this.is_child = true;
		} else {
			this.is_child = false;
		}

		var self = this;

		if ( is_parent ) {
			this.children_resa = ko.computed( function() {
				var children_resa = [];
				for ( var i = 0; i < view_model.resa().length; i++ ) {
					if ( view_model.resa()[i].parent_id == self.id ) {
						children_resa.push( view_model.resa()[i] );
					}
				}
				return children_resa;
			});

			this.active_children_resa = ko.computed( function() {
				var children_resa = self.children_resa();
				var active_children_resa = [];
				var active_status = ['new', 'pending', 'confirmed'];
				for ( var i = 0; i < children_resa.length; i++ ) {
					if ( active_status.indexOf( children_resa[i].status() ) >= 0 ) {
						active_children_resa.push( children_resa[i] );
					}
				}
				return active_children_resa;
			});

			this.status = ko.computed( function() {
				return hb_children_resa_identical_values( self.children_resa(), 'status' );
			});

			this.check_in = ko.computed( function() {
				return hb_children_resa_identical_values( self.active_children_resa(), 'check_in' );
			});

			this.check_out = ko.computed( function() {
				return hb_children_resa_identical_values( self.active_children_resa(), 'check_out' );
			});

			this.is_selected.subscribe( function( value ) {
				for (var i = 0; i < self.children_resa().length; i++ ) {
					self.children_resa()[ i ].is_selected( value );
					self.children_resa()[ i ].is_disabled( value );
				}
			});
		}

		this.parent_resa = function() {
			var parent_resa = ko.utils.arrayFirst( view_model.resa(), function( resa ) {
				return ( resa.is_parent && ( resa.id == self.parent_id ) );
			});
			return parent_resa;
		}

		this.status_markup = ko.computed( function() {
			if ( self.status() ) {
				return '<div class="hb-resa-status hb-resa-' + self.status() + '" title="' + hb_text[ self.status() ] + '">' + hb_text[ self.status() ] + '</div>';
			}
		});

		this.confirm_visible = ko.computed( function() {
			if ( self.action_processing() ) {
				return false;
			} else if ( self.is_parent ) {
				for ( var i = 0; i < self.children_resa().length; i++ ) {
					if ( ( self.children_resa()[ i ].status() == 'pending' ) || ( self.children_resa()[ i ].status() == 'new' ) ) {
						return true;
					}
				}
			} else {
				if ( ( self.status() == 'pending' ) || ( self.status() == 'new' ) ) {
					return true;
				}
			}
			return false;
		});

		this.past = ko.computed( function() {
			var today = hb_date_to_str( new Date() );
			if ( self.check_out() < today ) {
				return true;
			} else {
				return false;
			}
		});

		this.price_with_security_bond = ko.computed( function() {
			if ( hb_paid_security_bond == 'yes' ) {
				return parseFloat( self.price() ) + parseFloat( hb_security_bond );
			} else {
				return self.price();
			}
		});

		this.price_markup = ko.computed( function() {
			var price = '';
			if ( self.old_currency ) {
				price = format_price( self.price() ) + ' ' + old_currency;
			} else {
				price = '<span title="' + hb_text.price + '">';
				price += hb_format_price( self.price() );
				price += '</span>';
				if ( ( hb_paid_security_bond == 'yes' ) && ( ! self.past() ) ) {
					price += '<br/>';
					price += '<span title="' + hb_text.price_with_bond + '" class="hb-amount-with-security-bond">';
					price += hb_format_price( self.price_with_security_bond() );
					price += '</span>';
				}
				if ( ( self.previous_price() > 0 ) && ( self.previous_price() != self.price() ) ) {
					price += '<br/>';
					price += '<span title="' + hb_text.previous_price + '" class="hb-previous-price">';
					price += hb_format_price( self.previous_price() );
					price += '</span>';
				}
			}
			return price;
		});

		this.discount_markup = ko.computed( function() {
			if ( self.accom_price == -1 ) {
				return '';
			}
			var discount = '';
			if ( self.accom_discount_amount_type() && self.accom_discount_amount() && self.accom_discount_amount() != 0 ) {
				discount += hb_text.accom_discount + ' ';
				if ( self.accom_discount_amount_type() == 'percent' ) {
					discount += self.accom_discount_amount() + '%';
				} else if ( self.accom_discount_amount_type() == 'fixed' ) {
					discount += hb_format_price( self.accom_discount_amount() );
				}
				discount += '<br/>';
			}
			if ( self.global_discount_amount_type() && self.global_discount_amount() && self.global_discount_amount() != 0 ) {
				discount += hb_text.global_discount + ' ';
				if ( self.global_discount_amount_type() == 'percent' ) {
					discount += self.global_discount_amount() + '%';
				} else if ( self.global_discount_amount_type() == 'fixed' ) {
					discount += hb_format_price( self.global_discount_amount() );
				}
			}
			return discount;
		});

		this.paid = ko.computed( function() {
			if ( self.legacy_paid == -1 ) {
				return -1;
			}
			var paid = 0;
			for ( var i = 0; i < self.payments_logs().length; i++ ) {
				if ( ! self.payments_logs()[ i ].failed ) {
					paid += parseFloat( self.payments_logs()[ i ].amount );
				}
			}
			return paid;
		});

		this.has_failed_payments = ko.computed( function() {
			for ( var i = 0; i < self.payments_logs().length; i++ ) {
				if ( self.payments_logs()[ i ].failed ) {
					return true;
				}
			}
			return false;
		});

		this.has_delayed_payments = ko.computed( function() {
			for ( var i = 0; i < self.payments_logs().length; i++ ) {
				if ( self.payments_logs()[ i ].delayed ) {
					return true;
				}
			}
			return false;
		});

		this.payment_status = ko.computed( function() {
			var payment_status = '';
			if ( self.paid() != -1 ) {
				if ( self.price() == 0 ) {
					payment_status = '<div class="hb-payment-status hb-resa-paid" title="' + hb_text['paid'] + '">' + hb_text['paid'] + '</div>';
				} else if ( self.paid() <= 0 ) {
					payment_status = '<div class="hb-payment-status hb-resa-unpaid" title="' + hb_text['unpaid'] + '">' + hb_text['unpaid'] + '</div>';
				} else if ( hb_paid_security_bond == 'yes' ) {
					if (
						( round_price_for_compare( self.paid() ) < round_price_for_compare( self.price() ) ) ||
						(
							( round_price_for_compare( self.paid() ) < round_price_for_compare( self.price_with_security_bond() ) ) &&
							( hb_paid_security_bond == 'yes' ) &&
							( ! self.past() ) &&
							( hb_deposit_bond_paid == 'yes' )
						)
					)
					{
						payment_status = '<div class="hb-payment-status hb-resa-not-fully-paid" title="' + hb_text['not_fully_paid'] + '">' + hb_text['not_fully_paid'] + '</div>';
					} else if (
						( round_price_for_compare( self.paid() ) < round_price_for_compare( self.price_with_security_bond() ) ) &&
						( hb_paid_security_bond == 'yes' ) &&
						( ! self.past() ) &&
						( hb_deposit_bond_paid == 'no' )
					) {
						payment_status = '<div class="hb-payment-status hb-resa-not-fully-paid" title="' + hb_text['bond_not_paid'] + '">' + hb_text['bond_not_paid'] + '</div>';
					} else {
						payment_status = '<div class="hb-payment-status hb-resa-paid" title="' + hb_text['paid'] + '">' + hb_text['paid'] + '</div>';
					}
				} else {
					if ( round_price_for_compare( self.paid() ) >= round_price_for_compare( self.price() ) ) {
						payment_status = '<div class="hb-payment-status hb-resa-paid" title="' + hb_text['paid'] + '">' + hb_text['paid'] + '</div>';
					} else {
						payment_status = '<div class="hb-payment-status hb-resa-not-fully-paid" title="' + hb_text['not_fully_paid'] + '">' + hb_text['not_fully_paid'] + '</div>';
					}
				}
				if ( self.has_failed_payments() ) {
					payment_status += '<div class="hb-payment-status hb-resa-payment-failed" title="' + hb_text['payments_failed'] + '">' + hb_text['payments_failed'] + '</div>';
				}
				if ( self.has_delayed_payments() ) {
					payment_status += '<div class="hb-payment-status hb-resa-payment-delayed" title="' + hb_text['payments_delayed'] + '">' + hb_text['payments_delayed'] + '</div>';
				}
			}
			return payment_status;
		});

		this.price_paid_details = ko.computed( function() {
			if ( self.paid() == 0 ) {
				return '';
			}
			if ( ( hb_paid_security_bond == 'no' ) && ( self.paid() == self.price() ) ) {
				return '';
			}
			if ( hb_paid_security_bond == 'yes' ) {
				if ( self.past() && ( self.paid() == self.price() ) ) {
					return '';
				}
				if ( ! self.past() && ( self.paid() == self.price_with_security_bond() ) ) {
					return '';
				}
			}
			var paid_details = '';
			paid_details += '<div>';
			paid_details += hb_text['paid_details'] + ' ' + hb_format_price( self.paid() );
			paid_details += '</div>';
			return paid_details;
		});

		this.unpaid = ko.computed( function() {
			if ( ( hb_paid_security_bond == 'yes' ) && ( ! self.past() ) ) {
				return self.price_with_security_bond() - self.paid();
			} else {
				return self.price() - self.paid();
			}
		});

		this.price_details = ko.computed( function() {
			var price = '';
			price += self.price_paid_details();
			if ( self.past() ) {
				if ( round_price_for_compare( self.paid() ) < round_price_for_compare( self.price() ) ) {
					price += '<div>';
					price += hb_text['to_be_paid_details'];
					price += '<span class="hb-amount-due">';
					price += ' ' + hb_format_price( self.price() - self.paid() );
					price += '</span>';
					price += '</div>';
				}
				if ( round_price_for_compare( self.paid() ) > round_price_for_compare( self.price() ) ) {
					price += '<div>';
					price += hb_text['to_refund'];
					price += '<span class="hb-amount-due">';
					price += hb_format_price( self.paid() - self.price() );
					price += '</span>';
					price += '</div>';
				}
			} else {
				if (
					(
						( hb_paid_security_bond == 'no' ) &&
						( round_price_for_compare( self.paid() ) < round_price_for_compare( self.price() ) )
					) ||
					(
						( hb_paid_security_bond == 'yes' ) &&
						( round_price_for_compare( self.paid() ) < round_price_for_compare( self.price_with_security_bond() ) )
					)
				) {
					price += '<div>';
					price += hb_text['to_be_paid_details'] + ' ';
					if ( hb_paid_security_bond == 'no' ) {
						price += hb_format_price( self.price() - self.paid() );
					} else {
						price += hb_format_price( self.price_with_security_bond() - self.paid() );
					}
					price += '</div>';
				}
			}
			return price;
		})

		this.charge_action_visible = ko.computed( function() {
			if (
				( hb_stripe_active != 'yes' ) ||
				( ! self.customer_id() ) ||
				( self.customer_id() == '0' )
			) {
				return false;
			}
			var customer = ko.utils.arrayFirst( view_model.customers_list(), function( customer ) {
				return self.customer_id() == customer.id;
			});
			if ( ! customer || ! customer.payment_id ) {
				return false;
			}
			return true;
		});

		this.stripe_max_refundable = ko.computed( function() {
			var stripe_max_refundable = 0;
			for ( var i = 0; i < self.payments_logs().length; i++ ) {
				if ( ( self.payments_logs()[ i ].payment_method == 'Stripe' ) && ( self.payments_logs()[ i ].amount > 0 ) ) {
					stripe_max_refundable += parseFloat( self.payments_logs()[ i ].amount - self.payments_logs()[ i ].refunded_amount );
				}
			}
			return stripe_max_refundable;
		});

		this.payment_amount_is_positive = ko.computed( function() {
			var payment_amount_str = self.payment_amount().toString();
			if ( payment_amount_str.trim().charAt( 0 ) == '-' ) {
				return false;
			} else {
				return true;
			}
		});

		this.refund_action_visible = ko.computed( function() {
			if ( hb_stripe_active != 'yes' ) {
				return false;
			}
			var payment_amount = self.payment_amount().toString().trim();
			if ( ( payment_amount == '') || ( payment_amount == '-' ) ) {
				return true;
			} else if ( ( parseFloat( payment_amount ) < 0 ) && ( parseFloat( payment_amount ) >= self.stripe_max_refundable() * -1 ) ) {
				return true;
			} else {
				return false;
			}
		});

		this.check_in_formatted = ko.computed( function() {
			return hb_formatted_date( self.check_in() );
		});

		this.check_out_formatted = ko.computed( function() {
			return hb_formatted_date( self.check_out() );
		});

		this.check_in_tmp = ko.computed( function() {
			return hb_db_formatted_date( self.check_in_tmp_input() );
		});

		this.check_out_tmp = ko.computed( function() {
			return hb_db_formatted_date( self.check_out_tmp_input() );
		});

		this.payment_received_on = ko.computed( function() {
			return hb_db_formatted_date( self.payment_received_on_input() );
		});

		this.nb_nights = ko.computed( function() {
			if ( hb_charge_per_day == 'yes' ) {
				return hb_nb_days( self.check_in(), self.check_out() ) + 1;
			} else {
				return hb_nb_days( self.check_in(), self.check_out() );
			}
		});

		this.nb_nights_tmp = ko.computed( function() {
			if ( ! self.editing_dates() ||
				! self.check_in_tmp() ||
				! self.check_out_tmp() ||
				! hb_valid_date( self.check_in_tmp() ) ||
				! hb_valid_date( self.check_out_tmp() )
			) {
				return '';
			} else {
				if ( hb_charge_per_day == 'yes' ) {
					return hb_nb_days( self.check_in_tmp(), self.check_out_tmp() ) + 1;
				} else {
					return hb_nb_days( self.check_in_tmp(), self.check_out_tmp() );
				}
			}
		});

		this.accom = ko.computed( function() {
			if ( self.accom_id() in accoms ) {
				var accom_txt = accoms[ self.accom_id() ].name;
				if ( hb_show_accom_num == 'yes' ) {
					if ( self.accom_num() == 0 ) {
						accom_txt += ' <small>' + hb_text['not_allocated'] + '</small>';
					} else if ( accoms[ self.accom_id() ].num_name[ self.accom_num() ] ) {
						accom_txt += ' <small>(' + accoms[ self.accom_id() ].num_name[ self.accom_num() ] + ')</small>';
					}
				}
				return accom_txt;
			} else {
				return '';
			}
		});

		this.accom_editor = ko.computed( function() {
			if ( ! self.editing_accom() ) {
				return '';
			}
			var accom_editor_html = '',
				avai_accom = self.avai_accom_same_dates();
			for ( var i = 0; i < avai_accom.length; i++ ) {
				for ( var j = 0; j < avai_accom[i].accom_num.length; j++ ) {
					var accom_id = avai_accom[i].accom_id,
						accom_num = avai_accom[i].accom_num[j],
						input_id = 'hb-accom-change-' + accom_id + '-' + accom_num;
					accom_editor_html += '<div class="hb-accom-editor-radio">';
					accom_editor_html += '<input type="radio" id="' + input_id + '" name="hb-accom-change"';
					accom_editor_html += ' data-accom-id="' + accom_id + '" data-accom-num="' + accom_num + '" />';
					accom_editor_html += '<label for="' + input_id + '">';
					accom_editor_html += accoms[ accom_id ].name + ' (' + accoms[ accom_id ].num_name[ accom_num ] + ')';
					accom_editor_html += '</label>';
					accom_editor_html += '</div>';
				}
			}
			return accom_editor_html;
		});

		this.resa_info_html = ko.computed( function() {
			var markup = '';
			var additional_info = '';
			var legacy_additional_info = '';
			var lang_info = '';
			var adults = 0;
			var children = 0;

			if ( self.is_parent ) {
				for ( var i = 0; i < self.active_children_resa().length; i++ ) {
					adults += parseInt( self.active_children_resa()[i].adults() );
					children += parseInt( self.active_children_resa()[i].children() );
				}
			} else {
				adults = self.adults();
				children = self.children();
			}

			markup += '<b>' + hb_text.info_adults + '</b> ' + adults + '<br/>';
			if ( children != 0 ) {
				markup += '<b>' + hb_text.info_children + '</b> ' + children + '<br/>';
			}

			if ( self.is_child ) {
				return markup;
			}

			var additional_info_data;
			try {
				additional_info_data = JSON.parse( self.additional_info() );
			} catch ( e ) {
				additional_info_data = {};
			}

			$.each( additional_info_data, function( info_id, info_value ) {
				if ( info_value != '' ) {
					if ( hb_additional_info_fields[ info_id ] ) {
						additional_info += '<b>' + hb_additional_info_fields[ info_id ]['name'] + ':</b> ';
						if ( hb_additional_info_fields[ info_id ]['type'] == 'textarea' ) {
							additional_info += '<br/>';
						}
						additional_info += info_value.replace( /(?:\r\n|\r|\n)/g, '<br/>' ) + '<br/>';
					} else {
						legacy_additional_info += '<i>' + info_id + '</i>: ';
						legacy_additional_info += info_value.replace( /(?:\r\n|\r|\n)/g, '<br/>' ) + '<br/>';
					}
				}
			});

			if ( hb_multi_lang_site == 'yes' ) {
				lang_info = '<b>' + hb_text.resa_lang + '</b><br/>';
				if ( self.lang() in hb_langs ) {
					lang_info += hb_langs[ self.lang() ];
				} else {
					lang_info += self.lang();
				}
				lang_info += '<br/>';
			}

			if ( additional_info || legacy_additional_info || lang_info ) {
				markup += '<a href="#" class="hb-resa-more-info-toggle">';
				markup += '<span class="hb-more-info-link">' + hb_text.more_info + '</span>';
				markup += '<span class="hb-less-info-link">' + hb_text.less_info + '</span>';
				markup += '</a>';
				markup += '<div class="hb-resa-more-info-content">';
				markup += additional_info;
				if ( legacy_additional_info ) {
					markup += '<b>' + hb_text.legacy_info + ':</b><br/>';
					markup += legacy_additional_info;
				}
				markup += lang_info;
				markup += '</div>';
			}
			return markup;
		});

		this.additional_info_editing_markup = ko.computed( function() {
			var additional_info_edit_markup = '';

			var additional_info_data;
			try {
				additional_info_data = JSON.parse( self.additional_info() );
			} catch ( e ) {
				additional_info_data = [];
			}

			if ( ! additional_info_data ) {
				additional_info_data = [];
			}

			var current_additional_info_fields = { ...hb_additional_info_fields };
			var additional_info_fields_keys = Object.keys( hb_additional_info_fields );

			$.each( additional_info_data, function( id, value ) {
				if ( additional_info_fields_keys.indexOf( id ) == -1 ) {
					current_additional_info_fields[ id ] = {
						'name': id,
						'type': 'text'
					}
				}
			});

			$.each( current_additional_info_fields, function( field_id, field_info ) {
				additional_info_edit_markup += field_info['name'] + '<br/>';
				if ( field_info['type'] == 'textarea' ) {
					additional_info_edit_markup += '<textarea ';
					additional_info_edit_markup += 'rows="2" ';
					additional_info_edit_markup += 'class="hb-textarea-edit-resa hb-input-additional-info-resa-';
					if ( self.is_parent ) {
						additional_info_edit_markup += 'p-';
					}
					additional_info_edit_markup += self.id + '" ';
					additional_info_edit_markup += 'data-id="' + field_id + '" ';
					additional_info_edit_markup += '>';
					if ( additional_info_data[ field_id ] ) {
						additional_info_edit_markup += additional_info_data[ field_id ];
					}
					additional_info_edit_markup += '</textarea>';
				} else {
					additional_info_edit_markup += '<input ';
					additional_info_edit_markup += 'class="hb-input-edit-resa hb-input-additional-info-resa-';
					if ( self.is_parent ) {
						additional_info_edit_markup += 'p-';
					}
					additional_info_edit_markup += self.id + '" ';
					additional_info_edit_markup += 'type="text" ';
					if ( additional_info_data[ field_id ] ) {
						additional_info_edit_markup += 'value="' +  additional_info_data[ field_id ] + '" ';
					}
					additional_info_edit_markup += 'data-id="' + field_id + '" ';
					additional_info_edit_markup += '/>';
				}
			});

			return additional_info_edit_markup;
		});

		this.options_editor_class = ko.computed( function() {
			return 'hb-options-editor hb-options-editor-resa-' + self.id;
		});

		this.admin_comment_html = ko.computed( function() {
			return self.admin_comment().replace( /(?:\r\n|\r|\n)/g, '<br/>' );
		});

		this.customer_info_markup = ko.computed( function() {
			var customer_info_markup = '',
				customer_more_info_markup = '',
				customer_legacy_info_markup = '',
				customer,
				customer_data,
				nb_data = 0;

			if ( ! self.customer_id() || self.customer_id() == '0' ) {
				return '';
			}

			customer = ko.utils.arrayFirst( view_model.customers_list(), function( customer ) {
				return self.customer_id() == customer.id;
			});

			if ( ! customer ) {
				return '';
			}

			customer_data = customer.customer_data();
			if ( ! customer_data ) {
				return customer.info();
			}

			$.each( customer_data, function( info_id, info_value ) {
				if ( info_value != '' ) {
					nb_data++;
					var info_markup = '';
					if ( hb_customer_fields[ info_id ] ) {
						info_markup += '<b>' + hb_customer_fields[ info_id ]['name'] + ':</b> ';
						if ( hb_customer_fields[ info_id ]['type'] == 'textarea' ) {
							info_markup += '<br/>';
						}
					} else {
						info_markup += '<i>' + info_id + '</i>: ';
					}
					if ( info_id == 'country_iso' ) {
						if ( info_value == 'US' ) {
							info_markup += 'USA';
							if ( customer_data['usa_state_iso'] ) {
								info_markup += ' (' + hb_countries['usa_state_iso'][ customer_data['usa_state_iso'] ] + ')';
							}
						} else {
							info_markup += hb_countries['country_iso'][ info_value ];
							if ( ( info_value == 'CA' ) && ( customer_data['canada_province_iso'] ) ) {
								info_markup += ' (' + hb_countries['canada_province_iso'][ customer_data['canada_province_iso'] ] + ')';
							}
						}
						info_markup += '<br/>';
					} else if ( ( info_id != 'usa_state_iso' ) && ( info_id != 'canada_province_iso' ) ) {
						info_markup += info_value.replace( /(?:\r\n|\r|\n)/g, '<br/>' );
						info_markup += '<br/>';
					}
					if ( hb_customer_fields[ info_id ] ) {
						if ( nb_data <= 2 ) {
							customer_info_markup += info_markup;
						} else {
							customer_more_info_markup += info_markup;
						}
					} else if ( ( info_id != 'usa_state_iso' ) && ( info_id != 'canada_province_iso' ) ) {
						customer_legacy_info_markup += info_markup;
					}
				}
			});

			customer_info_markup = '<b>' + hb_text.customer_id + '</b> ' + self.customer_id() + '<br/>' + customer_info_markup;
			if ( ( customer_more_info_markup != '' ) || ( customer_legacy_info_markup != '' ) ) {
				customer_info_markup += '<a href="#" class="hb-resa-more-info-toggle">';
				customer_info_markup += '<span class="hb-more-info-link">' + hb_text.more_info + '</span>';
				customer_info_markup += '<span class="hb-less-info-link">' + hb_text.less_info + '</span>';
				customer_info_markup += '</a>';
				customer_info_markup += '<div class="hb-resa-more-info-content">';
				customer_info_markup += customer_more_info_markup;
				if ( customer_legacy_info_markup ) {
					customer_info_markup += '<b>' + hb_text.legacy_info + ':</b><br/>';
					customer_info_markup += customer_legacy_info_markup;
				}
				customer_info_markup += '</div>';
			}
			return customer_info_markup;
		});

		this.customer_info_editing_markup = ko.computed( function() {
			var customer_edit_markup = '',
				customer_data = [];

			if ( self.customer_id() != 0 ) {
				var customer = ko.utils.arrayFirst( view_model.customers_list(), function( customer ) {
					return self.customer_id() == customer.id;
				});
				if ( customer ) {
					customer_data = customer.customer_data();
				}
			}

			function country_select_markup( country_info ) {
				var select_markup = '';
				select_markup += '<div class="';
				select_markup += 'hb-select-edit-customer-country-wrapper ';
				select_markup += 'hb-select-edit-customer-country-wrapper-resa-' + self.id + ' ';
				select_markup += 'hb-select-edit-customer-country-wrapper-' + country_info + '">';
				select_markup += hb_text[ country_info ];
				select_markup += '<select ';
				select_markup += 'class="hb-select-edit-resa hb-input-customer-resa-' + self.id + '" ';
				select_markup += 'data-resa-id="' + self.id +'" ';
				select_markup += 'data-id="' + country_info +'">';
				select_markup += '<option value=""></option>';
				$.each( hb_countries[ country_info ], function( country_code, country_label ) {
					select_markup += '<option value="' + country_code + '"';
					if ( customer_data[ country_info ] && customer_data[ country_info ] == country_code ) {
						select_markup += ' selected';
					}
					select_markup += '>';
					select_markup += country_label;
					select_markup += '</option>';
				});
				select_markup += '</select>';
				select_markup += '</div>';
				return select_markup;
			}

			var current_customer_fields = { ...hb_customer_fields };
			var customer_fields_keys = Object.keys( hb_customer_fields );

			$.each( customer_data, function( id, value ) {
				if ( customer_fields_keys.indexOf( id ) == -1 ) {
					current_customer_fields[ id ] = {
						'name': id,
						'type': 'text'
					}
				}
			});

			$.each( current_customer_fields, function( field_id, field_info ) {
				if ( field_id != 'country_iso' ) {
					customer_edit_markup += field_info['name'];
					customer_edit_markup += '<br/>';
				}
				if ( field_info['type'] == 'country_select' ) {
					var countries_select_ids = ['country_iso', 'usa_state_iso', 'canada_province_iso'];
					for ( var i = 0; i < countries_select_ids.length; i++ ) {
						customer_edit_markup += country_select_markup( countries_select_ids[ i ] );
					}
				} else if ( field_info['type'] == 'textarea' ) {
					customer_edit_markup += '<textarea ';
					customer_edit_markup += 'rows="2" ';
					customer_edit_markup += 'class="hb-textarea-edit-resa hb-input-customer-resa-' + self.id + '" ';
					customer_edit_markup += 'data-id="' + field_id + '" ';
					customer_edit_markup += '>';
					if ( customer_data[ field_id ] ) {
						customer_edit_markup += customer_data[ field_id ];
					}
					customer_edit_markup += '</textarea>';
				} else {
					customer_edit_markup += '<input ';
					customer_edit_markup += 'class="hb-input-edit-resa hb-input-customer-resa-' + self.id + '" ';
					customer_edit_markup += 'type="text" ';
					if ( customer_data[ field_id ] ) {
						customer_edit_markup += 'value="' + customer_data[ field_id ] + '" ';
					}
					customer_edit_markup += 'data-id="' + field_id + '" ';
					customer_edit_markup += '/>';
				}
			});

			return customer_edit_markup;
		});

		this.customer_has_multiple_resa = ko.computed( function() {
			if ( hb_customers[ self.customer_id() ] ) {
				if ( hb_customers[ self.customer_id() ]['nb_resa'] > 1 ) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		});

		this.customer_nb_resa = ko.computed( function() {
			if ( hb_customers[ self.customer_id() ] ) {
				return hb_text.customer_resa.replace( '%s', hb_customers[ self.customer_id() ]['nb_resa'] );
			} else {
				return '';
			}
		});

		this.customer_multiple_resa_link = ko.computed( function() {
			if ( hb_customers[ self.customer_id() ] ) {
				return hb_resa_customer_page_url + self.customer_id();
			} else {
				return '';
			}
		});

		this.nb_emails_sent_text = ko.computed( function() {
			if ( self.email_logs().length > 0 ) {
				var nb_emails = self.email_logs().length;
			} else {
				var nb_emails = self.nb_emails_sent;
			}
			if ( nb_emails == 1 ) {
				return hb_text.one_email_sent;
			} else if ( nb_emails > 1 ) {
				return hb_text.emails_sent.replace( '%s', nb_emails );
			} else {
				return '';
			}
		});

		this.document_resa_link = ko.computed( function() {
			for ( var i = 0; i < hb_document_templates.length; i++ ) {
				if ( hb_document_templates[i]['lang'] == '' || hb_document_templates[i]['lang'] == self.lang() ) {
					var returned_link = hb_resa_document_page_url + hb_document_templates[i]['id'] + '&resa_id=' + self.id;
					if ( self.is_parent ) {
						returned_link += '&is_parent=1';
					}
					return returned_link;
				}
			}
		});

		this.document_resa_title = ko.computed( function() {
			for ( var i = 0; i < hb_document_templates.length; i++ ) {
				if ( hb_document_templates[i]['lang'] == '' || hb_document_templates[i]['lang'] == self.lang() ) {
					return hb_document_templates[i]['name'];
				}
			}
		});

		this.documents_resa_links = ko.computed( function() {
			var doc_links = '';
			for ( var i = 0; i < hb_document_templates.length; i++ ) {
				if ( hb_document_templates[i]['lang'] == '' || hb_document_templates[i]['lang'] == self.lang() ) {
					doc_links += '<a href="';
					doc_links += hb_resa_document_page_url + hb_document_templates[i]['id'] + '&resa_id=' + self.id;
					if ( self.is_parent ) {
						doc_links += '&is_parent=1';
					}
					doc_links += '" class="hb-open-document" target="_blank">'
					doc_links += hb_document_templates[i]['name'];
					doc_links += '</a>';
				}
			}
			return doc_links;
		});

		this.documents_resa_nb = ko.computed( function() {
			var nb_doc = 0;
			for ( var i = 0; i < hb_document_templates.length; i++ ) {
				if ( hb_document_templates[i]['lang'] == '' || hb_document_templates[i]['lang'] == self.lang() ) {
					nb_doc++;
				}
			}
			return nb_doc;
		});

		this.email_customer_attachment_titles = ko.computed( function() {
			if ( self.email_customer_attachment_ids() ) {
				return hb_media_titles[ self.email_customer_attachment_ids() ] + '<br/>';
			} else {
				return '';
			}
		});

		if ( ! self.is_parent ) {
			this.status.subscribe( function() {
				resaViewModel.redraw_calendar();
			});

			this.accom_id.subscribe( function() {
				resaViewModel.redraw_calendar();
			});

			this.accom_num.subscribe( function() {
				resaViewModel.redraw_calendar();
			});

			this.check_in.subscribe( function() {
				resaViewModel.redraw_calendar();
			});

			this.check_out.subscribe( function() {
				resaViewModel.redraw_calendar();
			});
		}

		this.email_templates_options = ko.computed( function() {
			var email_tmpls_options = [];
			email_tmpls_options.push({
				'id': '',
				'name': hb_text.email_templates_caption
			});
			$.each( hb_email_templates, function( email_tmpl_id, email_tmpl_values ) {
				var email_tmpl_accom = [];
				if ( email_tmpl_values['accom'] ) {
					email_tmpl_accom = email_tmpl_values['accom'].split( ',' );
				}
				if (
					(
						( email_tmpl_values['lang'] == 'all' ) ||
						( email_tmpl_values['lang'] == self.lang() )
					) &&
					(
						( email_tmpl_accom.indexOf( self.accom_id() ) >= 0 ) ||
						( ( email_tmpl_values['all_accom'] == 1 ) && ! self.is_parent ) ||
						( ( email_tmpl_values['multiple_accom'] == 1 ) && self.is_parent )
					)
				) {
					var email_tmpls_option = {
						'id': email_tmpl_id,
						'name': email_tmpl_values['name']
					};
					email_tmpls_options.push( email_tmpls_option );
				}
			});
			return email_tmpls_options;
		});

		this.email_customer_template.subscribe( function( email_template_id ) {
			if ( ! email_template_id ) {
				self.email_customer_to_address( '' );
				self.email_customer_subject( '' );
				self.email_customer_message( '' );
			} else {
				self.email_customer_to_address( hb_email_templates[ email_template_id ]['to_address'] );
				self.email_customer_subject( hb_email_templates[ email_template_id ]['subject'] );
				self.email_customer_message( hb_email_templates[ email_template_id ]['message'] );
			}
		});
	}

	function Payment( payment_data ) {
		this.id = payment_data.id;
		this.received_on = payment_data.received_on;
		this.amount = payment_data.amount;
		this.refunded_amount = payment_data.refunded_amount;
		this.comment = payment_data.comment;
		this.online = payment_data.online;
		this.payment_method = payment_data.payment_method;
		this.deleting_payment = ko.observable( false );
		if ( payment_data.amount > payment_data.refunded_amount ) {
			this.refunded = false;
		} else {
			this.refunded = true;
		}
		if ( payment_data.gateway_info != undefined ) {
			this.gateway_info = payment_data.gateway_info;
		} else {
			this.gateway_info = '';
		}
		if ( payment_data.delayed != undefined ) {
			this.delayed = true;
		} else {
			this.delayed = false;
		}
		if ( payment_data.failed != undefined ) {
			this.failed = true;
		} else {
			this.failed = false;
		}
	}

	function BlockedAccom( from_date, to_date, accom_id, accom_num, accom_all_num, accom_all_ids, comment, linked_resa_id, is_prepa_time ) {
		this.from_date = ko.observable( from_date );
		this.to_date = ko.observable( to_date );
		this.accom_id = accom_id;
		this.accom_num = accom_num;
		this.accom_all_num = parseInt( accom_all_num );
		this.accom_all_ids = parseInt( accom_all_ids );
		this.comment = comment;
		this.linked_resa_id = linked_resa_id;
		this.is_prepa_time = is_prepa_time;
		this.deleting = ko.observable( false );
		this.anim_class = ko.observable( '' );

		if ( this.accom_all_ids ) {
			this.accom_name_num = hb_text.all;
		} else if ( this.accom_id in accoms ) {
			this.accom_name_num = accoms[ this.accom_id ].name;
			if ( ! this.accom_all_num && accoms[ this.accom_id ].num_name[ this.accom_num ] ) {
				this.accom_name_num += ' (' + accoms[ this.accom_id ].num_name[ this.accom_num ] + ')';
			}
		} else {
			this.accom_name_num = '';
		}

		this.from_date_display = from_date;
		this.to_date_display = to_date;
		if ( from_date == '2016-01-01' || from_date == '0000-00-00' ) {
			this.from_date_display = '';
		} else {
			this.from_date_display = hb_formatted_date( from_date );
		}
		if ( to_date == '2029-12-31' || to_date == '0000-00-00' ) {
			this.to_date_display = '';
		} else {
			this.to_date_display = hb_formatted_date( to_date );
		}

		this.from_date.subscribe( function() {
			resaViewModel.redraw_calendar();
		});

		this.to_date.subscribe( function() {
			resaViewModel.redraw_calendar();
		});
	}

	function Customer( id, info, payment_id ) {
		this.id = id;
		this.info = ko.observable( info );
		this.payment_id = payment_id;

		var self = this;

		this.customer_data = ko.computed( function() {
			if ( ! self.info() ) {
				return [];
			}
			var data;
			try {
				data = JSON.parse( self.info() );
			} catch ( e ) {
				return [];
			}
			if ( ! data ) {
				return [];
			} else {
				return data;
			}
		});

		this.first_name = ko.computed( function() {
			if ( self.customer_data()['first_name'] ) {
				return self.customer_data()['first_name'];
			} else {
				return '';
			}
		});

		this.last_name = ko.computed( function() {
			if ( self.customer_data()['last_name'] ) {
				return self.customer_data()['last_name'];
			} else {
				return '';
			}
		});

		this.email = ko.computed( function() {
			if ( self.customer_data()['email'] ) {
				return self.customer_data()['email'];
			} else {
				return '';
			}
		});

		this.name_email = ko.computed( function() {
			var name_email_raw = self.first_name() + self.last_name() + self.email();
			return name_email_raw.toLowerCase();
		});
	}

	function ResaViewModel() {

		var self = this;

		this.resa = ko.observableArray();
		this.blocked_accom = ko.observableArray();
		this.customers_list = ko.observableArray();

		this.redraw_calendar = function() {
			hb_set_resa_cal( self.resa(), self.blocked_accom(), self.customers_list(), $( '#hb-resa-cal-table' ).data( 'first-day'), displayed_accoms );
		}

		this.resa.subscribe( function() {
			self.redraw_calendar();
		});

		this.blocked_accom.subscribe( function() {
			self.redraw_calendar();
		});

		this.customers_list.subscribe( function() {
			self.redraw_calendar();
		});

		this.confirm_resa = function( resa ) {
			$( '.hb-resa-bulk-action' ).val( 'no_action' );
			var resas = [ resa ];
			bulk_action_functions['confirm']( resas );
		}

		this.cancel_resa = function( resa ) {
			if ( confirm( hb_text.confirm_cancel_resa ) ) {
				$( '.hb-resa-bulk-action' ).val( 'no_action' );
				var resas = [ resa ];
				bulk_action_functions['cancel']( resas );
			}
		}

		this.delete_resa = function( resa ) {
			if ( confirm( hb_text.confirm_delete_resa ) ) {
				$( '.hb-resa-bulk-action' ).val( 'no_action' );
				var resas = [ resa ];
				bulk_action_functions['delete']( resas );
			}
		}

		function set_action_processing( resas, value ) {
			for ( var i = 0; i < resas.length; i++ ) {
				resas[i].action_processing( value );
			}
		}

		var bulk_action_functions = {
			'confirm': function( resas ) {
				var parent_resas = [];
				var parent_resas_ids = [];
				var children_to_confirm = [];
				var single_resas = [];
				var single_resas_ids = [];
				for ( var i = 0; i < resas.length; i++ ) {
					if ( resas[ i ].is_parent ) {
						parent_resas.push( resas[ i ] );
						parent_resas_ids.push( resas[ i ].id );
						children_to_confirm = children_to_confirm.concat( resas[ i ].children_resa() );
					}
				}
				for ( var i = 0; i < resas.length; i++ ) {
					if ( ! resas[ i ].is_parent && ( children_to_confirm.indexOf( resas[ i ] ) < 0 ) ) {
						single_resas.push( resas[ i ] );
						single_resas_ids.push( resas[ i ].id );
					}
				}
				var resas_to_confirm = children_to_confirm.concat( parent_resas, single_resas );
				set_action_processing( resas_to_confirm, true );
				hb_resa_ajax({
					data: {
						'action': 'hb_confirm_resas',
						'parent_resas_ids': parent_resas_ids,
						'single_resas_ids': single_resas_ids,
						'nonce': $( '#hb_nonce_update_db' ).val()
					},
					success: function( ajax_return ) {
						set_action_processing( resas_to_confirm, false );
						$( '.hb-bulk-action-spinner.spinner' ).css( 'display', 'none' );
						try {
							var response = JSON.parse( ajax_return );
						} catch ( e ) {
							alert( hb_text['error'] + ' ' + ajax_return );
							return false;
						}
						var confirm_error = false;
						for ( var i = 0; i < resas_to_confirm.length; i++ ) {
							if ( resas_to_confirm[i].is_parent ) {
								if ( response[ '#' + resas_to_confirm[ i ].id ]['status'] == 'confirmed' ) {
									resas_to_confirm[i].email_logs( response[ '#' + resas_to_confirm[ i ].id ]['email_logs'] );
								}
							} else {
								if (
									( resas_to_confirm[i].status() == 'new' ) &&
									( response[ resas_to_confirm[i].id ]['status'] == 'confirmed' )
								) {
									resas_to_confirm[i].status( 'confirmed' );
									if ( ! resas_to_confirm[i].is_child ) {
										resas_to_confirm[i].email_logs( response[ resas_to_confirm[ i ].id ]['email_logs'] );
									}
								} else if (
									( resas_to_confirm[i].status() == 'pending' ) &&
									( response[ resas_to_confirm[i].id ]['status'] == 'confirmed' )
								) {
									resas_to_confirm[i].status( 'confirmed' );
									resas_to_confirm[i].accom_num( response[ resas_to_confirm[i].id ]['accom_num'] );
									for ( var k = 0; k < response[ resas_to_confirm[i].id ]['automatic_blocked_accom'].length; k++ ) {
										var new_blocked_accom = new BlockedAccom(
											response[ resas_to_confirm[i].id ]['automatic_blocked_accom'][k]['from_date'],
											response[ resas_to_confirm[i].id ]['automatic_blocked_accom'][k]['to_date'],
											response[ resas_to_confirm[i].id ]['automatic_blocked_accom'][k]['accom_id'],
											response[ resas_to_confirm[i].id ]['automatic_blocked_accom'][k]['accom_num'],
											0,
											0,
											response[ resas_to_confirm[i].id ]['automatic_blocked_accom'][k]['comment'],
											response[ resas_to_confirm[i].id ]['automatic_blocked_accom'][k]['linked_resa_id'],
											response[ resas_to_confirm[i].id ]['automatic_blocked_accom'][k]['is_prepa_time']
										);
										self.blocked_accom.unshift( new_blocked_accom );
										if ( ! resas_to_confirm[i].is_child ) {
											resas_to_confirm[i].email_logs( response[ resas_to_confirm[ i ].id ]['email_logs'] );
										}
									}
								} else if (
									(
										( resas_to_confirm[i].status() == 'new' ) &&
										( response[ resas_to_confirm[i].id ]['status'] == 'new' )
									) || (
										( resas_to_confirm[i].status() == 'pending' ) &&
										( response[ resas_to_confirm[i].id ]['status'] == 'pending' )
									)
								) {
									confirm_error = true;
								}

							}
						}
						if ( confirm_error ) {
							if ( resas_to_confirm.length > 1 ) {
								alert( hb_text['no_accom_available_on_confirm_bulk'] );
							} else {
								alert( hb_text['no_accom_available_on_confirm'] );
							}
						} else {
							$( '.hb-resa-bulk-action' ).val( 'no_action' );
							$( '.hb-resa-bulk-action-msg' ).html( hb_text.resas_confirmed ).fadeIn();
							setTimeout( function() {
								$( '.hb-resa-bulk-action-msg' ).fadeOut();
							}, 4000 );
						}
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						set_action_processing( resas_to_confirm, false );
						$( '.hb-bulk-action-spinner.spinner' ).css( 'display', 'none' );
						alert( textStatus + ' (' + errorThrown + ')' );
					}
				});
			},

			'cancel': function( resas ) {
				var parent_resas = [];
				var parent_resas_ids = [];
				var children_to_be_cancelled = [];
				var single_resas = [];
				var single_resas_ids = [];
				for ( var i = 0; i < resas.length; i++ ) {
					if ( resas[ i ].is_parent ) {
						parent_resas.push( resas[ i ] );
						parent_resas_ids.push( resas[ i ].id );
						children_to_be_cancelled = children_to_be_cancelled.concat( resas[ i ].children_resa() );
					}
				}
				for ( var i = 0; i < resas.length; i++ ) {
					if ( ! resas[ i ].is_parent && ( children_to_be_cancelled.indexOf( resas[ i ] ) < 0 ) ) {
						single_resas.push( resas[ i ] );
						single_resas_ids.push( resas[ i ].id );
					}
				}
				var resas_to_set_processing = children_to_be_cancelled.concat( parent_resas, single_resas );
				set_action_processing( resas_to_set_processing, true );
				hb_resa_ajax({
					data: {
						'action': 'hb_cancel_resas',
						'parent_resas_ids': parent_resas_ids,
						'single_resas_ids': single_resas_ids,
						'nonce': $( '#hb_nonce_update_db' ).val()
					},
					success: function( ajax_return ) {
						set_action_processing( resas_to_set_processing, false );
						$( '.hb-bulk-action-spinner.spinner' ).css( 'display', 'none' );
						try {
							var response = JSON.parse( ajax_return );
						} catch ( e ) {
							alert( hb_text['error'] + ' ' + ajax_return );
							return false;
						}
						$( '.hb-resa-bulk-action' ).val( 'no_action' );
						var resas_to_cancel = parent_resas.concat( single_resas );
						for ( var i = 0; i < resas_to_cancel.length; i++ ) {
							if ( resas_to_cancel[i].is_parent ) {
								if ( response[ '#' + resas_to_cancel[ i ].id ]['new_status'] == 'cancelled' ) {
									resas_to_cancel[i].email_logs( response[ '#' + resas_to_cancel[ i ].id ]['email_logs'] );
									for ( var j = 0; j < resas_to_cancel[ i ].children_resa().length; j++ ) {
										resas_to_cancel[ i ].children_resa()[ j ].status( 'cancelled' );
										self.blocked_accom.remove( function( blocked_accom ) {
											return blocked_accom.linked_resa_id == resas_to_cancel[ i ].children_resa()[ j ].id;
										});
									}
									if ( resas_to_cancel[i].price() != response[ '#' + resas_to_cancel[i].id ]['new_price'] ) {
										resas_to_cancel[i].previous_price( resas_to_cancel[i].price() );
										resas_to_cancel[i].price( response[ '#' + resas_to_cancel[i].id ]['new_price'] );
									}
								}
							} else {
								if ( response[ resas_to_cancel[ i ].id ]['new_status'] == 'cancelled' ) {
									resas_to_cancel[i].status( 'cancelled' );
									self.blocked_accom.remove( function( blocked_accom ) {
										return blocked_accom.linked_resa_id == resas_to_cancel[ i ].id;
									});
									if (
										( resas_to_cancel[i].parent_id != 0 ) &&
										( resas_to_cancel[i].parent_resa().price() != response[ '#' + resas_to_cancel[i].parent_resa().id ]['new_price'] )
									) {
										resas_to_cancel[i].parent_resa().previous_price( resas_to_cancel[i].parent_resa().price() );
										resas_to_cancel[i].parent_resa().price( response[ '#' + resas_to_cancel[i].parent_resa().id ]['new_price'] );
									} else {
										resas_to_cancel[i].email_logs( response[ resas_to_cancel[ i ].id ]['email_logs'] );
									}
								}
							}
						}
						$( '.hb-resa-bulk-action-msg' ).html( hb_text.resas_cancelled ).fadeIn();
						setTimeout( function() {
							$( '.hb-resa-bulk-action-msg' ).fadeOut();
						}, 4000 );
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						set_action_processing( resas_to_set_processing, false );
						$( '.hb-bulk-action-spinner.spinner' ).css( 'display', 'none' );
						alert( textStatus + ' (' + errorThrown + ')' );
					}
				});
			},

			'delete': function( resas ) {
				var parent_resas = [];
				var parent_resas_ids = [];
				var children_to_be_deleted = [];
				var single_resas = [];
				var single_resas_ids = [];
				for ( var i = 0; i < resas.length; i++ ) {
					if ( resas[ i ].is_parent ) {
						parent_resas.push( resas[ i ] );
						parent_resas_ids.push( resas[ i ].id );
						children_to_be_deleted = children_to_be_deleted.concat( resas[ i ].children_resa() );
					}
				}
				for ( var i = 0; i < resas.length; i++ ) {
					if ( ! resas[ i ].is_parent && ( children_to_be_deleted.indexOf( resas[ i ] ) < 0 ) ) {
						single_resas.push( resas[ i ] );
						single_resas_ids.push( resas[ i ].id );
					}
				}
				var resas_to_set_processing = children_to_be_deleted.concat( parent_resas, single_resas );
				set_action_processing( resas_to_set_processing, true );
				hb_resa_ajax({
					data: {
						'action': 'hb_delete_resas',
						'parent_resas_ids': parent_resas_ids,
						'single_resas_ids': single_resas_ids,
						'nonce': $( '#hb_nonce_update_db' ).val()
					},
					success: function( ajax_return ) {
						set_action_processing( resas_to_set_processing, false );
						$( '.hb-bulk-action-spinner.spinner' ).css( 'display', 'none' );
						try {
							var response = JSON.parse( ajax_return );
						} catch ( e ) {
							alert( hb_text['error'] + ' ' + ajax_return );
							return false;
						}
						var resas_to_delete = parent_resas.concat( single_resas );
						var resas_deleted = [];
						for ( var i = 0; i < resas_to_delete.length; i++ ) {
							if ( resas_to_delete[i].is_parent ) {
								if ( response[ '#' + resas_to_delete[ i ].id ] == 'deleted' ) {
									resas_deleted = resas_deleted.concat( resas_to_delete[ i ] );
									for ( var j = 0; j < resas_to_delete[ i ].children_resa().length; j++ ) {
										self.blocked_accom.remove( function( blocked_accom ) {
											return blocked_accom.linked_resa_id == resas_to_delete[ i ].children_resa()[ j ].id;
										});
										resas_deleted = resas_deleted.concat( resas_to_delete[ i ].children_resa()[ j ] );
									}
								}
							} else {
								if ( response[ resas_to_delete[ i ].id ] == 'deleted' ) {
									resas_deleted = resas_deleted.concat( resas_to_delete[ i ] );
									self.blocked_accom.remove( function( blocked_accom ) {
										return blocked_accom.linked_resa_id == resas_to_delete[ i ].id;
									});
									if (
										( resas_to_delete[i].parent_id != 0 ) &&
										( resas_to_delete[i].parent_resa().price() != response[ '##' + resas_to_delete[i].parent_resa().id ] )
									) {
										resas_to_delete[i].parent_resa().previous_price( resas_to_delete[i].parent_resa().price() );
										resas_to_delete[i].parent_resa().price( response[ '##' + resas_to_delete[i].parent_resa().id ] );
									}
								}
							}
						}
						if ( $( '.hb-resa-bulk-action' ).val() != 'no_action' ) {
							$( '.hb-resa-bulk-action' ).val( 'no_action' );
							$( '.hb-resa-bulk-action-msg' ).html( hb_text.resas_deleted ).fadeIn();
							setTimeout( function() {
								$( '.hb-resa-bulk-action-msg' ).fadeOut();
							}, 4000 );
						}
						for ( var i = 0; i < resas_deleted.length; i++ ) {
							resas_deleted[i].anim_class( 'hb-resa-deleting' );
							setTimeout( function( delayed_resa ) {
								return function() {
									self.resa.remove( delayed_resa );
								}
							}( resas_deleted[i] ), 300 );
						}
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						set_action_processing( resas_to_set_processing, false );
						$( '.hb-bulk-action-spinner.spinner' ).css( 'display', 'none' );
						console.log( jqXHR );
						console.log( jqXHR.responseText );
						alert( textStatus + ' (' + errorThrown + ')' );
					}
				});
			}
		}

		this.edit_resa_info = function( resa ) {
			resa.editing_resa_info( true );
			resa.adults_tmp( resa.adults() );
			resa.children_tmp( resa.children() );
			resa.lang_tmp( resa.lang() );
		}

		this.cancel_edit_resa_info = function( resa ) {
			resa.editing_resa_info( false );
		}

		this.save_resa_info = function( resa ) {
			resa.saving_resa_info( true );
			var additional_info = {};
			var parent_prefix = '';
			if ( resa.is_parent ) {
				parent_prefix = 'p-';
			}
			$( '.hb-input-additional-info-resa-' + parent_prefix + resa.id ).each( function() {
				if ( $( this ).val() != '' ) {
					additional_info[ $( this ).data( 'id' ) ] = $( this ).val();
				}
			});
			additional_info = JSON.stringify( additional_info );
			hb_resa_ajax({
				data: {
					action: 'hb_update_resa_info',
					resa_id: resa.id,
					resa_is_parent: resa.is_parent,
					adults: resa.adults_tmp(),
					children: resa.children_tmp(),
					lang: resa.lang_tmp(),
					additional_info: additional_info,
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.saving_resa_info( false );
					resa.editing_resa_info( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return false;
					}
					if ( response['status']  == 'resa_info_updated' ) {
						resa.lang( resa.lang_tmp() );
						resa.additional_info( additional_info );
						if ( resa.is_parent ) {
							return;
						}
						resa.adults( resa.adults_tmp() );
						resa.children( resa.children_tmp() );
						if ( resa.parent_id != 0 ) {
							resa.parent_resa().previous_price( resa.parent_resa().price() );
							resa.parent_resa().price( response['parent_new_price'] );
						}
						if ( response['new_price'] != -1 ) {
							resa.previous_price( format_price( resa.price() ) );
							resa.price( format_price( response['new_price'] ) );
						}
					} else if ( response['status'] == 'price_calc_error' ) {
						alert( response['error_msg'] );
					} else if ( response['status'] == 'db_error' ) {
						alert( 'Database error.' );
					} else {
						alert( 'Unexpected error.' );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.saving_resa_info( false );
					console.log( jqXHR );
					console.log( jqXHR.responseText );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.edit_customer = function( resa ) {
			show_hide_country_iso_info( resa.id );
			resa.editing_customer( true );
		}

		this.cancel_edit_customer = function( resa ) {
			resa.editing_customer( false );
		}

		function show_hide_country_iso_info( resa_id ) {
			$( '.hb-select-edit-customer-country-wrapper:not(.hb-select-edit-customer-country-wrapper-country_iso)' ).hide();
			var selector_class = '.hb-select-edit-customer-country-wrapper-resa-' + resa_id;
			var selected_country_iso = $( selector_class + ' [data-id="country_iso"]' ).val();
			if ( selected_country_iso == 'US' ) {
				$( selector_class + '.hb-select-edit-customer-country-wrapper-usa_state_iso' ).show();
			} else if ( selected_country_iso == 'CA' ) {
				$( selector_class + '.hb-select-edit-customer-country-wrapper-canada_province_iso' ).show();
			}
		}

		$( '.wrap' ).on( 'change', '.hb-select-edit-customer-country-wrapper-country_iso select', function() {
			show_hide_country_iso_info( $( this ).data( 'resa-id' ) );
		});

		$( '.wrap' ).on( 'change', '.hb-input-edit-resa', function() {
			var edit_resa_class = $( this ).attr( 'class' );
			edit_resa_class = edit_resa_class.replace( 'hb-input-edit-resa ', '' );
			var edit_resa_data_id = $( this ).data( 'id' );
			var selector = '.' + edit_resa_class + '[data-id="' + edit_resa_data_id + '"]';
			$( selector ).val( $( this ).val() );
		});

		this.save_customer = function( resa ) {
			resa.saving_customer( true );
			var customer_details = {},
				customer_email = '';
			$( '.hb-input-customer-resa-' + resa.id ).each( function() {
				if ( $( this ).val() != '' ) {
					customer_details[ $( this ).data( 'id' ) ] = $( this ).val();
				}
				if ( $( this ).data( 'id' ) == 'email' ) {
					customer_email = $( this ).val();
				}
			});
			customer_details = JSON.stringify( customer_details );
			hb_resa_ajax({
				data: {
					action: 'hb_update_customer',
					customer_id: resa.customer_id(),
					email: customer_email,
					info: customer_details,
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.saving_customer( false );
					resa.editing_customer( false );
					if ( ajax_return == 'customer updated' ) {
						var customer = ko.utils.arrayFirst( self.customers_list(), function( customer ) {
							return resa.customer_id() == customer.id;
						});
						customer.info( customer_details );
						self.redraw_calendar();
					} else {
						alert( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.saving_customer( false );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.create_customer = function( resa ) {
			resa.creating_customer( true );
			hb_resa_ajax({
				data: {
					action: 'hb_resa_create_new_customer',
					resa_id: resa.id,
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.creating_customer( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( ajax_return );
						return;
					}
					if ( response['customer_id'] ) {
						self.customers_list.push( new Customer( response['customer_id'], '', '' ) );
						resa.customer_id( response['customer_id'] );
						resa.editing_customer( true );
					} else {
						alert( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.creating_customer( false );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.select_customer = function( resa ) {
			resa.selecting_customer( true );
		}

		this.save_selected_customer = function( resa ) {
			resa.saving_selected_customer( true );
			hb_resa_ajax({
				data: {
					action: 'hb_save_selected_customer',
					resa_id: resa.id,
					customer_id: resa.select_customer_id(),
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.saving_selected_customer( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( ajax_return );
						return;
					}
					resa.customer_id( response['customer_id'] );
					resa.selecting_customer( false );
					self.resa_customers_list_filter( '' );
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.creating_customer( false );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		};

		this.cancel_select_customer = function( resa ) {
			resa.selecting_customer( false );
		};

		this.edit_accom = function( resa ) {
			resa.fetching_accom( true );
			hb_resa_ajax({
				data: {
					action: 'hb_edit_accom_get_avai',
					check_in: resa.check_in(),
					check_out: resa.check_out(),
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.fetching_accom( false );
					try {
						var avai_accom = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( ajax_return );
						return;
					}
					if ( avai_accom.length ) {
						resa.avai_accom_same_dates( avai_accom );
						resa.editing_accom( true );
					} else {
						resa.editing_accom_no_accom( true );
						setTimeout( function() {
							resa.editing_accom_no_accom( false );
						}, 3000 );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.fetching_accom( false );
					resa.editing_accom( false );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.save_accom = function( resa ) {
			var $selected_input = $( 'input[name="hb-accom-change"]:checked' );
			if ( ! $selected_input.length ) {
				alert( hb_text.accom_not_selected );
			} else {
				var accom_id = $selected_input.data( 'accom-id' ),
					accom_num = $selected_input.data( 'accom-num' );
				resa.editing_accom( false );
				resa.saving_accom( true );
				hb_resa_ajax({
					data: {
						action: 'hb_update_resa_accom',
						check_in: resa.check_in(),
						check_out: resa.check_out(),
						resa_id: resa.id,
						accom_id: accom_id,
						accom_num: accom_num,
						nonce: $( '#hb_nonce_update_db' ).val()
					},
					success: function( ajax_return ) {
						resa.saving_accom( false );
						try {
							var response = JSON.parse( ajax_return );
						} catch ( e ) {
							alert( hb_text['error'] + ' ' + ajax_return );
							return false;
						}
						if ( response['status'] == 'accom_updated' ) {
							resa.accom_id( accom_id );
							resa.accom_num( accom_num );
							self.blocked_accom.remove( function( blocked_accom ) {
								return blocked_accom.linked_resa_id == resa.id;
							});
							for ( var i = 0; i < response['automatic_blocked_accom'].length; i++ ) {
								var new_blocked_accom = new BlockedAccom(
									response['automatic_blocked_accom'][i]['from_date'],
									response['automatic_blocked_accom'][i]['to_date'],
									response['automatic_blocked_accom'][i]['accom_id'],
									response['automatic_blocked_accom'][i]['accom_num'],
									0,
									0,
									response['automatic_blocked_accom'][i]['comment'],
									response['automatic_blocked_accom'][i]['linked_resa_id'],
									response['automatic_blocked_accom'][i]['is_prepa_time']
								);
								self.blocked_accom.unshift( new_blocked_accom );
							}
							if ( resa.parent_id != 0 ) {
								resa.parent_resa().previous_price( resa.parent_resa().price() );
								resa.parent_resa().price( response['parent_new_price'] );
							}
							if ( resa.accom_price != -1 ) {
								update_discounts_info( resa, response['discounts'] );
							}
							if ( response['new_price'] != -1 ) {
								resa.previous_price( format_price( resa.price() ) );
								resa.price( format_price( response['new_price'] ) );
							}
						} else if ( response['status'] == 'accom_no_longer_available' ) {
							alert( response['msg'] );
						} else if ( response['status'] == 'price_calc_error' ) {
							alert( response['error_msg'] );
						} else if ( response['status'] == 'db_error' ) {
							alert( 'Database error.' );
						} else {
							alert( 'Unexpected error.' );
							console.log( ajax_return );
						}
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						resa.saving_accom( false );
						alert( textStatus + ' (' + errorThrown + ')' );
					}
				});
			}
		}

		this.cancel_edit_accom = function( resa ) {
			resa.editing_accom( false );
		}

		this.edit_dates = function( resa ) {
			resa.check_in_tmp_input( resa.check_in_formatted() );
			resa.check_out_tmp_input( resa.check_out_formatted() );
			$( '.hb-input-edit-resa-dates' ).datepick( hb_datepicker_calendar_options );
			$( '.hb-input-edit-resa-dates' ).datepick( 'option', {
				onSelect: function() {
					jQuery( this ).change();
				}
			});
			$( '.hb-input-edit-resa-check-in' ).change( function () {
				var check_in_date = $( this ).datepick( 'getDate' )[0],
					$check_out_date_input = jQuery( this ).parent().find( '.hb-input-edit-resa-check-out' ),
					check_out_date = $check_out_date_input.datepick( 'getDate' )[0];
				if ( check_in_date && check_out_date && ( check_in_date.getTime() >= check_out_date.getTime() ) ) {
					$check_out_date_input.datepick( 'setDate', null );
				}
				if ( check_in_date ) {
					var min_check_out = new Date( check_in_date.getTime() );
					min_check_out.setDate( min_check_out.getDate() + 1 );
					$check_out_date_input.datepick( 'option', 'minDate', min_check_out );
				}
			}).change();
			resa.editing_dates( true );
		}

		this.cancel_edit_dates = function( resa ) {
			resa.editing_dates( false );
		}

		this.save_dates = function( resa ) {
			if ( ! resa.nb_nights_tmp() ) {
				alert( hb_text.invalid_date );
				return;
			} else if ( resa.nb_nights_tmp() < 1 ) {
				alert( hb_text.check_out_before_check_in );
				return;
			} else if ( resa.check_in_tmp() == resa.check_in() && resa.check_out_tmp() == resa.check_out() ) {
				resa.editing_dates( false );
				return;
			}
			resa.saving_dates( true );
			hb_resa_ajax({
				data: {
					'action': 'hb_update_resa_dates',
					'resa_id': resa.id,
					'new_check_in': resa.check_in_tmp(),
					'new_check_out': resa.check_out_tmp(),
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.saving_dates( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return false;
					}
					if ( response['status']  == 'resa_dates_modified' ) {
						resa.editing_dates( false );
						resa.check_in( resa.check_in_tmp() );
						resa.check_out( resa.check_out_tmp() );
						self.blocked_accom.remove( function( blocked_accom ) {
							return blocked_accom.linked_resa_id == resa.id;
						});
						for ( var i = 0; i < response['automatic_blocked_accom'].length; i++ ) {
							var new_blocked_accom = new BlockedAccom(
								response['automatic_blocked_accom'][i]['from_date'],
								response['automatic_blocked_accom'][i]['to_date'],
								response['automatic_blocked_accom'][i]['accom_id'],
								response['automatic_blocked_accom'][i]['accom_num'],
								0,
								0,
								response['automatic_blocked_accom'][i]['comment'],
								response['automatic_blocked_accom'][i]['linked_resa_id'],
								response['automatic_blocked_accom'][i]['is_prepa_time']
							);
							self.blocked_accom.unshift( new_blocked_accom );
						}
						if ( resa.parent_id != 0 ) {
							resa.parent_resa().previous_price( resa.parent_resa().price() );
							resa.parent_resa().price( response['parent_new_price'] );
						}
						if ( resa.accom_price != -1 ) {
							update_discounts_info( resa, response['discounts'] );
						}
						if ( response['new_price'] != -1 ) {
							resa.previous_price( format_price( resa.price() ) );
							resa.price( format_price( response['new_price'] ) );
						}
					} else if ( response['status'] == 'resa_dates_not_modified' ) {
						alert( hb_text.resa_dates_not_modified );
					} else if ( response['status'] == 'price_calc_error' ) {
						alert( response['error_msg'] );
					} else if ( response['status'] == 'db_error' ) {
						alert( 'Database error.' );
					} else {
						alert( 'Unexpected error.' );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.saving_dates( false );
					console.log( jqXHR );
					console.log( jqXHR.responseText );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		function update_discounts_info( resa, discounts ) {
			if ( discounts.accom['amount_type'] ) {
				resa.accom_discount_amount( discounts.accom['amount'] );
				resa.accom_discount_amount_type( discounts.accom['amount_type'] );
			} else {
				resa.accom_discount_amount( '' );
				resa.accom_discount_amount_type( 'fixed' );
			}
			if ( discounts.global['amount_type'] ) {
				resa.global_discount_amount( discounts.global['amount'] );
				resa.global_discount_amount_type( discounts.global['amount_type'] );
			} else {
				resa.global_discount_amount( '' );
				resa.global_discount_amount_type( 'fixed' );
			}
		}

		this.edit_options = function( resa ) {
			resa.editing_options( true );
			resa.options_editor( '<p>' + hb_text.fetching_options_editor + '</p>' );
			hb_resa_ajax({
				data: {
					action: 'hb_edit_options_get_editor',
					resa_id: resa.id,
					resa_is_parent: resa.is_parent,
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.options_editor( ajax_return );
					hb_calculate_admin_options_price( resa.id );
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.editing_options( false );
					console.log( jqXHR );
					console.log( jqXHR.responseText );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.cancel_edit_options = function( resa ) {
			resa.editing_options( false );
		}

		this.save_options = function( resa, event ) {
			resa.saving_options( true );
			var $save_button = $( event.target );
			var $options_form = $save_button.parents( 'td' ).find( 'form.hb-options-form' );
			$options_form.append( '<input type="hidden" name="action" value="hb_update_resa_options" />' );
			$options_form.append( '<input type="hidden" name="resa_is_parent" value="' + resa.is_parent + '" />' );
			$options_form.append( '<input type="hidden" name="resa_id" value="' + resa.id + '" />' );
			$options_form.append( '<input type="hidden" name="resa_parent_id" value="' + resa.parent_id + '" />' );
			$options_form.append( '<input type="hidden" name="accom_id" value="' + resa.accom_id() + '" />' );
			$options_form.append( '<input type="hidden" name="nonce" value="' + $( '#hb_nonce_update_db' ).val() + '" />' );
			hb_resa_ajax({
				data: $options_form.serialize(),
				success: function( ajax_return ) {
					resa.editing_options( false );
					resa.saving_options( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return false;
					}
					if ( response['status']  == 'resa_options_updated' ) {
						resa.options_info( response['options_info'] );
						if ( resa.parent_id != 0 ) {
							resa.parent_resa().previous_price( resa.parent_resa().price() );
							resa.parent_resa().price( response['parent_new_price'] );
						}
						if ( resa.is_parent ) {
							resa.previous_price( format_price( resa.price() ) );
							resa.price( format_price( response['parent_new_price'] ) );
						} else if ( response['new_price'] != -1 ) {
							resa.previous_price( format_price( resa.price() ) );
							resa.price( format_price( response['new_price'] ) );
						}
					} else if ( response['status'] == 'price_calc_error' ) {
						alert( response['error_msg'] );
					} else if ( response['status'] == 'db_error' ) {
						alert( 'Database error.' );
					} else {
						alert( 'Unexpected error.' );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.edit_comment = function( resa ) {
			resa.editing_comment( true );
			resa.admin_comment_tmp( resa.admin_comment() );
		}

		this.cancel_edit_comment = function( resa ) {
			resa.editing_comment( false );
		}

		this.save_comment = function( resa ) {
			resa.saving_comment( true );
			hb_resa_ajax({
				data: {
					'action': 'hb_update_resa_comment',
					'resa_comment': resa.admin_comment_tmp(),
					'resa_id': resa.id,
					'resa_is_parent': resa.is_parent,
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.editing_comment( false );
					resa.saving_comment( false );
					if ( ajax_return == 'admin comment updated' ) {
						resa.admin_comment( resa.admin_comment_tmp() );
					} else {
						alert( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.charge = function( resa ) {
			if ( ! hb_is_valid_price( resa.payment_amount() ) ) {
				return;
			}
			if ( resa.payment_amount() <= 0 ) {
				alert( hb_text.charge_amount_negative );
				return;
			}
			var charge_max = resa.price() - resa.paid() + parseFloat( hb_security_bond );
			charge_max = parseFloat( charge_max.toFixed( 2 ) );
			if ( parseFloat( resa.payment_amount() ) > charge_max ) {
				var confirm_text = hb_text.charge_amount_too_high;
				var charge_max_text = hb_decode_entities( hb_format_price( charge_max ) );
				confirm_text = confirm_text.replace( '%amount', charge_max_text );
				if ( ! confirm( confirm_text ) ) {
					return;
				}
			}
			resa.charging( true );
			hb_resa_ajax({
				data: {
					'action': 'hb_resa_charge',
					'charge_amount': resa.payment_amount(),
					'resa_id': resa.id,
					'resa_is_parent': resa.is_parent,
					'resa_payment_comment': resa.payment_comment(),
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.charging( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return;
					}
					if ( response['status'] == 'charge_done' ) {
						var payment_info = {
							id: response['payment_id'],
							amount: resa.payment_amount(),
							refunded_amount: 0,
							payment_method: 'Stripe',
							gateway_info: response['gateway_info'],
							comment: resa.payment_comment(),
							online: 'yes',
							received_on: response['charged_on'],
						};
						resa.payments_logs.unshift( new Payment( payment_info ) );
						resa.payment_amount( '' );
					} else if ( response['status'] == 'error' ) {
						alert( response['error_msg'] );
					} else {
						alert( 'Unexpected error.' );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.charging( false );
					console.log( jqXHR );
					console.log( jqXHR.responseText );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		};

		this.refund = function( resa ) {
			if ( ! hb_is_valid_price( resa.payment_amount() ) ) {
				return;
			}
			if ( resa.payment_amount() >= 0 ) {
				alert( hb_text.refund_amount_positive );
				return;
			}
			if ( resa.payment_amount() * - 1 > parseFloat( resa.stripe_max_refundable() ) ) {
				alert( hb_text.refund_amount_too_high.replace( '%amount', hb_decode_entities( hb_format_price( resa.stripe_max_refundable() ) ) ) );
				return;
			}
			resa.refunding( true );
			hb_resa_ajax({
				data: {
					'action': 'hb_resa_refund',
					'refund_amount': resa.payment_amount(),
					'resa_id': resa.id,
					'resa_is_parent': resa.is_parent,
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.refunding( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return;
					}
					if ( response['status'] == 'refund_done' ) {
						var knockout_payments = [];
						for ( var i = 0; i < response['payments_logs'].length; i++ ) {
							knockout_payments[ i ] = new Payment( response['payments_logs'][ i ] );
						}
						resa.payments_logs( knockout_payments );
						resa.payment_amount( '' );
					} else if ( response['status'] == 'error' ) {
						alert( response['error_msg'] );
					} else {
						alert( 'Unexpected error.' );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.refunding( false );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		};

		this.edit_price = function( resa ) {
			resa.editing_price( true );
			resa.price_tmp( format_price( resa.price() ) );
		}

		this.cancel_edit_price = function( resa ) {
			resa.editing_price( false );
		}

		this.insert_security_bond_amount = function( resa ) {
			resa.payment_comment( hb_text.payment_comment_security_bond_amount );
			resa.payment_amount( format_price( hb_security_bond ) );
		}

		this.insert_unpaid_amount = function( resa ) {
			resa.payment_comment( hb_text.payment_comment_unpaid_amount );
			resa.payment_amount( format_price( resa.unpaid() ) );
		}

		this.insert_full_refund_amount = function( resa ) {
			resa.payment_comment( hb_text.payment_comment_full_refund_amount );
			resa.payment_amount( format_price( resa.paid() * -1 ) );
		}

		this.insert_full_stripe_refund_amount = function( resa ) {
			resa.payment_comment( hb_text.payment_comment_full_stripe_refund_amount );
			resa.payment_amount( format_price( resa.stripe_max_refundable() * -1 ) );
			resa.payment_method( 'Stripe' );
		}

		this.insert_security_bond_refund_amount = function( resa ) {
			resa.payment_comment( hb_text.payment_comment_security_bond_refund_amount );
			resa.payment_amount( format_price( hb_security_bond * -1 ) );
		}

		this.add_payment = function( resa ) {
			if ( ! hb_is_valid_price( resa.payment_amount() ) ) {
				return;
			}
			resa.saving_payment( true );
			var payment_info = {
				received_on: resa.payment_received_on(),
				amount: resa.payment_amount(),
				payment_method: resa.payment_method(),
				comment: resa.payment_comment(),
				online: 'no',
			};
			hb_resa_ajax({
				data: {
					'action': 'hb_add_resa_payment',
					'resa_id': resa.id,
					'resa_is_parent': resa.is_parent,
					'resa_payment': payment_info,
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.saving_payment( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return;
					}
					if ( response['status'] == 'payment_added' ) {
						payment_info.id = response.payment_id;
						resa.payments_logs.unshift( new Payment( payment_info ) );
						resa.payment_amount( '' );
					} else if ( response['status'] == 'error' ) {
						alert( response['error_msg'] );
					} else {
						alert( 'Unexpected error.' );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.saving_payment( false );
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.delete_payment = function( resa, payment_id ) {
			var payment;
			for ( var i = 0; i < resa.payments_logs().length; i++ ) {
				if ( resa.payments_logs()[ i ].id == payment_id ) {
					payment = resa.payments_logs()[ i ];
					break;
				}
			}
			var action = 'delete';
			if ( payment.payment_method == 'Stripe' ) {
				action = 'refund';
			}
			if ( confirm( hb_text['confirm_' + action + '_payment'] ) ) {
				payment.deleting_payment( true );
				hb_resa_ajax({
					data: {
						'action': 'hb_' + action + '_resa_payment',
						'resa_payment_id': payment_id,
						'resa_payment_charge_id': payment.gateway_info,
						'resa_id': resa.id,
						'resa_is_parent': resa.is_parent,
						'nonce': $( '#hb_nonce_update_db' ).val()
					},
					success: function( ajax_return ) {
						payment.deleting_payment( false );
						try {
							var response = JSON.parse( ajax_return );
						} catch ( e ) {
							alert( hb_text['error'] + ' ' + ajax_return );
							return;
						}
						if ( response['status'] == 'payment_deleted' ) {
							resa.payments_logs.remove( payment );
						} else if ( response['status'] == 'payment_refunded' ) {
							var knockout_payments = [];
							for ( var i = 0; i < response['payments_logs'].length; i++ ) {
								knockout_payments[ i ] = new Payment( response['payments_logs'][ i ] );
							}
							resa.payments_logs( knockout_payments );
						} else if ( response['status'] == 'error' ) {
							alert( response['error_msg'] );
						} else {
							alert( 'Unexpected error.' );
							console.log( ajax_return );
						}
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						payment[0].deleting_payment( false );
						alert( textStatus + ' (' + errorThrown + ')' );
					}
				});
			}
		}

		this.save_price = function( resa ) {
			if ( parseFloat( resa.price_tmp() ) != parseFloat( resa.price() ) ) {
				resa.saving_price( true );
				hb_resa_ajax({
					data: {
						'action': 'hb_update_resa_price',
						'new_price': resa.price_tmp(),
						'resa_id': resa.id,
						'nonce': $( '#hb_nonce_update_db' ).val()
					},
					success: function( ajax_return ) {
						resa.editing_price( false );
						resa.saving_price( false );
						try {
							var response = JSON.parse( ajax_return );
						} catch ( e ) {
							alert( hb_text['error'] + ' ' + ajax_return );
							return false;
						}
						if ( response['status']  == 'price_updated' ) {
							if ( resa.parent_id != 0 ) {
								resa.parent_resa().previous_price( resa.parent_resa().price() );
								resa.parent_resa().price( response['parent_new_price'] );
							}
							resa.previous_price( format_price( resa.price() ) );
							resa.price( format_price( resa.price_tmp() ) );
							if ( response['discount_status'] == 'updated' ) {
								resa.global_discount_amount( response['discount_amount'] );
								resa.global_discount_amount_type( 'fixed' );
							}
						} else if ( response['status'] == 'db_error' ) {
							alert( 'Database error.' );
						} else {
							alert( 'Unexpected error.' );
							console.log( ajax_return );
						}
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						alert( textStatus + ' (' + errorThrown + ')' );
					}
				});
			} else {
				resa.editing_price( false );
			}
		}

		this.edit_discount = function( resa ) {
			if ( resa.accom_discount_amount() ) {
				if ( resa.accom_discount_amount_type() == 'fixed' ) {
					resa.accom_discount_amount_tmp( format_price( resa.accom_discount_amount() ) );
				} else {
					resa.accom_discount_amount_tmp( resa.accom_discount_amount() );
				}
			} else {
				resa.accom_discount_amount_tmp( '' );
			}
			resa.accom_discount_amount_type_tmp( resa.accom_discount_amount_type() );
			if ( resa.global_discount_amount() ) {
				if ( resa.global_discount_amount_type() == 'fixed' ) {
					resa.global_discount_amount_tmp( format_price( resa.global_discount_amount() ) );
				} else {
					resa.global_discount_amount_tmp( resa.global_discount_amount() );
				}
			} else {
				resa.global_discount_amount_tmp( '' );
			}
			resa.global_discount_amount_type_tmp( resa.global_discount_amount_type() );
			resa.editing_discount( true );
		}

		this.cancel_edit_discount = function( resa ) {
			resa.editing_discount( false );
		}

		this.save_discount = function( resa ) {
			resa.saving_discount( true );
			hb_resa_ajax({
				data: {
					'action': 'hb_update_resa_discount',
					'accom_discount_amount': resa.accom_discount_amount_tmp(),
					'accom_discount_amount_type': resa.accom_discount_amount_type_tmp(),
					'global_discount_amount': resa.global_discount_amount_tmp(),
					'global_discount_amount_type': resa.global_discount_amount_type_tmp(),
					'resa_id': resa.id,
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.saving_discount( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return false;
					}
					if ( response['status']  == 'discount updated' ) {
						resa.editing_discount( false );
						if ( resa.parent_id != 0 ) {
							resa.parent_resa().previous_price( resa.parent_resa().price() );
							resa.parent_resa().price( response['parent_new_price'] );
						}
						resa.previous_price( format_price( resa.price() ) );
						resa.price( format_price( response['new_price'] ) );
						resa.accom_discount_amount( resa.accom_discount_amount_tmp() );
						resa.accom_discount_amount_type( resa.accom_discount_amount_type_tmp() );
						resa.global_discount_amount( resa.global_discount_amount_tmp() );
						resa.global_discount_amount_type( resa.global_discount_amount_type_tmp() );
					} else if ( response['status'] == 'db_error' ) {
						alert( 'Database error.' );
					} else {
						alert( 'Unexpected error.' );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					alert( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.edit_payments = function( resa ) {
			resa.editing_payments( ! resa.editing_payments() );
			resa.payment_received_on_input( hb_formatted_date( hb_date_to_str( new Date() ) ) );
			$( '.hb-input-payment-received-on' ).datepick( hb_datepicker_calendar_options );
			$( '.hb-input-payment-received-on' ).datepick( 'option', {
				onSelect: function() {
					jQuery( this ).change();
				}
			});
		}

		this.close_payments_logs = function( resa ) {
			resa.editing_payments( false );
		}

		this.admin_add_resa = function() {
			var admin_comment = $( '#hb-admin-comment' ).val();
			var lang = $( '#hb-resa-admin-lang' ).val();
			var status = $( 'input[name="hb-new-resa-status"]:checked' ).val();

			$( '#hb-admin-add-resa' ).hide();
			$( '#hb-admin-add-resa-toggle .dashicons-arrow-down' ).css( 'display', 'inline-block' );
			$( '#hb-admin-add-resa-toggle .dashicons-arrow-up' ).hide();
			$( 'html, body' ).animate({ scrollTop: $( '#hb-add-resa-section' ).offset().top - 40 });
			$( '.hb-booking-search-form' ).removeClass( 'hb-search-form-admin-multiple-accom' );
			$( '.hb-adults, .hb-children, .hb-admin-search-type, .hb-accom' ).prop( 'selectedIndex', 0 );
			$( '.hb-accom-people' ).val( '1-0' );
			$( '#accom-number' ).prop( 'selectedIndex', 0 );
			$( '#accom-number option:nth-child(1)' ).html('');
			$( '#hb-add-resa-customer-id-list' ).prop( 'selectedIndex', -1 );
			$( '#hb-resa-admin-lang' ).val( hb_admin_lang );
			$( '.hb-booking-details-form input[type="text"], .hb-booking-details-form textarea' ).val( '' );
			$( '.hb-booking-details-form input[type="checkbox"]' ).removeAttr( 'checked' );
			var radios_to_reset = $.uniqueSort( $( 'input[type="radio"]' ).map( function( i, e ) { return $( e ).attr( 'name' ) } ).get() );
			$( radios_to_reset ).each( function( i, e ) {
				$( 'input[name="' + e + '"]:first' ).prop( 'checked', true ).change();
			});
			$( '#hb-new-resa-status-' + hb_new_resa_status ).prop( 'checked', true );
			$( '#hb-resa-customer-id' ).show();
			self.resa_customers_list_filter( '' );
			self.resa_current_page_number( 1 );

			setTimeout( function() {
				var customer = ko.utils.arrayFirst( self.customers_list(), function( customer ) {
					return hb_new_admin_resas[0].customer.id == customer.id;
				});
				if ( ! customer ) {
					self.customers_list.push(
						new Customer(
							hb_new_admin_resas[0].customer.id,
							hb_new_admin_resas[0].customer.info,
							''
						)
					);
					hb_customers[ hb_new_admin_resas[0].customer.id ] = [];
					hb_customers[ hb_new_admin_resas[0].customer.id ]['nb_resa'] = 1;
				} else {
					hb_customers[ customer.id ]['nb_resa']++;
					var resa_same_customer = ko.utils.arrayFilter( self.resa(), function( resa ) {
						if ( resa.customer_id() == customer.id ) {
							return true;
						} else {
							return false;
						}
					});
					for ( var i = 0; i < resa_same_customer.length; i++ ) {
						resa_same_customer[i].customer_id.valueHasMutated();
					}
				}
				for ( var i = 0; i < hb_new_admin_resas.length; i++ ) {
					for ( var j = 0; j < hb_new_admin_resas[i]['automatic_blocked_accom'].length; j++ ) {
						var new_blocked_accom = new BlockedAccom(
							hb_new_admin_resas[i]['automatic_blocked_accom'][j]['from_date'],
							hb_new_admin_resas[i]['automatic_blocked_accom'][j]['to_date'],
							hb_new_admin_resas[i]['automatic_blocked_accom'][j]['accom_id'],
							hb_new_admin_resas[i]['automatic_blocked_accom'][j]['accom_num'],
							0,
							0,
							hb_new_admin_resas[i]['automatic_blocked_accom'][j]['comment'],
							hb_new_admin_resas[i]['automatic_blocked_accom'][j]['linked_resa_id'],
							hb_new_admin_resas[i]['automatic_blocked_accom'][j]['is_prepa_time']
						);
						self.blocked_accom.unshift( new_blocked_accom );
					}
					if ( hb_new_admin_resas.length == 1 ) {
						var knockout_resa = new Resa(
							hb_new_admin_resas[i].resa_id, // id
							hb_new_admin_resas[i].resa_alphanum_id, // alphanum_id
							0, // parent_id
							0, // is_parent
							status, // status
							hb_new_admin_resas[i].price, // price
							0, // previous_price
							0, // paid
							0, // accom_price
							'', // old_currency
							$( '.hb-details-check-in' ).val(), // check_in
							$( '.hb-details-check-out' ).val(), // check_out
							hb_new_admin_resas[i].adults, // adults
							hb_new_admin_resas[i].children, // children
							hb_new_admin_resas[i].accom_id, // accom_id
							hb_new_admin_resas[i].accom_num, // accom_num
							hb_new_admin_resas[i].options_info, // options_info
							hb_new_admin_resas[i].non_editable_info, // non_editable_info
							admin_comment, // admin_comment,
							hb_new_admin_resas[i].accom_discount_amount, // accom_discount_amount
							hb_new_admin_resas[i].accom_discount_amount_type, // accom_discount_amount_type
							hb_new_admin_resas[i].global_discount_amount, // global_discount_amount
							hb_new_admin_resas[i].global_discount_amount_type, // global_discount_amount_type
							hb_new_admin_resas[i].customer.id, // customer_id,
							hb_new_admin_resas[i].received_on, // received_on,
							hb_new_admin_resas[i].email_logs, // email_logs,
							hb_new_admin_resas[i].email_logs.length, // nb_emails_sent,
							[], // payments_logs,
							'website', // origin,
							'', // origin_url
							hb_new_admin_resas[i].additional_info, // additional_info
							lang, // lang,
							self // view_model
						);
					} else if ( i < hb_new_admin_resas.length - 1 ) {
						var knockout_resa = new Resa(
							hb_new_admin_resas[i].resa_id, // id
							'', // alphanum_id
							hb_new_admin_resas[i].resa_parent_id, // parent_id
							0, // is_parent
							status, // status
							hb_new_admin_resas[i].price, // price
							0, // previous_price
							0, // paid
							0, // accom_price
							'', // old_currency
							$( '.hb-details-check-in' ).val(), // check_in
							$( '.hb-details-check-out' ).val(), // check_out
							hb_new_admin_resas[i].adults, // adults
							hb_new_admin_resas[i].children, // children
							hb_new_admin_resas[i].accom_id, // accom_id
							hb_new_admin_resas[i].accom_num, // accom_num
							hb_new_admin_resas[i].options_info, // options_info
							hb_new_admin_resas[i].non_editable_info, // non_editable_info
							'', // admin_comment,
							hb_new_admin_resas[i].accom_discount_amount, // accom_discount_amount
							hb_new_admin_resas[i].accom_discount_amount_type, // accom_discount_amount_type
							hb_new_admin_resas[i].global_discount_amount, // global_discount_amount
							hb_new_admin_resas[i].global_discount_amount_type, // global_discount_amount_type
							0, // customer_id,
							hb_new_admin_resas[i].received_on, // received_on,
							[], // email_logs,
							0, // nb_emails_sent,
							[], // payments_logs
							'', // origin,
							'', // origin_url
							hb_new_admin_resas[i].additional_info, // additional_info
							lang, // lang,
							self // view_model
						);
					} else {
						var knockout_resa = new Resa(
							hb_new_admin_resas[i].resa_id, // id
							hb_new_admin_resas[i].resa_alphanum_id, // alphanum_id
							0, // parent_id
							1, // is_parent
							'', // status
							hb_new_admin_resas[i].price, // price
							0, // previous_price
							0, // paid
							-1, // accom_price
							'', // old_currency
							'', // check_in
							'', // check_out
							0, // adults
							0, // children
							0, // accom_id
							0, // accom_num
							hb_new_admin_resas[i].options_info, // options_info
							hb_new_admin_resas[i].non_editable_info, // non_editable_info
							admin_comment, // admin_comment,
							0, // accom_discount_amount
							0, // accom_discount_amount_type
							0, // global_discount_amount
							0, // global_discount_amount_type
							hb_new_admin_resas[i].customer.id, // customer_id,
							hb_new_admin_resas[i].received_on, // received_on,
							hb_new_admin_resas[i].email_logs,
							hb_new_admin_resas[i].email_logs.length, // nb_emails_sent,
							[],
							'', // origin,
							'', // origin_url
							hb_new_admin_resas[i].additional_info, // additional_info
							lang, // lang,
							self // view_model
						);
					}
					knockout_resa.anim_class( 'hb-resa-added' );
					self.resa.unshift( knockout_resa );
					setTimeout( function( kr ) {
						return function() {
							kr.anim_class( '' );
						}
					}( knockout_resa ), 300 );
				}
			}, 1000 );
			return false;
		}

		this.email_resa = function( resa ) {
			resa.email_customer_template( '' );
			resa.email_customer_to_address( '' );
			resa.email_customer_subject( '' );
			resa.email_customer_message( '' );
			resa.email_customer_attachment_ids( '' );
			resa.email_customer_delete_attachments_after( false );
			resa.preparing_email( true );
		}

		this.open_close_payment_link = function( resa ) {
			resa.adding_payment_link( ! resa.adding_payment_link() );
		}

		this.insert_payment_link = function( resa ) {
			var payment_link_var = '[payment_link_' + resa.payment_link_type();
			if ( resa.payment_link_type() == 'custom_amount' ) {
				if ( ! hb_is_valid_price( resa.payment_link_custom_amount() ) ) {
					return;
				}
				payment_link_var += '-' + resa.payment_link_custom_amount();
				resa.payment_link_custom_amount( '' );
			}
			payment_link_var += ']';
			resa.email_customer_message( resa.email_customer_message() + payment_link_var );
			resa.adding_payment_link( false );
		}

		this.remove_email_attachments = function( resa ) {
			if ( resa && confirm( hb_text.remove_all_attachments ) ) {
				resa.email_customer_attachment_ids( '' );
			}
		}

		this.delete_email_attachments_after_label = function( resa ) {
			if ( resa ) {
				resa.email_customer_delete_attachments_after( ! resa.email_customer_delete_attachments_after() );
			}
		}

		this.cancel_email_resa = function( resa ) {
			resa.preparing_email( false );
		}

		this.send_email_customer = function( resa ) {
			resa.preparing_email( false );
			resa.action_processing( true );
			hb_resa_ajax({
				data: {
					'action': 'hb_send_email_customer',
					'resa_id': resa.id,
					'resa_is_parent': resa.is_parent,
					'email_template': resa.email_customer_template(),
					'email_to_address': resa.email_customer_to_address(),
					'email_subject': resa.email_customer_subject(),
					'email_message': resa.email_customer_message(),
					'email_attachments': resa.email_customer_attachment_ids(),
					'delete_attachments': resa.email_customer_delete_attachments_after(),
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.action_processing( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return false;
					}
					if ( response['status'] == 'email_sent' ) {
						resa.email_logs( response['email_logs'] );
						resa.email_sent( true );
						setTimeout( function() {
							resa.email_sent( false );
						}, 4000 );
					} else {
						alert( hb_text['email_sending_error'] );
						console.log( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.action_processing( false );
					console.log( jqXHR );
					console.log( jqXHR.responseText );
					alert( textStatus + ' (' + errorThrown + ')' )
				}
			});
		}

		this.fetch_email_logs = function( resa ) {
			resa.fetching_email_logs( true );
			hb_resa_ajax({
				data: {
					action: 'hb_fetch_email_logs',
					resa_id: resa.id,
					resa_is_parent: resa.is_parent,
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					resa.fetching_email_logs( false );
					try {
						var response = JSON.parse( ajax_return );
					} catch ( e ) {
						alert( hb_text['error'] + ' ' + ajax_return );
						return false;
					}
					resa.email_logs( response );
					resa.opening_email_logs( true );
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					resa.fetching_email_logs( false );
					console.log( jqXHR );
					console.log( jqXHR.responseText );
					console.log( textStatus + ' (' + errorThrown + ')' );
				}
			});
		}

		this.close_email_logs = function( resa ) {
			resa.opening_email_logs( false );
		}

		this.open_multiple_documents_resa = function( resa ) {
			if ( resa.opening_documents() ) {
				resa.opening_documents( false );
			} else {
				resa.opening_documents( true );
			}
		}

		this.resa_customers_list_filter = ko.observable( '' );

		this.resa_customers_list = ko.computed( function() {
			var customers_id_name_list = [];
			for ( var i = 0; i < self.customers_list().length; i++ ) {
				var customer = {
					id: self.customers_list()[ i ].id,
					id_name: self.customers_list()[ i ].last_name() + ' ' + self.customers_list()[ i ].first_name() + ' (' + hb_text.id + ' ' + self.customers_list()[ i ].id + ')'
				}
				customers_id_name_list.push( customer );
			}
			customers_id_name_list.sort( function( a, b ) {
				return a.id_name.localeCompare( b.id_name );
			});
			if ( ! self.resa_customers_list_filter() ) {
				return customers_id_name_list;
			} else {
				var filtered_customers = ko.utils.arrayFilter( customers_id_name_list, function( customer ) {
					if ( customer.id_name.toLowerCase().replace( /\s/g, '' ).indexOf( self.resa_customers_list_filter().toLowerCase().replace( /\s/g, '' ) ) >= 0 ) {
						return true;
					} else {
						return false;
					}
				});
				if ( filtered_customers.length == 1 ) {
					$( '.hb-customer-id-list' ).val( [ filtered_customers[0].id ] );
				}
				return filtered_customers;
			}

		});

		this.resa_filter = ko.observable( hb_default_filter );
		this.resa_filter_customer = ko.observable( '' );
		this.resa_filter_id = ko.observable( '' );
		this.resa_filter_alphanum = ko.observable( '' );
		this.resa_filter_status = ko.observable( hb_default_filter_status );
		this.resa_filter_origin = ko.observable( hb_default_filter_origin );
		this.resa_filter_accom_id = ko.observable( hb_default_filter_accom );
		this.resa_filter_accom_num = ko.observable( 'all' );
		this.resa_filter_accom_num_name = ko.computed( function() {
			if ( self.resa_filter_accom_id() == 'all' ) {
				return [];
			} else {
				var returned_num_name = [
						{ 'num': 'all', 'name': hb_text.all }
					];
				$.each( accoms[ self.resa_filter_accom_id() ].num_name, function( accom_num_id, accom_num_name ) {
					returned_num_name.push({ 'num': accom_num_id, 'name': accom_num_name });
				});
				return returned_num_name;
			}
		});
		var filter_by_date_types = ['check_in_from', 'check_in_to', 'check_out_from', 'check_out_to', 'check_in_out_from', 'check_in_out_to', 'active_resa_from', 'active_resa_to'];
		for ( var i = 0; i < filter_by_date_types.length; i++ ) {
			var hb_option = window['hb_resa_page_default_filter_' + filter_by_date_types[ i ] ];
			if ( hb_option == parseInt( hb_option, 10 ) ) {
				var default_date = new Date();
				default_date.setDate( default_date.getDate() + parseInt( hb_option, 10 ) );
			} else {
				var default_date = new Date( hb_option );
				if ( isNaN( default_date ) ) {
					var default_date = new Date();
				}
			}
			this[ 'resa_filter_' + filter_by_date_types[ i ] ] = ko.observable( $.datepick.formatDate( hb_date_format, default_date ) );
		}
		$( '.hb-filter-clear-date' ).on( 'click', function() {
			$( this ).prev().val( '' ).change();
		});

		$( '.hb-filter-date-from' ).change( function () {
			var from = $( this ).val(),
				to = $( this ).parent().find( '.hb-filter-date-to' ).val();
			if ( from.length == 10 ) {
				$( this ).parent().find( '.hb-filter-date-to' ).datepick( 'option', 'minDate', from );
			} else {
				$( this ).parent().find( '.hb-filter-date-to' ).datepick( 'option', 'minDate', -9999 );
			}
			if ( to && from && ( from > to ) ) {
				$( this ).parent().find( '.hb-filter-date-to' ).val( '' ).change();
			}
		});

		$( '.hb-filter-date-to' ).change( function () {
			var from = $( this ).parent().find( '.hb-filter-date-from' ).val();
			if ( from.length == 10 ) {
				var to = $( this ).val();
				if ( to.length == 10 && ( from > to ) ) {
					$( this ).parent().find( '.hb-filter-date-from' ).val( '' ).change();
				}
			}
		});

		this.resa_filtered = ko.computed( function() {
			var filtered_resa;
			if ( self.resa_filter() == 'none' ) {
				return self.resa();
			} else if ( self.resa_filter() == 'resa_id' ) {
				var filter = self.resa_filter_id().replace( /\s/g, '' );
				if ( ! filter ) {
					return self.resa();
				} else {
					filtered_resa = ko.utils.arrayFilter( self.resa(), function( resa ) {
						if ( filter.indexOf( '#' ) >= 0 ) {
							var filter_id = filter.replace( '#', '' );
							if ( ( resa.id.indexOf( filter_id ) >= 0 ) && resa.is_parent ) {
								return true;
							} else {
								return false;
							}
						} else if ( resa.id.indexOf( filter ) >= 0 ) {
							return true;
						} else {
							return false;
						}
					});
				}
			} else if ( self.resa_filter() == 'resa_alphanum' ) {
				var filter = self.resa_filter_alphanum().toLowerCase().replace( /\s/g, '' );
				if ( ! filter ) {
					return self.resa();
				} else {
					filtered_resa = ko.utils.arrayFilter( self.resa(), function( resa ) {
						if ( resa.alphanum_id.toLowerCase().indexOf( filter ) >= 0 ) {
							return true;
						} else {
							return false;
						}
					});
				}
			} else if ( self.resa_filter() == 'customer' ) {
				var filter = self.resa_filter_customer().toLowerCase().replace( /\s/g, '' );
				if ( ! filter ) {
					return self.resa();
				} else {
					filtered_resa = ko.utils.arrayFilter( self.resa(), function( resa ) {
						var customer = ko.utils.arrayFirst( self.customers_list(), function( customer ) {
							return resa.customer_id() == customer.id;
						});
						if ( ! customer ) {
							return false;
						} else {
							if ( customer.name_email().toLowerCase().indexOf( filter ) >= 0 ) {
								return true;
							} else {
								return false;
							}
						}
					});
				}
			} else if ( self.resa_filter() == 'status' ) {
				filtered_resa = ko.utils.arrayFilter( self.resa(), function( resa ) {
					if ( resa.status() == self.resa_filter_status() ) {
						return true;
					} else {
						return false;
					}
				});
			} else if ( self.resa_filter() == 'origin' ) {
				filtered_resa = ko.utils.arrayFilter( self.resa(), function( resa ) {
					if ( self.resa_filter_origin() == 'website' ) {
						if ( resa.origin() == 'website' || resa.is_parent ) {
							return true;
						} else {
							return false;
						}

					} else if ( self.resa_filter_origin() == 'ical' ) {
						if ( resa.origin() == 'website' || resa.is_parent ) {
							return false;
						} else {
							return true;
						}
					}
				});
			} else if ( self.resa_filter() == 'accom' ) {
				filtered_resa = ko.utils.arrayFilter( self.resa(), function( resa ) {
					if ( self.resa_filter_accom_id() == 'all' ) {
						return true;
					} else if ( resa.accom_id() == self.resa_filter_accom_id() ) {
						if ( self.resa_filter_accom_num() == 'all' ) {
							return true;
						} else {
							if ( resa.accom_num() == self.resa_filter_accom_num() ) {
								return true;
							} else {
								return false;
							}
						}
					} else {
						return false;
					}
				});
			} else if (
				self.resa_filter() == 'check_in_date' ||
				self.resa_filter() == 'check_out_date' ||
				self.resa_filter() == 'check_in_out_date' ||
				self.resa_filter() == 'active_resa_date'
			) {
				filtered_resa = ko.utils.arrayFilter( self.resa(), function( resa ) {
					var from = '';
					var to = '';
					if ( self.resa_filter() == 'check_in_date' ) {
						from = self.resa_filter_check_in_from();
						to = self.resa_filter_check_in_to();
					} else if ( self.resa_filter() == 'check_out_date' ) {
						from = self.resa_filter_check_out_from();
						to = self.resa_filter_check_out_to();
					} else if ( self.resa_filter() == 'check_in_out_date' ) {
						from = self.resa_filter_check_in_out_from();
						to = self.resa_filter_check_in_out_to();
					} else if ( self.resa_filter() == 'active_resa_date' ) {
						from = self.resa_filter_active_resa_from(),
						to = self.resa_filter_active_resa_to();
					}
					if ( from.trim() == '' ) {
						from = '0000-00-00';
					} else {
						from = hb_db_formatted_date( from );
					}
					if ( to.trim() == '' ) {
						to = '9999-99-99';
					} else {
						to = hb_db_formatted_date( to );
					}
					if (
						( ( self.resa_filter() == 'check_in_date' ) && ( resa.check_in() >= from ) && ( resa.check_in() <= to ) ) ||
						( ( self.resa_filter() == 'check_out_date' ) && ( resa.check_out() >= from ) && ( resa.check_out() <= to ) ) ||
						(
							( self.resa_filter() == 'check_in_out_date' ) &&
							(
								( ( resa.check_in() >= from ) && ( resa.check_in() <= to ) ) ||
								( ( resa.check_out() >= from ) && ( resa.check_out() <= to ) )
							)
						) ||
						( ( self.resa_filter() == 'active_resa_date' ) && ( resa.check_in() <= to ) && ( resa.check_out() >= from ) )
					) {
						return true;
					} else {
						return false;
					}
				});
			}
			var filtered_resa_with_children_and_parents = [];
			var processed_parent_resa = [];
			var added_parent_resa = [];
			filtered_resa.forEach( function( resa ) {
				if ( resa.is_parent ) {
					filtered_resa_with_children_and_parents.push( resa );
					filtered_resa_with_children_and_parents.push( ...resa.children_resa() );
					processed_parent_resa.push( resa.id );
				} else {
					if ( processed_parent_resa.indexOf( resa.parent_id ) == -1 ) {
						if ( ( resa.parent_id != 0 ) && ( added_parent_resa.indexOf( resa.parent_id ) == -1 ) ) {
							filtered_resa_with_children_and_parents.push(  resa.parent_resa() );
							added_parent_resa.push( resa.parent_id );
						}
						filtered_resa_with_children_and_parents.push( resa );
					}
				}
			})
			return filtered_resa_with_children_and_parents;
		});

		this.resa_filtered.subscribe( function() {
			self.select_unselect_all( false );
		});

		this.resa_sort = ko.observable( hb_saved_sorting );

		this.resa_sort.subscribe( function( sorting ) {
			self.select_unselect_all( false );
			hb_resa_ajax({
				data: {
					action: 'hb_save_resa_sorting',
					new_sorting: sorting,
					nonce: $( '#hb_nonce_update_db' ).val()
				},
				success: function() {},
				error: function( jqXHR, textStatus, errorThrown ) {
					console.log( jqXHR );
					console.log( jqXHR.responseText );
					console.log( textStatus + ' (' + errorThrown + ')' );
				}
			});
			if ( sorting == 'check_in_date_asc' && self.resa_filter() == 'none' ) {
				self.resa_filter( 'check_in_date' );
				self.resa_filter_check_in_to( '' );
			}
		});

		this.resa_sorted = ko.computed( function() {
			if ( self.resa_sort() == 'check_in_date_asc' ) {
				return self.resa_filtered().slice().sort( function( a, b ) {
					if ( a.check_in() > b.check_in() ) {
						return 1;
					} else if ( a.check_in() < b.check_in() ) {
						return -1;
					} else {
						return 0;
					}
				});
			} else if ( self.resa_sort() == 'check_in_date_desc' ) {
				return self.resa_filtered().slice().sort( function( a, b ) {
					if ( a.check_in() < b.check_in() ) {
						return 1;
					} else if ( a.check_in() > b.check_in() ) {
						return -1;
					} else {
						return 0;
					}
				});
			} else if ( self.resa_sort() == 'received_date_asc' ) {
				return self.resa_filtered().slice().sort( function( a, b ) {
					if ( a.received_on > b.received_on ) {
						return 1;
					} else if ( a.received_on < b.received_on ) {
						return -1;
					} else {
						return 0;
					}
				});
			} else {
				return self.resa_filtered();
			}
		});

		function blur_buttons() {
			$( '.button' ).blur();
		}

		this.resa_per_page = 25;
		this.resa_current_page_number = ko.observable( 1 );

		this.resa_first_page = function() {
			self.resa_current_page_number( 1 );
			blur_buttons();
		}

		this.resa_last_page = function() {
			self.resa_current_page_number( self.resa_total_pages() );
			blur_buttons();
		}

		this.resa_next_page = function() {
			if ( self.resa_current_page_number() != self.resa_total_pages() ) {
				self.resa_current_page_number( self.resa_current_page_number() + 1 );
			}
			blur_buttons();
		}

		this.resa_previous_page = function() {
			if ( self.resa_current_page_number() != 1 ) {
				self.resa_current_page_number( self.resa_current_page_number() - 1 );
			}
			blur_buttons();
		}

		this.resa_total_pages = ko.computed(function() {
			var total = Math.floor( self.resa_sorted().length / self.resa_per_page );
			total += self.resa_sorted().length % self.resa_per_page > 0 ? 1 : 0;
			return total;
		});

		this.resa_paginated = ko.computed( function() {
			if ( self.resa_current_page_number() > self.resa_total_pages() ) {
				self.resa_current_page_number( 1 );
			}
			var first = self.resa_per_page * ( self.resa_current_page_number() - 1 );
			return self.resa_sorted().slice( first, first + self.resa_per_page );
		});

		this.select_unselect_all = ko.observable();

		this.select_unselect_all.subscribe( function( value ) {
			if ( value ) {
				self.resa_paginated().map( function( resa ) {
					resa.is_selected( true );
			});
			} else {
				self.resa().map( function( resa ) {
					resa.is_selected( false );
				});
			}
		});

		$( '.hb-resa-bulk-action' ).on( 'change', function() {
			$( '.hb-resa-bulk-action' ).val( $( this ).val() );
			if ( ( $( this ).val() == '' ) || ( $( this ).val() == 'no_action' ) ) {
				$( '.hb-resa-bulk-action-button' ).hide();
			} else {
				$( '.hb-resa-bulk-action-button' ).show();
			}
		});

		this.do_bulk_action = function() {
			blur_buttons();
			var selected_resas = [];
			for ( var i = 0; i < self.resa_filtered().length; i++ ) {
				if ( self.resa_filtered()[i].is_selected() ) {
					selected_resas.push( self.resa_filtered()[i] );
				}
			}
			if ( ! selected_resas.length ) {
				alert( hb_text.no_reservations_selected );
				return;
			}
			var bulk_action = $( '.hb-resa-bulk-action' ).val();
			if ( bulk_action == 'no_action' ) {
				alert( hb_text.select_bulk_action );
				$( '.hb-resa-bulk-action' ).focus();
				return;
			} else {
				if ( bulk_action == 'confirm' ) {
					var exist_resas_to_confirm = false;
					for ( var i = 0; i < selected_resas.length; i++ ) {
						if ( ( selected_resas[ i ].status() == 'new' ) || ( selected_resas[ i ].status() == 'pending' ) ) {
							exist_resas_to_confirm = true;
							break;
						}
					}
					if ( ! exist_resas_to_confirm ) {
						alert( hb_text.no_resas_to_confirm );
						return;
					}
				} else if ( bulk_action == 'cancel' ) {
					var exist_resas_to_cancel = false;
					for ( var i = 0; i < selected_resas.length; i++ ) {
						if ( selected_resas[ i ].status() != 'cancelled' ) {
							exist_resas_to_cancel = true;
							break;
						}
					}
					if ( ! exist_resas_to_cancel ) {
						alert( hb_text.no_resas_to_cancel );
						return;
					}
				}
				if ( confirm( hb_text['confirm_' + bulk_action + '_resas'] ) ) {
					$( '.hb-bulk-action-spinner.spinner' ).css( 'display', 'inline-block' );
					bulk_action_functions[ bulk_action ]( selected_resas );
				}
			}
		}

		this.selected_resa = ko.observable( 0 );
		this.resa_detailed_all_children_link_visible = ko.observable( false );
		this.resa_detailed_displaying_all_children = ko.observable( false );

		$( '#hb-resa-cal-wrapper' ).on( 'click', '.hbdlcd', function() {
			$( this ).blur();
			self.resa_detailed_all_children_link_visible( false );
			self.resa_detailed_displaying_all_children( false );
			self.selected_resa( $( this ).data( 'resa-id' ) );
			return false;
		});

		this.hide_selected_resa = function() {
			self.selected_resa( 0 );
			self.resa_detailed_all_children_link_visible( false );
			self.resa_detailed_displaying_all_children( false );
		}

		this.resa_detailed_show_all_children = function() {
			self.resa_detailed_all_children_link_visible( false );
			self.resa_detailed_displaying_all_children( true );
		}

		this.resa_detailed = ko.computed( function() {
			if ( self.selected_resa() == 0 ) {
				return [];
			}
			var returned_resa = [];
			for ( var i = 0; i < self.resa().length; i++ ) {
				if ( ! self.resa()[ i ].is_parent && ( self.resa()[ i ].id == self.selected_resa() ) ) {
					let resa = self.resa()[ i ];
					if ( resa.parent_id != 0 ) {
						returned_resa.push( resa.parent_resa() );
						if ( ! self.resa_detailed_displaying_all_children() ) {
							self.resa_detailed_all_children_link_visible( true );
						}
					}
					if ( self.resa_detailed_displaying_all_children() ) {
						let parent_resa = resa.parent_resa();
						returned_resa.push( ...parent_resa.children_resa() );
					} else {
						returned_resa.push( resa );
					}
					return returned_resa;
				}
			}
			self.selected_resa( 0 );
			return [];
		});

		this.add_blocked_accom = function() {
			$( '.hb-add-blocked-accom-submit input' ).blur();

			var from_date = $( '#hb-block-accom-from-date-hidden' ).val(),
				to_date = $( '#hb-block-accom-to-date-hidden' ).val(),
				accom_id = $( '#hb-select-blocked-accom-type' ).val(),
				accom_num = $( '#hb-select-blocked-accom-num' ).val(),
				accom_all_ids = 0,
				accom_all_num = 0,
				comment = $( '#hb-block-accom-comment' ).val();

			if ( ! from_date || from_date == '0000-00-00' ) {
				from_date = '2016-01-01';
			}
			if ( ! to_date || to_date == '0000-00-00' ) {
				to_date = '2029-12-31';
			}
			if ( from_date >= to_date ) {
				alert( hb_text.to_date_before_from_date );
				return;
			}
			if ( accom_id == 'all' ) {
				accom_all_ids = 1;
				accom_all_num = 1;
				accom_id = 0;
				accom_num = 0;
			}
			if ( accom_num == 'all' ) {
				accom_num = 0;
				accom_all_num = 1;
			}

			if ( accom_all_ids && ( from_date == '2016-01-01' ) && ( to_date == '2029-12-31' ) ) {
				if ( ! confirm( hb_text.block_all ) ) {
					return;
				}
			}

			var identical_blocked_accom = ko.utils.arrayFilter( self.blocked_accom(), function( blocked_accom ) {
				if (
					( from_date == blocked_accom.from_date() ) &&
					( to_date == blocked_accom.to_date() ) &&
					(
						( ( accom_all_ids == 1 ) && ( blocked_accom.accom_all_ids == 1 ) ) ||
						( accom_id == blocked_accom.accom_id )
					) &&
					(
						( ( accom_all_num == 1 ) && ( blocked_accom.accom_all_num == 1 ) ) ||
						( accom_num == blocked_accom.accom_num )
					) &&
					( comment == blocked_accom.comment )
				) {
					return true;
				} else {
					return false;
				}
			});

			if ( identical_blocked_accom.length ) {
				alert( hb_text.accom_already_blocked );
				return;
			}

			$( '.hb-add-blocked-accom-submit .hb-ajaxing' ).css( 'display', 'inline-block' );
			$( '.hb-add-blocked-accom-submit input' ).prop( 'disabled', true );

			hb_resa_ajax({
				data: {
					'action': 'hb_add_blocked_accom',
					'accom_id': accom_id,
					'accom_num': accom_num,
					'accom_all_ids': accom_all_ids,
					'accom_all_num': accom_all_num,
					'from_date': from_date,
					'to_date': to_date,
					'comment': comment,
					'nonce': $( '#hb_nonce_update_db' ).val()
				},
				success: function( ajax_return ) {
					$( '.hb-add-blocked-accom-submit .hb-ajaxing' ).css( 'display', 'none' );
					$( '.hb-add-blocked-accom-submit input' ).prop( 'disabled', false );
					if ( ajax_return == 'blocked accom added' ) {
						var new_blocked_accom = new BlockedAccom(
							from_date,
							to_date,
							accom_id,
							accom_num,
							accom_all_num,
							accom_all_ids,
							comment,
							0,
							0
						);
						new_blocked_accom.anim_class( 'hb-blocked-accom-added' );
						self.blocked_accom.unshift( new_blocked_accom );
						setTimeout( function() {
							new_blocked_accom.anim_class( '' );
						}, 300 );
					} else {
						alert( ajax_return );
					}
				},
				error: function( jqXHR, textStatus, errorThrown ) {
					$( '.hb-add-blocked-accom-submit .hb-ajaxing' ).css( 'display', 'none' );
					$( '.hb-add-blocked-accom-submit input' ).prop( 'disabled', false );
					blocked_accom.deleting( false );
					alert( textStatus + ' (' + errorThrown + ')' )
				}
			});
		}

		this.delete_blocked_accom = function( blocked_accom ) {
			if ( confirm( hb_text.confirm_delete_blocked_accom ) ) {
				blocked_accom.deleting( true );
				var accom_id = 0,
					accom_num = 0;
				if ( blocked_accom.accom_id ) {
					accom_id = blocked_accom.accom_id;
				}
				if ( blocked_accom.accom_num ) {
					accom_num = blocked_accom.accom_num;
				}
				hb_resa_ajax({
					data: {
						'action': 'hb_delete_blocked_accom',
						'date_from': blocked_accom.from_date,
						'date_to': blocked_accom.to_date,
						'accom_id': accom_id,
						'accom_num': accom_num,
						'accom_all_ids': blocked_accom.accom_all_ids,
						'accom_all_num': blocked_accom.accom_all_num,
						'nonce': $( '#hb_nonce_update_db' ).val()
					},
					success: function( ajax_return ) {
						if ( ajax_return == 'blocked accom deleted' ) {
							blocked_accom.anim_class( 'hb-blocked-accom-deleting' );
							setTimeout( function() {
								self.blocked_accom.remove( blocked_accom );
							}, 300 );
						} else {
							blocked_accom.deleting( false );
							alert( ajax_return );
						}
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						blocked_accom.deleting( false );
						alert( textStatus + ' (' + errorThrown + ')' )
					}
				});
			}
		}


		var observable_customers = [];
		$.each( hb_customers, function( customer_id, customer_info ) {
			observable_customers.push(
				new Customer(
					customer_info.id,
					customer_info.info,
					customer_info.payment_id
				)
			);
		});

		this.customers_list( observable_customers );

		var prepared_resa = [],
			prepared_parent_resa_ids = [],
			not_processing_status = [ 'new', 'pending', 'confirmed', 'cancelled' ];

		for ( var i = 0; i < resa.length; i++ ) {
			if ( not_processing_status.indexOf( resa[i].status ) < 0 ) {
				resa[i].status = 'processing';
			}
			if ( ( resa[i].parent_id != 0 ) && ( prepared_parent_resa_ids.indexOf( resa[i].parent_id ) < 0 ) ) {
				prepared_parent_resa_ids.push( resa[i].parent_id );
				prepared_resa.push(
					new Resa(
						resa[i].parent_id, // id
						hb_parents_resa[ resa[i].parent_id ].alphanum_id, // id
						0, // parent_id
						1, // is_parent
						'', // status
						hb_parents_resa[ resa[i].parent_id ].price, // price
						hb_parents_resa[ resa[i].parent_id ].previous_price, // previous_price
						hb_parents_resa[ resa[i].parent_id ].paid, // paid
						-1, // accom_price
						hb_parents_resa[ resa[i].parent_id ].old_currency, // old_currency
						'', // check_in
						'', // check_out
						0, // adults
						0, // children
						0, // accom_id
						0, // accom_num
						hb_parents_resa[ resa[i].parent_id ].options_info, // options_info
						hb_parents_resa[ resa[i].parent_id ].non_editable_info, // non_editable_info
						hb_parents_resa[ resa[i].parent_id ].admin_comment, // admin_comment,
						0, // accom_discount_amount
						0, // accom_discount_amount_type
						0, // global_discount_amount
						0, // global_discount_amount_type
						hb_parents_resa[ resa[i].parent_id ].customer_id, // customer_id,
						hb_parents_resa[ resa[i].parent_id ].received_on, // received_on,
						[], // email_logs,
						hb_parents_resa[ resa[i].parent_id ].nb_emails_sent, // nb_emails_sent,
						hb_parents_resa[ resa[i].parent_id ].payments_logs, // payments_logs
						'', // origin,
						'', // origin_url
						hb_parents_resa[ resa[i].parent_id ].additional_info, // additional_info
						hb_parents_resa[ resa[i].parent_id ].lang, // lang,
						this // view_model
					)
				);
			}
			prepared_resa.push(
				new Resa(
					resa[i].id,
					resa[i].alphanum_id,
					resa[i].parent_id,
					0,
					resa[i].status,
					resa[i].price,
					resa[i].previous_price,
					resa[i].paid,
					resa[i].accom_price,
					resa[i].old_currency,
					resa[i].check_in,
					resa[i].check_out,
					resa[i].adults,
					resa[i].children,
					resa[i].accom_id,
					resa[i].accom_num,
					resa[i].options_info,
					resa[i].non_editable_info,
					resa[i].admin_comment,
					resa[i].accom_discount_amount,
					resa[i].accom_discount_amount_type,
					resa[i].global_discount_amount,
					resa[i].global_discount_amount_type,
					resa[i].customer_id,
					resa[i].received_on,
					[], // email_logs
					resa[i].nb_emails_sent,
					resa[i].payments_logs,
					resa[i].origin,
					resa[i].origin_url,
					resa[i].additional_info,
					resa[i].lang,
					this
				)
			);
		}
		this.resa( prepared_resa );

		var observable_blocked_accom = [];
		for ( var i = 0; i < hb_blocked_accom.length; i++ ) {
			observable_blocked_accom.push(
				new BlockedAccom(
					hb_blocked_accom[i].from_date,
					hb_blocked_accom[i].to_date,
					hb_blocked_accom[i].accom_id,
					hb_blocked_accom[i].accom_num,
					hb_blocked_accom[i].accom_all_num,
					hb_blocked_accom[i].accom_all_ids,
					hb_blocked_accom[i].comment,
					hb_blocked_accom[i].linked_resa_id
				)
			);
		}
		this.blocked_accom( observable_blocked_accom );
	}

	var resaViewModel = new ResaViewModel();
	ko.applyBindings( resaViewModel );

	var first_calendar_day = new Date();
	if ( first_calendar_day.getDate() > 20 ) {
		first_calendar_day.setDate( 15 );
	} else if ( first_calendar_day.getDate() > 5 ) {
		first_calendar_day.setDate( 1 );
	} else {
		first_calendar_day.setDate( 15 );
		first_calendar_day.setMonth( first_calendar_day.getMonth() - 1 );
	}
	hb_resa_cal_tables( hb_date_to_str( first_calendar_day ), displayed_accoms );
	resaViewModel.redraw_calendar();

	var today = new Date();
	var days_diff = Math.floor( ( today - first_calendar_day ) / ( 1000 *60 * 60 *24 ) );
	var scroll_left = ( days_diff - 1 ) * $( '#hb-resa-cal-table td' ).outerWidth();
	setTimeout( function() {
		$( '#hb-resa-cal-scroller' ).scrollLeft( scroll_left );
	}, 1000 );
});

var hb_new_admin_resas;