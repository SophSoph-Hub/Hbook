jQuery( document ).ready( function( $ ) {
	'use strict';

	var has_country_select_field = false;
	var country_select_revert = false;
	var updated_ids = [];

	var Field = function( standard, id, name, displayed, admin_only, required, type, choices, data_about, column_width, from_db ) {
		var self = this;
		this.standard = standard;
		this.id = ko.observable( id );
		this.id_tmp = ko.observable( id );
		this.name = ko.observable( name );
		this.name_tmp = ko.observable( name );
		this.type = ko.observable( type );
		this.column_width = ko.observable( column_width );
		this.from_db = from_db;
		this.displayed_yes_input_id = ko.computed( function() {
			return this.id() + '_displayed_yes';
		}, this );
		this.displayed_no_input_id = ko.computed( function() {
			return this.id() + '_displayed_no';
		}, this );
		this.admin_only_yes_input_id = ko.computed( function() {
			return this.id() + '_admin_only_yes';
		}, this );
		this.admin_only_no_input_id = ko.computed( function() {
			return this.id() + '_admin_only_no';
		}, this );
		this.required_yes_input_id = ko.computed( function() {
			return this.id() + '_required_yes';
		}, this );
		this.required_no_input_id = ko.computed( function() {
			return this.id() + '_required_no';
		}, this );
		this.data_about_customer_input_id = ko.computed( function() {
			return this.id() + '_data_about_customer';
		}, this );
		this.data_about_booking_input_id = ko.computed( function() {
			return this.id() + '_data_about_booking';
		}, this );
		this.displayed = ko.observable( displayed );
		this.admin_only = ko.observable( admin_only );
		this.required = ko.observable( required );
		this.data_about = ko.observable( data_about );
		this.choices = ko.observableArray();
		for ( var i = 0; i < choices.length; i++ ) {
			this.choices.push( choices[i] );
		}
		this.editing_name = ko.observable( false );
		this.editing_id = ko.observable( false );

		this.add_choice = function() {
			var id = get_unique_choice_id( 'choice' );
			if ( id ) {
				form_saved = false;
				self.choices.push( new Choice( id, hb_text.new_choice, true ) );
			} else {
				alert( 'Too many new choices. Please start renaming choices.' );
			}
		}

		this.remove_choice = function( choice ) {
			if ( confirm( hb_text.confirm_delete_choice.replace( '%choice_name', choice.name() ) ) ) {
				self.choices.remove( choice );
				form_saved = false;
			}
		}

		this.edit_choice_name = function( choice ) {
			choice.editing_choice( true );
			form_saved = false;
		}

		this.stop_edit_choice_name = function( choice ) {
			choice.editing_choice( false );
			$( '.hb-input-choice-name' ).blur();
			var new_id = get_unique_choice_id( choice.name() );
			if ( new_id ) {
				choice.id( new_id );
			}
			form_saved = false;
		}

		function get_unique_choice_id( name ) {
			return get_unique_id( name, self.choices() );
		}

		this.type.subscribe( function( value ) {
			self.old_type = value;
		}, null, 'beforeChange' );

		this.type.subscribe( function( value ) {
			if ( value == 'country_select' ) {
				if ( has_country_select_field ) {
					alert( hb_text.already_country_select_field );
					country_select_revert = true;
					self.type( self.old_type );
				} else {
					has_country_select_field = true;
					self.id('country_iso');
				}
			} else if ( self.old_type == 'country_select' ) {
				if ( country_select_revert ) {
					country_select_revert = false;
				} else {
					has_country_select_field = false;
				}
			}
		});
	}

	var Choice = function( id, name, editing_choice ) {
		this.id = ko.observable( id );
		this.name = ko.observable( name );

		this.editing_choice = ko.observable( editing_choice );
	}

	var FieldsViewModel = function() {
		var self = this;

		var observable_fields = [];
		for ( var i = 0; i < hb_fields.length; i++ ) {
			var observable_choices = [];
			for ( var j = 0; j < hb_fields[i].choices.length; j++ ) {
				observable_choices.push( new Choice( hb_fields[i].choices[j].id, hb_fields[i].choices[j].name, false ) );
			}
			if ( hb_fields[i].type == 'country_select' ) {
				has_country_select_field = true;
			}
			observable_fields.push( new Field( hb_fields[i].standard, hb_fields[i].id, hb_fields[i].name, hb_fields[i].displayed, hb_fields[i].admin_only, hb_fields[i].required, hb_fields[i].type, observable_choices, hb_fields[i].data_about, hb_fields[i].column_width, true ) );
		}
		self.fields = ko.observableArray( observable_fields );

		function new_field( id ) {
			var standard = 'no',
				id = id,
				name = hb_text.new_field,
				data_about = 'customer',
				column_width = '',
				displayed = 'yes',
				admin_only = 'no',
				required = 'no',
				type = 'text',
				choices = [];

			return new Field( standard, id, name, displayed, admin_only, required, type, choices, data_about, column_width, false );
		}

		this.add_field_top = function() {
			$( '#hb-form-add-field-top' ).blur();
			var id = get_unique_field_id( 'field' );
			if ( id ) {
				form_saved = false;
				self.fields.unshift( new_field( id ) );
				$( '.hb-form-fields-container .hb-form-field' ).first().hide().slideDown();
			} else {
				alert( 'Too many new fields. Please start renaming fields.' );
			}
		}

		this.add_field_bottom = function() {
			$( '#hb-form-add-field-bottom' ).blur();
			var id = get_unique_field_id( 'field' );
			if ( id ) {
				form_saved = false;
				self.fields.push( new_field( id ) );
				$( '.hb-form-fields-container .hb-form-field' ).last().hide().slideDown();
			} else {
				alert( 'Too many new fields. Please start renaming fields.' );
			}
		}

		this.remove_field = function( field ) {
			var confirm_text;
			var no_name_fields = ['column_break', 'separator'];

			if ( no_name_fields.indexOf( field.type() ) > -1 ) {
				confirm_text = hb_text.confirm_delete_field_no_name;
			} else {
				confirm_text = hb_text.confirm_delete_field.replace( '%field_name', field.name() );
			}
			if ( confirm( confirm_text ) ) {
				form_saved = false;
				if ( field.type() == 'country_select' ) {
					has_country_select_field = false;
				}
				$( '#' + field.id() ).slideUp( function() {
					self.fields.remove( field );
				});
			}
		}

		this.edit_field_name = function( field ) {
			field.editing_name( true );
		}

		this.confirm_edit_field_name = function( field ) {
			field.editing_name( false );
			$( '.hb-input-field-name' ).blur();
			field.name( field.name_tmp() );
			if ( field.id().substring( 0, 'field'.length ) == 'field' ) {
				var new_id = get_unique_field_id( field.name() );
				if ( new_id ) {
					field.id( new_id );
					field.id_tmp( new_id );
				}
			}
			form_saved = false;
		}

		this.cancel_edit_field_name = function( field ) {
			field.editing_name( false );
			$( '.hb-input-field-name' ).blur();
			field.name_tmp( field.name() );
		}

		function get_unique_field_id( name ) {
			return get_unique_id( name, self.fields() );
		}

		this.edit_field_id = function( field ) {
			field.editing_id( true );
		}

		this.confirm_edit_field_id = function( field ) {
			$( '.hb-input-field-id' ).blur();
			field.id_tmp( field.id_tmp().toLowerCase().replace( /\s/g, '_' ).replace( /[^a-z0-9_]+/g, '' ) );
			if ( field.id_tmp() == field.id() ) {
				field.editing_id( false );
				return;
			}
			for ( var i = 0; i < self.fields().length; i++ ) {
				if ( field.id_tmp() == self.fields()[ i ].id() ) {
					alert( hb_text.already_field_id );
					return;
				}
			}
			field.editing_id( false );
			if ( field.from_db ) {
				updated_ids.push( field.id() + '=' + field.id_tmp() );
			}
			field.id( field.id_tmp() );
			form_saved = false;
		}

		this.cancel_edit_field_id = function( field ) {
			field.editing_id( false );
			$( '.hb-input-field-id' ).blur();
			field.id_tmp( field.id() );
		}
	}

	function get_unique_id( name, stack ) {
		var id_already_taken = false;
		var id_candidate_max_length = 40;
		var id_candidate;
		if ( ( name == 'field' ) || ( name == 'choice' ) ) {
			id_candidate = name + '_1';
		} else {
			id_candidate = name.toLowerCase().replace( /\s/g, '_' ).replace( /[^a-z0-9_]+/g, '' ).substring( 0, id_candidate_max_length );
		}
		for ( var i = 0; i < stack.length; i++ ) {
			if ( stack[i].id() == id_candidate ) {
				id_already_taken = true;
			}
		}
		if ( ! id_already_taken ) {
			return id_candidate;
		} else if ( ( name == 'field' ) || ( name == 'choice' ) ) {
			id_candidate = name;
		}
		for ( var id_num = 2; id_num < 100; id_num++ ) {
			id_already_taken = false;
			for ( var i = 0; i < stack.length; i++ ) {
				if ( stack[i].id() == id_candidate + '_' + id_num ) {
					id_already_taken = true;
				}
			}
			if ( ! id_already_taken ) {
				id_candidate += '_' + id_num;
				return id_candidate;
			}
		}
		return false;
	}

	ko.bindingHandlers.slideVisible = {
		init: function( element, valueAccessor ) {
			if ( valueAccessor()() == 'no' ) {
				$( element ).hide();
			}
		},
		update: function(element, valueAccessor) {
			if ( valueAccessor()() == 'no' ) {
				$( element ).slideUp();
			} else {
				$( element ).slideDown();
			}
		}
	};

	ko.bindingHandlers.slideHidden = {
		init: function( element, valueAccessor ) {
			if ( valueAccessor()() == 'yes' ) {
				$( element ).hide();
			}
		},
		update: function(element, valueAccessor) {
			if ( valueAccessor()() == 'no' ) {
				$( element ).slideDown();
			} else {
				$( element ).slideUp();
			}
		}
	};

	ko.bindingHandlers.sortable.options = {
		distance: 5,
		cancel: 'input, textarea, button, select, option, .hb-form-field-id'
	};

	var viewModel = new FieldsViewModel();

	ko.applyBindings( viewModel );

	$( '.hb-saved' ).html( hb_text.form_saved );

	$( '.hb-options-save' ).on( 'click', function() {
		$( this ).blur();
		var $save_section = $( this ).parent().parent();
		$save_section.find( '.hb-ajaxing' ).css( 'display', 'inline' );

		var data = {
			'action': 'hb_update_details_form_settings',
			'nonce': $( '#hb_nonce_update_db' ).val(),
			'hb_fields': ko.toJSON( viewModel ),
			'hb_updated_ids': updated_ids.join(','),
			'hb_country_select_default': $( '#hb-country-select-default' ).val()
		}

		$.ajax({
			url: ajaxurl,
			type: 'POST',
			timeout: hb_ajax_settings.timeout,
			data: data,
			success: function( ajax_return ) {
				$save_section.find( '.hb-ajaxing' ).css( 'display', 'none' );
				if ( ajax_return.trim() != 'settings saved' ) {
					alert( ajax_return );
				} else {
					form_saved = true;
					updated_ids = [];
					$save_section.find( '.hb-saved' ).show();
					setTimeout( function() {
						$save_section.find( '.hb-saved ' ).fadeOut();
					}, 4000 );
				}
			},
			error: function( jqXHR, textStatus, errorThrown ) {
				$save_section.find( '.hb-ajaxing' ).css( 'display', 'none' );
				alert( 'Connection error: ' + textStatus + ' (' + errorThrown + ')' );
			}
		});

		return false;
	});

	var form_saved = true;

	$( '#hb-form-fields' ).on( 'change', 'input:not(.hb-input-field-name), select', function() {
		form_saved = false;
	});

	window.onbeforeunload = function() {
		if ( ! form_saved ) {
			return hb_text.unsaved_warning;
		}
	}

});