document.addEventListener("DOMContentLoaded", () => {
  if (typeof d3 !== 'undefined') {
    console.log("Page ready. D3 version:", d3.version);

    // ----------------------------------------------------
    // BAR CHARTS FOR FOOD DESERT AND DEPRESSION DATA
    // ----------------------------------------------------

    // Real data for food desert tracts
    const foodDesertTractsData = [
      { state: "Texas", tracts: 1022 },
      { state: "Florida", tracts: 550 },
      { state: "California", tracts: 536 },
      { state: "Georgia", tracts: 441 },
      { state: "Ohio", tracts: 421 },
      { state: "North Carolina", tracts: 353 },
      { state: "Michigan", tracts: 339 },
      { state: "Illinois", tracts: 319 },
      { state: "Indiana", tracts: 291 },
      { state: "Virginia", tracts: 269 }
    ];

    // Sample data for depression bar charts
    const depressionStatesData = [
      { state: "Vermont", value: 25.8 },
      { state: "Washington", value: 26.1 },
      { state: "Oregon", value: 26.2 },
      { state: "Utah", value: 26.7 },
      { state: "Arkansas", value: 27.0 },
      { state: "Louisiana", value: 27.1 },
      { state: "Kentucky", value: 27.2 },
      { state: "Oklahoma", value: 27.7 },
      { state: "West Virginia", value: 28.3 },
      { state: "Tennessee", value: 29.6 }
    ];

    const depressionRegionData = [
      { region: "South", value: 22.94 },
      { region: "Midwest", value: 22.8 },
      { region: "West", value: 22.39 },
      { region: "Northeast", value: 20.92 }
    ];

    // Regional food desert data
    const foodDesertRegionData = [
      { region: "South", tracts: 7616 },
      { region: "Midwest", tracts: 4736 },
      { region: "West", tracts: 4064 },
      { region: "Northeast", tracts: 2310 }
    ];

    // Create food desert tracts bar chart in the top left section
    createFoodDesertBarChart(
      ".split-layout-top-section .left-section",
      foodDesertTractsData
    );

    // Create food desert regional chart in the top right section
    createFoodDesertRegionalChart(
      ".split-layout-top-section .right-section",
      foodDesertRegionData
    );

    // Create depression bar chart (States)
    createDepressionBarChart(
      "#depression-bar-chart-container",
      depressionStatesData,
      "state",
      "value",
      "Percentage (%)"
    );

    // Create depression bar chart (Regions)
    createDepressionBarChart(
      "#depression-map-container",
      depressionRegionData,
      "region",
      "value",
      "Percentage (%)"
    );

    function createFoodDesertBarChart(containerSelector, data) {
      const container = d3.select(containerSelector);
      
      // Add title text above the chart
      container.append("p")
        .attr("class", "chart-title")
        .style("font-size", "1.1rem")
        .style("font-weight", "bold")
        .style("margin-bottom", "5px")
        .style("text-align", "center")
        .text("Top 10 States with the Highest Number of Low-Income Low Access Tracts");
      
      // Set dimensions
      const margin = { top: 20, right: 20, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // Create SVG
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales
      const x = d3.scaleBand()
        .domain(data.map(d => d.state))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tracts) * 1.1])
        .range([height, 0]);

      // Add bars with purple gradient
      const bars = svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.tracts))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.tracts))
        .attr("fill", "#667eea")
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease");
      
      // Create tooltip text element for hover values - append after bars to bring to front
      const tooltip = svg.append("text")
        .attr("class", "bar-tooltip")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("z-index", 1000);
      
      // Add hover handlers to bars for tooltip
      bars
        .on("mouseover", function(event, d) {
          // Change bar to darker purple
          d3.select(this).attr("fill", "#764ba2");
          // Show tooltip
          tooltip
            .attr("x", x(d.state) + x.bandwidth() / 2)
            .attr("y", y(d.tracts) - 5)
            .text(`(${d.tracts.toLocaleString()})`)
            .style("opacity", 1)
            .raise(); // Bring to front
        })
        .on("mouseout", function() {
          // Change bar back to original purple
          d3.select(this).attr("fill", "#667eea");
          // Hide tooltip
          tooltip.style("opacity", 0);
        });

      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#2c3e50");

      // Add x-axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("State");

      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#2c3e50");

      // Add y-axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65)
        .attr("x", -height / 2)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Low Income Low Access Tracts");
    }

    function createFoodDesertRegionalChart(containerSelector, data) {
      const container = d3.select(containerSelector);
      
      // Add title text above the chart
      container.append("p")
        .attr("class", "chart-title")
        .style("font-size", "1.1rem")
        .style("font-weight", "bold")
        .style("margin-bottom", "15px")
        .style("text-align", "center")
        .text("Regional Distribution of Food Desert Tracts");
      
      // Set dimensions
      const margin = { top: 20, right: 20, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // Create SVG
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales
      const x = d3.scaleBand()
        .domain(data.map(d => d.region))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tracts) * 1.1])
        .range([height, 0]);

      // Add bars with purple gradient
      const bars = svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.region))
        .attr("y", d => y(d.tracts))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.tracts))
        .attr("fill", "#667eea")
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease");
      
      // Create tooltip text element for hover values - append after bars to bring to front
      const tooltip = svg.append("text")
        .attr("class", "bar-tooltip")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("z-index", 1000);
      
      // Add hover handlers to bars
      bars
        .on("mouseover", function(event, d) {
          // Change bar to darker purple
          d3.select(this).attr("fill", "#764ba2");
          // Show tooltip
          tooltip
            .attr("x", x(d.region) + x.bandwidth() / 2)
            .attr("y", y(d.tracts) - 5)
            .text(`(${d.tracts.toLocaleString()})`)
            .style("opacity", 1)
            .raise(); // Bring to front
        })
        .on("mouseout", function() {
          // Change bar back to original purple
          d3.select(this).attr("fill", "#667eea");
          // Hide tooltip
          tooltip.style("opacity", 0);
        });

      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#2c3e50");

      // Add x-axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Region");

      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#2c3e50");

      // Add y-axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65)
        .attr("x", -height / 2)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Food Desert Tracts");
    }

    function createDepressionBarChart(containerSelector, data, xKey, yKey, yLabel) {
      const container = d3.select(containerSelector);
      
      // Only add title for the states chart (left side)
      if (containerSelector === "#depression-bar-chart-container") {
        container.append("p")
          .attr("class", "chart-title")
          .style("font-size", "1.1rem")
          .style("font-weight", "bold")
          .style("margin-bottom", "5px")
          .style("text-align", "center")
          .text("Top 10 States with Highest Proportion of Depressed Individuals");
      }
      
      // Add title for the regional chart (right side) to match format
      if (containerSelector === "#depression-map-container") {
        // Remove the existing chart-subtitle from HTML and add it here with same styling
        container.select(".chart-subtitle").remove();
        container.append("p")
          .attr("class", "chart-title")
          .style("font-size", "1.1rem")
          .style("font-weight", "bold")
          .style("margin-bottom", "5px")
          .style("text-align", "center")
          .text("Regional Distribution of Depression Prevalence");
      }
      
      // Set dimensions with extra right margin for the label
      const margin = { top: 20, right: 120, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 350 - margin.top - margin.bottom;

      // Create SVG
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales
      const x = d3.scaleBand()
        .domain(data.map(d => d[xKey]))
        .range([0, width])
        .padding(0.2);

      // Adjust y-axis: start at 0 but use a tighter max to emphasize differences
      // For regional chart, use 25 as max to make South and Midwest appear worse
      // For states chart, keep 35 to accommodate higher state values
      const maxValue = containerSelector === "#depression-map-container" ? 25 : 35;
      const y = d3.scaleLinear()
        .domain([0, maxValue])
        .range([height, 0]);

      // Add bars with purple gradient
      const bars = svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[xKey]))
        .attr("y", d => y(d[yKey]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[yKey]))
        .attr("fill", "#667eea")
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease");
      
      // Create tooltip text element for hover values - append after bars to bring to front
      const tooltip = svg.append("text")
        .attr("class", "bar-tooltip")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("z-index", 1000);
      
      // Add hover handlers to bars
      bars
        .on("mouseover", function(event, d) {
          // Change bar to darker purple
          d3.select(this).attr("fill", "#764ba2");
          // Show tooltip
          const value = d[yKey];
          tooltip
            .attr("x", x(d[xKey]) + x.bandwidth() / 2)
            .attr("y", y(d[yKey]) - 5)
            .text(`(${value.toFixed(2)}%)`)
            .style("opacity", 1)
            .raise(); // Bring to front
        })
        .on("mouseout", function() {
          // Change bar back to original purple
          d3.select(this).attr("fill", "#667eea");
          // Hide tooltip
          tooltip.style("opacity", 0);
        });

      // Add nationwide average line (only for states chart)
      if (containerSelector === "#depression-bar-chart-container") {
        const nationalAvg = 22.5;
        
        // Draw line with black accent
        svg.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(nationalAvg))
          .attr("y2", y(nationalAvg))
          .attr("stroke", "#000000")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");
        
        // Add label outside the graph
        svg.append("text")
          .attr("x", width + 5)
          .attr("y", y(nationalAvg) + 5)
          .attr("fill", "#000000")
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .text("Nationwide Average");
        
        // Add percentage below Nationwide Average in black
        svg.append("text")
          .attr("x", width + 5)
          .attr("y", y(nationalAvg) + 20)
          .attr("fill", "#000000")
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .text("22.5%");
      }

      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#2c3e50");

      // Add x-axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text(containerSelector === "#depression-bar-chart-container" ? "States" : "Region");

      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#2c3e50");

      // Add y-axis label - push down more to prevent "Years" from cutting off
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .text(containerSelector === "#depression-bar-chart-container" 
          ? "% of Residents Who Have Reported Depression in Last 10 Years" 
          : yLabel);
    }

    // ----------------------------------------------------
    // D3 VORONOI DIAGRAM FOR COMMUNITY ORGANIZATIONS
    // ----------------------------------------------------

    const communityOrgs = [
      { name: "The Food For Thought Foundation", url: "https://www.thefoodforthoughtfoundation.org" },
      { name: "Feeding America", url: "https://www.feedingamerica.org" },
      { name: "Food Research & Action Center (FRAC)", url: "https://frac.org" },
      { name: "National Alliance on Mental Illness (NAMI)", url: "https://www.nami.org" },
      { name: "Mental Health America (MHA)", url: "https://mhanational.org" },
      { name: "Active Minds", url: "https://activeminds.org" },
      { name: "Rural Minds", url: "https://www.ruralminds.org" }
    ];

    const container = d3.select("#voronoi-container");
    const containerRect = container.node().getBoundingClientRect();
    const width = containerRect.width > 0 ? containerRect.width : 800; 
    const height = 500; 

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    // Create semi-random grid positions with some variation
    const cols = 3;
    const rows = 3;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const points = communityOrgs.map((org, i) => ({
      ...org,
      x: (i % cols) * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * cellWidth * 0.3,
      y: Math.floor(i / cols) * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * cellHeight * 0.3
    }));

    // Extract coordinates for d3.Delaunay
    const coordinates = points.map(d => [d.x, d.y]);

    const delaunay = d3.Delaunay.from(coordinates);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    // Map sites to their polygons and include the original data
    const polygons = Array.from({ length: points.length }, (_, i) => ({
      data: points[i],
      polygon: voronoi.cellPolygon(i)
    })).filter(d => d.polygon !== null);


    // Create a group for each cell
    const cellGroups = svg.selectAll(".voronoi-cell")
      .data(polygons)
      .join("g")
        .attr("class", "voronoi-cell")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          if (d && d.data && d.data.url) {
            window.open(d.data.url, "_blank");
          }
        });

    // Append the Voronoi cell paths
    cellGroups.append("path")
      .attr("d", d => "M" + d.polygon.join("L") + "Z")
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10]) 
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7)
      .attr("class", "voronoi-path")
      .each(function(d, i) {
        // Store original color
        const color = d3.schemeCategory10[i % 10];
        d3.select(this).attr("data-original-color", color);
      })
      .on("mouseenter", function() {
        const originalColor = d3.select(this).attr("data-original-color");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.9)
          .attr("fill", d3.color(originalColor).brighter(1.2));
      })
      .on("mouseleave", function() {
        const originalColor = d3.select(this).attr("data-original-color");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.7)
          .attr("fill", originalColor);
      });

    // Append text labels to the center of each cell
    const textElements = cellGroups.append("text")
      .attr("x", d => d3.polygonCentroid(d.polygon)[0]) 
      .attr("y", d => d3.polygonCentroid(d.polygon)[1])
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .style("pointer-events", "none"); 
      
    // Apply the custom wrapText function
    textElements.call(wrapText, 120);

    // Function to wrap text inside SVG
    function wrapText(text, width) {
      text.each(function(d) { 
        const textElement = d3.select(this);
        const orgName = d.data.name; 
        if (!orgName) return;
        
        const words = orgName.split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const y = textElement.attr("y");
        const x = textElement.attr("x");
        let tspan = textElement.text(null)
          .append("tspan")
            .attr("x", x)
            .attr("y", y);
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width && line.length > 1) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = textElement.append("tspan")
              .attr("x", x)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + "em")
              .text(word);
          }
        }
        // Adjust vertical position for multi-line text to truly center
        const totalLines = textElement.selectAll("tspan").size();
        if (totalLines > 1) {
          textElement.selectAll("tspan")
            .attr("dy", (d, i) => (i - (totalLines - 1) / 2) * lineHeight + "em");
        }
      });
    }
    const spiralContainer = document.getElementById('spiral-container');
    if (spiralContainer) {
      createSpiralVisualization('#spiral-container', 'data/food_access.csv');
    }

    const sliderContainer = document.getElementById('distance-slider-container');
    if (sliderContainer) {
      createDistanceSlider('#distance-slider-container', 'data/food_access.csv');
    }

  } else {
    console.log("Page ready. D3 not loaded yet.");
  }
});

