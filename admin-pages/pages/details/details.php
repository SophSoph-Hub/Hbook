<?php
class HbAdminPageDetails extends HbAdminPage {

	public function __construct( $page_id, $hbdb, $utils, $options_utils ) {
		$this->data = array(
			'hb_text' => array(
				'form_saved' => esc_html__( 'The Details form settings have been saved.', 'hbook-admin' ),
				'new_field' => esc_html__( 'New field', 'hbook-admin' ),
				'confirm_delete_field' => esc_html__( 'Remove \'%field_name\' field?', 'hbook-admin' ),
				'confirm_delete_field_no_name' => esc_html__( 'Remove field?', 'hbook-admin' ),
				'new_choice' => esc_html__( 'New choice', 'hbook-admin' ),
				'confirm_delete_choice' => esc_html__( 'Remove \'%choice_name\'?', 'hbook-admin' ),
				'already_country_select_field' => esc_html__( 'There is already a "Country select" field.', 'hbook-admin' ),
				'already_field_id' => esc_html__( 'There is already a field with this id.', 'hbook-admin' ),
			),
			'hb_fields' => $hbdb->get_details_form_fields()
		);
		parent::__construct( $page_id, $hbdb, $utils, $options_utils );
	}

	public function display() {
		?>

		<div class="wrap">

			<form id="hb-form-fields">

				<h1><?php esc_html_e( 'Customer and booking details form', 'hbook-admin' ); ?></h1>
				<?php $this->display_right_menu(); ?>

				<hr/>

				<p>
					<i>
						<?php esc_html_e( 'Customize the Details form.', 'hbook-admin' ); ?><br/>
						<?php esc_html_e( 'You can add new fields, change fields settings and Drag and Drop fields to reorder them.', 'hbook-admin' ); ?>
					</i>
				</p>

				<?php $this->options_utils->display_save_options_section(); ?>

				<input id="hb-form-add-field-top" type="button" class="button" value="<?php esc_attr_e( 'Add a field', 'hbook-admin' ); ?>" data-bind="click: add_field_top" />

				<?php $this->display_form_builder(); ?>

				<p>
					<input id="hb-form-add-field-bottom" type="button" class="button" value="<?php esc_attr_e( 'Add a field', 'hbook-admin' ); ?>" data-bind="click: add_field_bottom" />
				</p>

				<?php $this->options_utils->display_save_options_section(); ?>

			</form>

		</div><!-- end .wrap -->

	<?php
	}
}