// ============================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================

const CSV_FILE = "data/agg_health.csv";
const VARIABLE_NAME = "FOODINSECU_CrudePrev";
const STATE_COLUMN = "StateDesc";
const COUNTY_COLUMN = "CountyName";
const MAP_TITLE = "US State Map: Average by State";
const COLOR_SCHEME = d3.interpolateBlues;

// Metrics available for county-level view
const COUNTY_METRICS = [
    { value: "FOODINSECU_CrudePrev", label: "Unadjusted Rate of Food Insecurity (%)", format: ".2f", colorScheme: d3.interpolateBlues},
    { value: "DIABETES_CrudePrev", label: "Unadjusted Rate of Diabetes (%)", format: ".2f", colorScheme: d3.interpolateReds },
    { value: "DEPRESSION_CrudePrev", label: "Unadjusted Rate of Depression (%)", format: ".2f", colorScheme: d3.interpolatePurples },
    { value: "BPHIGH_CrudePrev", label: "Unadjusted Rate of High Blood Pressure (%)", format: ".2f", colorScheme: d3.interpolateGreens }
];

const ADDITIONAL_VARIABLES = [
    { column: "BPHIGH_CrudePrev", label: "High Blood Pressure Crude Prevalence", format: ",.0f", aggregate: "mean" },
    { column: "DIABETES_CrudePrev", label: "Diabetes Crude Prevalence", format: ".0f", aggregate: "mean" },
    { column: "DEPRESSION_CrudePrev", label: "Depression Crude Prevalence", format: ".2f", aggregate: "mean" },
];

// ============================================
// MAP SETUP
// ============================================

const width = 960;
const height = 600;

const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const g = svg.append("g");

const projection = d3.geoAlbersUsa()
    .scale(1300)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const countyGroup = g.append("g").attr("class", "counties");
const stateGroup = g.append("g").attr("class", "states");

d3.select("#title").text(MAP_TITLE);

let currentState = null;
let isZoomed = false;
let currentMetric = COUNTY_METRICS[0].value; // Default to Diabetes
let currentStateData = null;
let currentCountyFeatures = null;
let currentStateFeature = null;

// ============================================
// FIPS TO STATE NAME MAPPING
// ============================================

const fipsToName = new Map([
    ["01", "Alabama"], ["02", "Alaska"], ["04", "Arizona"], 
    ["05", "Arkansas"], ["06", "California"], ["08", "Colorado"],
    ["09", "Connecticut"], ["10", "Delaware"], ["11", "District of Columbia"],
    ["12", "Florida"], ["13", "Georgia"], ["15", "Hawaii"],
    ["16", "Idaho"], ["17", "Illinois"], ["18", "Indiana"],
    ["19", "Iowa"], ["20", "Kansas"], ["21", "Kentucky"],
    ["22", "Louisiana"], ["23", "Maine"], ["24", "Maryland"],
    ["25", "Massachusetts"], ["26", "Michigan"], ["27", "Minnesota"],
    ["28", "Mississippi"], ["29", "Missouri"], ["30", "Montana"],
    ["31", "Nebraska"], ["32", "Nevada"], ["33", "New Hampshire"],
    ["34", "New Jersey"], ["35", "New Mexico"], ["36", "New York"],
    ["37", "North Carolina"], ["38", "North Dakota"], ["39", "Ohio"],
    ["40", "Oklahoma"], ["41", "Oregon"], ["42", "Pennsylvania"],
    ["44", "Rhode Island"], ["45", "South Carolina"], ["46", "South Dakota"],
    ["47", "Tennessee"], ["48", "Texas"], ["49", "Utah"],
    ["50", "Vermont"], ["51", "Virginia"], ["53", "Washington"],
    ["54", "West Virginia"], ["55", "Wisconsin"], ["56", "Wyoming"]
]);

