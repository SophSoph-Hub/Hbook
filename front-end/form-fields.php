<?php
class HBFormFields {

	private $hb_strings;
	private $countries;

	public function __construct( $hb_strings, $countries ) {
		$this->hb_strings = $hb_strings;
		$this->countries = $countries;
	}

	public function get_field_mark_up( $field, $form_data = array(), $show_required = true, $display_column = true, $is_admin = false ) {
		if ( $field['type'] == 'column_break' ) {
			return '';
		}
		$output = '';
		$field_display_name = $this->get_field_display_name( $field );
		if ( $display_column && $field['column_width'] ) {
			$output .= '<div class="hb-column-' . $field['column_width'] . '">';
		}
		if ( ( $field['type'] == 'title' ) || ( $field['type'] == 'sub_title' ) || ( $field['type'] == 'explanation' ) || ( $field['type'] == 'separator' ) ) {
			if ( $field['type'] == 'title' ) {
				$output .= '<h3 class="hb-title">' . $field_display_name . '</h3>';
			} else if ( $field['type'] == 'sub_title' ) {
				$output .= '<h4>' . $field_display_name . '</h4>';
			} else if ( $field['type'] == 'explanation' ) {
				$output .= '<p class="hb-explanation">' . $field_display_name . '</p>';
			} else if ( $field['type'] == 'separator' ) {
				$output .= '<hr/>';
			}
			if ( $display_column && $field['column_width'] ) {
				$output .= '</div><!-- end .hb-column-' . $field['column_width'] . ' -->';
			}
			$output = apply_filters( 'hb_details_form_markup_field', $output, $field );
			return $output;
		}
		$required_text = '';
		if ( $show_required && $field['required'] == 'yes' ) {
			$required_text = '*';
		}
		$output .= '<p>';
		$output .= '<label for="' . $field['id'] . '">' . $field_display_name . $required_text . '</label>';
		$field_attributes = $this->get_field_attributes( $field );
		if ( $field['type'] == 'text' || $field['type'] == 'email' || $field['type'] == 'number' ) {
			$field_value = '';
			if ( isset( $form_data[ $field['id'] ] ) ) {
				$field_value = esc_attr( $form_data[ $field['id'] ] );
			}
			$output .= '<input ' . $field_attributes . ' type="text"  value="' . $field_value . '" />';
		} else if ( $field['type'] == 'textarea' ) {
			$field_value = '';
			if ( isset( $form_data[ $field['id'] ] ) ) {
				$field_value = esc_textarea( $form_data[ $field['id'] ] );
			}
			$output .= '<textarea ' . $field_attributes . '>';
			$output .= $field_value;
			$output .= '</textarea>';
		} else if ( $field['type'] == 'select' || $field['type'] == 'radio' || $field['type'] == 'checkbox' ) {
			$choices_mark_up = '';
			if ( ( $field['type'] == 'radio' ) || ( $field['type'] == 'checkbox' ) ) {
				if ( isset( $form_data[ $field['id'] ] ) && $form_data[ $field['id'] ] != '' ) {
					$checked_choices = array_map( 'trim' , explode( ',', $form_data[ $field['id'] ] ) );
				} else {
					$checked_choices = array();
				}
			}
			foreach ( $field['choices'] as $i => $choice ) {
				$choice_display_name = $this->get_field_display_name( $choice );
				if ( $field['type'] == 'select' ) {
					$choices_mark_up .= '<option value="' . $choice['name'] . '"';
					if ( isset( $form_data[ $field['id'] ] ) && $form_data[ $field['id'] ] == $choice['name'] ) {
						$choices_mark_up .= ' selected';
					}
					$choices_mark_up .= '>' . $choice_display_name . '</option>';
				} else if ( ( $field['type'] == 'radio' ) || ( $field['type'] == 'checkbox' ) ) {
					$choices_mark_up .= '<span class="hb-' . $field['type'] . '-wrapper">';
					$choices_mark_up .= '<input type="' . $field['type'] . '"';
					$field_name = 'hb_' . $field['id'];
					if ( $field['type'] == 'checkbox' ) {
						$field_name .= '[]';
						if ( $field['required'] == 'yes' ) {
							$choices_mark_up .= ' data-validation="checkbox_group" data-validation-qty="min1"';
						}
					}
					if ( in_array( $choice['name'], $checked_choices ) ) {
						$choices_mark_up .= ' checked';
					} else if ( $field['type'] == 'radio' && $i == 0 && count( $checked_choices ) == 0 ) {
						$choices_mark_up .= ' checked';
					}
					$choices_mark_up .= ' id="' . $field['id'] . '-' . $choice['id'] . '" name="' . $field_name . '" value="' . $choice['name'] . '">';
					$choices_mark_up .= '<label for="' . $field['id'] . '-' . $choice['id'] . '" class="hb-label-choice"> ' . $choice_display_name . '</label>';
					$choices_mark_up .= '</span>';
					$choices_mark_up .= '<br/>';
				}
			}
			if ( $field['type'] == 'select' ) {
				$output .= '<select ' . $field_attributes . '>';
				$output .= $choices_mark_up;
				$output .= '</select>';
			}
			if ( $field['type'] == 'radio' || $field['type'] == 'checkbox' ) {
				$output .= $choices_mark_up;
			}
		} else if ( $field['type'] == 'country_select' ) {
			$output .= '<select ' . $field_attributes . '>';
			$output .= '<option value=""></value>';
			if ( $is_admin ) {
				$countries = $this->countries->get_list_admin_side();
			} else {
				$countries = $this->countries->get_list();
			}
			$default_country_code = get_option( 'hb_country_select_default' );
			foreach ( $countries as $country_code => $country_name ) {
				$output .= '<option value="' . $country_code . '"';
				if ( $country_code == $default_country_code ) {
					$output .= ' selected';
				}
				$output .= '>' . $country_name . '</option>';
			}
			$output .= '</select>';
			$output .= '</p>';
			$output .= '<p class="hb-country-iso-additional-info-wrapper hb-usa-state-iso-wrapper">';
			$output .= '<label for="usa_state_iso">';
			if ( isset( $this->hb_strings['usa_state_iso'] ) && $this->hb_strings['usa_state_iso'] ) {
				$output .= $this->hb_strings['usa_state_iso'];
			} else {
				$output .= 'State';
			}
			if ( $show_required && $field['required'] == 'yes' ) {
				$output .= '*';
			}
			$output .= '</label>';
			$output .= '<select id="usa_state_iso" name="hb_usa_state_iso" class="hb-detail-field">';
			$output .= '<option value=""></value>';
			foreach ( $this->countries->usa_states as $state_code => $state_name ) {
				$output .= '<option value="' . $state_code . '">' . $state_name . '</option>';
			}
			$output .= '</select>';
			$output .= '</p>';
			$output .= '<p class="hb-country-iso-additional-info-wrapper hb-canada-province-iso-wrapper">';
			$output .= '<label for="canada_province_iso">';
			if ( isset( $this->hb_strings['canada_province_iso'] ) && $this->hb_strings['canada_province_iso'] ) {
				$output .= $this->hb_strings['canada_province_iso'];
			} else {
				$output .= 'Province';
			}
			if ( $show_required && $field['required'] == 'yes' ) {
				$output .= '*';
			}
			$output .= '</label>';
			$output .= '<select id="canada_province_iso" name="hb_canada_province_iso" class="hb-detail-field">';
			$output .= '<option value=""></value>';
			foreach ( $this->countries->canada_provinces as $province_code => $province_name ) {
				$output .= '<option value="' . $province_code . '">' . $province_name . '</option>';
			}
			$output .= '</select>';
		}
		$output .= '</p>';
		if ( $display_column && $field['column_width'] ) {
			$output .= '</div><!-- end .hb-column-' . $field['column_width'] . ' -->';
		}
		$output = apply_filters( 'hb_details_form_markup_field', $output, $field );
		return $output;
	}

