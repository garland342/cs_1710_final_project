// ============================================
// CONFIGURATION
// ============================================

const CSV_FILE = "data/agg_health.csv";
const STATE_COLUMN = "StateDesc";
const COUNTY_COLUMN = "CountyName";

// Fixed metric for left map
const BASELINE_METRIC = "FOODINSECU_CrudePrev";

// Available comparison metrics for right map
const COMPARISON_METRICS = [
    { value: "DIABETES_CrudePrev", label: "Rate of Diabetes (Unadjusted %)", format: ".2f", colorScheme: d3.interpolateGreens },
    { value: "DEPRESSION_CrudePrev", label: "Rate of Depression (Unadjusted %)", format: ".2f", colorScheme: d3.interpolatePurples},
    { value: "BPHIGH_CrudePrev", label: "High Blood Pressure Rate (Unadjusted %)", format: ".2f", colorScheme: d3.interpolateReds}
];

// ============================================
// STATE
// ============================================

let currentComparisonMetric = COMPARISON_METRICS[1].value;
let isZoomed = false;
let currentStateName = null;
let currentStateData = null;

// Store global data
let globalData = {
    csvData: null,
    stateFeatures: null,
    countyFeatures: null,
    dataByState: null
};

// Bar charts state
let barChartsData = {
    stateLevel: null,
    regionalLevel: null,
    currentView: 'state',
    currentMetric: 'DEPRESSION_CrudePrev'  // Track which metric is selected
};

// State to region mapping
const stateToRegion = {
    'Connecticut': 'Northeast', 'Maine': 'Northeast', 'Massachusetts': 'Northeast', 'New Hampshire': 'Northeast',
    'New Jersey': 'Northeast', 'New York': 'Northeast', 'Pennsylvania': 'Northeast', 'Rhode Island': 'Northeast',
    'Vermont': 'Northeast', 'Delaware': 'Northeast', 'Maryland': 'Northeast', 'District of Columbia': 'Northeast',
    'Illinois': 'Midwest', 'Indiana': 'Midwest', 'Michigan': 'Midwest', 'Ohio': 'Midwest',
    'Wisconsin': 'Midwest', 'Iowa': 'Midwest', 'Kansas': 'Midwest', 'Minnesota': 'Midwest',
    'Missouri': 'Midwest', 'Nebraska': 'Midwest', 'North Dakota': 'Midwest', 'South Dakota': 'Midwest',
    'Alabama': 'South', 'Arkansas': 'South', 'Florida': 'South', 'Georgia': 'South',
    'Kentucky': 'South', 'Louisiana': 'South', 'Mississippi': 'South', 'North Carolina': 'South',
    'South Carolina': 'South', 'Tennessee': 'South', 'Texas': 'South', 'Virginia': 'South',
    'West Virginia': 'South', 'Oklahoma': 'South', 'Arizona': 'West', 'Colorado': 'West',
    'Idaho': 'West', 'Montana': 'West', 'Nevada': 'West', 'New Mexico': 'West',
    'Utah': 'West', 'Wyoming': 'West', 'Alaska': 'West', 'California': 'West',
    'Hawaii': 'West', 'Oregon': 'West', 'Washington': 'West'
};

// ============================================
// MAP SETUP
// ============================================

const mapWidth = 450;
const mapHeight = 500;

// Left Map (Food Insecurity)
const svgLeft = d3.select("#map-left")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

const gLeft = svgLeft.append("g");
const countyGroupLeft = gLeft.append("g").attr("class", "counties");
const stateGroupLeft = gLeft.append("g").attr("class", "states");

// Right Map (Comparison Metric)
const svgRight = d3.select("#map-right")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

const gRight = svgRight.append("g");
const countyGroupRight = gRight.append("g").attr("class", "counties");
const stateGroupRight = gRight.append("g").attr("class", "states");

// Projection (same for both maps)
const projection = d3.geoAlbersUsa()
    .scale(550)
    .translate([mapWidth / 2, mapHeight / 2]);

const path = d3.geoPath().projection(projection);

// ============================================
// FIPS MAPPING
// ============================================