const nameToFips = new Map(
    Array.from(fipsToName, ([fips, name]) => [name, fips])
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatValue(value, formatString) {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return d3.format(formatString)(value);
}

function calculateStatistic(data, column, aggregateType) {
    const values = data.map(d => +d[column]).filter(v => !isNaN(v));
    if (values.length === 0) return null;
    
    switch(aggregateType) {
        case "sum":
            return d3.sum(values);
        case "mean":
            return d3.mean(values);
        case "median":
            return d3.median(values);
        case "min":
            return d3.min(values);
        case "max":
            return d3.max(values);
        default:
            return d3.mean(values);
    }
}

function getMetricLabel(metricValue) {
    const metric = COUNTY_METRICS.find(m => m.value === metricValue);
    return metric ? metric.label : metricValue;
}

function getMetricFormat(metricValue) {
    const metric = COUNTY_METRICS.find(m => m.value === metricValue);
    return metric ? metric.format : ".2f";
}

function getMetricColorScheme(metricValue) {
    const metric = COUNTY_METRICS.find(m => m.value === metricValue);
    return metric ? metric.colorScheme : d3.interpolateBlues;
}

// ============================================
// METRIC CHANGE HANDLER
// ============================================

function onMetricChange(newMetric) {
    currentMetric = newMetric;
    
    if (isZoomed && currentStateData && currentCountyFeatures && currentStateFeature) {
        // Update county colors and legend
        updateCountyColors(currentStateData, currentCountyFeatures);
        updateLegendForMetric(currentMetric, currentStateData);
        
        // Update distribution chart
        const chartContainer = d3.select("#county-distribution-chart");
        if (!chartContainer.empty()) {
            createCountyDistributionChart(chartContainer, currentStateData, currentMetric);
        }
        
        // Update primary statistics
        updatePrimaryStatistics(currentStateData, currentMetric);
    }
}

function updatePrimaryStatistics(stateData, metric) {
    const values = stateData.map(d => +d[metric]).filter(v => !isNaN(v));
    const formatStr = getMetricFormat(metric);
    
    d3.select(".stat-grid .stat-card:nth-child(1) .stat-value")
        .text(formatValue(d3.mean(values), formatStr));
    d3.select(".stat-grid .stat-card:nth-child(2) .stat-value")
        .text(formatValue(d3.min(values), formatStr));
    d3.select(".stat-grid .stat-card:nth-child(3) .stat-value")
        .text(formatValue(d3.max(values), formatStr));
    d3.select(".stat-grid .stat-card:nth-child(4) .stat-value")
        .text(formatValue(d3.median(values), formatStr));
}

function updateCountyColors(stateData, countyFeatures) {
    // Calculate color scale for current metric using metric-specific color scheme
    const values = stateData.map(d => +d[currentMetric]).filter(v => !isNaN(v));
    const colorScale = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(getMetricColorScheme(currentMetric));
    
    const stateFips = nameToFips.get(currentState);
    const stateCounties = countyFeatures.features.filter(d => {
        return d.id.substring(0, 2) === stateFips;
    });
    
    const countyDataMap = new Map();
    stateData.forEach(d => {
        const normalizedName = (d[COUNTY_COLUMN] || "").toLowerCase().replace(/\s+county\s*$/i, '').trim();
        countyDataMap.set(normalizedName, d);
    });
    
    // Update existing county paths
    countyGroup.selectAll("path.county")
        .transition()
        .duration(500)
        .attr("fill", d => {
            const countyTopoName = d.properties && d.properties.name ? d.properties.name.toLowerCase() : '';
            let matchingData = null;
            
            for (let [normalizedName, data] of countyDataMap) {
                if (countyTopoName.includes(normalizedName) || normalizedName.includes(countyTopoName)) {
                    matchingData = data;
                    break;
                }
            }
            
            if (!matchingData) {
                matchingData = stateData.find(cd => {
                    const dataCountyName = (cd[COUNTY_COLUMN] || "").toLowerCase().replace(/\s+county\s*$/i, '').trim();
                    return countyTopoName.includes(dataCountyName) || dataCountyName.includes(countyTopoName);
                });
            }
            
            if (matchingData) {
                const value = +matchingData[currentMetric];
                return isNaN(value) ? "#e0e0e0" : colorScale(value);
            }
            return "#e0e0e0";
        });
    
    // Update tooltips
    countyGroup.selectAll("path.county")
        .select("title")
        .text(d => {
            return getCountyTooltipText(d, stateData);
        });
}

function updateLegendForMetric(metric, stateData) {
    const values = stateData.map(d => +d[metric]).filter(v => !isNaN(v));
    const colorScale = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(getMetricColorScheme(metric));
    
    createLegend(colorScale, values, getMetricLabel(metric));
}

// ============================================
// ZOOM FUNCTIONS
// ============================================

function zoomToState(stateFeature, stateName, stateData, countyFeatures, colorScale) {
    isZoomed = true;
    currentState = stateName;
    currentStateData = stateData;
    currentCountyFeatures = countyFeatures;
    currentStateFeature = stateFeature;
    
    // Keep regional graph panel visible, show info panel
    d3.select("#info-panel").classed("hidden", false);
    
    d3.select("#reset-button").classed("visible", true);
    
    const bounds = path.bounds(stateFeature);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    
    const centerX = (bounds[0][0] + bounds[1][0]) / 2;
    const centerY = (bounds[0][1] + bounds[1][1]) / 2;
    
    const scale = 0.85 / Math.max(dx / width, dy / height);
    
    const translateX = width / 2 - scale * centerX;
    const translateY = height / 2 - scale * centerY;
    
    console.log(`Zooming to ${stateName}:`, {
        bounds,
        center: [centerX, centerY],
        scale,
        translate: [translateX, translateY]
    });
    
    stateGroup.transition()
        .duration(750)
        .style("opacity", 0)
        .on("end", function() {
            stateGroup.style("display", "none");
        });
    
    const stateFips = nameToFips.get(stateName);
    
    const stateCounties = countyFeatures.features.filter(d => {
        return d.id.substring(0, 2) === stateFips;
    });
    
    // Use current metric for initial coloring with metric-specific color scheme
    const values = stateData.map(d => +d[currentMetric]).filter(v => !isNaN(v));
    const countyColorScale = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(getMetricColorScheme(currentMetric));
    
    const countyDataMap = new Map();
    stateData.forEach(d => {
        const normalizedName = (d[COUNTY_COLUMN] || "").toLowerCase().replace(/\s+county\s*$/i, '').trim();
        countyDataMap.set(normalizedName, d);
    });
    
    countyGroup.selectAll("path.county")
        .data(stateCounties)
        .join("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", d => {
            const countyTopoName = d.properties && d.properties.name ? d.properties.name.toLowerCase() : '';
            let matchingData = null;
            
            for (let [normalizedName, data] of countyDataMap) {
                if (countyTopoName.includes(normalizedName) || normalizedName.includes(countyTopoName)) {
                    matchingData = data;
                    break;
                }
            }
            
            if (!matchingData) {
                matchingData = stateData.find(cd => {
                    const dataCountyName = (cd[COUNTY_COLUMN] || "").toLowerCase().replace(/\s+county\s*$/i, '').trim();
                    return countyTopoName.includes(dataCountyName) || dataCountyName.includes(countyTopoName);
                });
            }
            
            if (matchingData) {
                const value = +matchingData[currentMetric];
                return isNaN(value) ? "#e0e0e0" : countyColorScale(value);
            }
            return "#e0e0e0";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("stroke", "#667eea")
                .attr("stroke-width", 2);
            d3.select(this).raise();
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5);
        })
        .append("title")
        .text(d => getCountyTooltipText(d, stateData));
    
    countyGroup.append("path")
        .datum(stateFeature)
        .attr("class", "state-boundary")
        .attr("d", path)
        .style("opacity", 0);
    
    g.transition()
        .duration(750)
        .attr("transform", `translate(${translateX},${translateY}) scale(${scale})`)
        .on("end", function() {
            countyGroup.selectAll("path").transition().duration(300).style("opacity", 1);
        });
    
    // Update legend for current metric
    updateLegendForMetric(currentMetric, stateData);
}

