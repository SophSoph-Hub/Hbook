<?php
class HbStripe extends HbPaymentGateway {

	private $currency;
	private $zero_decimal_currency;
	public $has_delayed_payment;

	public function __construct( $hbdb, $version, $utils ) {
		$this->id = 'stripe';
		$this->name = 'Stripe';
		$this->has_redirection = 'yes';
		$this->has_delayed_payment = 'yes';
		$this->version = $version;
		$this->hbdb = $hbdb;
		$this->utils = $utils;
		$this->currency = get_option( 'hb_currency' );
		$this->zero_decimal_currency = 'no';
		$zero_decimal_currencies = array( 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'VND', 'VUV', 'XAF', 'XOF', 'XPF' );
		if ( in_array( $this->currency, $zero_decimal_currencies ) ) {
			$this->zero_decimal_currency = 'yes';
		}

		add_filter( 'hbook_payment_gateways', array( $this, 'add_stripe_gateway_class' ) );
	}

	public function add_stripe_gateway_class( $hbook_gateways ) {
		$hbook_gateways[] = $this;
		return $hbook_gateways;
	}

	public function get_payment_method_label() {
		$output = $this->utils->get_string( 'stripe_payment_method_label' );
		$output .= $this->get_credit_cards_icons( 'hb-stripe-payment-gateway-img' );
		return apply_filters( 'hb_stripe_payment_method_label', $output );
	}

	public function admin_fields() {
		return array(
			'label' => esc_html__( 'Stripe settings', 'hbook-admin' ),
			'options' => array(

				'hb_stripe_mode' => array(
					'label' => esc_html__( 'Stripe mode', 'hbook-admin' ),
					'type' => 'radio',
					'choice' => array(
						'live' => esc_html__( 'Live', 'hbook-admin' ),
						'test' => esc_html__( 'Test', 'hbook-admin' ),
					),
					'default' => 'live'
				),
				'hb_stripe_test_publishable_key' => array(
					'label' => esc_html__( 'Test Publishable Key', 'hbook-admin' ),
					'type' => 'text',
					'wrapper-class' => 'hb-stripe-mode-test'
				),
				'hb_stripe_test_secret_key' => array(
					'label' => esc_html__( 'Test Secret Key', 'hbook-admin' ),
					'type' => 'text',
					'wrapper-class' => 'hb-stripe-mode-test',
				),
				'hb_stripe_live_publishable_key' => array(
					'label' => esc_html__( 'Live Publishable Key', 'hbook-admin' ),
					'type' => 'text',
					'wrapper-class' => 'hb-stripe-mode-live',
				),
				'hb_stripe_live_secret_key' => array(
					'label' => esc_html__( 'Live Secret Key', 'hbook-admin' ),
					'type' => 'text',
					'wrapper-class' => 'hb-stripe-mode-live',
				),
				'hb_stripe_payment_methods' => array(
					'label' => esc_html__( 'Payment methods', 'hbook-admin' ),
					'type' => 'radio',
					'choice' => array(
						'credit_card' => esc_html__( 'Credit card only', 'hbook-admin' ),
						'all' => esc_html__( 'All payment methods enabled in Stripe', 'hbook-admin' ),
					),
					'default' => 'credit_card'
				),
				'hb_store_credit_card' => array(
					'label' => esc_html__( 'Store payment method', 'hbook-admin' ),
					'type' => 'radio',
					'choice' => array(
						'yes' => esc_html__( 'Yes', 'hbook-admin' ),
						'no' => esc_html__( 'No', 'hbook-admin' ),
					),
					'default' => 'no'
				),
				'hb_stripe_powered_by' => array(
					'label' => esc_html__( 'Display a "Powered by Stripe" icon', 'hbook-admin' ),
					'type' => 'radio',
					'choice' => array(
						'yes' => esc_html__( 'Yes', 'hbook-admin' ),
						'no' => esc_html__( 'No', 'hbook-admin' ),
					),
					'default' => 'no'
				),

			)
		);
	}