const fipsToName = new Map([
    ["01", "Alabama"], ["02", "Alaska"], ["04", "Arizona"], ["05", "Arkansas"],
    ["06", "California"], ["08", "Colorado"], ["09", "Connecticut"], ["10", "Delaware"],
    ["11", "District of Columbia"], ["12", "Florida"], ["13", "Georgia"], ["15", "Hawaii"],
    ["16", "Idaho"], ["17", "Illinois"], ["18", "Indiana"], ["19", "Iowa"],
    ["20", "Kansas"], ["21", "Kentucky"], ["22", "Louisiana"], ["23", "Maine"],
    ["24", "Maryland"], ["25", "Massachusetts"], ["26", "Michigan"], ["27", "Minnesota"],
    ["28", "Mississippi"], ["29", "Missouri"], ["30", "Montana"], ["31", "Nebraska"],
    ["32", "Nevada"], ["33", "New Hampshire"], ["34", "New Jersey"], ["35", "New Mexico"],
    ["36", "New York"], ["37", "North Carolina"], ["38", "North Dakota"], ["39", "Ohio"],
    ["40", "Oklahoma"], ["41", "Oregon"], ["42", "Pennsylvania"], ["44", "Rhode Island"],
    ["45", "South Carolina"], ["46", "South Dakota"], ["47", "Tennessee"], ["48", "Texas"],
    ["49", "Utah"], ["50", "Vermont"], ["51", "Virginia"], ["53", "Washington"],
    ["54", "West Virginia"], ["55", "Wisconsin"], ["56", "Wyoming"]
]);

const nameToFips = new Map(Array.from(fipsToName, ([key, value]) => [value, key]));

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatValue(value, formatString) {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return d3.format(formatString)(value);
}

function getComparisonMetricInfo(metricValue) {
    return COMPARISON_METRICS.find(m => m.value === metricValue) || COMPARISON_METRICS[1];
}

function getMetricLabel(metric) {
    if (metric === BASELINE_METRIC) return "Food Insecurity Rate (Unadjusted %)";
    const info = getComparisonMetricInfo(metric);
    return `${info.label}`;
}

// ============================================
// LEGEND FUNCTIONS
// ============================================

function createLegend(containerId, colorScale, values, title) {
    const legendContainer = d3.select(containerId);
    legendContainer.html("");

    legendContainer.append("h4").text(title);
    
    const legendSvg = legendContainer.append("svg")
        .attr("width", "100%")
        .attr("height", 50)
        .attr("viewBox", "0 0 300 50")
        .attr("preserveAspectRatio", "xMidYMid meet");
    
    const legendScale = d3.scaleLinear()
        .domain(d3.extent(values))
        .range([0, 250]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f"));

    const defs = legendSvg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", `legend-gradient-${containerId.replace('#', '')}`);

    gradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.01))
        .join("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => colorScale(legendScale.invert(d * 250)));

    legendSvg.append("rect")
        .attr("x", 25)
        .attr("y", 5)
        .attr("width", 250)
        .attr("height", 20)
        .style("fill", `url(#legend-gradient-${containerId.replace('#', '')})`)
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

    legendSvg.append("g")
        .attr("transform", "translate(25, 25)")
        .call(legendAxis)
        .selectAll("text")
        .style("font-size", "10px");
}

// ============================================
// ZOOM FUNCTIONS
// ============================================

function zoomToBothMaps(stateFeature, stateName) {
    isZoomed = true;
    currentStateName = stateName;
    currentStateData = globalData.dataByState.get(stateName) || [];

    if (currentStateData.length === 0) {
        console.warn(`No data for state: ${stateName}`);
        return;
    }

    d3.select("#reset-button").classed("visible", true);
    d3.select("#info-panel").classed("hidden", false);

    const bounds = path.bounds(stateFeature);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    
    const centerX = (bounds[0][0] + bounds[1][0]) / 2;
    const centerY = (bounds[0][1] + bounds[1][1]) / 2;
    
    const scale = 0.85 / Math.max(dx / mapWidth, dy / mapHeight);
    const translateX = mapWidth / 2 - scale * centerX;
    const translateY = mapHeight / 2 - scale * centerY;
    
    // Hide state groups
    stateGroupLeft.transition().duration(750).style("opacity", 0)
        .on("end", () => stateGroupLeft.style("display", "none"));
    stateGroupRight.transition().duration(750).style("opacity", 0)
        .on("end", () => stateGroupRight.style("display", "none"));
    
    // Zoom both maps
    gLeft.transition().duration(750)
        .attr("transform", `translate(${translateX},${translateY}) scale(${scale})`);
    gRight.transition().duration(750)
        .attr("transform", `translate(${translateX},${translateY}) scale(${scale})`);
    
    // Draw counties on both maps
    drawCountiesOnMap(countyGroupLeft, stateName, BASELINE_METRIC, d3.interpolateBlues);
    drawCountiesOnMap(countyGroupRight, stateName, currentComparisonMetric, 
        getComparisonMetricInfo(currentComparisonMetric).colorScheme);
    
    // Update legends
    updateLegends();
    
    // Hide bar charts and show state-specific info
    hideBarCharts();
    showComparisonInfo(stateName);
}