function getCountyTooltipText(countyFeature, stateData) {
    const countyTopoName = countyFeature.properties && countyFeature.properties.name ? 
        countyFeature.properties.name.toLowerCase() : '';
    
    let matchingData = null;
    
    // Try to find matching county data
    for (let cd of stateData) {
        const dataCountyName = (cd[COUNTY_COLUMN] || "").toLowerCase().replace(/\s+county\s*$/i, '').trim();
        if (countyTopoName.includes(dataCountyName) || dataCountyName.includes(countyTopoName)) {
            matchingData = cd;
            break;
        }
    }
    
    if (matchingData) {
        const value = +matchingData[currentMetric];
        const metricLabel = getMetricLabel(currentMetric);
        const formatStr = getMetricFormat(currentMetric);
        return `${matchingData[COUNTY_COLUMN]}\n${metricLabel}: ${formatValue(value, formatStr)}`;
    }
    
    return `County ID: ${countyFeature.id}\nData not available`;
}

function getCountyNameFromFips(fips, stateData) {
    const matchingData = stateData.find(cd => {
        return cd.fips === fips;
    });
    
    if (matchingData) {
        const value = +matchingData[currentMetric];
        const metricLabel = getMetricLabel(currentMetric);
        const formatStr = getMetricFormat(currentMetric);
        return `${matchingData[COUNTY_COLUMN]}\n${metricLabel}: ${formatValue(value, formatStr)}`;
    }
    
    return `County ID: ${fips}\nClick state to see all counties`;
}

