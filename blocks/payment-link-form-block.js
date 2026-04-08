'use strict';

registerBlockType( 'hbook/payment-link-form', {
	title: hb_blocks_text.payment_link_form_title,
	icon: 'feedback',
	category: 'hbook-blocks',
	supports: {
		className: false,
		customClassName: false,
		html: false
	},

	edit: function edit( props ) {
		var setAttributes = props.setAttributes;
		var thank_you_page_id = props.attributes.thank_you_page_id;

		function on_thank_you_page_change( changes ) {
			setAttributes({ thank_you_page_id: changes });
		}

		return [
			el(
				InspectorControls,
				null,
				el(
					PanelBody,
					{ title: hb_blocks_text.payment_link_form_settings },
					hb_blocks_data.pages_options.length > 0 &&
					el(
						SelectControl, {
							label: hb_blocks_text.thank_you_page,
							value: thank_you_page_id,
							onChange: on_thank_you_page_change,
							options: hb_blocks_data.pages_options
						}
					)
				)
			),
			el(
				'div',
				{ style: { background: '#fff', border: '1px solid', padding: '10px 15px' } },
				el(
					'div',
					null,
					hb_blocks_text.payment_link_form_block
				)
			)
		];
	},
	save: function save() {
		return null;
	}
});