function drawCountiesOnMap(countyGroup, stateName, metric, colorScheme) {
    const stateFips = nameToFips.get(stateName);
    const stateCounties = globalData.countyFeatures.features.filter(d => 
        d.id.substring(0, 2) === stateFips
    );

    const values = currentStateData
        .map(d => {
            const val = d[metric];
            // Handle both empty strings and non-numeric values
            return (val === '' || val === undefined || val === null) ? NaN : +val;
        })
        .filter(v => !isNaN(v));
    
    const hasValidData = values.length > 0;
    
    console.log(`Drawing ${stateName} with ${metric}: found ${values.length} valid values out of ${currentStateData.length} counties`);
    
    const colorScale = d3.scaleSequential()
        .domain(hasValidData ? d3.extent(values) : [0, 1])
        .interpolator(colorScheme);

    // Store in window so updateLegends can access it
    window.currentLegendMetric = metric;
    window.currentLegendHasData = hasValidData;

    const countyDataMap = new Map();
    currentStateData.forEach(d => {
        const normalizedName = (d[COUNTY_COLUMN] || "").toLowerCase()
            .replace(/\s+county\s*$/i, '').trim();
        countyDataMap.set(normalizedName, d);
    });

    countyGroup.selectAll("path.county")
        .data(stateCounties)
        .join("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", d => {
            // If state has no valid data for this metric, always return gray
            if (!hasValidData) {
                return "#e0e0e0";
            }
            
            const countyTopoName = d.properties && d.properties.name ? 
                d.properties.name.toLowerCase() : '';
            let matchingData = null;

            for (let [normalizedName, data] of countyDataMap) {
                if (countyTopoName.includes(normalizedName) || 
                    normalizedName.includes(countyTopoName)) {
                    matchingData = data;
                    break;
                }
            }

            if (matchingData) {
                const value = +matchingData[metric];
                return isNaN(value) ? "#e0e0e0" : colorScale(value);
            }
            return "#e0e0e0";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", function() {
            d3.select(this).attr("stroke", "#667eea").attr("stroke-width", 2);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
        })
        .append("title")
        .text(d => getCountyTooltip(d, metric));

    // Add state boundary
    const stateFeature = globalData.stateFeatures.features.find(f => 
        fipsToName.get(f.id) === stateName
    );

    if (stateFeature) {
        countyGroup.append("path")
            .datum(stateFeature)
            .attr("class", "state-boundary")
            .attr("d", path)
            .style("opacity", 0);
    }

    // Fade in counties
    countyGroup.selectAll("path").transition().duration(300).style("opacity", 1);
}

function getCountyTooltip(countyFeature, metric) {
    const countyTopoName = countyFeature.properties && countyFeature.properties.name ? 
        countyFeature.properties.name.toLowerCase() : '';

    let matchingData = null;
    
    for (let cd of currentStateData) {
        const dataCountyName = (cd[COUNTY_COLUMN] || "").toLowerCase()
            .replace(/\s+county\s*$/i, '').trim();
        if (countyTopoName.includes(dataCountyName) || 
            dataCountyName.includes(countyTopoName)) {
            matchingData = cd;
            break;
        }
    }

    if (matchingData) {
        const value = +matchingData[metric];
        const metricLabel = metric === BASELINE_METRIC ? "Food Insecurity Rate (Unadjusted %)" : 
            getComparisonMetricInfo(metric).label;
        return `${matchingData[COUNTY_COLUMN]}\n${metricLabel}: ${formatValue(value, ".2f")}`;
    }

    return `County: ${countyFeature.id}\nData not available`;
}

// ============================================
// RESET & INFO PANEL FUNCTIONS
// ============================================