function createSpiralVisualization(containerId, dataPath) {
  // Private namespace to avoid conflicts
  const module = {
    distances: [0.5, 1, 10, 20],
    a: 8,
    b: 6,
    maxMiles: 20,
    center: { x: 0, y: 0 },
    viewW: 600,
    viewH: 520,
    maxVisualRadius: 200,
    lastRows: []
  };

  const container = d3.select(containerId);
  if (container.empty()) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'spiral-tooltip spiral-hidden')
    .style('opacity', 0);

  const vizWrap = container.append('div').attr('class', 'spiral-viz-wrap');
  const viz = vizWrap.append('div').attr('class', 'spiral-viz');
  const meta = vizWrap.append('aside').attr('class', 'spiral-meta');
  
  const dataStatus = meta.append('div').attr('class', 'spiral-data-status').text('Loading data...');
  const legend = meta.append('div').attr('class', 'spiral-legend');
  const metaPanel = meta.append('div').attr('class', 'spiral-meta-panel').style('display', 'none');

  const svg = viz.append('svg')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .classed('spiral-svg', true);

  svg.append('path').attr('class', 'spiral-path');
  const markerGroup = svg.append('g').attr('class', 'spiral-markers');

  const color = d3.scaleLinear().domain([0, module.maxMiles]).range(['#2ca25f', '#de2d26']);

  function radiusToTheta(r) {
    return (r - module.a) / module.b;
  }

  function milesToRadius(d) {
    const minMile = 0.5;
    const logMin = Math.log10(minMile);
    const logMax = Math.log10(module.maxMiles);
    const logD = Math.log10(d);
    const t = (logD - logMin) / (logMax - logMin);
    return module.a + t * (module.maxVisualRadius - module.a);
  }

  function buildSpiralPoints() {
    const tMax = radiusToTheta(module.maxVisualRadius);
    const points = [];
    const steps = Math.max(60, Math.ceil(tMax * 12));
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax;
      const r = module.a + module.b * t;
      const x = module.center.x + r * Math.cos(t);
      const y = module.center.y + r * Math.sin(t);
      points.push([x, y]);
    }
    return points;
  }

  function sampleFoodsByDistance(miles) {
    if (miles <= 2) return ['Fresh fruits', 'Fresh vegetables', 'Whole grains', 'Low-fat dairy'];
    if (miles <= 10) return ['Fruits', 'Vegetables', 'Canned vegetables', 'Bread', 'Milk'];
    if (miles <= 20) return ['Processed snacks', 'Soda', 'Canned soups', 'Fast food options'];
    return ['Mostly convenience store items', 'Packaged snacks', 'Sugary drinks', 'Limited fresh produce'];
  }

  function chooseLatColumn(miles) {
    if (miles <= 0.75) return 'LATracts_half';
    if (miles <= 5) return 'LATracts1';
    if (miles <= 15) return 'LATracts10';
    return 'LATracts20';
  }

  function placeMarkers(rows) {
    const markers = markerGroup.selectAll('.spiral-marker-g').data(module.distances, d => d);
    const enter = markers.enter().append('g').attr('class', 'spiral-marker-g');
    enter.append('circle').attr('class', 'spiral-marker');
    enter.append('text').attr('class', 'spiral-marker-label').attr('text-anchor', 'middle').attr('dy', -12);
    enter.append('text').attr('class', 'spiral-marker-badge').attr('text-anchor', 'middle').attr('dy', 12);

    const all = enter.merge(markers);
    all.each(function (d) {
      const r = milesToRadius(d);
      const t = radiusToTheta(r);
      const x = module.center.x + r * Math.cos(t);
      const y = module.center.y + r * Math.sin(t);
      
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
        .attr('r', Math.max(7, Math.round(module.viewW / 100)))
        .attr('fill', color(d))
        .on('mouseenter', (event, dist) => {
          showTooltip(event, dist, candidates.length ? candidates : rows, candidates.length === 0);
        })
        .on('mousemove', (event) => moveTooltip(event))
        .on('mouseleave', hideTooltip)
        .on('click', (event) => {
          showMetaPanel(d, candidates, col);
        });
      d3.select(this).select('.spiral-marker-label').text(d + ' mi');
      d3.select(this).select('.spiral-marker-badge')
        .text(candidates.length > 0 ? candidates.length : '0')
        .attr('x', 0)
        .attr('dy', 12);
    });
    markers.exit().remove();
  }

  function showTooltip(event, miles, rows, isRandom) {
  let tractInfo = '';
  if (rows && rows.length && !isRandom) {
    tractInfo = `<div class="spiral-tooltip-sample"><strong>Matching tracts: ${rows.length}</strong></div>`;
  }

    const foods = sampleFoodsByDistance(miles).map(f => `<li>${f}</li>`).join('');
    const html = `<strong>${miles} mile${miles>1?'s':''}</strong>
      <div class="spiral-small">Typical available food types:</div>
      <ul class="spiral-tooltip-list">${foods}</ul>
      ${tractInfo}`;
  tooltip.html(html).classed('spiral-hidden', false).transition().duration(120).style('opacity', 1);
  moveTooltip(event);
}

  function showMetaPanel(distance, candidates, col) {
    if (candidates.length > 0) {
      const list = candidates.map(r => `<li>${r.CensusTract || 'n/a'} — ${r.County || ''}, ${r.State || ''}</li>`).join('');
      metaPanel.html(`<h2>Tracts with limited access (${distance} mi)</h2>
        <div>Column: <code>${col}</code></div>
        <div>Matches: <strong>${candidates.length}</strong></div>
        <ul>${list}</ul>`);
    } else {
      metaPanel.html(`<h2>No matching tracts for ${distance} mi</h2>
        <div>Column: <code>${col}</code></div>
        <div style="color:#d9534f">No tracts flagged for this distance. Try another marker.</div>`);
    }
    metaPanel.style('display', 'block');
  }

  function moveTooltip(event) {
    const left = event.pageX + 12;
    const top = event.pageY + 12;
    tooltip.style('left', left + 'px').style('top', top + 'px');
  }

  function hideTooltip() {
    tooltip.transition().duration(120).style('opacity', 0).on('end', () => tooltip.classed('spiral-hidden', true));
  }

  function render(rows = module.lastRows) {
    module.viewW = Math.max(320, viz.node().clientWidth || 600);
    module.viewH = Math.max(360, viz.node().clientHeight || 520);
    svg.attr('viewBox', `0 0 ${module.viewW} ${module.viewH}`);
    module.center = { x: module.viewW / 2, y: module.viewH / 2 };
    module.maxVisualRadius = Math.min(module.viewW, module.viewH) * 0.45;

    const line = d3.line();
    svg.select('.spiral-path').attr('d', line(buildSpiralPoints()));

    placeMarkers(rows);
  }

  d3.csv(dataPath).then(rows => {
    module.lastRows = rows;
    dataStatus.text(`Loaded ${rows.length} rows from ${dataPath.split('/').pop()}`);
    legend.html(`<strong>Dataset</strong><div>Tracts loaded: ${rows.length}</div>
      <div style="margin-top:6px;color:#555;font-size:13px">Markers show tracts flagged by distance:<ul class="spiral-tooltip-list" style="margin-top:6px"><li>½ mile → <code>LATracts_half</code></li><li>1 mile → <code>LATracts1</code></li><li>10 miles → <code>LATracts10</code></li><li>20 miles → <code>LATracts20</code></li></ul></div>`);
    render(rows);
  }).catch(err => {
    console.warn('CSV load error', err);
    dataStatus.text('Could not load data — showing concept-only spiral.');
    render([]);
  });

  const resizeHandler = () => render();
  window.addEventListener('resize', resizeHandler);

  setTimeout(() => render(), 60);

  return {
    render: () => render(),
    destroy: () => {
      window.removeEventListener('resize', resizeHandler);
      tooltip.remove();
      container.selectAll('*').remove();
    }
  };
}

