// main.js — D3 spiral visualization (responsive rendering + interactive markers)

const distances = [0.5, 1, 10, 20];

// Create tooltip
const tooltip = d3.select('body')
	.append('div')
	.attr('class', 'tooltip hidden')
	.style('opacity', 0);

const dataStatus = d3.select('#data-status');
const viz = d3.select('#viz');

// Spiral constants
const a = 8; // starting radius
const b = 6; // radius growth per radian
const maxMiles = 20;

// SVG container (we will set viewBox dynamically)
const svg = viz.append('svg')
	.attr('preserveAspectRatio', 'xMidYMid meet')
	.classed('spiral-svg', true);

let center = { x: 0, y: 0 };
let viewW = 600, viewH = 520, maxVisualRadius = 200;

function radiusToTheta(r) {
	return (r - a) / b;
}

// Nonlinear mapping: spread small distances, compress large ones
function milesToRadius(d) {
	// Use a log scale for better separation
	// log(0.5) = -0.3, log(1) = 0, log(10) = 1, log(20) = 1.3
	// We'll shift so log(0.5) maps to 0
	const minMile = 0.5;
	const logMin = Math.log10(minMile);
	const logMax = Math.log10(maxMiles);
	const logD = Math.log10(d);
	const t = (logD - logMin) / (logMax - logMin);
	return a + t * (maxVisualRadius - a);
}

function buildSpiralPoints() {
	const tMax = radiusToTheta(maxVisualRadius);
	const points = [];
	const steps = Math.max(60, Math.ceil(tMax * 12));
	for (let i = 0; i <= steps; i++) {
		const t = (i / steps) * tMax;
		const r = a + b * t;
		const x = center.x + r * Math.cos(t);
		const y = center.y + r * Math.sin(t);
		points.push([x, y]);
	}
	return points;
}

// groups
svg.append('path').attr('class', 'spiral-path');
const markerGroup = svg.append('g').attr('class', 'markers');

// color scale
const color = d3.scaleLinear().domain([0, maxMiles]).range(['#2ca25f', '#de2d26']);

function sampleFoodsByDistance(miles) {
	if (miles <= 2) return ['Fresh fruits', 'Fresh vegetables', 'Whole grains', 'Low-fat dairy'];
	if (miles <= 10) return ['Fruits', 'Vegetables', 'Canned vegetables', 'Bread', 'Milk'];
	if (miles <= 20) return ['Processed snacks', 'Soda', 'Canned soups', 'Fast food options'];
	return ['Mostly convenience store items', 'Packaged snacks', 'Sugary drinks', 'Limited fresh produce'];
}

// Choose which LATracts column to use for a given marker distance
function chooseLatColumn(miles) {
	// map distances to the nearest LATracts indicator
	// <= 0.75 mile -> LATracts_half, <=5 -> LATracts1, <=15 -> LATracts10, otherwise LATracts20
	if (miles <= 0.75) return 'LATracts_half';
	if (miles <= 5) return 'LATracts1';
	if (miles <= 15) return 'LATracts10';
	return 'LATracts20';
}

function placeMarkers(rows) {
	const markers = markerGroup.selectAll('.marker-g').data(distances, d => d);
	const enter = markers.enter().append('g').attr('class', 'marker-g');
	enter.append('circle').attr('class', 'marker');
	enter.append('text').attr('class', 'marker-label').attr('text-anchor', 'middle').attr('dy', -12);
	enter.append('text').attr('class', 'marker-badge').attr('text-anchor', 'middle').attr('dy', 12);

	const all = enter.merge(markers);
	all.each(function (d) {
		const r = milesToRadius(d);
		const t = radiusToTheta(r);
		const x = center.x + r * Math.cos(t);
		const y = center.y + r * Math.sin(t);
		// Find candidate tracts for this marker
		let candidates = [];
		let col = chooseLatColumn(d);
		if (rows && rows.length) {
			candidates = rows.filter(r => {
				const v = r[col];
				return v !== undefined && v !== null && v !== '' && +v > 0;
			});
		}
		d3.select(this).attr('transform', `translate(${x},${y})`);
		d3.select(this).select('circle')
			.attr('r', Math.max(7, Math.round(viewW / 100)))
			.attr('fill', color(d))
			.on('mouseenter', (event, dist) => {
				showTooltip(event, dist, candidates.length ? candidates : rows, candidates.length === 0);
			})
			.on('mousemove', (event) => moveTooltip(event))
			.on('mouseleave', hideTooltip)
			.on('click', (event) => {
				showMetaPanel(d, candidates, col);
			});
		d3.select(this).select('.marker-label').text(d + ' mi');
		d3.select(this).select('.marker-badge')
			.text(candidates.length > 0 ? candidates.length : '0')
			.attr('x', 0)
			.attr('dy', 12);
	});
	markers.exit().remove();
}

