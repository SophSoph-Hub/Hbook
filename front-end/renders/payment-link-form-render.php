<?php
class HBookPaymentLinkForm extends HBookRender {

	public function render( $atts ) {
		if ( ! $this->utils->payment_gateways_support_later_payment() ) {
			return '<p>The Payment form could not be loaded (No active payment gateway suitable for payment links).</p>';
		}

		static $payment_link_form_loaded;
		if ( $payment_link_form_loaded ) {
			return '';
		}

		if ( ! isset( $_GET['payment_id'] ) ) {
			return '<p>' . esc_html( $this->strings['later_payment_form_could_not_be_loaded'] ) . '</p>';
		}

		$payment = $this->hbdb->get_later_payment( $_GET['payment_id'] );
		if ( ! $payment ) {
			return '<p>' . esc_html( $this->strings['later_payment_form_could_not_be_loaded'] ) . '</p>';
		} else if ( $payment['status'] == 'paid' ) {
			return '<p>' . esc_html( $this->strings['later_payment_already_paid'] ) . '</p>';
		}

		$status = '';
		if ( isset( $_GET['payment_confirm'] ) ) {
			if ( ! isset( $_GET['payment_gateway'] ) ) {
				return 'Error: payment gateway is not defined.';
			}
			$payment_gateway = $this->utils->get_payment_gateway( $_GET['payment_gateway'] );
			$payment_token = $payment_gateway->get_payment_token();
			if ( ! $payment_token ) {
				return 'Error: no payment token.';
			}
			$payment_confirmation = $payment_gateway->confirm_later_payment();
			if ( $payment_confirmation['success'] ) {
				$status = 'external-payment-confirm-ok';
				if ( $atts['thank_you_page_url'] ) {
					if ( $atts['thank_you_page_url'] == get_permalink( get_the_ID() ) ) {
						$status = 'external-payment-confirm-ok';
					} else {
						$this->utils->load_jquery();
						$this->utils->load_front_end_script( 'payment-link-form' );
						return $this->redirect_form_to_thank_you_page( $payment, $atts, true );
					}
				}
			} else {
				$status = 'external-payment-confirm-error';
			}
		}

		if ( $payment['resa_is_parent'] ) {
			$resa = $this->hbdb->get_single( 'parents_resa', $payment['resa_id'] );
		} else {
			$resa = $this->hbdb->get_single( 'resa', $payment['resa_id'] );
		}
		if ( ! $resa ) {
			return '';
		}

		$customer_info = $this->hbdb->get_customer_info( $resa['customer_id'] );
		if ( ! isset( $customer_info['email'] ) || ( $customer_info['email'] == '' ) ) {
			return 'Customer does not have an email.';
		}

		if ( $status == 'external-payment-confirm-ok' ) {
			$output = '';
			if ( $payment['resa_is_parent'] ) {
				$payments_history_table = $this->utils->get_payments_history_table( $resa, true, true );
			} else {
				$payments_history_table = $this->utils->get_payments_history_table( $resa, false, true );
			}
			$output .= '<div class="hb-later-payment-history-table">' . $payments_history_table . '</div>';
			if ( $payment['amount_to_pay'] > 0 ) {
				$thanks_message = str_replace( '%customer_email', $customer_info['email'], $this->strings['later_payment_thanks_message'] );
			} else {
				$thanks_message = str_replace( '%customer_email', $customer_info['email'], $this->strings['later_payment_store_credit_card_thanks_message'] );
			}
			$output .= '<p class="hb-later-payment-thank-you-msg">' . $thanks_message . '</p>';
			$this->utils->load_jquery();
			$this->utils->load_front_end_script( 'payment-link-form' );
			return $output;
		}

		$this->utils->load_jquery();
		foreach ( $this->utils->get_active_payment_gateways() as $gateway ) {
			foreach ( $gateway->js_scripts() as $js_script ) {
				if ( isset( $js_script['src'] ) && ( get_option( 'hbook_status' ) == 'dev' ) ) {
					wp_enqueue_script( $js_script['id'], $this->utils->plugin_url . $js_script['src'], array( 'jquery' ), filemtime( $this->utils->plugin_directory . $js_script['src'] ), true );
				} else {
					wp_enqueue_script( $js_script['id'], $js_script['url'], array( 'jquery' ), $js_script['version'], true );
				}
			}
			foreach ( $gateway->js_data() as $js_data_id => $js_data ) {
				if ( ! $js_data ) {
					$js_data = '0';
				} else {
					$js_data = strval( $js_data );
				}
				$this->utils->hb_script_var( $js_script['id'], $js_data_id, $js_data );
			}
			foreach ( $gateway->css_styles() as $css_style ) {
				wp_enqueue_style( $css_style['id'], $css_style['url'], array(), $css_style['version'] );
			}
		}
		$this->utils->load_front_end_script( 'booking-form' );
		$this->utils->load_front_end_script( 'selectize' );
		$this->utils->load_front_end_script( 'payment-link-form' );
		$ajax_timeout = intval( get_option( 'hb_ajax_timeout' ) );
		if ( ! $ajax_timeout ) {
			$ajax_timeout = 40000;
		}
		$payment_link_form_data = array(
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'ajax_timeout' => $ajax_timeout,
		);
		$this->utils->hb_script_var( 'hb-payment-link-form-script', 'hb_payment_link_form_data', $payment_link_form_data );
		$this->utils->hb_script_var( 'hb-payment-link-form-script', 'hb_customer_info', $customer_info );
		if ( $status == 'external-payment-confirm-error' ) {
			$this->utils->hb_script_var( 'hb-payment-link-form-script', 'hb_payment_confirmation_error', $payment_confirmation['error_msg'] );
		}

		if ( get_option( 'hb_security_bond' ) == 'yes' ) {
			$security_bond = get_option( 'hb_security_bond_amount' );
		} else {
			$security_bond = 0;
		}
		if ( $payment['payment_type'] == 'total_price' ) {
			$charged_total_price = $resa['price'];
		} else if ( $payment['payment_type'] == 'total_price_including_bond' ) {
			$charged_total_price = $resa['price'] + $security_bond;
		} else if ( $payment['payment_type'] == 'deposit' ) {
			$charged_total_price = $resa['deposit'];
		} else if ( $payment['payment_type'] == 'deposit_including_bond' ) {
			$charged_total_price = $resa['deposit'] + $security_bond;
		} else if ( $payment['payment_type'] == 'remaining_balance' ) {
			$charged_total_price = $resa['price'] - $this->utils->resa_total_paid( $resa );
		} else if ( $payment['payment_type'] == 'remaining_balance_including_bond' ) {
			$charged_total_price = $resa['price'] - $this->utils->resa_total_paid( $resa ) + $security_bond;
		} else if ( $payment['payment_type'] == 'bond' ) {
			$charged_total_price = $security_bond;
		} else if ( $payment['payment_type'] == 'no_payments' ) {
			$charged_total_price = 0;
		} else if ( strpos( $payment['payment_type'], 'custom_amount' ) !== false ) {
			$custom_payment_parts = explode( '-', $payment['payment_type'] );
			$charged_total_price = $custom_payment_parts[1];
		} else {
			return 'Error: could not find payment type.';
		}

		if ( $this->hbdb->update_later_payment_amount( $payment['id'], $charged_total_price ) === false ) {
			return 'Error: could not update payment amount.';
		}

		require_once $this->utils->plugin_directory . '/front-end/form-fields.php';
		require_once $this->utils->plugin_directory . '/front-end/booking-form/details-form.php';
		require_once $this->utils->plugin_directory . '/utils/countries.php';
		$countries = new HbCountries();
		$form_fields = new HbFormFields( $this->strings, $countries );
		$details_form = new HbDetailsForm( $this->hbdb, $this->utils, $this->strings, $form_fields );

		$output = '<div class="hb-payment-link-form-wrapper">';
		if ( $this->strings['later_payment_form_title'] ) {
			$output .= '<h3 class="hb-title hb-payment-link-form-title">';
			$output .= esc_html( $this->strings['later_payment_form_title'] );
			$output .= '</h3>';
		}
		if ( $charged_total_price > 0 ) {
			$output .= '<p class="hb-payment-link-explanation">';
			$payment_types_with_text_explanation = array(
				'total_price',
				'total_price_including_bond',
				'deposit',
				'deposit_including_bond',
				'remaining_balance',
				'remaining_balance_including_bond',
				'bond',
			);
			$payment_type_explanation = '';
			if ( $this->strings['later_payment_type_explanation'] && in_array( $payment['payment_type'], $payment_types_with_text_explanation ) ) {
				$payment_type_explanation = esc_html(
					str_replace(
						'%payment_type',
						$this->strings['later_payment_type_' . $payment['payment_type'] ],
						$this->strings['later_payment_type_explanation']
					)
				);
			}
			if ( $payment_type_explanation ) {
				$output .= '<span class="hb-payment-link-type-explanation">';
				$output .= $payment_type_explanation;
				$output .= '</span>';
				$output .= '<br/>';
			}
			$payment_amount_text = esc_html( str_replace( '%amount', $this->utils->price_with_symbol( $charged_total_price ), $this->strings['later_payment_form_amount'] ) );
			if ( $payment_amount_text ) {
				$output .= '<span class="hb-payment-link-amount-text">';
				$output .= $payment_amount_text;
				$output .= '</span>';
			}
			$output .= '</p>';
		} else {
			$output .= '<p class="hb-payment-link-store-credit-card">';
			$output .= esc_html( $this->strings['later_payment_form_store_credit_card_text_explanation'] );
			$output .= '</p>';
		}
		$output .= '<form id="hb-payment-link-form" class="hb-payment-link-form">';
		$output .= '<select id="hb-payment-form-select-for-selectize-styles"><option></option><option>This option is never used!</option></select>';

		if ( ! isset( $customer_info['country_iso'] ) || ( $customer_info['country_iso'] == '' ) ) {
			$country_field_name = esc_html__( 'Country', 'hbook-admin' );
			$country_field = $this->hbdb->get_single_field( 'country_iso' );
			if ( $country_field ) {
				$country_field_name = $country_field['name'];
			}
			$country_select = array(
				'id' => 'country_iso',
				'type' => 'country_select',
				'name' => $country_field_name,
				'required' => 'yes',
				'column_width' => '',
			);
			$output .= '<div class="hb-payment-link-form-country-wrapper">';
			$output .= $form_fields->get_field_mark_up( $country_select );
			$output .= '</div>';
		}

		$output .= '<input type="hidden" name="action" value="hb_process_later_payment" />';
		$output .= '<input type="hidden" name="hb-payment-alphanum-id" value="' . esc_attr( $payment['alphanum_id'] ) . '" />';
		$output .= '<input type="radio" name="hb-payment-type" value="full" checked />';
		$output .= '<div class="hb-payment-data-summary" ';
		$output .= 'data-charged-total-price-raw="' . esc_attr( $this->utils->round_price( $charged_total_price ) ) . '" ';
		$output .= '></div>';
		$output .= $details_form->get_payment_methods( array( 'stripe' ) );
		$output .= '<p class="hb-processing-later-payment hb-dots-loader">' . str_replace( '...', '<span></span>', $this->strings['processing'] ) . '</p>';
		$text_before_confirm_button = '';
		if ( $payment['payment_type'] == 'no_payments' ) {
			$confirm_button_text = $this->strings['later_payment_form_submit_button'];
			$text_before_confirm_button = $this->strings['later_payment_txt_before_submit_button'];
		} else {
			$confirm_button_text = $this->strings['later_payment_form_pay_button'];
			$text_before_confirm_button = $this->strings['later_payment_txt_before_pay_button'];
		}
		if ( $text_before_confirm_button ) {
			$output .= '<p class="hb-later-payment-txt-before-confirm-button">' . esc_html( $text_before_confirm_button ) . '</p>';
		}
		$output .= '<p class="hb-confirm-error"></p>';
		$output .= '<p class="hb-confirm-button hb-button-wrapper"><input type="submit" value="' . esc_attr( $confirm_button_text ) . '" /></p>';
		$output .= '</form>';
		$output .= $this->redirect_form_to_thank_you_page( $payment, $atts, false );
		$output .= '</div><!-- end .hb-payment-form-wrapper -->';

		$payment_link_form_loaded = true;

		return $output;
	}

	private function redirect_form_to_thank_you_page( $payment, $atts, $redirect_after_return ) {
		$output = '<form method="post" action="' . esc_url( $atts['thank_you_page_url'] ) . '" class="hb-thank-you-page-form"';
		if ( $redirect_after_return ) {
			$output .= ' id="hb-later-payment-thank-you-page-redirect"';
		}
		$output .= '>';
		$output .= '<input type="hidden" class="hb-resa-id" name="hb-resa-id" value="' . esc_attr( $payment['resa_id'] ) .'" />';
		$output .= '<input type="hidden" class="hb-resa-is-parent" name="hb-resa-is-parent" value="' . esc_attr( $payment['resa_is_parent'] ) .'" />';
		if ( $payment['payment_type'] == 'no_payments' ) {
			$output .= '<input type="hidden" class="hb-resa-payment-type" name="hb-resa-payment-type" value="method_updated_later_payment" />';
		} else {
			$output .= '<input type="hidden" class="hb-resa-payment-type" name="hb-resa-payment-type" value="paid_later_payment" />';
		}
		$output .= '</form>';
		return $output;
	}
}