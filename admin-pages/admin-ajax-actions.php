<?php
class HbAdminAjaxActions {

	private $hbdb;
	private $utils;
	private $options_utils;
	private $stripe;
	private $resa;
	private $multi_resa;

	public function __construct( $db, $utils, $options_utils, $stripe, $resa, $multi_resa ) {
		$this->hbdb = $db;
		$this->utils = $utils;
		$this->options_utils = $options_utils;
		$this->stripe = $stripe;
		$this->resa = $resa;
		$this->multi_resa = $multi_resa;
	}

	private function hb_verify_nonce() {
		if ( wp_verify_nonce( $_POST['nonce'], 'hb_nonce_update_db' ) ) {
			return true;
		} else {
			esc_html_e( 'Your session has expired. Please refresh the page.', 'hbook-admin' );
			return false;
		}
	}

	private function hb_user_can() {
		if ( current_user_can( 'manage_hbook' ) ) {
			return true;
		} else {
			echo( 'Not enough privileges to do this action.' );
			return false;
		}
	}

	private function hb_user_can_manage_cap( $cap ) {
		if ( current_user_can( 'manage_hbook' ) || current_user_can( $cap ) ) {
			return true;
		} else {
			echo( 'Not enough privileges to do this action.' );
			return false;
		}
	}

