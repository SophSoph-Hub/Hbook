<?php
class HbResa {

	private $hbdb;
	private $utils;

	public $id;
	public $parent_id;
	public $check_in;
	public $check_out;
	public $adults;
	public $children;

	public $accom_id;
	public $accom_num;

	public $accom_price;
	public $price;

	public $status;

	public $extras;

	public $accom_discount;
	public $global_discount;
	public $coupon_value;

	public $fees;
	public $accom_added_fees;
	public $accom_final_added_fees;
	public $accom_included_fees;
	public $extras_added_fees;
	public $extras_final_added_fees;
	public $extras_included_fees;
	public $final_added_fees;
	public $final_included_fees;

	public function __construct( $hbdb, $utils ) {
		$this->hbdb = $hbdb;
		$this->utils = $utils;
	}

	public function load( $id ) {
		$db_resa = $this->hbdb->get_single( 'resa', $id );

		$this->id = $id;
		$this->parent_id = $db_resa['parent_id'];
		$this->check_in = $db_resa['check_in'];
		$this->check_out = $db_resa['check_out'];
		$this->adults = $db_resa['adults'];
		$this->children = $db_resa['children'];

		$this->accom_id = $db_resa['accom_id'];
		$this->accom_num = $db_resa['accom_num'];

		$this->accom_price = $db_resa['accom_price'];
		$this->price = $db_resa['price'];

		$this->status = $db_resa['status'];

		if ( $this->accom_price != -1 ) {
			$this->extras = json_decode( $db_resa['options'], true );
			$discount = json_decode( $db_resa['discount'], true );
			if ( $discount ) {
				$this->accom_discount = $discount['accom'];
				$this->global_discount = $discount['global'];
			} else {
				$this->accom_discount = array();
				$this->global_discount = array();
			}

			$this->coupon_value = $db_resa['coupon_value'];

			$this->fees = array();
			$this->accom_added_fees = array();
			$this->accom_final_added_fees = array();
			$this->accom_included_fees = array();
			$this->extras_added_fees = array();
			$this->extras_final_added_fees = array();
			$this->extras_included_fees = array();
			$this->final_added_fees = array();
			$this->final_included_fees = array();

			$fees = json_decode( $db_resa['fees'], true );
			$fixed_fee_types = array( 'per-person', 'per-accom', 'per-person-per-day', 'per-accom-per-day', 'global-fixed' );
			if ( $fees ) {
				$this->fees = $fees;
				foreach ( $fees as $fee ) {
					if ( $fee['apply_to_type'] == 'accom-percentage' ) {
						if ( $fee['include_in_price'] == 0 ) {
							$this->accom_final_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 1 ) {
							$this->accom_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 2 ) {
							$this->accom_included_fees[] = $fee;
						}
					} else if ( $fee['apply_to_type'] == 'extras-percentage' ) {
						if ( $fee['include_in_price'] == 0 ) {
							$this->extras_final_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 1 ) {
							$this->extras_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 2 ) {
							$this->extras_included_fees[] = $fee;
						}
					} else if ( ( $fee['apply_to_type'] == 'global-percentage' ) ) {
						if ( $fee['include_in_price'] == 0 ) {
							$this->final_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 1 ) {
							$this->accom_added_fees[] = $fee;
							$this->extras_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 2 ) {
							$this->final_included_fees[] = $fee;
						}
					} else if ( in_array( $fee['apply_to_type'], $fixed_fee_types ) ) {
						if ( $fee['include_in_price'] == 0 ) {
							$this->final_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 1 ) {
							$this->accom_added_fees[] = $fee;
						} else if ( $fee['include_in_price'] == 2 ) {
							$this->accom_included_fees[] = $fee;
						}
					}
				}
			}
		}
	}

	public function populate( $info ) {
		$this->status = $info['status'];
		$this->adults = $info['adults'];
		$this->children = $info['children'];
	}

	public function discounts() {
		$discounts = array(
			'accom' => array(),
			'global' => array(),
		);
		if ( isset( $this->accom_discount['amount_type'] ) ) {
			$discounts['accom'] = array(
				'amount_type' => $this->accom_discount['amount_type'],
				'amount' => '' . $this->accom_discount['amount'],
			);
		}
		if ( isset( $this->global_discount['amount_type'] ) ) {
			$discounts['global'] = array(
				'amount_type' => $this->global_discount['amount_type'],
				'amount' => '' . $this->global_discount['amount'],
			);
		}
		return $discounts;
	}