	public function admin_js_scripts() {
		return array(
			array(
				'id' => 'hb-stripe-admin',
				'url' => plugin_dir_url( __FILE__ ) . 'stripe-admin.js',
				'version' => $this->version
			),
		);
	}

	public function js_scripts() {
		return array(
			array(
				'id' => 'stripejs',
				'url' => 'https://js.stripe.com/v3/',
				'version' => null
			),
			array(
				'id' => 'hbook-stripe',
				'url' => plugin_dir_url( __FILE__ ) . 'stripe.js',
				'src' => '/payment/stripe/stripe.js',
				'version' => $this->version
			),
		);
	}

	public function js_data() {
		if ( get_option( 'hb_stripe_mode') == 'test' ) {
			$stripe_key = trim( get_option( 'hb_stripe_test_publishable_key' ) );
		} else {
			$stripe_key = trim( get_option( 'hb_stripe_live_publishable_key' ) );
		}

		$stripe_locale = 'auto';
		$available_locales = array( 'ar', 'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fr', 'he', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'ms', 'mt', 'nb', 'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sv', 'th', 'tr', 'vi', 'zh' );
		$current_locale = get_locale();
		switch ( $current_locale ) {
			case 'en_GB' : $stripe_locale = 'en-GB'; break;
			case 'fr_CA' : $stripe_locale = 'fr-CA'; break;
			case 'pt_BR' : $stripe_locale = 'pt-BR'; break;
			case 'nn_NO' : $stripe_locale = 'nb'; break;
			case 'zh_HK' : $stripe_locale = 'zh-HK'; break;
			case 'zh_TW' : $stripe_locale = 'zh-TW'; break;
			case 'mlt' : $stripe_locale = 'mt'; break;
		}
		if ( $stripe_locale == 'auto' ) {
			$candidate_stripe_locale = substr( $current_locale, 0, 2 );
			if ( in_array( $candidate_stripe_locale, $available_locales ) ) {
				$stripe_locale = $candidate_stripe_locale;
			}
		}

		return array(
			'hb_stripe_key' => $stripe_key,
			'hb_stripe_locale' => $stripe_locale,
			'hb_stripe_currency' => $this->currency,
			'hb_stripe_zero_decimal_currency' => $this->zero_decimal_currency,
			'hb_stripe_payment_methods' => get_option( 'hb_stripe_payment_methods' ),
			'hb_stripe_store_credit_card' => get_option( 'hb_store_credit_card' ),
			'hb_stripe_requires_country_field_msg' => esc_html__( 'When using Stripe you need to add a Required Country Field in the Details form.', 'hbook-admin' ),
		);
	}

	public function payment_form() {
		$output = '';
		$stripe_text_before_form = $this->utils->get_string( 'stripe_text_before_form' );
		if ( $stripe_text_before_form ) {
			$output .= '<p class="hb-stripe-payment-form-txt-top">' . $stripe_text_before_form . '</p>';
		}
		$output .= '<p class="hb-stripe-loading-form hb-dots-loader">';
		$output .= str_replace( '...', '<span></span>', $this->utils->get_string( 'stripe_text_loading_form' ) );
		$output .= '</p>';
		$output .= '<div class="hb-stripe-payment-element-wrapper"></div>';
		$powered_by_stripe = '';
		$stripe_text_class = 'hb-stripe-payment-form-txt-bottom';
		if ( get_option( 'hb_stripe_powered_by' ) == 'yes' ) {
			$powered_by_stripe = '<p class="hb-powered-by-stripe"><img class="hb-powered-by-stripe-img" src="' . plugin_dir_url( __FILE__ ) . '../img/powered_by_stripe.png" alt="" /></p>';
			$stripe_text_class .= ' hb-stripe-payment-form-txt-bottom-has-margin';
		}
		$stripe_text_bottom_form = $this->utils->get_string( 'stripe_text_bottom_form' );
		if ( $stripe_text_bottom_form ) {
			$output .= '<p class="' . $stripe_text_class . '"><small>';
			$output .= '<img class="hb-padlock-img" src="' . plugin_dir_url( __FILE__ ) . '../img/padlock.png" alt="" />';
			$output .= '<span>' . $stripe_text_bottom_form . '</span>';
			$output .= '</small></p>';
		}
		$output .= $powered_by_stripe;
		return apply_filters( 'hb_stripe_payment_form', $output );
	}