function createDistanceSlider(containerId, dataPath) {
  const distances = [0.5, 1, 10, 20];
  const distanceColumns = {
    0.5: 'LATracts_half',
    1: 'LATracts1',
    10: 'LATracts10',
    20: 'LATracts20'
  };

  let currentDistance = 0.5;
  let currentFilter = 'both'; // 'urban', 'rural', or 'both'
  let allData = [];

  const container = d3.select(containerId);
  if (container.empty()) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  // Create main wrapper
  const wrapper = container.append('div').attr('class', 'slider-wrapper');

  // Create toggle buttons
  const toggleContainer = wrapper.append('div').attr('class', 'slider-toggle-container');
  
  const urbanBtn = toggleContainer.append('button')
    .attr('class', 'slider-toggle-btn active')
    .attr('data-filter', 'both')
    .text('Both');
  
  const ruralBtn = toggleContainer.append('button')
    .attr('class', 'slider-toggle-btn')
    .attr('data-filter', 'urban')
    .text('Urban');
  
  const bothBtn = toggleContainer.append('button')
    .attr('class', 'slider-toggle-btn')
    .attr('data-filter', 'rural')
    .text('Rural');

  // Create info display
  const infoDisplay = wrapper.append('div').attr('class', 'slider-info-display');
  const tractCount = infoDisplay.append('div').attr('class', 'slider-tract-count').text('0');
  const tractLabel = infoDisplay.append('div').attr('class', 'slider-tract-label').text('tracts');
  const distanceLabel = infoDisplay.append('div').attr('class', 'slider-distance-label').text('at 0.5 miles');

  // Create SVG for slider
  const width = 600;
  const height = 120;
  const margin = { top: 20, right: 40, left: 40, bottom: 40 };
  
  const svg = wrapper.append('svg')
    .attr('class', 'slider-svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const sliderWidth = width - margin.left - margin.right;
  
  // Create scale for positioning (logarithmic for better spacing)
  const xScale = d3.scalePoint()
    .domain(distances)
    .range([0, sliderWidth])
    .padding(0);

  // Draw track line
  g.append('line')
    .attr('class', 'slider-track')
    .attr('x1', 0)
    .attr('x2', sliderWidth)
    .attr('y1', 40)
    .attr('y2', 40);

  // Draw distance markers
  const markers = g.selectAll('.slider-marker')
    .data(distances)
    .join('g')
    .attr('class', 'slider-marker')
    .attr('transform', d => `translate(${xScale(d)}, 40)`);

  markers.append('circle')
    .attr('r', 8)
    .attr('class', 'slider-marker-circle');

  markers.append('text')
    .attr('class', 'slider-marker-text')
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .text(d => d === 0.5 ? '½ mi' : `${d} mi`);

  // Create draggable handle
  const handle = g.append('g')
    .attr('class', 'slider-handle')
    .attr('transform', `translate(${xScale(0.5)}, 40)`)
    .style('cursor', 'grab');

  handle.append('circle')
    .attr('r', 15)
    .attr('class', 'slider-handle-circle');

  handle.append('text')
    .attr('class', 'slider-handle-text')
    .attr('text-anchor', 'middle')
    .attr('dy', 5)
    .text('½');

  // Drag behavior
  const drag = d3.drag()
    .on('start', function() {
      d3.select(this).style('cursor', 'grabbing');
    })
    .on('drag', function(event) {
      // Find closest distance
      const mouseX = event.x;
      let closestDistance = distances[0];
      let minDiff = Math.abs(xScale(distances[0]) - mouseX);
      
      distances.forEach(d => {
        const diff = Math.abs(xScale(d) - mouseX);
        if (diff < minDiff) {
          minDiff = diff;
          closestDistance = d;
        }
      });
      
      if (closestDistance !== currentDistance) {
        currentDistance = closestDistance;
        updateVisualization();
      }
    })
    .on('end', function() {
      d3.select(this).style('cursor', 'grab');
    });

  handle.call(drag);

  // Toggle button click handlers
  toggleContainer.selectAll('.slider-toggle-btn')
    .on('click', function() {
      toggleContainer.selectAll('.slider-toggle-btn').classed('active', false);
      d3.select(this).classed('active', true);
      currentFilter = d3.select(this).attr('data-filter');
      updateVisualization();
    });

  // Filter data based on current settings
  function getFilteredData() {
  const column = distanceColumns[currentDistance];
  
  return allData.filter(row => {
    // Check if tract has limited access at this distance
    const hasLimitedAccess = row[column] && +row[column] > 0;
    if (!hasLimitedAccess) return false;

    // Apply urban/rural filter
    if (currentFilter === 'both') return true;
    
    const urbanValue = row.Urban !== undefined && row.Urban !== null && row.Urban !== '' ? +row.Urban : null;
    
    if (currentFilter === 'urban') return urbanValue === 1;
    if (currentFilter === 'rural') return urbanValue === 0;
    
    return false;
  });
}

  // Update visualization based on current state
  function updateVisualization() {
    const filteredData = getFilteredData();
    const count = filteredData.length;

    // Update handle position
    handle.transition()
      .duration(300)
      .attr('transform', `translate(${xScale(currentDistance)}, 40)`);

    // Update handle text
    handle.select('.slider-handle-text')
      .text(currentDistance === 0.5 ? '½' : currentDistance === 1 ? '1' : currentDistance);

    // Update info display
    tractCount.text(count.toLocaleString());
    
    const filterText = currentFilter === 'both' ? '' : 
                      currentFilter === 'urban' ? ' urban' : ' rural';
    
    distanceLabel.text(`${filterText} tracts at ${currentDistance === 0.5 ? '½' : currentDistance} mile${currentDistance > 1 ? 's' : ''} from food access`);

    // Update marker highlights
    markers.selectAll('.slider-marker-circle')
      .transition()
      .duration(300)
      .attr('class', d => d === currentDistance ? 'slider-marker-circle active' : 'slider-marker-circle');
  }

  // Load data
  d3.csv(dataPath).then(data => {
    allData = data;
    console.log(`Distance slider loaded ${data.length} rows`);
    updateVisualization();
  }).catch(err => {
    console.error('Error loading data for distance slider:', err);
    tractCount.text('Error');
    distanceLabel.text('Could not load data');
  });

  return {
    update: updateVisualization
  };
}