	public function accom_total_price( $include_fees = true ) {
		$price = 0;
		$resa = array(
			'check_in' => $this->check_in,
			'check_out' => $this->check_out,
			'adults' => $this->adults,
			'children' => $this->children,
		);
		$discount = 0;
		if ( $this->accom_discount ) {
			if ( $this->accom_discount['amount_type'] == 'fixed' ) {
				$discount = $this->accom_discount['amount'];
			} else {
				$discount = $this->utils->round_price( $this->accom_discount['amount'] * $this->accom_price / 100 );
			}
		}
		$price = $this->accom_price - $discount;
		$fees_total = 0;
		if ( $include_fees ) {
			foreach ( $this->accom_added_fees as $fee ) {
				$fee_values = $this->utils->calculate_fees_extras_values( $resa, $price, $fee );
				$fees_total += $fee_values['price'];
			}
		}
		return $this->utils->round_price( $price + $fees_total );
	}

	public function refresh_price() {
		$strings = $this->utils->get_strings();
		require_once $this->utils->plugin_directory . '/utils/price-calc.php';
		$price_calc = new HbPriceCalc( $this->hbdb, $this->utils, $strings );
		$prices = $price_calc->get_price( $this->accom_id, $this->check_in, $this->check_out, $this->adults, $this->children );
		if ( $prices['success'] ) {
			$this->accom_price = $prices['prices']['accom'];
			$this->accom_discount = $prices['prices']['discount'];
			$discount = $this->utils->get_global_discount( $this->accom_id, $this->check_in, $this->check_out, $this->subtotal_price() );
			$this->global_discount = $discount['discount_breakdown'];
			$this->hbdb->update_resa_prices_info( $this->id, $this->accom_price, json_encode( $this->discounts() ), $this->deposit(), $this->price, $this->total_price() );
			return array(
				'status' => 'price_updated'
			);
		} else {
			return array(
				'status' => 'price_calc_error',
				'error_msg' => $prices['error']
			);
		}
	}

	public function extras_price( $include_fees = true ) {
		$extras_price = 0;
		$resa = array(
			'check_in' => $this->check_in,
			'check_out' => $this->check_out,
			'adults' => $this->adults,
			'children' => $this->children,
		);
		foreach ( $this->extras as $extra ) {
			$extra_calculated_values = $this->utils->calculate_fees_extras_values( $resa, 0, $extra );
			$extras_price += $extra_calculated_values['price'];
		}
		$fees_total = 0;
		if ( $include_fees ) {
			foreach ( $this->extras_added_fees as $fee ) {
				$fee_values = $this->utils->calculate_fees_extras_values( $resa, $extras_price, $fee );
				$fees_total += $fee_values['price'];
			}
		}
		return $this->utils->round_price( $extras_price + $fees_total );
	}

	public function subtotal_price() {
		return $this->utils->round_price( $this->accom_total_price() + $this->extras_price() );
	}

	public function global_discount_amount() {
		$discount = 0;
		if ( $this->global_discount ) {
			if ( $this->global_discount['amount_type'] == 'fixed' ) {
				$discount = $this->global_discount['amount'];
			} else {
				$discount = $this->utils->round_price( $this->global_discount['amount'] * $this->subtotal_price() / 100 );
			}
		}
		return $this->utils->round_price( $discount );
	}

	public function deposit() {
		$deposit = 0;
		if ( get_option( 'hb_deposit_type' ) == 'nb_night' ) {
			$nb_nights = $this->utils->get_number_of_nights( $this->check_in, $this->check_out );
			$deposit = ( $this->total_price() / $nb_nights ) * get_option( 'hb_deposit_amount' );
		} else if ( get_option( 'hb_deposit_type' ) == 'fixed' ) {
			$deposit = get_option( 'hb_deposit_amount' );
		} else if ( get_option( 'hb_deposit_type' ) == 'percentage' ) {
			$deposit = $this->total_price() * get_option( 'hb_deposit_amount' ) / 100;
		}
		if ( $deposit > $this->total_price() ) {
			$deposit = $this->total_price();
		}
		return $this->utils->round_price( $deposit );
	}