function resetBothMaps() {
    isZoomed = false;
    currentStateName = null;
    currentStateData = null;

    d3.select("#reset-button").classed("visible", false);
    d3.select("#info-panel").classed("hidden", false);

    // Clear counties
    countyGroupLeft.selectAll("*").transition().duration(300).style("opacity", 0)
        .on("end", function() { countyGroupLeft.selectAll("*").remove(); });
    countyGroupRight.selectAll("*").transition().duration(300).style("opacity", 0)
        .on("end", function() { countyGroupRight.selectAll("*").remove(); });

    // Reset zoom
    gLeft.transition().duration(750).attr("transform", "translate(0,0) scale(1)");
    gRight.transition().duration(750).attr("transform", "translate(0,0) scale(1)");

    // Show states
    stateGroupLeft.style("display", "block").transition().duration(750).style("opacity", 1);
    stateGroupRight.style("display", "block").transition().duration(750).style("opacity", 1);

    // Reset legends
    updateLegends();

    // Show default instruction in info panel and bar charts
    showDefaultInstruction();
    showBarCharts();
}

function showDefaultInstruction() {
    d3.select("#state-name-header").text("National");
    d3.select("#county-count-subtitle").text("See nationwide statistics below");
    
    const content = d3.select("#info-content");
    content.html(`
        <div class="instruction">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <p>Click on any state in either map to view detailed statistics and county-level comparison data</p>
        </div>
    `);
}

function showComparisonInfo(stateName) {
    d3.select("#state-name-header").text(stateName);
    d3.select("#county-count-subtitle").text(
        `${currentStateData.length} ${currentStateData.length === 1 ? 'County' : 'Counties'}`
    );

    const content = d3.select("#info-content");
    content.html("");

    // Comparison Statistics
    const comparisonSection = content.append("div").attr("class", "comparison-section");

    // Food Insecurity Card
    const foodCard = comparisonSection.append("div")
        .attr("class", "comparison-card food-insecurity");
    foodCard.append("h4").text("Food Insecurity Rate (Unadjusted %)");
    addStatRows(foodCard, BASELINE_METRIC);

    // Comparison Metric Card
    const compMetric = getComparisonMetricInfo(currentComparisonMetric);
    const compCard = comparisonSection.append("div")
        .attr("class", "comparison-card comparison-metric")
        .style("border-left-color", getMetricColor(currentComparisonMetric));
    compCard.append("h4").text(compMetric.label);
    addStatRows(compCard, currentComparisonMetric);

    // Distribution Charts
    const chartsSection = content.append("div").attr("class", "distribution-charts");

    // Food Insecurity Distribution
    const foodChartSection = chartsSection.append("div").attr("class", "distribution-chart-section");
    createSmallDistributionChart(foodChartSection, BASELINE_METRIC, d3.interpolateBlues);

    // Comparison Metric Distribution
    const compChartSection = chartsSection.append("div").attr("class", "distribution-chart-section");
    createSmallDistributionChart(compChartSection, currentComparisonMetric, compMetric.colorScheme);
}

function addStatRows(container, metric) {
    const values = currentStateData
        .map(d => {
            const val = d[metric];
            return (val === '' || val === undefined || val === null) ? NaN : +val;
        })
        .filter(v => !isNaN(v));

    const stats = [
        { label: "Average", value: d3.mean(values) },
        { label: "Minimum", value: d3.min(values) },
        { label: "Maximum", value: d3.max(values) },
        { label: "Median", value: d3.median(values) }
    ];

    stats.forEach(stat => {
        const row = container.append("div").attr("class", "stat-row");
        row.append("div").attr("class", "label").text(stat.label);
        const valueText = isNaN(stat.value) ? "No Data" : formatValue(stat.value, ".2f");
        row.append("div").attr("class", "value").text(valueText);
    });
}