	private function get_field_display_name( $field ) {
		$display_name = '';
		if ( isset( $this->hb_strings[ $field['id'] ] ) ) {
			$display_name = $this->hb_strings[ $field['id'] ];
		}
		if ( $display_name != '' ) {
			return $display_name;
		} else {
			return $field['name'];
		}
	}

	private function get_field_attributes( $field ) {
		$class = 'hb-detail-field';
		if ( $field['type'] == 'country_select' ) {
			$class .= ' hb-country-iso-select';
		}
		$data_validation = '';
		if ( $field['required'] == 'yes' ) {
			$data_validation = 'required';
		}
		if ( $field['type'] == 'email' ) {
			$data_validation .= ' email';
		}
		if ( $field['type'] == 'number' ) {
			$data_validation .= ' number';
		}
		$data_validation_saved = '';
		if ( $field['id'] == 'state_province' ) {
			$data_validation_saved = ' data-validation-saved="' . $data_validation . '"';
		}
		$attributes = 'id="' . $field['id'] . '" name="hb_' . $field['id'] . '" class="' . $class . '" data-validation="' . $data_validation . '"' . $data_validation_saved;
		if ( $field['type'] == 'number' ) {
			$attributes .= ' data-validation-allowing="float"';
		}
		if ( ( $field['type'] == 'email' ) && get_option( 'hbook_status' ) == 'dev' ) {
			$attributes .= ' value="test@test.com"';
		}
		return $attributes;
	}

}