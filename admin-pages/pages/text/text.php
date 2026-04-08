<?php
class HbAdminPageText extends HbAdminPage {

	private $sections;
	private $strings;
	private $langs;
	private $variables;

	public function __construct( $page_id, $hbdb, $utils, $options_utils ) {
		$this->data = array(
			'hb_text' => array(
				'select_language' => esc_html__( 'Select a language.', 'hbook-admin' ),
				'choose_file' => esc_html__( 'Choose a file to import.', 'hbook-admin' ),
				'form_saved' => esc_html__( 'All text has been saved.', 'hbook-admin' ),
			)
		);
		$this->langs = $utils->get_langs();
		$this->sections = array(
			'search-form-txt' => array(
				'title' => esc_html__( 'Search form text', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_search_form_txt()
			),
			'search-form' => array(
				'title' => esc_html__( 'Search form messages', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_search_form_msg()
			),
			'accom-select' => array(
				'title' => esc_html__( 'Accommodation selection', 'hbook-admin' ),
				'strings' => array_merge( $utils->strings_utils->get_accom_selection_txt(), $hbdb->get_fee_names() )
			),
			'options-select' => array(
				'title' => esc_html__( 'Extra services selection', 'hbook-admin' ),
				'strings' => array_merge( $utils->strings_utils->get_options_selection_txt(), $hbdb->get_option_names() )
			),
			'details-form-txt' => array(
				'title' => esc_html__( 'Booking details form text', 'hbook-admin' ),
				'strings' => $hbdb->get_details_form_labels()
			),
			'details-form-msg' => array(
				'title' => esc_html__( 'Booking details form messages', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_details_form_msg()
			),
			'coupons' => array(
				'title' => esc_html__( 'Coupons', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_coupons_txt()
			),
			'summary' => array(
				'title' => esc_html__( 'Summary', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_summary_txt()
			),
			'payment-choice' => array(
				'title' => esc_html__( 'Payment choice', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_payment_type_choice()
			),
			'stripe' => array(
				'title' => esc_html__( 'Stripe payment', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_stripe_txt()
			),
			'paypal' => array(
				'title' => esc_html__( 'Paypal payment', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_paypal_txt()
			),
			'external-payment-desc' => array(
				'title' => esc_html__( 'External payment description', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_external_payment_desc_txt()
			),
			'book-now-area' => array(
				'title' => esc_html__( 'Book now area', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_book_now_area_txt()
			),
			'error-msg' => array(
				'title' => esc_html__( 'Error messages', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_error_form_msg()
			),
			'cal-legend' => array(
				'title' => esc_html__( 'Calendars legend', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_cal_legend_txt()
			),
			'rates-table' => array(
				'title' => esc_html__( 'Rates table', 'hbook-admin' ),
				'strings' => array_merge( $utils->strings_utils->get_rates_table_txt(), $hbdb->get_season_names() )
			),
			'invoice-table' => array(
				'title' => esc_html__( 'Invoice table', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_invoice_table_txt()
			),
			'payments-history-table' => array(
				'title' => esc_html__( 'Payments history table', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_payments_history_table_txt()
			),
			'accom-list' => array(
				'title' => esc_html__( 'Accommodation list', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_accom_list_txt()
			),
			'later-payment-form' => array(
				'title' => esc_html__( 'Payment link form', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_later_payment_form_txt()
			),
			'later-payment-link' => array(
				'title' => esc_html__( 'Payment link button', 'hbook-admin' ),
				'strings' => $utils->strings_utils->get_later_payment_link_button_txt()
			),
		);
		$this->sections = apply_filters( 'hb_strings', $this->sections );
		$this->strings = $hbdb->get_all_strings();
		$this->langs = $utils->get_langs();
		$this->variables = $utils->strings_utils->get_txt_variables();
		parent::__construct( $page_id, $hbdb, $utils, $options_utils );
	}

	public function display() {
	?>

	<div class="wrap">
	<h2><?php esc_html_e( 'Text/Translations', 'hbook-admin' ); ?></h2>
		<?php $this->display_right_menu(); ?>
		<hr/>
		<p>
			<?php printf( esc_html__( 'HBook includes front-end translation files for many languages and they can be found in the folder %s.', 'hbook-admin' ), '<b>wp-content/plugins/hbook/languages/front-end-language-files/</b>'); ?><br/>
			<?php printf( esc_html__( 'You will see the imported strings in the %s section below, where you can edit any text displayed by HBook and translate HBook strings for all languages.', 'hbook-admin' ), '<b>Front-end strings</b>' ); ?><br/>
		</p>
		<?php
		if (
			isset( $_POST['hb-import-export-action'] ) &&
			( $_POST['hb-import-export-action'] == 'import-lang' ) &&
			wp_verify_nonce( $_POST['hb_import_export'], 'hb_import_export' ) &&
			current_user_can( 'manage_hbook' )
		) {
			$import_file = $_FILES['hb-import-lang-file']['tmp_name'];
			$file_content = file_get_contents( $import_file );
			$re_id = "/msgid\\s*\"(.*)\"/";
			$re_str = "/msgstr\\s*\"(.*)\"/";
			preg_match_all( $re_id, $file_content, $matches_id );
			preg_match_all( $re_str, $file_content, $matches_str );
			$ids = $matches_id[1];
			$strings = $matches_str[1];
			if (
				( count( $ids ) == 0 ) ||
				( count( $ids ) != count( $strings ) ) ||
				! ( in_array( 'default_form_title', $ids ) )
			) {
			?>
				<div class="error">
					<p><?php esc_html_e( 'The language file is not valid.', 'hbook-admin' ); ?></p>
				</div>
			<?php
			} else {
				$strings_to_db = array();
				$nb_valid_ids = 0;
				$valid_ids = array_keys( $this->utils->get_string_list() );
				$existing_strings = $this->hbdb->get_strings_by_locale( $_POST['hb-import-lang-code'] );
				for ( $i = 0; $i < count( $ids ); $i++ ) {
					if (
						in_array( $ids[ $i ], $valid_ids ) &&
						( $strings[ $i ] != '' ) &&
						(
							(
								isset( $_POST['hb-overwrite-strings'] ) &&
								( $_POST['hb-overwrite-strings'] == 'overwrite' )
							) ||
							! isset( $existing_strings[ $ids[ $i ] ] ) ||
							( $existing_strings[ $ids[ $i ] ] == '' )
						)
					) {
						$new_string = array(
							'id' => $ids[ $i ],
							'value' => $strings[ $i ],
							'locale' => $_POST['hb-import-lang-code']
						);
						$strings_to_db[] = $new_string;
						$nb_valid_ids++;
					}
				}
				$this->hbdb->update_strings( $strings_to_db );
			?>
				<div class="updated">
					<p>
					<?php
					if ( $nb_valid_ids == 0 ) {
						esc_html_e( 'No new strings have been imported.', 'hbook-admin' );
					} else if ( $nb_valid_ids == 1 ) {
						esc_html_e( 'The import was successful (1 string has been imported).', 'hbook-admin' );
					} else {
						printf( esc_html__( 'The import was successful (%d strings have been imported).', 'hbook-admin' ), intval( $nb_valid_ids ) );
					}
					?>
					</p>
				</div>
			<?php
			}
		}
		?>

		<h3><?php esc_html_e( 'Import a file', 'hbook-admin' ); ?></h3>
		<form id="hb-import-file-form" method="post" enctype="multipart/form-data">
			<p>
				<label><?php esc_html_e( 'Language', 'hbook-admin' ); ?></label><br/>
				<?php
				$select_lang_options = '<option value=""></option>';
				foreach ( $this->langs as $locale => $lang_name ) {
					$select_lang_options .= '<option value="' . $locale . '">' . $lang_name . ' (' . $locale . ')</option>';
				}
				$select_lang = '<select id="hb-import-lang-code" name="hb-import-lang-code">' . $select_lang_options . '</select>';
				$allowed_html = array(
					'select' => array(
						'id' => array(),
						'name' => array()
					),
					'option' => array(
						'value' => array()
					)
				);
				echo( wp_kses( $select_lang, $allowed_html ) );
				?>
			</p>
			<p>
				<input id="hb-import-lang-file" type="file" name="hb-import-lang-file" />
			</p>
			<p>
				<input id="hb-overwrite-strings" type="checkbox" name="hb-overwrite-strings" value="overwrite" />
				<label for="hb-overwrite-strings"><?php esc_html_e( 'Overwrite existing strings', 'hbook-admin' ); ?></label>
			</p>
			<p>
				<input id="hb-import-lang-submit" type="submit" class="button-primary" value="<?php esc_attr_e( 'Import', 'hbook-admin' ); ?>" />
			</p>
			<input type="hidden" name="hb-import-export-action" value="import-lang" />
			<?php wp_nonce_field( 'hb_import_export', 'hb_import_export' ); ?>
		</form>
		<br/>

		<h3><?php esc_html_e( 'Export a file', 'hbook-admin' ); ?></h3>
		<p>
			<?php
			foreach ( $this->langs as $locale => $lang_name ) {
			?>
			<a href="#" class="hb-export-lang-file" data-locale="<?php echo( esc_attr( $locale ) ); ?>"><?php echo( wp_kses_post( $lang_name . ' (' . $locale . ')' ) ); ?></a>
			<br/>
			<?php
			}
			?>
		</p>
		<br/>

		<form id="hb-export-lang-form" method="POST">
			<input type="hidden" name="hb-import-export-action" value="export-lang" />
			<input id="hb-locale-export" type="hidden" name="hb-locale-export" />
			<?php wp_nonce_field( 'hb_import_export', 'hb_import_export' ); ?>
		</form>

		<hr/>

		<form id="hb-admin-form">

			<input id="hb-nonce" type="hidden" name="nonce" value="" />
			<input id="hb-action" type="hidden" name="action" value="" />

			<div class="hb-clearfix">
				<h1><?php esc_html_e( 'Front-end strings', 'hbook-admin' ); ?></h1>
				<div class="hb-options-save-beside-title">
					<div>
						<a href="#" class="hb-options-save button-primary"><?php esc_html_e( 'Save changes', 'hbook-admin' ); ?></a>
					</div>
					<div class="hb-ajaxing">
						<span class="spinner"></span>
						<span><?php esc_html_e( 'Saving...', 'hbook-admin' ); ?></span>
					</div>
					<div class="hb-saved"></div>
				</div>
			</div>
			<hr/>
			<?php esc_html_e( 'Here you can modify any front-end strings for any set language.', 'hbook-admin' ); ?>
			<p>
				<input id="hb-untranslated-strings" type="checkbox" name="hb-untranslated-strings" value="untranslated-only" />
				<label for="hb-untranslated-strings"><?php esc_html_e( 'Show untranslated strings only', 'hbook-admin' ); ?></label>
			</p>
			<h3><?php esc_html_e( 'Text sections' , 'hbook-admin' ); ?></h3>
			<ul>
				<?php
				$untranslated_sections = array();
				$untranslated_strings = array();
				foreach ( $this->sections as $section_id => $section ) {
					foreach ( $section['strings'] as $string_id => $string_name ) {
						foreach ( $this->langs as $locale => $lang_name ) {
							if ( ( ! isset( $this->strings[ $string_id ][ $locale ] ) ) || ( '' == $this->strings[ $string_id ][ $locale ] ) ) {
								if ( ! in_array( $string_id, $untranslated_strings ) ) {
									$untranslated_strings[] = $string_id ;
								}
								if ( ! in_array( $section_id, $untranslated_sections )  ) {
									$untranslated_sections[] = $section_id;
								}
							}
						}
					}
					if ( in_array( $section_id, $untranslated_sections ) ) {
						$section_class = 'hb-untranslated-section';
					} else {
						$section_class = 'hb-translated-section';
					}
					?>
					<li><a href="<?php echo( esc_url( '#hb-text-section-' .  $section_id ) ); ?>" class="<?php echo( esc_attr( $section_class ) ); ?>"><?php echo( esc_html( $section['title'] ) ); ?></a></li>
				<?php } ?>
			</ul>
			<hr/>
			<?php
			foreach ( $this->sections as $section_id => $section ) {
				if ( in_array( $section_id, $untranslated_sections ) ) {
					$section_class = 'hb-untranslated-section';
				} else {
					$section_class = 'hb-translated-section';
				}
				?>
				<div class="<?php echo( $section_class ); ?>">
					<h3 id="<?php echo( esc_attr( 'hb-text-section-' . $section_id ) ); ?>"><?php echo( esc_html( $section['title'] ) ); ?></h3>
					<?php
					if ( $section_id == 'details-form-txt' ) {
					?>
						<p><i><?php esc_html_e( 'Leave the following fields blank to use their default name.', 'hbook-admin' ); ?></i></p>
					<?php
					}
					foreach ( $section['strings'] as $string_id => $string_name ) {
						if ( in_array( $string_id, $untranslated_strings ) ) {
							$string_class = 'hb-untranslated-string';
						} else {
							$string_class = 'hb-translated-string';
						}
						?>
						<div class="<?php echo( $string_class ); ?>">
							<h4><?php echo( esc_html( $string_name ) ); ?></h4>
							<?php if ( isset( $this->variables[ $string_id ] ) ) { ?>
								<small class="hb-variable-desc">
								<?php
								if ( count( $this->variables[ $string_id ] ) > 1 ) {
									esc_html_e( 'You can use these variables:', 'hbook-admin' );
								} else {
									esc_html_e( 'You can use this variable:', 'hbook-admin' );
								}
								echo( ' ' );
								echo( esc_html( implode( ', ', $this->variables[ $string_id ] ) ) );
								?>
								</small>
							<?php
							}

							foreach ( $this->langs as $locale => $lang_name ) {
							?>
								<p>
								<?php
								if ( isset( $this->strings[ $string_id ][ $locale ] ) ) {
									$translation = $this->strings[ $string_id ][ $locale ];
								} else {
									$translation = '';
								}
								if ( count( $this->langs ) > 1 ) {
								?>
									<label class="hb-string-lang"><?php echo( esc_html( $lang_name ) ); ?><span> (<?php echo( esc_html( $locale ) );?>)</span></label><br/>
								<?php
								}
								?>
									<input type="text" name="<?php echo( esc_attr( 'string-id-' . $string_id . '-in-' . $locale ) ); ?>" value="<?php echo( esc_attr( $translation ) ); ?>" />
								</p>
							<?php } ?>
						</div>
					<?php } ?>
					<br class="hb-before-save-button" />
					<?php $this->options_utils->display_save_options_section(); ?>
				</div>
			<?php } ?>

		</form>

	</div><!-- end .wrap -->

	<?php
	}
}