function createSmallDistributionChart(container, metric, colorScheme) {
    const values = currentStateData.map(d => +d[metric]).filter(v => !isNaN(v));

    if (values.length === 0) {
        container.append("p").text("No data available");
        return;
    }

    const numBins = Math.min(8, Math.ceil(values.length / 3));
    const histogram = d3.bin().domain(d3.extent(values)).thresholds(numBins);
    const bins = histogram(values);

    // Increased margins for axis labels
    const margin = { top: 10, right: 10, bottom: 45, left: 50 };
    const width = 320 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 320 ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([d3.min(values), d3.max(values)]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).range([height, 0]);

    const colorScale = d3.scaleSequential().domain(d3.extent(values)).interpolator(colorScheme);

    // Draw bars
    svg.selectAll(".bar")
        .data(bins)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => height - y(d.length))
        .attr("fill", d => colorScale((d.x0 + d.x1) / 2));

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format(".1f")))
        .selectAll("text")
        .style("font-size", "9px");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("fill", "#495057")
        .text(getMetricLabel(metric));

    // Y-axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(4))
        .selectAll("text")
        .style("font-size", "9px");

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -38)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("fill", "#495057")
        .text("Number of Counties");
}

function getMetricColor(metric) {
    const info = getComparisonMetricInfo(metric);
    const colorScale = d3.scaleSequential().domain([0, 1]).interpolator(info.colorScheme);
    return colorScale(0.7);
}

// ============================================
// METRIC CHANGE HANDLER
// ============================================

function onComparisonMetricChange(newMetric) {
    currentComparisonMetric = newMetric;
    barChartsData.currentMetric = newMetric;

    if (isZoomed && currentStateName && currentStateData) {
        // Update right map counties
        countyGroupRight.selectAll("*").remove();
        drawCountiesOnMap(countyGroupRight, currentStateName, currentComparisonMetric,
            getComparisonMetricInfo(currentComparisonMetric).colorScheme);
        
        // Update legend and info panel
        updateLegends();
        showComparisonInfo(currentStateName);
    } else {
        // Update right map states and bar charts
        updateRightMapStates();
        updateLegends();
        // Update bar charts if in national view
        if (!isZoomed) {
            showBarCharts();
        }
    }
}

function updateRightMapStates() {
    const stateAverages = d3.rollup(
        globalData.csvData,
        v => d3.mean(v, d => +d[currentComparisonMetric]),
        d => d[STATE_COLUMN]
    );

    const values = Array.from(stateAverages.values());
    const colorScale = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(getComparisonMetricInfo(currentComparisonMetric).colorScheme);

    stateGroupRight.selectAll("path.state")
        .transition()
        .duration(500)
        .attr("fill", d => {
            const stateName = fipsToName.get(d.id);
            const avg = stateAverages.get(stateName);
            return avg ? colorScale(avg) : "#e0e0e0";
        });

    stateGroupRight.selectAll("path.state")
        .select("title")
        .text(d => {
            const stateName = fipsToName.get(d.id);
            const avg = stateAverages.get(stateName);
            const metricLabel = getComparisonMetricInfo(currentComparisonMetric).label;
            return stateName && avg 
                ? `${stateName}\n${metricLabel}: ${avg.toFixed(2)}%\nClick to zoom in` 
                : stateName || "No data";
        });
}

function updateLegends() {
    if (isZoomed) {
        // County-level legends
        const leftValues = currentStateData
            .map(d => {
                const val = d[BASELINE_METRIC];
                return (val === '' || val === undefined || val === null) ? NaN : +val;
            })
            .filter(v => !isNaN(v));
        
        const rightValues = currentStateData
            .map(d => {
                const val = d[currentComparisonMetric];
                return (val === '' || val === undefined || val === null) ? NaN : +val;
            })
            .filter(v => !isNaN(v));
        
        // Check if we have data for each metric
        const hasLeftData = leftValues.length > 0;
        const hasRightData = rightValues.length > 0;
        
        if (!hasLeftData) {
            d3.select("#legend-left").html('<h4>No data available</h4>');
        } else {
            const leftColorScale = d3.scaleSequential()
                .domain(d3.extent(leftValues))
                .interpolator(d3.interpolateBlues);
            createLegend("#legend-left", leftColorScale, leftValues, "Food Insecurity Rate (Unadjusted %)");
        }
        
        if (!hasRightData) {
            d3.select("#legend-right").html('<h4>No data available</h4>');
        } else {
            const rightColorScale = d3.scaleSequential()
                .domain(d3.extent(rightValues))
                .interpolator(getComparisonMetricInfo(currentComparisonMetric).colorScheme);
            createLegend("#legend-right", rightColorScale, rightValues, 
                getComparisonMetricInfo(currentComparisonMetric).label);
        }
    } else {
        // State-level legends
        const leftStateAvg = d3.rollup(
            globalData.csvData,
            v => d3.mean(v, d => +d[BASELINE_METRIC]),
            d => d[STATE_COLUMN]
        );
        const rightStateAvg = d3.rollup(
            globalData.csvData,
            v => d3.mean(v, d => +d[currentComparisonMetric]),
            d => d[STATE_COLUMN]
        );
        
        const leftValues = Array.from(leftStateAvg.values());
        const rightValues = Array.from(rightStateAvg.values());
        
        const leftColorScale = d3.scaleSequential()
            .domain(d3.extent(leftValues))
            .interpolator(d3.interpolateBlues);
        
        const rightColorScale = d3.scaleSequential()
            .domain(d3.extent(rightValues))
            .interpolator(getComparisonMetricInfo(currentComparisonMetric).colorScheme);
        
        createLegend("#legend-left", leftColorScale, leftValues, "Food Insecurity Rate (Unadjusted %)");
        createLegend("#legend-right", rightColorScale, rightValues, 
            getComparisonMetricInfo(currentComparisonMetric).label);
    }
}