function resetZoom(stateFeatures, stateAverages, colorScale) {
    isZoomed = false;
    currentState = null;
    currentStateData = null;
    currentCountyFeatures = null;
    currentStateFeature = null;
    
    d3.select("#reset-button").classed("visible", false);
    d3.select("#info-panel").classed("hidden", true);
    
    // Regional graph panel stays visible
    
    countyGroup.selectAll("*").transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", function() {
            countyGroup.selectAll("*").remove();
        });
    
    g.transition()
        .duration(750)
        .attr("transform", "translate(0,0) scale(1)");
    
    stateGroup.style("display", "block")
        .transition()
        .duration(750)
        .style("opacity", 1);
    
    // Reset legend to food insecurity
    const values = Array.from(stateAverages.values());
    createLegend(colorScale, values, "Unadjusted Rate of Food Insecurity (%)");
}

// ============================================
// INFO PANEL FUNCTIONS
// ============================================

function showStateInfo(stateName, stateData, stateAverages) {
    const panel = d3.select("#info-panel");
    panel.classed("hidden", false);
    
    panel.html("");
    
    const header = panel.append("div").attr("class", "panel-header");
    header.append("h2").text(stateName);
    header.append("div")
        .attr("class", "subtitle")
        .text(`${stateData.length} ${stateData.length === 1 ? 'County' : 'Counties'}`);
    
    const content = panel.append("div").attr("class", "panel-content");
    
    // Add metric selector dropdown
    const selectorDiv = content.append("div").attr("class", "metric-selector");
    selectorDiv.append("label")
        .attr("for", "metric-select")
        .text("Select Health Metric:");
    
    const select = selectorDiv.append("select")
        .attr("id", "metric-select")
        .on("change", function() {
            const selectedMetric = this.value;
            onMetricChange(selectedMetric);
        });
    
    select.selectAll("option")
        .data(COUNTY_METRICS)
        .join("option")
        .attr("value", d => d.value)
        .property("selected", d => d.value === currentMetric)
        .text(d => d.label);
    
    // Primary section for current metric
    const primarySection = content.append("div").attr("class", "info-section");
    primarySection.append("h3").text("Selected Metric Statistics");
    
    const values = stateData.map(d => +d[currentMetric]).filter(v => !isNaN(v));
    const primaryGrid = primarySection.append("div").attr("class", "stat-grid");
    
    const avgCard = primaryGrid.append("div").attr("class", "stat-card");
    avgCard.append("div").attr("class", "stat-label").text("Average");
    avgCard.append("div").attr("class", "stat-value").text(formatValue(d3.mean(values), getMetricFormat(currentMetric)));
    
    const minCard = primaryGrid.append("div").attr("class", "stat-card").style("border-left-color", "#e74c3c");
    minCard.append("div").attr("class", "stat-label").text("Minimum");
    minCard.append("div").attr("class", "stat-value").text(formatValue(d3.min(values), getMetricFormat(currentMetric)));
    
    const maxCard = primaryGrid.append("div").attr("class", "stat-card").style("border-left-color", "#27ae60");
    maxCard.append("div").attr("class", "stat-label").text("Maximum");
    maxCard.append("div").attr("class", "stat-value").text(formatValue(d3.max(values), getMetricFormat(currentMetric)));
    
    const medianCard = primaryGrid.append("div").attr("class", "stat-card").style("border-left-color", "#f39c12");
    medianCard.append("div").attr("class", "stat-label").text("Median");
    medianCard.append("div").attr("class", "stat-value").text(formatValue(d3.median(values), getMetricFormat(currentMetric)));
    
    // County distribution chart for current metric
    const countySection = content.append("div").attr("class", "info-section");
    countySection.append("h3").text("County Distribution");
    
    const chartContainer = countySection.append("div").attr("id", "county-distribution-chart");
    
    // Create distribution chart
    createCountyDistributionChart(chartContainer, stateData, currentMetric);
}

