# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HBook** is a commercial WordPress plugin for hotel/accommodation booking management (version 2.1.4, by Maestrel). It handles the full booking lifecycle: accommodation setup, availability, reservations, pricing, payments, and notifications.

There is no build system, no npm/Composer dependency management, and no automated tests. Changes are deployed by updating PHP/JS/CSS files directly in a WordPress installation.

## Architecture

### Plugin Entry Point

`hbook.php` bootstraps the plugin: it includes all class files, instantiates the core objects, and registers WordPress hooks.

### Core Components

| Class | File | Responsibility |
|---|---|---|
| `HbDataBaseActions` | `database-actions/database-actions.php` | All DB reads/writes across 40+ custom tables |
| `HbUtils` | `utils/utils.php` | Shared helpers: dates, prices, emails, currency, asset enqueuing |
| `HbPriceCalc` | `utils/price-calc.php` | Complex rate/season/discount/fee price calculation |
| `HbResa` | `utils/resa.php` | Reservation data model |
| `HbResaSummary` | `utils/resa-summary.php` | Builds order summaries for frontend/emails |
| `HbResaIcal` | `utils/resa-ical.php` | iCalendar (RFC 5545) sync with external calendars |
| `HbStringsUtils` | `utils/strings-utils.php` | Multi-language string management |
| `HbAccommodation` | `accom-post-type/accom-post-type.php` | `hb_accommodation` custom post type and meta boxes |
| `HbAdminPage` | `admin-pages/admin-page.php` | Admin menu, page routing |
| `HBookBlocks` | `blocks/blocks.php` | Gutenberg block registration |

Payment gateways live under `payment/` with an abstract base (`payment-gateway.php`) and concrete implementations for PayPal (`payment/paypal/`) and Stripe (`payment/stripe/`).

### Admin Layer

`admin-pages/admin-ajax-actions.php` handles all admin AJAX calls. Individual page UIs are in `admin-pages/pages/<page-name>/`. The admin JS uses **Knockout.js 3.2.0** for dynamic pages (`admin-pages/js/hb-settings-knockout.js`) and plain JS for static pages (`hb-settings-static.js`).

### Frontend Layer

`front-end/shortcodes.php` registers 8 shortcodes. `front-end/front-end-ajax-actions.php` handles all frontend AJAX. The booking form has three phases, each in `front-end/booking-form/`:
1. `search-form.php` — date/guest search
2. `available-accom.php` — availability + price display
3. `details-form.php` — guest info collection

The main frontend JS is `front-end/js/booking-form.js` (~79 KB).

### Database

All tables use the `wp_hb_` prefix. Key tables:
- `wp_hb_resa` — reservations
- `wp_hb_customers` — guest records
- `wp_hb_parents_resa` — multi-accommodation bookings
- `wp_hb_rates` / `wp_hb_rates_rules` / `wp_hb_rates_seasons` — pricing
- `wp_hb_ical` — external calendar sync

Schema management is in `database-actions/database-schema.php` and `database-actions/database-creation.php`. Migrations run automatically on admin page load when the stored version differs from the plugin version.

### Booking Flow (Frontend)

1. User submits dates/guests → AJAX `hb_get_available_accom` → availability + prices returned
2. User selects accommodation → AJAX `hb_get_summary` → order summary
3. User submits guest details → AJAX `hb_create_resa` → reservation created, payment redirect
4. Payment gateway callback updates reservation status and triggers email notifications

### WordPress Integration

- Custom roles: `hb_hbook_manager`, `hb_resa_manager`, `hb_resa_reader`
- WP-Cron jobs: email sending, iCal sync, Stripe delayed payment checking
- Gutenberg blocks in `blocks/` use ES5 JS (no transpilation needed)
- Localization strings under `languages/admin-language-files/` and `languages/front-end-language-files/`

## Dual Currency (CHF / EUR)

The frontend displays prices in both CHF (default) and EUR via a toggle button. EUR amounts are computed client-side by multiplying the CHF price by the exchange rate.

**Exchange rate**: stored in `wp_options` as `hb_eur_chf_rate` (default `0.95`). Update with:
```php
update_option( 'hb_eur_chf_rate', '0.96' );
```

**How it works**:
- PHP wraps every displayed price with `$utils->price_display($price)` → `<span class="hb-currency-price" data-raw-price="X">CHF X</span>`
- `utils/utils.php::price_placeholder()` wraps the currency symbol in `<span class="hb-price-currency-symbol">` so JS can swap it
- `front-end/js/utils.js` defines the global currency functions (`hb_apply_currency_to_prices`, `hb_format_price_with_symbol`, etc.) and the button click handler
- The selected currency is persisted in `localStorage` (`hb_selected_currency`)
- `booking-form.js` listens for the `hb_currency_changed` jQuery event to re-run dynamic price recalculations (options, payment explanations)
- `booking-form-render.php` passes `eur_chf_rate`, `chf_symbol`, `eur_symbol` into `hb_booking_form_data`
- `resa-summary-render.php` passes the same data as `hb_currency_data` for the standalone recap page

## Development Notes

- **No linting or test commands exist.** Validate by loading the plugin in a WordPress test environment.
- `utils.php` (≈4900 lines) and `database-actions.php` (≈4100 lines) are intentionally large monolithic files — add to them rather than splitting them.
- All DB access goes through `$wpdb` (WordPress database abstraction); never use raw PDO/mysqli.
- External documentation: https://documentation.maestrel.com/hbook/