	public function process_payment( $resa_info, $customer_info, $amount_to_pay ) {
		$customer_email = '';
		$customer_first_name = '';
		$customer_last_name = '';
		$customer_name = '';
		$customer_phone = '';
		if ( isset( $customer_info['email'] ) ) {
			$customer_email = $customer_info['email'];
		}
		if ( isset( $customer_info['first_name'] ) ) {
			$customer_first_name = $customer_info['first_name'];
		}
		if ( isset( $customer_info['last_name'] ) ) {
			$customer_last_name = $customer_info['last_name'];
		}
		if ( isset( $customer_info['phone'] ) ) {
			$customer_phone = $customer_info['phone'];
		}
		$sep = '';
		if ( $customer_first_name && $customer_last_name ) {
			$sep = ' ';
		}
		$customer_name = $customer_first_name . $sep . $customer_last_name;
		if ( $amount_to_pay == 0 || get_option( 'hb_store_credit_card' ) == 'yes' ) {
			$post_args = array(
				'description' => $customer_name,
				'email' => $customer_email,
				'phone' => $customer_phone,
				'name' => $customer_name,
			);
			$customer_payment_id = false;
			$customer = $this->hbdb->get_customer_by_email( $customer_email );
			if ( $customer ) {
				if ( $customer['payment_id'] && substr( $customer['payment_id'], 0, 4 ) == 'cus_' ) {
					$response = $this->remote_get_to_stripe( 'https://api.stripe.com/v1/customers/' . $customer['payment_id'] );
					if ( $response['success'] ) {
						$customer_payment_id =  $customer['payment_id'];
						$this->remote_post_to_stripe( 'https://api.stripe.com/v1/customers/' . $customer['payment_id'], $post_args );
					}
				}
			}
			if ( ! $customer_payment_id ) {
				$response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/customers', $post_args );
				if ( ! $response['success'] ) {
					return $response;
				}
				$info = json_decode( $response['info'], true );
				$customer_payment_id = $info['id'];
			}
		}

		$payment_description = $customer_email;
		if ( $customer_name ) {
			$payment_description .= ' (' . $customer_name . ')';
		}
		if ( isset( $resa_info['accom_id'] ) ) {
			if ( $payment_description ) {
				$payment_description .= ' - ';
			}
			$wptexturize = remove_filter( 'the_title', 'wptexturize' );
			$payment_description .= get_the_title( $resa_info['accom_id'] );
			if ( $wptexturize ) {
				add_filter( 'the_title', 'wptexturize' );
			}
		}
		$payment_description .= ' (' . $resa_info['check_in'] . ' - ' . $resa_info['check_out'] . ')';

		if ( $amount_to_pay == 0 ) {
			$post_args = array(
				'customer' => $customer_payment_id,
				'description' => $payment_description,
				'usage' => 'off_session',
			);
		} else {
			$post_args = array(
				'amount' => $amount_to_pay,
				'currency' => $resa_info['currency'],
				'description' => $payment_description,
				'receipt_email' => $customer_email,
			);
			if ( get_option( 'hb_store_credit_card' ) == 'yes' ) {
				$post_args['customer'] = $customer_payment_id;
				$post_args['setup_future_usage'] = 'off_session';
			}
		}
		if ( get_option( 'hb_stripe_payment_methods' ) != 'all' ) {
			$post_args['payment_method_types'] = array( 'card' );
		}

		if ( $amount_to_pay > 0 ) {
			$response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/payment_intents', $post_args );
		} else {
			$response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/setup_intents', $post_args );
		}

		if ( ! $response['success'] ) {
			return $response;
		}

		$payment_info = json_decode( $response['info'], true );

		$parameters_to_remove = array( 'payment_intent', 'payment_intent_client_secret', 'redirect_status' );
		$return_urls = $this->get_return_urls( $parameters_to_remove );

		$response = array(
			'success' => true,
			'payment_requires_action' => 'yes',
			'payment_token' => $payment_info['id'],
			'client_secret' => $payment_info['client_secret'],
			'return_url' => $return_urls['payment_confirm'],
		);
		$this->add_log( $payment_info['id'], null, null, $return_urls['payment_confirm'] );
		return $response;
	}