function showTooltip(event, miles, rows, isRandom) {
	let sampleHtml = '';
	if (rows && rows.length) {
		const isCandidateList = rows.length <= 50 && !isRandom;
		if (isCandidateList) {
			const list = rows.slice(0, 3).map(r => `<li>${r.CensusTract || 'n/a'} — ${r.County || ''}, ${r.State || ''}</li>`).join('');
			sampleHtml = `<div class="tooltip-sample"><strong>Matching tracts (${rows.length}):</strong><ul class="tooltip-list">${list}</ul></div>`;
		} else {
			const idx = Math.floor(Math.random() * rows.length);
			const r = rows[idx];
			sampleHtml = `<div class="tooltip-sample"><strong>No matching tracts found for this distance.</strong><br><span style="color:var(--danger)">Showing a random tract instead:</span><br>${r.CensusTract || 'n/a'} — ${r.City || r.County || ''}, ${r.State || ''}</div>`;
		}
	}

	const foods = sampleFoodsByDistance(miles).map(f => `<li>${f}</li>`).join('');
	const html = `<strong>${miles} mile${miles>1?'s':''}</strong>
		<div class="small">Typical available food types:</div>
		<ul class="tooltip-list">${foods}</ul>
		${sampleHtml}`;
	tooltip.html(html).classed('hidden', false).transition().duration(120).style('opacity', 1);
	moveTooltip(event);
}

// Persistent meta panel for marker click
function showMetaPanel(distance, candidates, col) {
	const panel = d3.select('#meta-panel');
	if (!panel.empty()) {
		if (candidates.length > 0) {
			const list = candidates.map(r => `<li>${r.CensusTract || 'n/a'} — ${r.County || ''}, ${r.State || ''}</li>`).join('');
			panel.html(`<h2>Tracts with limited access (${distance} mi)</h2>
				<div>Column: <code>${col}</code></div>
				<div>Matches: <strong>${candidates.length}</strong></div>
				<ul>${list}</ul>`);
		} else {
			panel.html(`<h2>No matching tracts for ${distance} mi</h2>
				<div>Column: <code>${col}</code></div>
				<div style="color:var(--danger)">No tracts flagged for this distance. Try another marker.</div>`);
		}
		panel.style('display', 'block');
	}
}

function moveTooltip(event) {
	const pageX = event.pageX;
	const pageY = event.pageY;
	const left = pageX + 12;
	const top = pageY + 12;
	tooltip.style('left', left + 'px').style('top', top + 'px');
}

function hideTooltip() {
	tooltip.transition().duration(120).style('opacity', 0).on('end', () => tooltip.classed('hidden', true));
}

// responsive renderer: computes view size, center, radius, redraws spiral and markers
let lastRows = [];
function render(rows = lastRows) {
	// measure container
	viewW = Math.max(320, viz.node().clientWidth || 600);
	viewH = Math.max(360, viz.node().clientHeight || 520);
	svg.attr('viewBox', `0 0 ${viewW} ${viewH}`);
	center = { x: viewW / 2, y: viewH / 2 };
	maxVisualRadius = Math.min(viewW, viewH) * 0.45;

	// redraw spiral path
	const line = d3.line();
	svg.select('.spiral-path').attr('d', line(buildSpiralPoints()));

	// reposition markers if they exist
	placeMarkers(rows);
}

// load data then render
d3.csv('food_access_data.csv').then(rows => {
	lastRows = rows;
	console.log(lastRows);
	dataStatus.text(`Loaded ${rows.length} rows from food_access_data.csv`);
	d3.select('#legend').html(`<strong>Dataset</strong><div>Tracts loaded: ${rows.length}</div>
		<div style="margin-top:6px;color:#555;font-size:13px">Markers are data-driven: they show tracts flagged in these columns depending on distance:<ul class="tooltip-list" style="margin-top:6px"><li>½ mile → <code>LATracts_half</code></li><li>1 mile → <code>LATracts1</code></li><li>10 miles → <code>LATracts10</code></li><li>20 miles → <code>LATracts20</code></li></ul> Use this as a hook — the tooltip will list matching tracts for each marker.</div>`);
	render(rows);
}).catch(err => {
	console.warn('CSV load error', err);
	dataStatus.text('Could not load food_access_data.csv — showing concept-only spiral.');
	render([]);
});

// initial render and resize handling
window.addEventListener('resize', () => render());
// small timeout to ensure layout is ready in many browsers
setTimeout(() => render(), 60);


