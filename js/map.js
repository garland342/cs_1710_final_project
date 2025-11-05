// ============================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================

const CSV_FILE = "health_data_v2.csv";
const VARIABLE_NAME = "FOODINSECU_CrudePrev";
const STATE_COLUMN = "StateDesc";
const COUNTY_COLUMN = "CountyName";
const MAP_TITLE = "US State Map: Average by State";
const COLOR_SCHEME = d3.interpolateBlues;

const ADDITIONAL_VARIABLES = [
    { column: "MHLTH_CrudePrev", label: "Mental Health Crude Prevalence", format: ",.0f", aggregate: "mean" },
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

// ============================================
// ZOOM FUNCTIONS
// ============================================

function zoomToState(stateFeature, stateName, stateData, countyFeatures, colorScale) {
    isZoomed = true;
    currentState = stateName;
    
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
            const matchingData = stateData.find(cd => {
                const dataCountyName = (cd[COUNTY_COLUMN] || "").toLowerCase().replace(/\s+county\s*$/i, '').trim();
                return countyDataMap.has(dataCountyName);
            });
            
            if (matchingData) {
                const value = +matchingData[VARIABLE_NAME];
                return isNaN(value) ? "#e0e0e0" : colorScale(value);
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
            
            const countyName = getCountyNameFromFips(d.id, stateData);
            if (countyName) {
                d3.select(this).raise();
            }
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5);
        })
        .append("title")
        .text(d => {
            const countyName = getCountyNameFromFips(d.id, stateData);
            return countyName || "County data not available";
        });
    
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
}

function getCountyNameFromFips(fips, stateData) {
    const matchingData = stateData.find(cd => {
        return cd.fips === fips;
    });
    
    if (matchingData) {
        return `${matchingData[COUNTY_COLUMN]}\n${VARIABLE_NAME}: ${formatValue(+matchingData[VARIABLE_NAME], ".2f")}`;
    }
    
    return `County ID: ${fips}\nClick state to see all counties`;
}

function resetZoom(stateFeatures, stateAverages, colorScale) {
    isZoomed = false;
    currentState = null;
    
    d3.select("#reset-button").classed("visible", false);
    d3.select("#info-panel").classed("hidden", true);
    
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
    
    const primarySection = content.append("div").attr("class", "info-section");
    primarySection.append("h3").text("Primary Metric");
    
    const mainValue = stateAverages.get(stateName);
    const primaryGrid = primarySection.append("div").attr("class", "stat-grid");
    
    const mainCard = primaryGrid.append("div").attr("class", "stat-card");
    mainCard.append("div").attr("class", "stat-label").text(VARIABLE_NAME + " (Avg)");
    mainCard.append("div").attr("class", "stat-value").text(formatValue(mainValue, ".2f"));
    
    const values = stateData.map(d => +d[VARIABLE_NAME]).filter(v => !isNaN(v));
    
    const minCard = primaryGrid.append("div").attr("class", "stat-card").style("border-left-color", "#e74c3c");
    minCard.append("div").attr("class", "stat-label").text("Minimum");
    minCard.append("div").attr("class", "stat-value").text(formatValue(d3.min(values), ".2f"));
    
    const maxCard = primaryGrid.append("div").attr("class", "stat-card").style("border-left-color", "#27ae60");
    maxCard.append("div").attr("class", "stat-label").text("Maximum");
    maxCard.append("div").attr("class", "stat-value").text(formatValue(d3.max(values), ".2f"));
    
    const medianCard = primaryGrid.append("div").attr("class", "stat-card").style("border-left-color", "#f39c12");
    medianCard.append("div").attr("class", "stat-label").text("Median");
    medianCard.append("div").attr("class", "stat-value").text(formatValue(d3.median(values), ".2f"));
    
    if (ADDITIONAL_VARIABLES.length > 0) {
        const statsSection = content.append("div").attr("class", "info-section");
        statsSection.append("h3").text("Additional Statistics");
        
        ADDITIONAL_VARIABLES.forEach(variable => {
            const value = calculateStatistic(stateData, variable.column, variable.aggregate);
            const row = statsSection.append("div").attr("class", "stat-row");
            row.append("div").attr("class", "label").text(variable.label);
            row.append("div").attr("class", "value").text(formatValue(value, variable.format));
        });
    }
    
    const countySection = content.append("div").attr("class", "info-section");
    countySection.append("h3").text("Counties Ranked");
    
    const countyList = countySection.append("div").attr("class", "county-list");
    
    const sortedCounties = stateData
        .map(d => ({...d, numValue: +d[VARIABLE_NAME]}))
        .filter(d => !isNaN(d.numValue))
        .sort((a, b) => b.numValue - a.numValue);
    
    sortedCounties.forEach((county, index) => {
        const countyItem = countyList.append("div").attr("class", "county-item");
        
        const nameDiv = countyItem.append("div");
        nameDiv.append("span")
            .attr("class", "county-name")
            .text(county[COUNTY_COLUMN] || "Unknown County");
        
        if (index < 3) {
            nameDiv.append("span")
                .attr("class", "rank-badge")
                .text(`#${index + 1}`);
        }
        
        countyItem.append("div")
            .attr("class", "county-value")
            .text(formatValue(county.numValue, ".2f"));
    });
}

// ============================================
// LEGEND FUNCTION
// ============================================

function createLegend(colorScale, values) {
    const legendContainer = d3.select("#legend");
    legendContainer.html("");
    
    legendContainer.append("h4").text("Color Scale");
    
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
            return avg ? `${stateName}\nAverage: ${avg.toFixed(2)}\nClick to zoom in` : stateName || "No data";
        });
    
    createLegend(colorScale, values);
    
    d3.select("#reset-button").on("click", function() {
        resetZoom(stateFeatures, stateAverages, colorScale);
    });
    
}).catch(error => {
    console.error("Error loading data:", error);
    d3.select("#map").append("p")
        .style("color", "red")
        .text("Error loading data. Check console for details.");
});