	public function get_payment_token() {
		if ( isset( $_GET['payment_intent'] ) ) {
			return $_GET['payment_intent'];
		} else {
			return $_GET['setup_intent'];
		}
	}

	public function confirm_payment() {
		$resa = $this->hbdb->get_resa_by_payment_token( $this->get_payment_token() );
		if ( ! $resa ) {
			$this->add_log( $this->get_payment_token(), null, null, 'timeout_error' );
			$response = array(
				'success' => false,
				'error_msg' => $this->utils->get_string( 'timeout_error' )
			);
		} else {
			if ( ! isset( $resa['parent_id'] ) ) {
				$is_parent = true;
				$resas = $this->hbdb->get_resa_by_parent_id( $resa['id'] );
			} else {
				$is_parent = false;
			}
			$this->add_log( $this->get_payment_token(), $resa['id'], $is_parent, 'confirm_payment_' . $_GET['redirect_status'] );
			if ( $_GET['redirect_status'] == 'succeeded' || $_GET['redirect_status'] == 'pending' ) {
				if (
					( $is_parent && ( $resas[0]['status'] == 'waiting_payment' ) ) ||
					( ! $is_parent && ( $resa['status'] == 'waiting_payment' ) )
				) {
					if ( $resa['payment_status'] != 'paid' ) {
						$charge_info = false;
						$payment_info = false;
						$processing = false;
						if ( $resa['amount_to_pay'] > 0 ) {
							$stripe_response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/payment_intents/' . $this->get_payment_token(), array() );
							if ( $stripe_response['success'] ) {
								$payment_info = json_decode( $stripe_response['info'], true );
								if ( isset( $payment_info['latest_charge'] ) ) {
									$charge_info = $payment_info['latest_charge'];
								}
							} else {
								$this->add_log( $this->get_payment_token(), $resa['id'], $is_parent, $stripe_response );
							}
							if ( ! $payment_info || ( isset( $payment_info['status'] ) && ( $payment_info['status'] == 'processing' ) ) ) {
								$processing = true;
								$charge_info = $this->get_payment_token();
							}
						} else {
							$stripe_response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/setup_intents/' . $this->get_payment_token(), array() );
							if ( $stripe_response['success'] ) {
								$payment_info = json_decode( $stripe_response['info'], true );
							} else {
								$this->add_log( $this->get_payment_token(), $resa['id'], $is_parent, $stripe_response );
							}
						}
						if (
							( ( $resa['amount_to_pay'] == 0 ) || ( get_option( 'hb_store_credit_card' ) == 'yes' ) ) &&
							isset( $payment_info['customer'] )
						) {
							$this->hbdb->update_customer_payment_id( $resa['customer_id'], $payment_info['customer'] );
						}
						$resa_id = $this->hbdb->update_resa_after_payment( $this->get_payment_token(), 'paid', '', $resa['amount_to_pay'], $charge_info, $processing );
						if ( ! $resa_id ) {
							$response = array(
								'success' => false,
								'error_msg' => 'Error (could not update reservation).'
							);
						} else {
							$this->utils->send_email( 'new_resa', $resa_id );
							$response = array(
								'success' => true,
							);
						}
					}
				} else if (
					( $is_parent && ( $resas[0]['payment_status'] == 'paid' ) ) ||
					( ! $is_parent && ( $resa['payment_status'] == 'paid' ) )
				) {
					$response = array(
						'success' => true,
					);
				} else {
					$response = array(
						'success' => false,
						'error_msg' => 'Error (could not confirm reservation because its status is unknown).'
					);
				}
			} else if ( $_GET['redirect_status'] == 'failed' ) {
				if ( $is_parent ) {
					$this->hbdb->delete_parent_resa( $resa['id'] );
				} else {
					$this->hbdb->delete_resa( $resa['id'] );
				}
				$response = array(
					'success' => false,
					'error_msg' => esc_html( $this->utils->get_string( 'stripe_payment_declined' ) ),
				);
			} else {
				$response = array(
					'success' => false,
					'error_msg' => 'Error (could not confirm reservation).'
				);
			}
		}
		return $response;
	}

