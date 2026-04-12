<?php
class HBookResaSummary extends HBookRender {

	public function render() {
		$resa_id = 0;
		if ( isset( $_POST['hb-resa-id'] ) ) {
			$resa_id = intval( $_POST['hb-resa-id'] );
			$resa_is_parent = $_POST['hb-resa-is-parent'];
			$resa_payment_type = $_POST['hb-resa-payment-type'];
		} else if ( isset( $_GET['payment_id'] ) ) {
			$payment = $this->hbdb->get_later_payment( $_GET['payment_id'] );
			if ( $payment ) {
				$resa_id = $payment['resa_id'];
				$resa_is_parent = $payment['resa_is_parent'];
				$resa_payment_type = false;
				if ( isset( $_GET['payment_confirm'] ) ) {
					if ( $payment['status'] == 'paid' ) {
						$resa_payment_type = 'paid_later_payment';
					} else if ( $payment['status'] == 'updated' ) {
						$resa_payment_type = 'method_updated_later_payment';
					}
				}
			} else {
				return '<p>' . esc_html__( 'Could not display Reservation summary', 'hbook-admin' ) . ' ' . esc_html( ' (the specified Payment link was not found).', 'hbook-admin' ) . '</p>';
			}
		}
		if ( ! $resa_id ) {
			return '';
		}

		if ( $resa_is_parent ) {
			$parent_resa = $this->hbdb->get_single( 'parents_resa', $resa_id );
			if ( ! $parent_resa ) {
				return '';
			}
			$resa = $this->hbdb->get_resa_by_parent_id( $resa_id );
			$customer_info = $this->hbdb->get_customer_info( $parent_resa['customer_id'] );
		} else {
			$resa = $this->hbdb->get_single( 'resa', $resa_id );
			if ( ! $resa ) {
				return '';
			}
			$customer_info = $this->hbdb->get_customer_info( $resa['customer_id'] );
			$resa = array( $resa );
			$parent_resa = false;
		}

		$this->utils->load_jquery();
		$this->utils->load_datepicker();
		$this->utils->load_front_end_script( 'utils' );
		$this->utils->load_front_end_script( 'summary' );

		global $wp_locale;
		$decimal_point = isset( $wp_locale->number_format['decimal_point'] ) ? $wp_locale->number_format['decimal_point'] : '.';
		$thousands_sep = isset( $wp_locale->number_format['thousands_sep'] ) ? $wp_locale->number_format['thousands_sep'] : '';
		$this->utils->hb_script_var( 'hb-summary-script', 'hb_currency_data', array(
			'eur_chf_rate'   => floatval( get_option( 'hb_eur_chf_rate', '0.95' ) ),
			'chf_symbol'     => $this->utils->get_currency_symbol( 'CHF' ),
			'eur_symbol'     => $this->utils->get_currency_symbol( 'EUR' ),
			'eur_position'   => 'after',
			'price_precision' => get_option( 'hb_price_precision' ),
			'decimal_point'  => $decimal_point,
			'thousands_sep'  => $thousands_sep,
		) );

		require_once $this->utils->plugin_directory . '/utils/resa-summary.php';
		$summary = new HbResaSummary( $this->hbdb, $this->utils, $this->strings );
		$switcher = '<div class="hb-currency-switcher">'
			. '<button type="button" class="hb-currency-btn hb-currency-btn-chf" data-currency="CHF">CHF</button>'
			. '<button type="button" class="hb-currency-btn hb-currency-btn-eur" data-currency="EUR">EUR</button>'
			. '</div>';
		return $switcher . $summary->get_summary( $resa, $parent_resa, $customer_info, $resa_payment_type );
	}
}