	public function total_price( $include_fees = true ) {
		$resa = array(
			'check_in' => $this->check_in,
			'check_out' => $this->check_out,
			'adults' => $this->adults,
			'children' => $this->children,
		);
		$subtotal_price = $this->subtotal_price();

		$subtotal_price -= $this->coupon_value;
		$subtotal_price -= $this->global_discount_amount();

		$fees_total = 0;
		if ( $include_fees ) {
			foreach ( $this->accom_final_added_fees as $fee ) {
				$fee_values = $this->utils->calculate_fees_extras_values( $resa, $this->accom_total_price(), $fee );
				$fees_total += $fee_values['price'];
			}
			foreach ( $this->extras_final_added_fees as $fee ) {
				$fee_values = $this->utils->calculate_fees_extras_values( $resa, $this->extras_price(), $fee );
				$fees_total += $fee_values['price'];
			}
			foreach ( $this->final_added_fees as $fee ) {
				$fee_values = $this->utils->calculate_fees_extras_values( $resa, $subtotal_price, $fee );
				$fees_total += $fee_values['price'];
			}
		}
		return $this->utils->round_price( $subtotal_price + $fees_total );
	}

	public function fee_price( $fee_id, $type = 'total' ) {
		$fee = $this->fee_by_id( $fee_id );
		if ( $fee ) {
			$resa_array = array(
				'check_in' => $this->check_in,
				'check_out' => $this->check_out,
				'adults' => $this->adults,
				'children' => $this->children,
			);
			$base_price = 0;
			// checks below follow the order of resa-summary.php
			if ( ( $type == 'total' ) || ( $type == 'extra' ) ) {
				if ( in_array( $fee_id, array_column( $this->extras_added_fees, 'id' ) ) ) {
					$base_price += $this->extras_price( false );
				}
				if ( in_array( $fee_id, array_column( $this->extras_included_fees, 'id' ) ) ) {
					$base_price += $this->utils->calculate_price_before_included_fees( $resa_array, $this->extras_price( true ), $this->extras_included_fees );
				}
				if ( in_array( $fee_id, array_column( $this->extras_final_added_fees, 'id' ) ) ) {
					$base_price += $this->extras_price( true );
				}
			}
			if ( $type == 'total' ) {
				if ( in_array( $fee_id, array_column( $this->final_added_fees, 'id' ) ) ) {
					$base_price += $this->total_price( false );
				}
				if ( in_array( $fee_id, array_column( $this->final_included_fees, 'id' ) ) ) {
					$base_price += $this->utils->calculate_price_before_included_fees( $resa_array, $this->total_price( true ), $this->final_included_fees );
				}
			}
			if ( ( $type == 'total' ) || ( $type == 'accom' ) ) {
				if ( in_array( $fee_id, array_column( $this->accom_added_fees, 'id' ) ) ) {
					$base_price += $this->accom_total_price( false );
				}
				if ( in_array( $fee_id, array_column( $this->accom_included_fees, 'id' ) ) ) {
					$base_price += $this->utils->calculate_price_before_included_fees( $resa_array, $this->accom_total_price( true ), $this->extras_included_fees );
				}
				if ( in_array( $fee_id, array_column( $this->accom_final_added_fees, 'id' ) ) ) {
					$base_price += $this->accom_total_price( true );
				}
			}
			$fee_details = $this->utils->calculate_fees_extras_values( $resa_array, $base_price, $fee );
			return $this->utils->round_price( $fee_details['price'] );
		} else {
			return 0;
		}
	}

	public function fee_by_id( $id ) {
		foreach ( $this->fees as $fee ) {
			if ( $fee['id'] == $id ) {
				return $fee;
			}
		}
		return false;
	}

	public function price_before_included_fees() {
		$fixed_fee_types = array( 'per-person', 'per-accom', 'per-person-per-day', 'per-accom-per-day', 'global-fixed' );
		$included_percent_fees_rate = 0;
		$included_fixed_fees_amount = 0;
		$price_before_included_fees = $price;
		foreach ( $fees as $fee ) {
			if ( $fee['include_in_price'] == 2 ) {
				if ( in_array( $fee['apply_to_type'], $fixed_fee_types ) ) {
					$fee_values = $this->calculate_fees_extras_values( $resa, 0, $fee );
					$included_fixed_fees_amount += $fee_values['price'];
				} else {
					$included_percent_fees_rate += $fee['amount'];
				}
			}
		}
		$price_before_included_fees -= $included_fixed_fees_amount;
		$price_before_included_fees = $price_before_included_fees / ( 1 + ( $included_percent_fees_rate / 100 ) );
		return $price_before_included_fees;
	}

	public function accom_final_added_fees_rows_for_invoice() {
		return $this->fee_rows_for_invoice( $this->accom_final_added_fees );
	}

	public function fee_rows_for_invoice() {
	}
}