	public function confirm_later_payment() {
		$later_payment = $this->hbdb->get_later_payment_by_token( $this->get_payment_token() );
		if ( ! $later_payment ) {
			$response = array(
				'success' => false,
				'error_msg' => 'Error (could not find payment information).'
			);
		} else {
			$this->add_log( $this->get_payment_token(), $later_payment['resa_id'], $later_payment['resa_is_parent'], 'confirm_later_payment_' . $_GET['redirect_status'] );
			if ( $_GET['redirect_status'] == 'succeeded' || $_GET['redirect_status'] == 'pending' ) {
				$charge_info = false;
				$payment_info = false;
				$processing = false;
				if ( $later_payment['amount_to_pay'] > 0 ) {
					$stripe_response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/payment_intents/' . $this->get_payment_token(), array() );
					if ( $stripe_response['success'] ) {
						$payment_info = json_decode( $stripe_response['info'], true );
						if ( isset( $payment_info['latest_charge'] ) ) {
							$charge_info = $payment_info['latest_charge'];
						}
					} else {
						$this->add_log( $this->get_payment_token(), $later_payment['resa_id'], $later_payment['resa_is_parent'], $stripe_response );
					}
					if ( ! $payment_info || ( isset( $payment_info['status'] ) && ( $payment_info['status'] == 'processing' ) ) ) {
						$processing = true;
						$charge_info = $this->get_payment_token();
					}
					$new_payment = array(
						'amount' => $later_payment['amount_to_pay'],
						'payment_method' => 'Stripe',
						'online' => 'yes',
						'gateway_info' => $charge_info,
					);
					if ( $processing ) {
						$new_payment['delayed'] = 'yes';
						$this->hbdb->tag_resa_payment_delayed( $later_payment['resa_id'], $later_payment['resa_is_parent'] );
					}
					if ( $this->hbdb->add_resa_payment( $later_payment['resa_id'], $later_payment['resa_is_parent'], $new_payment ) ) {
						$this->hbdb->update_later_payment_status( $later_payment['id'], 'paid' );
						$resa_id = $later_payment['resa_id'];
						if ( $later_payment['resa_is_parent'] ) {
							$resa_id = '#' . $resa_id;
						}
						$this->utils->send_email( 'new_later_payment', $resa_id );
						$response = array(
							'success' => true,
						);
					} else {
						$response = array(
							'success' => false,
							'error_msg' => 'Error (could not update payments logs).'
						);
					}
				} else {
					$stripe_response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/setup_intents/' . $this->get_payment_token(), array() );
					if ( $stripe_response['success'] ) {
						$this->hbdb->update_later_payment_status( $later_payment['id'], 'updated' );
						$payment_info = json_decode( $stripe_response['info'], true );
						$resa_id = $later_payment['resa_id'];
						if ( $later_payment['resa_is_parent'] ) {
							$resa_id = '#' . $resa_id;
						}
						$this->utils->send_email( 'store_later_payment', $resa_id );
						$response = array(
							'success' => true,
						);
					} else {
						$this->add_log( $this->get_payment_token(), $resa['id'], $is_parent, $stripe_response );
					}
				}
				if ( ( get_option( 'hb_store_credit_card' ) == 'yes' ) && isset( $payment_info['customer'] ) ) {
					if ( $later_payment['resa_is_parent'] ) {
						$resa = $this->hbdb->get_single( 'parents_resa', $later_payment['resa_id'] );
					} else {
						$resa = $this->hbdb->get_single( 'resa', $later_payment['resa_id'] );
					}
					$this->hbdb->update_customer_payment_id( $resa['customer_id'], $payment_info['customer'] );
				}
			} else if ( $_GET['redirect_status'] == 'failed' ) {
				$response = array(
					'success' => false,
					'error_msg' => esc_html( $this->utils->get_string( 'stripe_payment_declined' ) )
				);
			} else {
				$response = array(
					'success' => false,
					'error_msg' => 'Error (could not confirm payment).'
				);
			}
		}
		return $response;
	}

