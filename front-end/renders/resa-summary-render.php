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

		require_once $this->utils->plugin_directory . '/utils/resa-summary.php';
		$summary = new HbResaSummary( $this->hbdb, $this->utils, $this->strings );
		return $summary->get_summary( $resa, $parent_resa, $customer_info, $resa_payment_type );
	}
}