	public function hb_update_db() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			echo( esc_html( $this->hbdb->update_hb_setting( $_POST['db_action'], $_POST['object'] ) ) );
		}
		die;
	}

	public function hb_update_appearance_settings() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			$settings = $this->options_utils->get_options_list( 'appearance_settings' );
			foreach ( $settings as $setting ) {
				if ( isset( $_POST[ $setting ] ) ) {
					update_option( $setting, wp_strip_all_tags( stripslashes( $_POST[ $setting ] ) ) );
				}
			}
			echo( 'settings saved' );
		}
		die;
	}

	public function hb_update_payment_settings() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			$settings = $this->options_utils->get_options_list( 'payment_settings' );
			foreach ( $this->utils->get_payment_gateways() as $gateway ) {
				$settings[] = 'hb_' . $gateway->id .'_active';
				$gateway_admin_fields = $gateway->admin_fields();
				$gateway_options = $gateway_admin_fields['options'];
				foreach ( $gateway_options as $id => $option ) {
					$settings[] = $id;
				}
			}
			foreach ( $settings as $setting ) {
				if ( isset( $_POST[ $setting ] ) ) {
					if ( is_array( $_POST[ $setting ] ) ) {
						update_option( $setting, wp_strip_all_tags( json_encode( $_POST[ $setting ] ) ) );
					} else {
						update_option( $setting, wp_strip_all_tags( stripslashes( $_POST[ $setting ] ) ) );
					}
					if ( ( 'hb_stripe_active' == $setting ) && ( 'yes' == $_POST[ $setting ] ) ) {
						$country_field = $this->hbdb->get_single_field( 'country_iso' );
						if ( $country_field ) {
							if ( ( '1' != $country_field['required'] ) || ( '1' != $country_field['displayed'] ) ) {
								$this->hbdb->update_country_select_field();
							}
						}
					}
				}
			}
			echo( 'settings saved' );
		}
		die;
	}

	public function hb_update_misc_settings() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			$settings = $this->options_utils->get_options_list( 'misc_settings' );
			if ( isset( $_POST[ 'hb_accommodation_slug' ] ) && $_POST[ 'hb_accommodation_slug' ] != get_option( 'hb_accommodation_slug' ) ) {
				update_option( 'hb_flush_rewrite', 'flush' );
			}
			if (
				( get_option( 'hb_multiple_accom_booking' ) == 'enabled' ) &&
				( $_POST['hb_multiple_accom_booking'] == 'disabled' )
			) {
				$this->hbdb->remove_linked_booking_extra();
				update_option( 'hb_display_accom_number_field', 'no' );
			}
			if (
				( get_option( 'hb_multiple_accom_booking_front_end' ) == 'enabled' ) &&
				( $_POST['hb_multiple_accom_booking_front_end'] == 'disabled' )
			) {
				update_option( 'hb_display_accom_number_field', 'no' );
			}
			foreach ( $settings as $setting ) {
				if ( isset( $_POST[ $setting ] ) ) {
					update_option( $setting, wp_strip_all_tags( trim( stripslashes( $_POST[ $setting ] ) ) ) );
				}
			}
			echo( 'settings saved' );
		}
		die;
	}

	public function hb_update_ical_settings() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			$settings = $this->options_utils->get_options_list( 'ical_settings' );
			foreach ( $settings as $setting ) {
				if ( isset( $_POST[ $setting ] ) ) {
					$new_setting_value = wp_strip_all_tags( trim( stripslashes( $_POST[ $setting ] ) ) );
					if ( $setting == 'hb_ical_frequency' ) {
						if ( get_option( 'hb_ical_frequency' ) != $new_setting_value ) {
							update_option( 'hb_ical_frequency', $new_setting_value );
							wp_clear_scheduled_hook( 'hb_ical_synchronized' );
							wp_schedule_event( time(), 'hb_ical_custom_frequency', 'hb_ical_synchronized' );
						}
					} else if ( $setting == 'hb_ical_url_feed_has_key' ) {
						update_option( 'hb_ical_url_feed_has_key', $new_setting_value );
						if ( $new_setting_value == 'yes' ) {
							update_option( 'hb_ical_url_feed_key', $this->utils->get_alphanum( 15 ) );
						} else {
							delete_option( 'hb_ical_url_feed_key' );
						}
					} else {
						update_option( $setting, $new_setting_value );
					}
				}
			}
			echo( 'settings saved' );
		}
		die;
	}

	public function hb_update_forms_settings() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			$options = $this->options_utils->get_options_list( 'search_form_options' );
			foreach ( $options as $option ) {
				update_option( $option, wp_strip_all_tags( stripslashes( $_POST[ $option ] ) ) );
			}
			if ( $_POST['hb_minimum_accom_number'] > 1 ) {
				update_option( 'hb_multiple_accom_booking_suggestions', 'disabled' );
			}
			$options = $this->options_utils->get_options_list( 'accom_selection_options' );
			foreach ( $options as $option ) {
				update_option( $option, wp_strip_all_tags( stripslashes( $_POST[ $option ] ) ) );
			}
			echo( 'settings saved' );
		}
		die;
	}

	public function hb_update_details_form_settings() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			$this->hbdb->update_fields( wp_strip_all_tags( stripslashes( $_POST['hb_fields'] ) ) );
			$this->hbdb->update_resa_customers_field_ids( $_POST['hb_updated_ids'] );
			update_option( 'hb_country_select_default', $_POST['hb_country_select_default'] );
			echo( 'settings saved' );
		}
		die;
	}

	public function hb_update_strings() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			$strings = $this->utils->get_string_list();
			$external_strings_sections = apply_filters( 'hb_strings', array() );
			foreach ( $external_strings_sections as $section ) {
				$strings = array_merge( $strings, $section['strings'] );
			}
			$langs = $this->utils->get_langs();
			$strings_to_update = array();
			foreach ( $strings as $string_id => $string_name ) {
				foreach ( $langs as $locale => $lang_name ) {
					$input_name = 'string-id-' . $string_id . '-in-' . $locale;
					if ( isset( $_POST[ $input_name ] ) ) {
						$strings_to_update[] = array(
							'id' => $string_id,
							'locale' => $locale,
							'value' => wp_kses_post( stripslashes( $_POST[ $input_name ] ) )
						);
					}
				}
			}
			$this->hbdb->update_strings( $strings_to_update );
			echo( 'form saved' );
		}
		die;
	}

	public function hb_update_rates() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can() ) {
			if ( $this->hbdb->update_rates( $_POST['rate_type'], $_POST['rates'] ) ) {
				echo( 'rates saved' );
			} else {
				echo( 'Database error.' );
			}
		}
		die;
	}

	public function hb_confirm_resas() {
		$response = array();
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( isset( $_POST['parent_resas_ids'] ) ) {
				foreach ( $_POST['parent_resas_ids'] as $id ) {
					$this->multi_resa->load( $id );
					$has_confirmed_resas = false;
					foreach ( $this->multi_resa->children_resas as $resa ) {
						$response[ $resa->id ]['status'] = $resa->status;
						if ( $resa->status == 'new' ) {
							if ( $this->hbdb->update_resa_status( $resa->id, 'confirmed' ) ) {
								$has_confirmed_resas = true;
								$response[ $resa->id ]['status'] = 'confirmed';
							}
						} else if ( $resa->status == 'pending' ) {
							$confirmed_resa_data = $this->utils->confirm_pending_resa( $resa->id );
							if ( $confirmed_resa_data['status'] == 'confirmed' ) {
								$has_confirmed_resas = true;
								$response[ $resa->id ]['status'] = 'confirmed';
								$response[ $resa->id ]['accom_num'] = $confirmed_resa_data['accom_num'];
								$response[ $resa->id ]['automatic_blocked_accom'] = $confirmed_resa_data['automatic_blocked_accom'];
							}
						}
					}
					if ( $has_confirmed_resas ) {
						$this->utils->send_email( 'confirmation_resa', '#' . $id );
						$response[ '#' . $id ]['status'] = 'confirmed';
						$response[ '#' . $id ]['email_logs'] = $this->utils->get_email_logs_txt( $id, 1 );
					} else {
						$response[ '#' . $id ]['status'] = '';
					}
				}
			}
			if ( isset( $_POST['single_resas_ids'] ) ) {
				foreach ( $_POST['single_resas_ids'] as $id ) {
					$this->resa->load( $id );
					$response[ $id ]['status'] = $this->resa->status;
					$resa_confirmed = true;
					if ( $this->resa->status == 'new' ) {
						if ( $this->hbdb->update_resa_status( $id, 'confirmed' ) ) {
							$response[ $id ]['status'] = 'confirmed';
						} else {
							$resa_confirmed = false;
						}
					} else if ( $this->resa->status == 'pending' ) {
						$confirmed_resa_data = $this->utils->confirm_pending_resa( $id );
						if ( $confirmed_resa_data['status'] == 'confirmed' ) {
							$response[ $id ]['status'] = 'confirmed';
							$response[ $id ]['accom_num'] = $confirmed_resa_data['accom_num'];
							$response[ $id ]['automatic_blocked_accom'] = $confirmed_resa_data['automatic_blocked_accom'];
						} else {
							$resa_confirmed = false;
						}
					} else {
						$resa_confirmed = false;
					}
					if ( $resa_confirmed && ( $this->resa->parent_id == 0 ) ) {
						$this->utils->send_email( 'confirmation_resa', $id );
						$response[ $id ]['email_logs'] = $this->utils->get_email_logs_txt( $id, 0 );
					}
				}
			}
		}
		echo( json_encode( $this->utils->hb_esc( $response ) ) );
		die;
	}

	public function hb_cancel_resas() {
		$response = array();
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( isset( $_POST['parent_resas_ids'] ) ) {
				foreach ( $_POST['parent_resas_ids'] as $id ) {
					$this->multi_resa->load( $id );
					$previous_price = $this->multi_resa->price;
					if ( $this->hbdb->cancel_parent_resa( $id ) ) {
						$this->multi_resa->load( $id );
						$response[ '#'. $id ]['new_status'] = 'cancelled';
						if ( $this->multi_resa->total_price() != $previous_price ) {
							$this->hbdb->update_parent_resa_price( $id, $previous_price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
						}
						$response[ '#' . $id ]['new_price'] = $this->multi_resa->total_price();
						$this->utils->send_email( 'cancellation_resa', '#' . $id );
						$response[ '#' . $id ]['email_logs'] = $this->utils->get_email_logs_txt( $id, 1 );
					} else {
						$response[ '#'. $id ]['new_status'] = '';
					}
				}
			}
			if ( isset( $_POST['single_resas_ids'] ) ) {
				foreach ( $_POST['single_resas_ids'] as $id ) {
					$this->resa->load( $id );
					if ( $this->hbdb->update_resa_status( $id, 'cancelled' ) ) {
						$response[ $id ]['new_status'] = 'cancelled';
						if ( $this->resa->parent_id != 0 ) {
							$this->multi_resa->load( $this->resa->parent_id );
							$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
							$response[ '#' . $this->resa->parent_id ]['new_price'] = $this->multi_resa->total_price();
						} else {
							$this->utils->send_email( 'cancellation_resa', $id );
							$response[ $id ]['email_logs'] = $this->utils->get_email_logs_txt( $id, 0 );
						}
					} else {
						$response[ $id ]['new_status'] = '';
					}
				}
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_delete_resas() {
		$response = array();
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( isset( $_POST['parent_resas_ids'] ) ) {
				foreach ( $_POST['parent_resas_ids'] as $id ) {
					if ( $this->hbdb->delete_parent_resa( $id ) ) {
						$response[ '#'. $id ] = 'deleted';
					} else {
						$response[ '#'. $id ] = 'db_error';
					}
				}
			}
			if ( isset( $_POST['single_resas_ids'] ) ) {
				foreach ( $_POST['single_resas_ids'] as $id ) {
					$this->resa->load( $id );
					if ( $this->hbdb->delete_resa( $id ) ) {
						$response[ $id ] = 'deleted';
						if ( $this->resa->parent_id != 0 ) {
							$this->multi_resa->load( $this->resa->parent_id );
							$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
							$response[ '##' . $this->resa->parent_id ] = $this->multi_resa->total_price();
						}
					} else {
						$response[ $id ] = 'db_error';
					}
				}
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_update_resa_dates() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $this->utils->can_update_resa_dates( $_POST['resa_id'], $_POST['new_check_in'], $_POST['new_check_out'] ) ) {
				$this->resa->load( $_POST['resa_id'] );
				if ( $this->hbdb->update_resa_dates( $_POST['resa_id'], $_POST['new_check_in'], $_POST['new_check_out'] ) ) {
					$automatic_blocked_accom = array();
					if ( ( $this->resa->status == 'new' ) || ( $this->resa->status == 'confirmed' ) ) {
						$automatic_blocked_accom = $this->hbdb->automatic_block_accom( $this->resa->accom_id, $this->resa->accom_num, $_POST['new_check_in'], $_POST['new_check_out'], $this->resa->id );
					}
					$new_price = -1;
					if ( $this->resa->accom_price != -1 ) {
						$this->resa->check_in = $_POST['new_check_in'];
						$this->resa->check_out = $_POST['new_check_out'];
						$response = $this->resa->refresh_price();
						if ( $response['status'] == 'price_calc_error' ) {
							echo( json_encode( $this->utils->hb_esc( $response ) ) );
							die;
						}
						$new_price = $this->resa->total_price();
						if ( $new_price == $this->resa->price ) {
							$new_price = -1;
						}
					}
					$response = array(
						'status' => 'resa_dates_modified',
						'automatic_blocked_accom' => $automatic_blocked_accom,
						'new_price' => $new_price,
						'discounts' => $this->resa->discounts(),
					);
					if ( $this->resa->parent_id != 0 ) {
						$this->multi_resa->load( $this->resa->parent_id );
						$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
						$response['parent_new_price'] = $this->multi_resa->total_price();
					}
				} else {
					$response = array(
						'status' => 'db_error'
					);
				}
			} else {
				$response = array(
					'status' => 'resa_dates_not_modified'
				);
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_update_resa_info() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $_POST['resa_is_parent'] ) {
				if ( $this->hbdb->update_parent_resa_info( $_POST['resa_id'], $_POST['lang'], stripslashes( $_POST['additional_info'] ) ) !== false ) {
					$response = array(
						'status' => 'resa_info_updated',
					);
				} else {
					$response = array(
						'status' => 'db_error'
					);
				}
				echo( json_encode( $this->utils->hb_esc( $response ) ) );
				die;
			}
			$this->resa->load( $_POST['resa_id'] );
			if ( $this->hbdb->update_resa_info( $_POST['resa_id'], $_POST['adults'], $_POST['children'], $_POST['lang'], stripslashes( $_POST['additional_info'] ) ) !== false ) {
				$new_price = -1;
				if (
					(
						( $_POST['adults'] != $this->resa->adults ) ||
						( $_POST['children'] != $this->resa->children )
					) &&
					( $this->resa->accom_price != -1 )
				) {
					$this->resa->adults = $_POST['adults'];
					$this->resa->children = $_POST['children'];
					$response = $this->resa->refresh_price();
					if ( $response['status'] == 'price_calc_error' ) {
						echo( json_encode( $this->utils->hb_esc( $response ) ) );
						die;
					}
					$new_price = $this->resa->total_price();
					if ( $new_price == $this->resa->price ) {
						$new_price = -1;
					}
				}
				$response = array(
					'status' => 'resa_info_updated',
					'new_price' => $new_price,
				);
				if ( $this->resa->parent_id != 0 ) {
					$this->multi_resa->load( $this->resa->parent_id );
					$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
					$response['parent_new_price'] = $this->multi_resa->total_price();
				}
			} else {
				$response = array(
					'status' => 'db_error'
				);
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_edit_options_get_editor() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			require_once $this->utils->plugin_directory . '/utils/resa-options.php';
			$options_form = new HbOptionsForm( $this->hbdb, $this->utils );
			if ( $_POST['resa_is_parent'] ) {
				$this->multi_resa->load( $_POST['resa_id'] );
				$resa_info = array(
					array(
						'link' => 'booking',
						'adults' => $this->multi_resa->adults(),
						'children' => $this->multi_resa->children(),
						'nb_accom' => count( $this->multi_resa->children_resas ),
						'resa_parental_status' => 'parent',
					)
				);
				$nb_nights = 0;
				$extras = $this->multi_resa->extras;
			} else {
				$this->resa->load( $_POST['resa_id'] );
				$resa_info = array(
					array(
						'ids' => array( $this->resa->accom_id ),
						'adults' => $this->resa->adults,
						'children' => $this->resa->children,
						'resa_parental_status' => '',
					)
				);
				$nb_nights = $this->utils->get_number_of_nights( $this->resa->check_in, $this->resa->check_out );
				$extras = $this->resa->extras;
				if ( $this->resa->parent_id != 0 ) {
					$resa_info[0]['resa_parental_status'] = 'child';
				}
			}
			echo( $options_form->get_update_options_form_markup_backend( $resa_info, $nb_nights, $extras ) );
		}
		die;
	}

	public function hb_update_resa_options() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $_POST['resa_is_parent'] ) {
				$options = $this->hbdb->get_global_options_with_choices();
			} else {
				$options = $this->hbdb->get_options_with_choices( $_POST['accom_id'] );
			}
			$options_choices = $this->hbdb->get_all( 'options_choices' );
			$choice_name = array();
			foreach ( $options_choices as $choice ) {
				$choice_name[ $choice['id'] ] = $choice['name'];
			}
			$chosen_options = array();
			foreach ( $options as $option ) {
				if ( ( $_POST['resa_parent_id'] != 0 ) && ( $option['link'] == 'booking' ) ) {
					continue;
				}
				$chosen_option = array(
					'name' => $option['name'],
					'amount' => $option['amount'],
					'amount_children' => $option['amount_children'],
					'apply_to_type' => $option['apply_to_type'],
				);
				$option_name = 'hb-option-' . $option['id'] . '-multi-accom-1';
				if ( $option['apply_to_type'] == 'quantity' || $option['apply_to_type'] == 'quantity-per-day' ) {
					$quantity = 0;
					if ( isset( $_POST[ $option_name ] ) ) {
						$quantity = intval( $_POST[ $option_name ] );
					}
					if ( $quantity ) {
						$chosen_option['quantity'] = $quantity;
						$chosen_option['amount'] = $option['amount'];
						$chosen_options[ $option['id'] ] = $chosen_option;
					}
				} else if ( $option['choice_type'] == 'single' ) {
					if ( isset( $_POST[ $option_name ] ) ) {
						$chosen_option['amount'] = $option['amount'];
						$chosen_option['amount_children'] = $option['amount_children'];
						$chosen_options[ $option['id'] ] = $chosen_option;
					}
				} else {
					foreach ( $option['choices'] as $choice ) {
						if ( isset( $_POST[ $option_name ] ) && ( $_POST[ $option_name ] == $choice['id'] ) ) {
							$chosen_option['chosen'] = $choice['id'];
							$chosen_option['choice_name'] = $choice_name[ $choice['id'] ];
							$chosen_option['amount'] = $choice['amount'];
							$chosen_option['amount_children'] = $choice['amount_children'];
						}
					}
					$chosen_options[ $option['id'] ] = $chosen_option;
				}
			}
			$chosen_options = json_encode( $chosen_options );

			if ( $this->hbdb->update_resa_options( $_POST['resa_id'], $_POST['resa_is_parent'], $chosen_options ) !== false ) {
				$response = array(
					'status' => 'resa_options_updated',
					'options_info' => $this->utils->resa_options_markup_admin( $chosen_options ),
				);
				if ( $_POST['resa_is_parent'] ) {
					$this->multi_resa->load( $_POST['resa_id'] );
					$this->hbdb->update_parent_resa_price( $_POST['resa_id'], $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
					$response['parent_new_price'] = $this->multi_resa->total_price();
				} else {
					$new_price = -1;
					$this->resa->load( $_POST['resa_id'] );
					if ( $this->resa->accom_price != -1 ) {
						$refresh_price_response = $this->resa->refresh_price();
						if ( $refresh_price_response['status'] == 'price_calc_error' ) {
							echo( json_encode( $this->utils->hb_esc( $refresh_price_response ) ) );
							die;
						}
						$new_price = $this->resa->total_price();
						if ( $new_price == $this->resa->price ) {
							$new_price = -1;
						}
						$response['new_price'] = $new_price;
					}
					if ( $this->resa->parent_id != 0 ) {
						$this->multi_resa->load( $this->resa->parent_id );
						$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
						$response['parent_new_price'] = $this->multi_resa->total_price();
					}
				}
			} else {
				$response = array(
					'status' => 'db_error'
				);
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_update_resa_comment() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $this->hbdb->update_resa_comment( $_POST['resa_id'], $_POST['resa_is_parent'], stripslashes( $_POST['resa_comment'] ) ) !== false ) {
				echo( 'admin comment updated' );
			} else {
				echo( 'Database error.' );
			}
		}
		die;
	}

	public function hb_edit_accom_get_avai() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$accom = $this->hbdb->get_all_accom_ids();
			$all_avai_accom_with_num = array();
			$avai_accom = false;
			foreach ( $accom as $accom_id ) {
				$accom_num = array_keys( $this->hbdb->get_accom_num_name( $accom_id ) );
				$unavai_accom_num = $this->hbdb->get_unavailable_accom_num_per_date( $accom_id, $_POST['check_in'], $_POST['check_out'] );
				$avai_accom_num = array_values( array_diff( $accom_num, $unavai_accom_num ) );
				if ( $avai_accom_num ) {
					$avai_accom = true;
				}
				$all_avai_accom_with_num[] = array(
					'accom_id' => $accom_id,
					'accom_num' => $avai_accom_num
				);
			}
			if ( $avai_accom ) {
				echo( json_encode( $this->utils->hb_esc( $all_avai_accom_with_num ) ) );
			} else {
				echo( json_encode( array() ) );
			}
		}
		die;
	}

	public function hb_update_resa_accom() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $this->hbdb->is_available_accom_num( $_POST['accom_id'], $_POST['accom_num'], $_POST['check_in'], $_POST['check_out'] ) ) {
				$this->resa->load( $_POST['resa_id'] );
				$this->resa->accom_id = $_POST['accom_id'];
				if ( $this->hbdb->update_resa_accom( $_POST['resa_id'], $_POST['accom_id'], $_POST['accom_num'] ) ) {
					$automatic_blocked_accom = array();
					if ( ( $this->resa->status == 'new' ) || ( $this->resa->status == 'confirmed' ) ) {
						$automatic_blocked_accom = $this->hbdb->automatic_block_accom( $_POST['accom_id'], $_POST['accom_num'], $_POST['check_in'], $_POST['check_out'], $_POST['resa_id'] );
					}
					$new_price = -1;
					if ( $this->resa->accom_price != -1 ) {
						$response = $this->resa->refresh_price();
						if ( $response['status'] == 'price_calc_error' ) {
							echo( json_encode( $this->utils->hb_esc( $response ) ) );
							die;
						}
						$new_price = $this->resa->total_price();
						if ( $new_price == $this->resa->price ) {
							$new_price = -1;
						}
					}
					$response = array(
						'status' => 'accom_updated',
						'automatic_blocked_accom' => $automatic_blocked_accom,
						'new_price' => $new_price,
						'discounts' => $this->resa->discounts(),
					);
					if ( $this->resa->parent_id != 0 ) {
						$this->multi_resa->load( $this->resa->parent_id );
						$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
						$response['parent_new_price'] = $this->multi_resa->total_price();
					}
				} else {
					$response = array(
						'status' => 'db_error'
					);
				}
			} else {
				$accom_num_name = $this->hbdb->get_accom_num_name( $_POST['accom_id'] );
				$response = array(
					'status' => 'accom_no_longer_available',
					'msg' => sprintf( esc_html__( 'The %s (%s) is no longer available.', 'hbook-admin' ), get_the_title( $_POST['accom_id'] ), $accom_num_name[ $_POST['accom_num'] ] ),
				);
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_update_resa_price() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$this->resa->load( $_POST['resa_id'] );
			$new_price = floatval( $_POST['new_price'] );
			if ( $this->resa->accom_price == -1 ) {
				$this->hbdb->update_resa_price( $_POST['resa_id'], $this->resa->price, $new_price );
				$response = array(
					'status' => 'price_updated',
					'discount_status' => 'not_updated',
				);
			} else {
				$total_fee_percent = 0;
                $total_fee_fixed = 0;
                foreach ( $this->resa->final_added_fees as $fee ) {
                    if ( $fee['apply_to_type'] == 'global-percentage' ) {
                        $total_fee_percent += $fee['amount'];
                    }
                    if ( $fee['apply_to_type'] == 'global-fixed' ) {
                        $total_fee_fixed += $fee['amount'];
                    }
                }
                if ( $new_price > $total_fee_fixed ) {
                    $new_discount = ( $this->resa->price - $new_price ) / ( 1 + ( $total_fee_percent / 100 ) );
                } else {
                    $tmp_price = $this->resa->price - $total_fee_fixed;
                    $tmp_price = $tmp_price / ( 1 + ( $total_fee_percent / 100 ) );
                    $new_discount = $tmp_price - ( $new_price - $total_fee_fixed );
                }
                $discount_amount = round( $new_discount + $this->resa->global_discount_amount(), 2 );
				$this->resa->global_discount = array(
					'amount' => $discount_amount,
					'amount_type' => 'fixed'
				);
				if ( $this->hbdb->update_resa_prices_info( $_POST['resa_id'], $this->resa->accom_price, json_encode( $this->resa->discounts() ), $this->resa->deposit(), $this->resa->price, $this->resa->total_price() ) !== false ) {
					$response = array(
						'status' => 'price_updated',
						'discount_status' => 'updated',
						'discount_amount' => $this->resa->global_discount['amount'],
					);
					if ( $this->resa->parent_id != 0 ) {
						$this->multi_resa->load( $this->resa->parent_id );
						$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
						$response['parent_new_price'] = $this->multi_resa->total_price();
					}
				} else {
					$response = array(
						'status' => 'db_error',
					);
				}
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_add_resa_payment() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $_POST['resa_is_parent'] ) {
				$resa = $this->hbdb->get_single( 'parents_resa', $_POST['resa_id'] );
			} else {
				$resa = $this->hbdb->get_single( 'resa', $_POST['resa_id'] );
			}
			$resa = $this->hbdb->update_resa_charges_info( $resa );

			$payment_id = $this->hbdb->add_resa_payment( $_POST['resa_id'], $_POST['resa_is_parent'], $_POST['resa_payment'] );
			if ( $payment_id ) {
				echo( json_encode( array( 'status' => 'payment_added', 'payment_id' => $payment_id ) ) );
			} else {
				echo( json_encode( array( 'status' => 'error', 'error_msg' => 'Database error.' ) ) );
			}
		}
		die;
	}

	public function hb_delete_resa_payment() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $this->hbdb->delete_resa_payment( $_POST['resa_id'], $_POST['resa_is_parent'], $_POST['resa_payment_id'] ) !== false ) {
				echo( json_encode( array( 'status' => 'payment_deleted' ) ) );
			} else {
				echo( json_encode( array( 'status' => 'error', 'error_msg' => 'Database error.' ) ) );
			}
		}
		die;
	}

	public function hb_update_resa_discount() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$this->resa->load( $_POST['resa_id'] );
			$accom_discount_amount = $this->utils->round_price( floatval( $_POST['accom_discount_amount'] ) );
			$global_discount_amount = $this->utils->round_price( floatval( $_POST['global_discount_amount'] ) );
			$this->resa->accom_discount = array(
				'amount_type' => $_POST['accom_discount_amount_type'],
				'amount' => $accom_discount_amount,
			);
			$this->resa->global_discount = array(
				'amount_type' => $_POST['global_discount_amount_type'],
				'amount' => $global_discount_amount,
			);
			$new_price = $this->resa->total_price();
			if ( $this->hbdb->update_resa_prices_info( $_POST['resa_id'], $this->resa->accom_price, json_encode( $this->resa->discounts() ), $this->resa->deposit(), $this->resa->price, $new_price ) !== false ) {
				$response = array(
					'status' => 'discount updated',
					'new_price' => $new_price,
				);
				if ( $this->resa->parent_id != 0 ) {
					$this->multi_resa->load( $this->resa->parent_id );
					$this->hbdb->update_parent_resa_price( $this->resa->parent_id, $this->multi_resa->price, $this->multi_resa->total_price(), $this->multi_resa->deposit() );
					$response['parent_new_price'] = $this->multi_resa->total_price();
				}
			} else {
				$response = array(
					'status' => 'db_error',
				);
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_update_customer() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$customer_id = intval( $_POST['customer_id'] );
			$customer_email = wp_strip_all_tags( $_POST['email'] );
			$customer_info = json_decode( wp_strip_all_tags( stripslashes( $_POST['info'] ) ), true );
			if ( $this->hbdb->update_customer( $customer_id, $customer_email, $customer_info ) !== false ) {
				echo( 'customer updated' );
			} else {
				echo( 'Database error.' );
			}
		}
		die;
	}

	public function hb_delete_customer() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $this->hbdb->delete_customer( $_POST['customer_id'] ) ) {
				echo( 'customer_deleted' );
			} else {
				echo( 'Database error.' );
			}
		}
		die;
	}

	public function hb_add_blocked_accom() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $this->hbdb->add_blocked_accom( $_POST['accom_id'], $_POST['accom_num'], $_POST['accom_all_ids'], $_POST['accom_all_num'], $_POST['from_date'], $_POST['to_date'], $_POST['comment'] ) ) {
				echo( 'blocked accom added' );
			} else {
				echo( 'Database error.' );
			}
		}
		die;
	}

	public function hb_delete_blocked_accom() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $this->hbdb->delete_blocked_accom( $_POST['date_from'], $_POST['date_to'], $_POST['accom_id'], $_POST['accom_num'], $_POST['accom_all_ids'], $_POST['accom_all_num'] ) ) {
				echo( 'blocked accom deleted' );
			} else {
				echo( 'Database error.' );
			}
		}
		die;
	}

	public function hb_delete_sync_errors() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$this->hbdb->delete_sync_errors();
		}
		die;
	}

	public function hb_resa_create_new_customer() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$response = array();
			$customer_id = $this->hbdb->create_customer( '', array() );
			if ( $customer_id ) {
				if ( $this->hbdb->resa_update_customer_id( $_POST['resa_id'], $customer_id ) ) {
					$response['customer_id'] = $customer_id;
				}
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_save_selected_customer() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$response = array();
			if ( $this->hbdb->resa_update_customer_id( $_POST['resa_id'], $_POST['customer_id'] ) ) {
				$response['customer_id'] = $_POST['customer_id'];
			} else {
				$response['customer_id'] = 0;
			}
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_resa_charge() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $_POST['resa_is_parent'] ) {
				$resa = $this->hbdb->get_single( 'parents_resa', $_POST['resa_id'] );
			} else {
				$resa = $this->hbdb->get_single( 'resa', $_POST['resa_id'] );
			}
			$resa = $this->hbdb->update_resa_charges_info( $resa );

			$customer_payment_id = $this->hbdb->get_customer_payment_id( $resa['customer_id'] );
			$customer_info = $this->hbdb->get_customer_info( $resa['customer_id'] );

			$charge_amount = floatval( $_POST['charge_amount'] );
			if ( ! is_numeric( $charge_amount ) ) {
				echo( 'Invalid amount.' );
				die;
			}

			$currency = get_option( 'hb_currency' );
			if ( $currency != $resa['currency'] ) {
				echo( 'Currency error.' );
				die;
			}

			$customer_email = '';
			$customer_first_name = '';
			$customer_last_name = '';
			if ( isset( $customer_info['email'] ) ) {
				$customer_email = $customer_info['email'];
			}
			if ( isset( $customer_info['first_name'] ) ) {
				$customer_first_name = $customer_info['first_name'];
			}
			if ( isset( $customer_info['last_name'] ) ) {
				$customer_last_name = $customer_info['last_name'];
			}
			$payment_description = $customer_email;
			if ( $customer_first_name || $customer_last_name ) {
				$payment_description .= ' (' . $customer_first_name . ' ' . $customer_last_name . ')';
			}
			if ( $payment_description ) {
				$payment_description .= ' - ';
			}
			if ( $_POST['resa_is_parent'] ) {
				$payment_description .= '#' . $_POST['resa_id'];
			} else {
				$wptexturize = remove_filter( 'the_title', 'wptexturize' );
				$payment_description .= get_the_title( $resa['accom_id'] );
				if ( $wptexturize ) {
					add_filter( 'the_title', 'wptexturize' );
				}
				$payment_description .= ' (' . esc_html__( 'from', 'hbook-admin' ) . ' ' . $resa['check_in'] . ' ' . esc_html__( 'to', 'hbook-admin' ) . ' ' . $resa['check_out'] . ')';
			}

			if ( substr( $customer_payment_id, 0, 4 ) == 'cus_' ) {
				$response = $this->stripe->remote_get_to_stripe( 'https://api.stripe.com/v1/customers/' . $customer_payment_id . '/payment_methods' );
				if ( $response['success'] ) {
					$payment_methods = json_decode( $response['info'], true );
					if ( isset( $payment_methods['data'] ) && count( $payment_methods['data'] ) > 0 ) {
						$newest_payment_method_created = 0;
						for ( $i = 0; $i < count( $payment_methods['data'] ); $i++ ) {
							if ( $payment_methods['data'][ $i ]['created'] > $newest_payment_method_created ) {
								$newest_payment_method_created = $payment_methods['data'][ $i ]['created'];
								$payment_method = $payment_methods['data'][ $i ]['id'];
							}
						}
					} else {
						echo( 'Unexpected error (customer does not have payment methods).' );
						die;
					}
				} else {
					echo( wp_kses_post( $response['error_msg'] ) );
					die;
				}
			} else {
				$customer_payment_info = json_decode( $customer_payment_id, true );
				$payment_method = $customer_payment_info['payment_method_id'];
				$customer_payment_id = $customer_payment_info['customer_id'];
			}

			$post_args = array(
				'amount' => $charge_amount,
				'currency' => $currency,
				'customer' => $customer_payment_id,
				'description' => $payment_description,
				'payment_method' => $payment_method,
				'off_session' => 'true',
				'confirm' => 'true',
			);

			$charge_response = $this->stripe->remote_post_to_stripe( 'https://api.stripe.com/v1/payment_intents', $post_args );
			if ( $charge_response['success'] ) {
				$charge_response['info'] = json_decode( $charge_response['info'], true );
				$payment_comment = '';
				if ( isset( $_POST['resa_payment_comment'] ) ) {
					$payment_comment = $_POST['resa_payment_comment'];
				}
				$new_payment = array(
					'amount' => $charge_amount,
					'payment_method' => 'Stripe',
					'comment' => $payment_comment,
					'online' => 'yes',
					'gateway_info' => $charge_response['info']['latest_charge'],
				);
				$payment_id = $this->hbdb->add_resa_payment( $_POST['resa_id'], $_POST['resa_is_parent'], $new_payment );
				$response = array(
					'status' => 'charge_done',
					'payment_id' => $payment_id,
					'gateway_info' => $charge_response['info']['latest_charge'],
					'charged_on' => $this->utils->get_blog_datetime( current_time( 'mysql', 1 ) ),
				);
			} else {
				$response = array(
					'status' => 'error',
					'error_msg' => wp_kses_post( $charge_response['error_msg'] ),
				);
			}
		}
		echo( json_encode( $this->utils->hb_esc( $response ) ) );
		die;
	}

	public function hb_refund_resa_payment() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $_POST['resa_is_parent'] ) {
				$resa = $this->hbdb->get_single( 'parents_resa', $_POST['resa_id'] );
			} else {
				$resa = $this->hbdb->get_single( 'resa', $_POST['resa_id'] );
			}
			$resa = $this->hbdb->update_resa_charges_info( $resa );

			$payments_logs = json_decode( $resa['payments_logs'], true );
			if ( ! $payments_logs ) {
				echo( 'No payments to refund.' );
				die;
			}

			$payment_info = false;
			foreach ( $payments_logs as $payment_log ) {
				if ( $payment_log['gateway_info'] == $_POST['resa_payment_charge_id'] ) {
					$payment_info = $payment_log;
					break;
				}
			}
			if ( $payment_info ) {
				$post_args = array(
					'charge' => $payment_info['gateway_info'],
					'amount' => $payment_info['amount'] - $payment_info['refunded_amount'],
				);
				$response = $this->stripe->remote_post_to_stripe( 'https://api.stripe.com/v1/refunds', $post_args );
				if ( $response['success'] ) {
					$this->hbdb->mark_resa_payment_refunded( $_POST['resa_id'], $_POST['resa_is_parent'], $payment_info['id'], $payment_info['amount'] );
					$payment_info = array(
						'amount' => ( $payment_info['amount'] - $payment_info['refunded_amount'] ) * -1,
						'comment' => '#' . $payment_info['id'] . ' ' . esc_html( 'refund', 'hbook-admin' ),
						'online' => 'yes',
						'payment_method' => 'Stripe',
					);
					$this->hbdb->add_resa_payment( $_POST['resa_id'], $_POST['resa_is_parent'], $payment_info );
					$resa['payments_logs'] = $this->hbdb->get_resa_payments_logs_raw( $_POST['resa_id'], $_POST['resa_is_parent'] );
					$response = array(
						'status' => 'payment_refunded',
						'payments_logs' => $this->utils->prepare_resa_payments_logs( $resa )
					);
				} else {
					$response = array(
						'status' => 'error',
						'error_msg' => wp_kses_post( $response['error_msg'] ),
					);
				}
			} else {
				$response = array(
					'status' => 'error',
					'error_msg' => 'Could not find payment information.',
				);
			}
		}
		echo( json_encode( $this->utils->hb_esc( $response ) ) );
		die;
	}

	public function hb_resa_refund() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			if ( $_POST['resa_is_parent'] ) {
				$resa = $this->hbdb->get_single( 'parents_resa', $_POST['resa_id'] );
			} else {
				$resa = $this->hbdb->get_single( 'resa', $_POST['resa_id'] );
			}
			$resa = $this->hbdb->update_resa_charges_info( $resa );

			$refund_amount = floatval( $_POST['refund_amount'] ) * -1;
			if ( ! is_numeric( $refund_amount ) ) {
				echo( 'Invalid amount.' );
				die;
			}

			$currency = get_option( 'hb_currency' );
			if ( $currency != $resa['currency'] ) {
				echo( 'Currency error.' );
				die;
			}

			$payments_logs = json_decode( $resa['payments_logs'], true );
			if ( ! $payments_logs ) {
				echo( 'No payments to refund.' );
				die;
			}

			$stripe_charges = array();
			foreach ( $payments_logs as $payment ) {
				if (
					( $payment['payment_method'] == 'Stripe' ) &&
					( $payment['amount'] > $payment['refunded_amount'] )
				) {
					$stripe_charges[] = $payment;
				}
			}
			if ( ! $stripe_charges ) {
				echo( 'No Stripe charges.' );
				die;
			}

			$refunds_to_do = array();

			foreach ( $stripe_charges as $charge ) {
				if ( $charge['amount'] - $charge['refunded_amount'] == $refund_amount ) {
					$refunds_to_do[] = array(
						'payment_id' => $charge['id'],
						'charge_id' => $charge['gateway_info'],
						'amount' => $refund_amount,
					);
				}
				break;
			}

			if ( ! $refunds_to_do ) {
				$to_be_refunded = 0;
				foreach ( $stripe_charges as $charge ) {
					$remaining_in_charge = $charge['amount'] - $charge['refunded_amount'];
					$remaining_to_refund = $refund_amount - $to_be_refunded;
					if ( $remaining_to_refund >= $remaining_in_charge ) {
						$charge_refund_amount = $remaining_in_charge;
					} else {
						$charge_refund_amount = $remaining_to_refund;
					}
					$refunds_to_do[] = array(
						'payment_id' => $charge['id'],
						'charge_id' => $charge['gateway_info'],
						'amount' => $charge_refund_amount,
					);
					$to_be_refunded += $charge_refund_amount;
					if ( $to_be_refunded >= $refund_amount ) {
						break;
					}
				}
				if ( $to_be_refunded != $refund_amount ) {
					echo( 'Could not calculate charges to refund.' );
					die;
				}
			}

			foreach ( $refunds_to_do as $refund ) {
				$post_args = array(
					'charge' => $refund['charge_id'],
					'amount' => $refund['amount'],
				);
				$response = $this->stripe->remote_post_to_stripe( 'https://api.stripe.com/v1/refunds', $post_args );
				if ( ! $response['success'] ) {
					echo( wp_kses_post( $response['error_msg'] ) );
					die;
				} else {
					$this->hbdb->mark_resa_payment_refunded( $_POST['resa_id'], $_POST['resa_is_parent'], $refund['payment_id'], $refund['amount'] );
				}
			}

			$payment_info = array(
				'amount' => $refund_amount * -1,
				'online' => 'yes',
				'payment_method' => 'Stripe',
			);
			$this->hbdb->add_resa_payment( $_POST['resa_id'], $_POST['resa_is_parent'], $payment_info );
			$resa['payments_logs'] = $this->hbdb->get_resa_payments_logs_raw( $_POST['resa_id'], $_POST['resa_is_parent'] );
			$response = array(
				'status' => 'refund_done',
				'payments_logs' => $this->utils->prepare_resa_payments_logs( $resa )
			);
			echo( json_encode( $this->utils->hb_esc( $response ) ) );
		}
		die;
	}

	public function hb_send_email_customer() {
		if ( $this->hb_verify_nonce() && $this->hb_user_can_manage_cap( 'manage_resa' ) ) {
			$resa_id = intval( $_POST['resa_id'] );
			$resa_is_parent = intval( $_POST['resa_is_parent'] );
			if ( $this->utils->send_not_automatic_email( $resa_id, $resa_is_parent ) ) {
				$response = array(
					'status' => 'email_sent',
					'email_logs' => $this->utils->get_email_logs_txt( $resa_id, $resa_is_parent ),
				);
			} else {
				$response = array(
					'status' => 'email_not_sent'
				);
			}
		}
		echo( json_encode( $this->utils->hb_esc( $response ) ) );
		die;
	}

	public function hb_save_resa_sorting() {
		if ( $this->hb_verify_nonce() ) {
			$valid_sorting = array( 'received_date_desc', 'received_date_asc', 'check_in_date_desc', 'check_in_date_asc' );
			if ( in_array( $_POST['new_sorting'], $valid_sorting ) ) {
				update_option( 'hb_resa_saved_sorting', $_POST['new_sorting'] );
			}
		}
		die;
	}

	public function hb_save_customers_sorting() {
		if ( $this->hb_verify_nonce() ) {
			$valid_sorting = array( 'last_name_asc', 'last_name_desc', 'id_asc', 'id_desc' );
			if ( in_array( $_POST['new_sorting'], $valid_sorting ) ) {
				update_option( 'hb_customers_saved_sorting', $_POST['new_sorting'] );
			}
		}
		die;
	}

	public function hb_fetch_email_logs() {
		if ( $this->hb_verify_nonce() ) {
			$email_logs = $this->utils->get_email_logs_txt( $_POST['resa_id'], $_POST['resa_is_parent'] );
			echo( json_encode( $this->utils->hb_esc( $email_logs ) ) );
		}
		die;
	}
}