// Function to create county distribution chart
function createCountyDistributionChart(container, stateData, metric) {
    container.html(""); // Clear previous chart
    
    const formatStr = getMetricFormat(metric);
    const metricLabel = getMetricLabel(metric);
    
    // Get values for the metric
    const values = stateData.map(d => +d[metric]).filter(v => !isNaN(v));
    
    if (values.length === 0) {
        container.append("p").text("No data available for this metric.");
        return;
    }
    
    // Create histogram bins
    const numBins = Math.min(10, Math.ceil(values.length / 3));
    const histogram = d3.bin()
        .domain(d3.extent(values))
        .thresholds(numBins);
    
    const bins = histogram(values);
    
    // Set dimensions
    const margin = { top: 10, right: 20, bottom: 60, left: 60 };
    const width = 350 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleLinear()
        .domain([d3.min(values), d3.max(values)])
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0]);
    
    // Get color scheme for current metric
    const colorInterpolator = getMetricColorScheme(metric);
    const colorScale = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(colorInterpolator);
    
    // Add bars
    const bars = svg.selectAll(".dist-bar")
        .data(bins)
        .join("rect")
        .attr("class", "dist-bar")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => height - y(d.length))
        .attr("fill", d => colorScale((d.x0 + d.x1) / 2))
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease");
    
    // Add tooltip for bars
    const tooltip = svg.append("text")
        .attr("class", "dist-tooltip")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .style("pointer-events", "none");
    
    bars
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.7);
            tooltip
                .attr("x", (x(d.x0) + x(d.x1)) / 2)
                .attr("y", y(d.length) - 5)
                .text(`${d.length} counties`)
                .style("opacity", 1)
                .raise();
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            tooltip.style("opacity", 0);
        });
    
    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(formatStr)))
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#2c3e50");
    
    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .text(metricLabel);
    
    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#2c3e50");
    
    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -height / 2)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .text("Number of Counties");
}

// ============================================
// LEGEND FUNCTION
// ============================================

function createLegend(colorScale, values, title = "Unadjusted Rate of Food Insecurity (%)") {
    const legendContainer = d3.select("#legend");
    legendContainer.html("");
    
    legendContainer.append("h4").text(title);
    
    const legendSvg = legendContainer.append("svg")
        .attr("width", 300)
        .attr("height", 50);
    
    const legendScale = d3.scaleLinear()
        .domain(d3.extent(values))
        .range([0, 250]);
    
    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f"));
    
    const defs = legendSvg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");
    
    gradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.01))
        .join("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => colorScale(legendScale.invert(d * 250)));
    
    legendSvg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 250)
        .attr("height", 20)
        .style("fill", "url(#legend-gradient)")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);
    
    legendSvg.append("g")
        .attr("transform", "translate(0, 20)")
        .call(legendAxis);
}

// ============================================
// LOAD AND PROCESS DATA
// ============================================

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.csv(CSV_FILE)
]).then(([statesTopology, countiesTopology, csvData]) => {
    
    console.log("Sample data rows:", csvData.slice(0, 5));
    
    const dataByState = d3.group(csvData, d => d[STATE_COLUMN]);
    
    const stateAverages = d3.rollup(
        csvData,
        v => d3.mean(v, d => +d[VARIABLE_NAME]),
        d => d[STATE_COLUMN]
    );
    
    console.log("State averages:", Array.from(stateAverages));
    
    const values = Array.from(stateAverages.values());
    const colorScale = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(COLOR_SCHEME);
    
    const stateFeatures = topojson.feature(statesTopology, statesTopology.objects.states);
    const countyFeatures = topojson.feature(countiesTopology, countiesTopology.objects.counties);
    
    stateGroup.selectAll("path")
        .data(stateFeatures.features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", d => {
            const stateName = fipsToName.get(d.id);
            const avg = stateAverages.get(stateName);
            return avg ? colorScale(avg) : "#e0e0e0";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("mouseover", function(event, d) {
            if (!isZoomed) {
                d3.select(this)
                    .attr("stroke", "#667eea")
                    .attr("stroke-width", 2.5);
            }
        })
        .on("mouseout", function(event, d) {
            if (!isZoomed) {
                d3.select(this)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5);
            }
        })
        .on("click", function(event, d) {
            const stateName = fipsToName.get(d.id);
            const stateData = dataByState.get(stateName) || [];
            
            if (stateData.length > 0) {
                zoomToState(d, stateName, stateData, countyFeatures, colorScale);
                showStateInfo(stateName, stateData, stateAverages);
            }
        })
        .append("title")
        .text(d => {
            const stateName = fipsToName.get(d.id);
            const avg = stateAverages.get(stateName);
            return stateName && avg 
                ? `${stateName}\nFood Insecurity: ${avg.toFixed(2)}%\nClick to zoom in` 
                : stateName || "No data";
        });
    
    createLegend(colorScale, values, "Unadjusted Rate of Food Insecurity (%)");
    
    d3.select("#reset-button").on("click", function() {
        resetZoom(stateFeatures, stateAverages, colorScale);
    });
    
}).catch(error => {
    console.error("Error loading data:", error);
    d3.select("#map").append("p")
        .style("color", "red")
        .text("Error loading data. Check console for details.");
});
