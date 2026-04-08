<?php
class HbMultiResa {

	private $hbdb;
	private $utils;

	public $price;
	public $deposit;

	public $extras;

	public $children_resas;

	public $extras_added_fees;
	public $extras_final_added_fees;
	public $final_added_fees;

	public function __construct( $hbdb, $utils ) {
		$this->hbdb = $hbdb;
		$this->utils = $utils;
	}

	public function load( $id ) {
		$db_resa = $this->hbdb->get_single( 'parents_resa', $id );

		$this->price = $db_resa['price'];
		$this->deposit = $db_resa['deposit'];

		$this->extras = json_decode( $db_resa['options'], true );

		$this->children_resas = array();
		$db_children_resas = $this->hbdb->get_resa_by_parent_id( $id );
		$active_status = array( 'new', 'pending', 'confirmed' );
		foreach ( $db_children_resas as $db_child_resa ) {
			if ( in_array( $db_child_resa['status'], $active_status ) ) {
				$this->children_resas[] = $this->load_child_resa( $db_child_resa['id'] );
			}
		}

		$this->extras_added_fees = array();
		$this->extras_final_added_fees = array();
		$this->final_added_fees = array();

		$fees = json_decode( $db_resa['fees'], true );
		if ( $fees ) {
			foreach ( $fees as $fee ) {
				if ( $fee['apply_to_type'] == 'extras-percentage' ) {
					if ( $fee['include_in_price'] == 0 ) {
						$this->extras_final_added_fees[] = $fee;
					} else if ( $fee['include_in_price'] == 1 ) {
						$this->extras_added_fees[] = $fee;
					}
				} else if ( ( $fee['apply_to_type'] == 'global-percentage' ) ) {
					if ( $fee['include_in_price'] == 0 ) {
						$this->final_added_fees[] = $fee;
					} else if ( $fee['include_in_price'] == 1 ) {
						$this->extras_added_fees[] = $fee;
					} else if ( $fee['include_in_price'] == 2 ) {
						$this->final_included_fees[] = $fee;
					}
				} else if ( ( $fee['apply_to_type'] == 'global-fixed' ) ) {
					if ( $fee['include_in_price'] == 0 ) {
						$this->final_added_fees[] = $fee;
					}
				}
			}
		}
	}

	public function populate( $resa_info ) {
		$this->extras = $resa_info['extras'];

		$this->children_resas = array();
		foreach ( $resa_info['children_resas'] as $child_resa ) {
			$this->children_resas[] = $this->populate_child_resa( $child_resa );
		}
	}

	public function load_child_resa( $id ) {
		$resa = new HbResa( $this->hbdb, $this->utils );
		$resa->load( $id );
		return $resa;
	}

	public function populate_child_resa( $child_resa ) {
		$resa = new HbResa( $this->hbdb, $this->utils );
		$resa->populate( $child_resa );
		return $resa;
	}

	public function status() {
		$status = '';
		if ( $this->children_resas[0] ) {
			$status = $this->children_resas[0]->status;
		}
		foreach ( $this->children_resas as $child_resa ) {
			if ( $child_resa->status != $status ) {
				return '';
			}
		}
		return $status;
	}

	public function check_in() {
		$check_in = '';
		if ( $this->children_resas[0] ) {
			$check_in = $this->children_resas[0]->check_in;
		}
		foreach ( $this->children_resas as $child_resa ) {
			if ( $child_resa->check_in != $check_in ) {
				return '';
			}
		}
		return $check_in;
	}

	public function check_out() {
		$check_out = '';
		if ( $this->children_resas[0] ) {
			$check_out = $this->children_resas[0]->check_out;
		}
		foreach ( $this->children_resas as $child_resa ) {
			if ( $child_resa->check_out != $check_out ) {
				return '';
			}
		}
		return $check_out;
	}

	public function adults() {
		$total_adults = 0;
		foreach ( $this->children_resas as $child_resa ) {
			$total_adults += $child_resa->adults;
		}
		return $total_adults;
	}

	public function children() {
		$total_children = 0;
		foreach ( $this->children_resas as $child_resa ) {
			$total_children += $child_resa->children;
		}
		return $total_children;
	}

	public function extras_price() {
		$extras_price = 0;
		$resa = array(
			'adults' => $this->adults(),
			'children' => $this->children(),
			'nb_accom' => count( $this->children_resas ),
		);
		foreach ( $this->extras as $extra ) {
			$extra_calculated_values = $this->utils->calculate_fees_extras_values( $resa, 0, $extra );
			$extras_price += $extra_calculated_values['price'];
		}
		$fees_total = 0;
		foreach ( $this->extras_added_fees as $fee ) {
			$fee_values = $this->utils->calculate_fees_extras_values( $resa, $extras_price, $fee );
			$fees_total += $fee_values['price'];
		}
		return $this->utils->round_price( $extras_price + $fees_total );
	}

	public function deposit() {
		$deposit = 0;
		if ( get_option( 'hb_deposit_type' ) == 'nb_night' ) {
			if ( ! $this->check_in() || ! $this->check_out() ) {
				return $this->deposit;
			} else {
				$nb_nights = $this->utils->get_number_of_nights( $this->check_in(), $this->check_out() );
				$deposit = ( $this->total_price() / $nb_nights ) * get_option( 'hb_deposit_amount' );
			}
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

	public function total_price() {
		$total_price = 0;
		foreach ( $this->children_resas as $child_resa ) {
			$total_price += $child_resa->price;
		}
		$total_price += $this->extras_price();
		$resa = array(
			'adults' => $this->adults(),
			'children' => $this->children(),
			'nb_accom' => count( $this->children_resas ),
		);
		$fees_total = 0;
		foreach ( $this->extras_final_added_fees as $fee ) {
			$fee_values = $this->utils->calculate_fees_extras_values( $resa, $this->extras_price(), $fee );
			$fees_total += $fee_values['price'];
		}
		foreach ( $this->final_added_fees as $fee ) {
			$fee_values = $this->utils->calculate_fees_extras_values( $resa, $this->extras_price(), $fee );
			$fees_total += $fee_values['price'];
		}
		$total_price += $fees_total;
		return $total_price;
	}
}