// ============================================
// DRAW STATES ON BOTH MAPS
// ============================================

function drawStatesOnBothMaps() {
    // Calculate averages for both metrics
    const leftStateAvg = d3.rollup(
        globalData.csvData,
        v => d3.mean(v, d => +d[BASELINE_METRIC]),
        d => d[STATE_COLUMN]
    );

    const rightStateAvg = d3.rollup(
        globalData.csvData,
        v => d3.mean(v, d => +d[currentComparisonMetric]),
        d => d[STATE_COLUMN]
    );

    const leftValues = Array.from(leftStateAvg.values());
    const rightValues = Array.from(rightStateAvg.values());

    const leftColorScale = d3.scaleSequential()
        .domain(d3.extent(leftValues))
        .interpolator(d3.interpolateBlues);

    const rightColorScale = d3.scaleSequential()
        .domain(d3.extent(rightValues))
        .interpolator(getComparisonMetricInfo(currentComparisonMetric).colorScheme);

    // Draw left map states
    stateGroupLeft.selectAll("path")
        .data(globalData.stateFeatures.features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", d => {
            const stateName = fipsToName.get(d.id);
            const avg = leftStateAvg.get(stateName);
            return avg ? leftColorScale(avg) : "#e0e0e0";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function() {
            if (!isZoomed) {
                d3.select(this).attr("stroke", "#667eea").attr("stroke-width", 2);
            }
        })
        .on("mouseout", function() {
            if (!isZoomed) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
            }
        })
        .on("click", function(event, d) {
            const stateName = fipsToName.get(d.id);
            if (stateName) zoomToBothMaps(d, stateName);
        })
        .append("title")
        .text(d => {
            const stateName = fipsToName.get(d.id);
            const avg = leftStateAvg.get(stateName);
            return stateName && avg 
                ? `${stateName}\nFood Insecurity: ${avg.toFixed(2)}%\nClick to zoom in` 
                : stateName || "No data";
        });

    // Draw right map states
    stateGroupRight.selectAll("path")
        .data(globalData.stateFeatures.features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", d => {
            const stateName = fipsToName.get(d.id);
            const avg = rightStateAvg.get(stateName);
            return avg ? rightColorScale(avg) : "#e0e0e0";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function() {
            if (!isZoomed) {
                d3.select(this).attr("stroke", "#667eea").attr("stroke-width", 2);
            }
        })
        .on("mouseout", function() {
            if (!isZoomed) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
            }
        })
        .on("click", function(event, d) {
            const stateName = fipsToName.get(d.id);
            if (stateName) zoomToBothMaps(d, stateName);
        })
        .append("title")
        .text(d => {
            const stateName = fipsToName.get(d.id);
            const avg = rightStateAvg.get(stateName);
            const metricLabel = getComparisonMetricInfo(currentComparisonMetric).label;
            return stateName && avg 
                ? `${stateName}\n${metricLabel}: ${avg.toFixed(2)}%\nClick to zoom in` 
                : stateName || "No data";
        });
    
    // Create legends
    updateLegends();
}

// ============================================
// BAR CHARTS FOR NATIONAL VIEW
// ============================================