	public function check_resa_payment_delayed_status( $token ) {
		$payment_status = 'delayed';
		$charge_info = false;
		$stripe_response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/payment_intents/' . $token, array() );
		if ( $stripe_response['success'] ) {
			$payment_info = json_decode( $stripe_response['info'], true );
			if ( $payment_info['status'] == 'succeeded' ) {
				$payment_status = 'succeeded';
				$charge_info = $payment_info['latest_charge'];
			} else if ( ( $payment_info['status'] == 'requires_payment_method' ) || ( $payment_info['status'] == 'canceled' ) ) {
				$payment_status = 'declined';
			}
		}
		return array(
			'status' => $payment_status,
			'info' => $charge_info,
		);
	}

	public function check_uncompleted_resa( $resa ) {
		if ( $resa['amount_to_pay'] > 0 ) {
			$stripe_response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/payment_intents/' . $resa['payment_token'], array() );
		} else {
			$stripe_response = $this->remote_post_to_stripe( 'https://api.stripe.com/v1/setup_intents/' . $resa['payment_token'], array() );
		}
		if ( $stripe_response['success'] ) {
			$payment_info = json_decode( $stripe_response['info'], true );
			$processing = false;
			$charge_info = false;
			if ( ( $payment_info['status'] == 'succeeded' ) || ( $payment_info['status'] == 'processing' ) ) {
				if ( $resa['amount_to_pay'] > 0 ) {
					if ( $payment_info['status'] == 'succeeded' ) {
						$processing = false;
						$charge_info = $payment_info['latest_charge'];
					} else {
						$processing = true;
						$charge_info = $resa['payment_token'];
					}
				}
				if (
					( ( $resa['amount_to_pay'] == 0 ) || ( get_option( 'hb_store_credit_card' ) == 'yes' ) ) &&
					isset( $payment_info['customer'] )
				) {
					$this->hbdb->update_customer_payment_id( $resa['customer_id'], $payment_info['customer'] );
				}
				$resa_id = $this->hbdb->update_resa_after_payment( $resa['payment_token'], 'paid', '', $resa['amount_to_pay'], $charge_info, $processing );
				if ( $resa_id ) {
					$this->utils->send_email( 'new_resa', $resa_id );
				}
				return 'do-not-delete';
			} else if (
				( $payment_info['status'] == 'requires_payment_method' ) ||
				( $payment_info['status'] == 'requires_action' ) ||
				( $payment_info['status'] == 'requires_confirmation' ) ||
				( $payment_info['status'] == 'canceled' )
			) {
				return 'delete';
			} else {
				return 'do-not-delete';
			}
		} else {
			if ( $stripe_response['connection_error'] ) {
				return 'do-not-delete';
			} else {
				return 'delete';
			}
		}
	}

