'use strict';

var hbMonthCal = (function($) {

	var _resa = [], _customers = [], _displayedAccoms = null;
	var _accomColors = {}, _year, _month, _onResaClick, _initialized = false;

	var PALETTE = [
		'#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#D35400',
		'#16A085', '#2C3E50', '#AD1457', '#6D4C41', '#1565C0',
		'#00695C', '#E67E22', '#558B2F', '#4527A0', '#00838F',
		'#E53935', '#5D4037', '#0277BD', '#2E7D32', '#880E4F'
	];

	var EH = 24, EMAR = 2, ETOP = 26, EBOT = 6;

	// DJB2 hash — gives stable, visually distinct colors per customer
	function colorForId(n) {
		n = n | 0;
		var h = 5381;
		var s = String(n);
		for (var i = 0; i < s.length; i++) {
			h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
		}
		return PALETTE[h % PALETTE.length];
	}

	function d2s(d) {
		return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
	}

	function pad2(n) {
		return n < 10 ? '0' + n : '' + n;
	}

	function s2d(s) {
		var p = s.split('-');
		return new Date(+p[0], +p[1] - 1, +p[2]);
	}

	function addDays(d, n) {
		var r = new Date(d);
		r.setDate(r.getDate() + n);
		return r;
	}

	function dayDiff(a, b) {
		return Math.round((b - a) / 864e5);
	}

	function weekSunday(d) {
		var r = new Date(d);
		r.setDate(d.getDate() - d.getDay());
		return r;
	}

	function getWeekEvents(wStart, wEnd) {
		var wStartStr = d2s(wStart), wEndStr = d2s(wEnd);
		var evs = [];

		for (var i = 0; i < _resa.length; i++) {
			var r = _resa[i];
			if (r.is_parent) continue;
			var st = r.status();
			if (st === 'cancelled' || st === 'pending') continue;

			if (_displayedAccoms !== null) {
				var aid = '' + r.accom_id();
				var found = false;
				for (var k = 0; k < _displayedAccoms.length; k++) {
					if (_displayedAccoms[k] === aid) { found = true; break; }
				}
				if (!found) continue;
			}

			var ci = r.check_in(), co = r.check_out();
			if (!ci || !co || ci === '0000-00-00' || co === '0000-00-00') continue;

			// Reservation covers nights ci through (co minus 1 day)
			var lastNight = d2s(addDays(s2d(co), -1));
			if (ci > wEndStr || lastNight < wStartStr) continue;

			var sDate = ci < wStartStr ? wStart : s2d(ci);
			var eDate = lastNight > wEndStr ? wEnd : s2d(lastNight);
			var sCol = dayDiff(wStart, sDate);
			var eCol = dayDiff(wStart, eDate);

			var name = '';
			for (var j = 0; j < _customers.length; j++) {
				if (_customers[j].id == r.customer_id()) {
					var fn = _customers[j].first_name ? _customers[j].first_name() : '';
					var ln = _customers[j].last_name ? _customers[j].last_name() : '';
					name = fn + (fn && ln ? ' ' : '') + ln;
					break;
				}
			}

			var ac = accoms[r.accom_id()];
			var accomAbbr = ac ? (ac.abbr_name || ac.short_name || '') : '';
			var customerId = r.customer_id();

			evs.push({
				id: r.id,
				sCol: sCol, eCol: eCol,
				color: colorForId(customerId || r.id),
				title: r.id + (name ? '. ' + name : '') + (accomAbbr ? ' [' + accomAbbr + ']' : ''),
				name: name,
				accomAbbr: accomAbbr,
				contLeft: ci < wStartStr,
				contRight: lastNight > wEndStr,
				row: -1,
				confirmed: st === 'confirmed'
			});
		}

		evs.sort(function(a, b) {
			if (a.sCol !== b.sCol) return a.sCol - b.sCol;
			return (b.eCol - b.sCol) - (a.eCol - a.sCol);
		});

		var rowEnd = [];
		for (var i = 0; i < evs.length; i++) {
			var placed = false;
			for (var rr = 0; rr < rowEnd.length; rr++) {
				if (evs[i].sCol > rowEnd[rr]) {
					evs[i].row = rr; rowEnd[rr] = evs[i].eCol; placed = true; break;
				}
			}
			if (!placed) { evs[i].row = rowEnd.length; rowEnd.push(evs[i].eCol); }
		}

		return evs;
	}

	function render() {
		if (!_initialized) return;
		var y = _year, m = _month;
		var first = new Date(y, m, 1);
		var last = new Date(y, m + 1, 0);
		var today = d2s(new Date());
		var h = '';

		// Header
		h += '<div class="hb-mcal-header">';
		h += '<button class="hb-mcal-prev button" type="button">&lsaquo;</button>';
		h += '<span class="hb-mcal-title">' + month_full_name[m] + ' ' + y + '</span>';
		h += '<button class="hb-mcal-next button" type="button">&rsaquo;</button>';
		h += '</div>';

		// Accommodation filter badges (colors on bars = per client, not per accom)
		var legendHtml = '';
		for (var i = 0; i < all_accom_ids.length; i++) {
			var aid = all_accom_ids[i];
			if (_displayedAccoms !== null && _displayedAccoms.indexOf('' + aid) < 0) continue;
			var ac = accoms[aid];
			var aname = ac ? (ac.short_name || ac.name) : '' + aid;
			legendHtml += '<div class="hb-mcal-legend-item">';
			legendHtml += '<span class="hb-mcal-legend-label" title="' + aname + '">' + aname + '</span>';
			legendHtml += '</div>';
		}
		if (legendHtml) h += '<div class="hb-mcal-legend">' + legendHtml + '</div>';

		// Day name headers
		h += '<div class="hb-mcal-daynames">';
		for (var d = 0; d < 7; d++) {
			h += '<div class="hb-mcal-dayname">' + days_short_name[d] + '</div>';
		}
		h += '</div>';

		// Weeks
		h += '<div class="hb-mcal-weeks">';
		var cur = weekSunday(first);
		while (cur <= last) {
			var wStart = new Date(cur), wEnd = addDays(wStart, 6);
			var evs = getWeekEvents(wStart, wEnd);
			var nRows = 0;
			for (var i = 0; i < evs.length; i++) {
				if (evs[i].row + 1 > nRows) nRows = evs[i].row + 1;
			}
			var wh = ETOP + nRows * (EH + EMAR) + EBOT;
			if (wh < 50) wh = 50;

			h += '<div class="hb-mcal-week" style="height:' + wh + 'px">';

			// Day number cells
			h += '<div class="hb-mcal-day-cells">';
			for (var d = 0; d < 7; d++) {
				var dd = addDays(wStart, d);
				var cls = 'hb-mcal-day';
				if (dd.getMonth() !== m) cls += ' hb-mcal-other-month';
				if (d2s(dd) === today) cls += ' hb-mcal-today';
				h += '<div class="' + cls + '"><span class="hb-mcal-day-num">' + dd.getDate() + '</span></div>';
			}
			h += '</div>';

			// Event bars
			if (evs.length > 0) {
				h += '<div class="hb-mcal-events-layer">';
				for (var i = 0; i < evs.length; i++) {
					var ev = evs[i];
					var left = (ev.sCol / 7 * 100).toFixed(3);
					var width = ((ev.eCol - ev.sCol + 1) / 7 * 100).toFixed(3);
					var top = ev.row * (EH + EMAR);
					var cls = 'hb-mcal-event';
					if (ev.contLeft) cls += ' hb-mcal-cont-left';
					if (ev.contRight) cls += ' hb-mcal-cont-right';
					if (!ev.confirmed) cls += ' hb-mcal-event-unconfirmed';
					h += '<div class="' + cls + '"';
					h += ' style="left:' + left + '%;width:calc(' + width + '% - 2px);top:' + top + 'px;background:' + ev.color + '"';
					h += ' data-resa-id="' + ev.id + '" title="' + ev.title.replace(/"/g, '&quot;') + '">';
					h += '<span class="hb-mcal-ev-label">';
					if (ev.accomAbbr) h += '<span class="hb-mcal-ev-accom">' + ev.accomAbbr + '</span>';
					h += ev.id;
					if (ev.name) h += '<span class="hb-mcal-ev-name"> ' + ev.name + '</span>';
					h += '</span>';
					h += '</div>';
				}
				h += '</div>';
			}

			h += '</div>'; // .hb-mcal-week
			cur = addDays(cur, 7);
		}
		h += '</div>'; // .hb-mcal-weeks

		$('#hb-month-cal').html(h);
	}

	$(document).on('click', '#hb-month-cal .hb-mcal-prev', function() {
		_month--;
		if (_month < 0) { _month = 11; _year--; }
		render();
		return false;
	});

	$(document).on('click', '#hb-month-cal .hb-mcal-next', function() {
		_month++;
		if (_month > 11) { _month = 0; _year++; }
		render();
		return false;
	});

	$(document).on('click', '#hb-month-cal .hb-mcal-event', function() {
		if (_onResaClick) _onResaClick($(this).data('resa-id'));
		return false;
	});

	return {
		init: function(resa, customers, onResaClick) {
			_resa = resa;
			_customers = customers;
			_onResaClick = onResaClick;
			for (var i = 0; i < all_accom_ids.length; i++) {
				_accomColors[all_accom_ids[i]] = PALETTE[i % PALETTE.length];
			}
			var now = new Date();
			_year = now.getFullYear();
			_month = now.getMonth();
			_initialized = true;
			render();
		},

		refresh: function(resa, customers) {
			_resa = resa;
			_customers = customers;
			render();
		},

		setDisplayedAccoms: function(accomId) {
			_displayedAccoms = accomId === 'all' ? null : ['' + accomId];
			render();
		}
	};

})(jQuery);