function calculateBarChartsData(csvData) {
    // Calculate state-level data
    const stateAverages = d3.rollup(
        csvData,
        v => ({
            foodInsecurity: d3.mean(v, d => +d['FOODINSECU_CrudePrev']),
            depression: d3.mean(v, d => +d['DEPRESSION_CrudePrev']),
            diabetes: d3.mean(v, d => +d['DIABETES_CrudePrev']),
            bphigh: d3.mean(v, d => +d['BPHIGH_CrudePrev'])
        }),
        d => d['StateDesc']
    );

    // Create separate top 10 arrays for each metric
    const allStates = Array.from(stateAverages, ([state, values]) => ({
        name: state,
        foodInsecurity: values.foodInsecurity,
        depression: values.depression,
        diabetes: values.diabetes,
        bphigh: values.bphigh
    }));

    // Top 10 by Food Insecurity
    const top10FoodInsecurity = [...allStates]
        .sort((a, b) => b.foodInsecurity - a.foodInsecurity)
        .slice(0, 10);

    // Top 10 by Depression
    const top10Depression = [...allStates]
        .sort((a, b) => b.depression - a.depression)
        .slice(0, 10);

    // Top 10 by Diabetes
    const top10Diabetes = [...allStates]
        .sort((a, b) => b.diabetes - a.diabetes)
        .slice(0, 10);

    // Top 10 by High Blood Pressure
    const top10BP = [...allStates]
        .sort((a, b) => b.bphigh - a.bphigh)
        .slice(0, 10);

    // Calculate regional data
    const regionAverages = d3.rollup(
        csvData,
        v => ({
            foodInsecurity: d3.mean(v, d => +d['FOODINSECU_CrudePrev']),
            depression: d3.mean(v, d => +d['DEPRESSION_CrudePrev']),
            diabetes: d3.mean(v, d => +d['DIABETES_CrudePrev']),
            bphigh: d3.mean(v, d => +d['BPHIGH_CrudePrev'])
        }),
        d => stateToRegion[d['StateDesc']] || 'Unknown'
    );

    const allRegions = Array.from(regionAverages, ([region, values]) => ({
        name: region,
        foodInsecurity: values.foodInsecurity,
        depression: values.depression,
        diabetes: values.diabetes,
        bphigh: values.bphigh
    }));

    // Separate regional arrays sorted by each metric
    const regionalDataByFoodInsecurity = [...allRegions]
        .sort((a, b) => b.foodInsecurity - a.foodInsecurity);

    const regionalDataByDepression = [...allRegions]
        .sort((a, b) => b.depression - a.depression);

    const regionalDataByDiabetes = [...allRegions]
        .sort((a, b) => b.diabetes - a.diabetes);

    const regionalDataByBP = [...allRegions]
        .sort((a, b) => b.bphigh - a.bphigh);

    barChartsData.stateLevel = top10FoodInsecurity;
    barChartsData.stateLevelByMetric = {
        'FOODINSECU_CrudePrev': top10FoodInsecurity,
        'DEPRESSION_CrudePrev': top10Depression,
        'DIABETES_CrudePrev': top10Diabetes,
        'BPHIGH_CrudePrev': top10BP
    };
    barChartsData.regionalLevel = regionalDataByFoodInsecurity;
    barChartsData.regionalLevelByMetric = {
        'FOODINSECU_CrudePrev': regionalDataByFoodInsecurity,
        'DEPRESSION_CrudePrev': regionalDataByDepression,
        'DIABETES_CrudePrev': regionalDataByDiabetes,
        'BPHIGH_CrudePrev': regionalDataByBP
    };
}

function createBarChart(containerId, data, metric, title, colorScheme) {
    const container = d3.select(containerId);
    container.html('');

    const margin = { top: 30, right: 15, left: 50, bottom: 50 };
    const width = 280 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 280 ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, width])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[metric])])
        .range([height, 0]);

    const color = d3.scaleSequential()
        .domain([0, d3.max(data, d => d[metric])])
        .interpolator(colorScheme);

    // Bars
    g.selectAll('.bar')
        .data(data)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.name))
        .attr('y', d => y(d[metric]))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d[metric]))
        .attr('fill', d => color(d[metric]))
        .attr('rx', 3);

    // X-axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('font-size', '9px')
        .style('text-anchor', 'end');

    // Y-axis
    g.append('g')
        .call(d3.axisLeft(y).ticks(4))
        .selectAll('text')
        .style('font-size', '9px');

    // Title
    svg.append('text')
        .attr('x', 140)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(title);

    // Y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 5)
        .attr('x', -(height + margin.top) / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '8px')
        .style('fill', '#666')
        .text('Rate (%)');
}