	public function remote_post_to_stripe( $url, $post_args ) {
		if ( isset( $post_args['amount'] ) ) {
			if ( $this->zero_decimal_currency == 'no' ) {
				$post_args['amount'] = round( $post_args['amount'] * 100 );
			}
		}
		if ( get_option( 'hb_stripe_mode') == 'test' ) {
			$stripe_key = trim( get_option( 'hb_stripe_test_secret_key' ) );
		} else {
			$stripe_key = trim( get_option( 'hb_stripe_live_secret_key' ) );
		}
		$post_args = array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $stripe_key,
				'Stripe-Version' => '2023-08-16',
			),
			'body' => $post_args
		);
		$response = $this->hb_remote_post( $url, $post_args );
		if ( is_wp_error( $response ) ) {
			return array(
				'success' => false,
				'connection_error' => true,
				'error_msg' => 'WP error: ' . $response->get_error_message()
			);
		} else if ( $response['response']['code'] == 200 ) {
			return array(
				'success' => true,
				'connection_error' => false,
				'info' => $response['body']
			);
		} else {
			$response = json_decode( $response['body'], true );
			$error_msg = str_replace( '%error_msg', $response['error']['message'], $this->utils->get_string( 'stripe_processing_error' ) );
			return array(
				'success' => false,
				'connection_error' => false,
				'error_msg' => $error_msg
			);
		}
	}

	public function remote_get_to_stripe( $url ) {
		if ( get_option( 'hb_stripe_mode') == 'test' ) {
			$stripe_key = trim( get_option( 'hb_stripe_test_secret_key' ) );
		} else {
			$stripe_key = trim( get_option( 'hb_stripe_live_secret_key' ) );
		}
		$args = array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $stripe_key,
				'Stripe-Version' => '2023-08-16',
			),
		);
		$response = wp_remote_get( $url, $args );
		if ( is_wp_error( $response ) ) {
			return array( 'success' => false, 'error_msg' => 'WP error: ' . $response->get_error_message() );
		} else if ( $response['response']['code'] == 200 ) {
			return array(
				'success' => true,
				'info' => $response['body']
			);
		} else {
			$response = json_decode( $response['body'], true );
			$error_msg = str_replace( '%error_msg', $response['error']['message'], $this->utils->get_string( 'stripe_processing_error' ) );
			return array(
				'success' => false,
				'error_msg' => $error_msg
			);
		}
	}

	private function get_credit_cards_icons( $css_class ) {
		$output = '';
		$icons = apply_filters( 'hb_stripe_credit_cards_icons', array( 'visa', 'mastercard', 'americanexpress' ) );
		foreach ( $icons as $icon ) {
			$output .= ' ';
			$output .= '<img class="' . $css_class . '-' . $icon . '" ';
			$output .= 'src="' . plugin_dir_url( __FILE__ ) . '../img/' . $icon . '.png" alt="" />';
		}
		return $output;
	}

	private function add_log( $token, $resa_id, $resa_is_parent, $log ) {
		if ( get_option( 'hb_add_stripe_logs' ) == 'yes' ) {
			$db_option_stripe_log = get_option( 'hb_stripe_logs' );
			if ( $db_option_stripe_log ) {
				$db_option_stripe_log = json_decode( $db_option_stripe_log, true );
			} else {
				$db_option_stripe_log = array();
			}
			$new_log = array(
				'token' => $token,
			);
			if ( $resa_id === null ) {
				$new_log['resa_id'] = '?';
				$new_log['resa_is_parent'] = '?';
			} else {
				$new_log['resa_id'] = $resa_id;
				if ( $resa_is_parent ) {
					$new_log['resa_is_parent'] = 'yes';
				} else {
					$new_log['resa_is_parent'] = 'no';
				}
			}
			$new_log['log'] = $log;
			$new_log['logged_on'] = current_time( 'mysql', 1 );
			$db_option_stripe_log[] = $new_log;
			update_option( 'hb_stripe_logs', json_encode( $db_option_stripe_log ) );
		}
	}
}