function showBarCharts() {
    d3.select('#national-view-container').classed('hidden', false);
    d3.select('#state-view-container').classed('hidden', true);
    d3.select('#reset-button').classed('visible', false);

    // Food Insecurity always uses its own top 10
    let foodInsecurityData;
    if (barChartsData.currentView === 'state') {
        foodInsecurityData = barChartsData.stateLevelByMetric['FOODINSECU_CrudePrev'];
    } else {
        foodInsecurityData = barChartsData.regionalLevelByMetric['FOODINSECU_CrudePrev'];
    }

    // Get the appropriate top 10 array for the health metric
    let healthMetricData;
    if (barChartsData.currentView === 'state') {
        healthMetricData = barChartsData.stateLevelByMetric[barChartsData.currentMetric] || barChartsData.stateLevel;
    } else {
        healthMetricData = barChartsData.regionalLevelByMetric[barChartsData.currentMetric] || barChartsData.regionalLevel;
    }

    // Determine which metric to display based on currentMetric
    let secondMetric, secondLabel, secondColorScheme;
    
    if (barChartsData.currentMetric === 'DEPRESSION_CrudePrev') {
        secondMetric = 'depression';
        secondLabel = 'Depression Rate';
        secondColorScheme = d3.interpolatePurples;
    } else if (barChartsData.currentMetric === 'DIABETES_CrudePrev') {
        secondMetric = 'diabetes';
        secondLabel = 'Diabetes Rate';
        secondColorScheme = d3.interpolateGreens;
    } else if (barChartsData.currentMetric === 'BPHIGH_CrudePrev') {
        secondMetric = 'bphigh';
        secondLabel = 'High Blood Pressure Rate';
        secondColorScheme = d3.interpolateReds;
    }

    createBarChart('#bar-chart-1', foodInsecurityData, 'foodInsecurity', 'Food Insecurity Rate', d3.interpolateBlues);
    createBarChart('#bar-chart-2', healthMetricData, secondMetric, secondLabel, secondColorScheme);
}

function hideBarCharts() {
    d3.select('#national-view-container').classed('hidden', true);
    d3.select('#state-view-container').classed('hidden', false);
    d3.select('#reset-button').classed('visible', true);
}

function setupBarChartToggles() {
    d3.select('#state-level-toggle').on('click', function() {
        barChartsData.currentView = 'state';
        d3.selectAll('.chart-toggle-btn').classed('active', false);
        d3.select(this).classed('active', true);
        showBarCharts();
    });

    d3.select('#regional-toggle').on('click', function() {
        barChartsData.currentView = 'regional';
        d3.selectAll('.chart-toggle-btn').classed('active', false);
        d3.select(this).classed('active', true);
        showBarCharts();
    });
}

// ============================================
// LOAD DATA AND INITIALIZE
// ============================================

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.csv(CSV_FILE)
]).then(([statesTopology, countiesTopology, csvData]) => {
    
    console.log("Data loaded successfully");

    globalData.csvData = csvData;
    globalData.stateFeatures = topojson.feature(statesTopology, statesTopology.objects.states);
    globalData.countyFeatures = topojson.feature(countiesTopology, countiesTopology.objects.counties);
    globalData.dataByState = d3.group(csvData, d => d[STATE_COLUMN]);
    
    // Calculate bar charts data
    calculateBarChartsData(csvData);
    
    // Draw initial state views
    drawStatesOnBothMaps();
    
    // Show default instruction in info panel and bar charts
    showDefaultInstruction();
    showBarCharts();
    
    // Setup event listeners
    d3.select("#comparison-metric-select").on("change", function() {
        onComparisonMetricChange(this.value);
    });

    d3.select("#reset-button").on("click", resetBothMaps);
    
    // Setup bar chart toggles
    setupBarChartToggles();
    
}).catch(error => {
    console.error("Error loading data:", error);
    d3.select("#map-left").append("p")
        .style("color", "red")
        .text("Error loading data. Check console for details.");
});