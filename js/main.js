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

    // Create regional chart in the map's regional panel
    createFoodDesertRegionalChart(
      "#regional-chart-content",
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
      
      container.append("p")
        .attr("class", "chart-title")
        .style("font-size", "1.1rem")
        .style("font-weight", "bold")
        .style("margin-bottom", "5px")
        .style("text-align", "center")
        .text("Top 10 States with the Highest Number of Low-Income Low Access Tracts");
      
      const margin = { top: 20, right: 20, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(data.map(d => d.state))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tracts) * 1.1])
        .range([height, 0]);

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
      
      const tooltip = svg.append("text")
        .attr("class", "bar-tooltip")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("z-index", 1000);
      
      bars
        .on("mouseover", function(event, d) {
          d3.select(this).attr("fill", "#764ba2");
          tooltip
            .attr("x", x(d.state) + x.bandwidth() / 2)
            .attr("y", y(d.tracts) - 5)
            .text(`(${d.tracts.toLocaleString()})`)
            .style("opacity", 1)
            .raise();
        })
        .on("mouseout", function() {
          d3.select(this).attr("fill", "#667eea");
          tooltip.style("opacity", 0);
        });

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#2c3e50");

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("State");

      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#2c3e50");

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
      
      // Don't add title for the regional panel (it has a header)
      if (containerSelector !== "#regional-chart-content") {
        container.append("p")
          .attr("class", "chart-title")
          .style("font-size", "1.1rem")
          .style("font-weight", "bold")
          .style("margin-bottom", "15px")
          .style("text-align", "center")
          .text("Regional Distribution of Food Desert Tracts");
      }
      
      const margin = { top: 20, right: 20, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(data.map(d => d.region))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tracts) * 1.1])
        .range([height, 0]);

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
      
      const tooltip = svg.append("text")
        .attr("class", "bar-tooltip")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("z-index", 1000);
      
      bars
        .on("mouseover", function(event, d) {
          d3.select(this).attr("fill", "#764ba2");
          tooltip
            .attr("x", x(d.region) + x.bandwidth() / 2)
            .attr("y", y(d.tracts) - 5)
            .text(`(${d.tracts.toLocaleString()})`)
            .style("opacity", 1)
            .raise();
        })
        .on("mouseout", function() {
          d3.select(this).attr("fill", "#667eea");
          tooltip.style("opacity", 0);
        });

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#2c3e50");

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Region");

      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#2c3e50");

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
      
      if (containerSelector === "#depression-bar-chart-container") {
        container.append("p")
          .attr("class", "chart-title")
          .style("font-size", "1.1rem")
          .style("font-weight", "bold")
          .style("margin-bottom", "5px")
          .style("text-align", "center")
          .text("Top 10 States with Highest Proportion of Depressed Individuals");
      }
      
      if (containerSelector === "#depression-map-container") {
        container.select(".chart-subtitle").remove();
        container.append("p")
          .attr("class", "chart-title")
          .style("font-size", "1.1rem")
          .style("font-weight", "bold")
          .style("margin-bottom", "5px")
          .style("text-align", "center")
          .text("Regional Distribution of Depression Prevalence");
      }
      
      const margin = { top: 20, right: 120, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 350 - margin.top - margin.bottom;

      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(data.map(d => d[xKey]))
        .range([0, width])
        .padding(0.2);

      const maxValue = containerSelector === "#depression-map-container" ? 25 : 35;
      const y = d3.scaleLinear()
        .domain([0, maxValue])
        .range([height, 0]);

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
      
      const tooltip = svg.append("text")
        .attr("class", "bar-tooltip")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("z-index", 1000);
      
      bars
        .on("mouseover", function(event, d) {
          d3.select(this).attr("fill", "#764ba2");
          const value = d[yKey];
          tooltip
            .attr("x", x(d[xKey]) + x.bandwidth() / 2)
            .attr("y", y(d[yKey]) - 5)
            .text(`(${value.toFixed(2)}%)`)
            .style("opacity", 1)
            .raise();
        })
        .on("mouseout", function() {
          d3.select(this).attr("fill", "#667eea");
          tooltip.style("opacity", 0);
        });

      if (containerSelector === "#depression-bar-chart-container") {
        const nationalAvg = 22.5;
        
        svg.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(nationalAvg))
          .attr("y2", y(nationalAvg))
          .attr("stroke", "#000000")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");
        
        svg.append("text")
          .attr("x", width + 5)
          .attr("y", y(nationalAvg) + 5)
          .attr("fill", "#000000")
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .text("Nationwide Average");
        
        svg.append("text")
          .attr("x", width + 5)
          .attr("y", y(nationalAvg) + 20)
          .attr("fill", "#000000")
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .text("22.5%");
      }

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#2c3e50");

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("fill", "#2c3e50")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text(containerSelector === "#depression-bar-chart-container" ? "States" : "Region");

      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#2c3e50");

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

    const cols = 3;
    const rows = 3;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const points = communityOrgs.map((org, i) => ({
      ...org,
      x: (i % cols) * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * cellWidth * 0.3,
      y: Math.floor(i / cols) * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * cellHeight * 0.3
    }));

    const coordinates = points.map(d => [d.x, d.y]);

    const delaunay = d3.Delaunay.from(coordinates);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    const polygons = Array.from({ length: points.length }, (_, i) => ({
      data: points[i],
      polygon: voronoi.cellPolygon(i)
    })).filter(d => d.polygon !== null);

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

    cellGroups.append("path")
      .attr("d", d => "M" + d.polygon.join("L") + "Z")
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10]) 
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7)
      .attr("class", "voronoi-path")
      .each(function(d, i) {
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

    const textElements = cellGroups.append("text")
      .attr("x", d => d3.polygonCentroid(d.polygon)[0]) 
      .attr("y", d => d3.polygonCentroid(d.polygon)[1])
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .style("pointer-events", "none"); 
      
    textElements.call(wrapText, 120);

    function wrapText(text, width) {
      text.each(function(d) { 
        const textElement = d3.select(this);
        const orgName = d.data.name; 
        if (!orgName) return;
        
        const words = orgName.split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
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
        const totalLines = textElement.selectAll("tspan").size();
        if (totalLines > 1) {
          textElement.selectAll("tspan")
            .attr("dy", (d, i) => (i - (totalLines - 1) / 2) * lineHeight + "em");
        }
      });
    }
    
    const spiralContainer = document.getElementById('spiral-container');
    if (spiralContainer) {
      createSpiralVisualization('#spiral-container', 'data/food_access_data.csv');
    }

    const sliderContainer = document.getElementById('distance-slider-container');
    if (sliderContainer) {
      createDistanceSlider('#distance-slider-container', 'data/food_access_data.csv');
    }

  } else {
    console.log("Page ready. D3 not loaded yet.");
  }
});

function createSpiralVisualization(containerId, dataPath) {
  const module = {
    urbanDistances: [0.1, 0.3, 0.5, 1],
    ruralDistances: [2, 5, 10, 20],
    currentDistances: [0.1, 0.3, 0.5, 1],
    currentMode: 'urban',
    a: 8,
    b: 6,
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

  const instructText = container.insert('p', ':first-child')
    .attr('class', 'spiral-instruction-text')
    .style('text-align', 'center')
    .style('color', '#666')
    .style('font-size', '0.95rem')
    .style('margin-top', '3rem')
    .style('margin-bottom', '2rem')
    .style('font-style', 'italic')
    .text('Hover over each distance to uncover food quality in rural and urban food deserts');

  const vizWrap = container.append('div')
    .attr('class', 'spiral-viz-wrap')
    .style('display', 'flex')
    .style('gap', '2rem')
    .style('align-items', 'flex-start');
  
  const viz = vizWrap.append('div')
    .attr('class', 'spiral-viz')
    .style('flex', '1');
  
  const toggleContainer = vizWrap.append('div')
    .attr('class', 'spiral-toggle-container')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('gap', '1rem')
    .style('padding', '1rem');

  const urbanBtn = toggleContainer.append('button')
    .attr('class', 'spiral-toggle-btn active')
    .style('padding', '0.75rem 1.5rem')
    .style('border', '2px solid #667eea')
    .style('background', '#667eea')
    .style('color', 'white')
    .style('border-radius', '8px')
    .style('cursor', 'pointer')
    .style('font-weight', 'bold')
    .style('font-size', '1rem')
    .style('transition', 'all 0.3s')
    .text('Urban');

  const ruralBtn = toggleContainer.append('button')
    .attr('class', 'spiral-toggle-btn')
    .style('padding', '0.75rem 1.5rem')
    .style('border', '2px solid #667eea')
    .style('background', 'white')
    .style('color', '#667eea')
    .style('border-radius', '8px')
    .style('cursor', 'pointer')
    .style('font-weight', 'bold')
    .style('font-size', '1rem')
    .style('transition', 'all 0.3s')
    .text('Rural');

  const svg = viz.append('svg')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .classed('spiral-svg', true);

  svg.append('path').attr('class', 'spiral-path')
    .style('fill', 'none')
    .style('stroke', '#ccc')
    .style('stroke-width', '2px');
  
  const markerGroup = svg.append('g').attr('class', 'spiral-markers');

  const foodImages = {
    urban: {
      0.1: [
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400',
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
        'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400'
      ],
      0.3: [
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400',
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400'
      ],
      0.5: [
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'
      ],
      1: [
        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=400'
      ]
    },
    rural: {
      2: [
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400',
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
        'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400'
      ],
      5: [
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400',
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400'
      ],
      10: [
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'
      ],
      20: [
        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=400'
      ]
    }
  };

  function getColorForDistance(distance, mode) {
    if (mode === 'urban') {
      if (distance === 0.1) return '#2d5016';
      if (distance === 0.3) return '#5a9216';
      if (distance === 0.5) return '#ff8c00';
      if (distance === 1) return '#dc2626';
    } else {
      if (distance === 2) return '#2d5016';
      if (distance === 5) return '#5a9216';
      if (distance === 10) return '#ff8c00';
      if (distance === 20) return '#dc2626';
    }
    return '#666';
  }

  function getFoodsByDistance(distance, mode) {
    if (mode === 'urban') {
      return foodImages.urban[distance] || [];
    } else {
      return foodImages.rural[distance] || [];
    }
  }

  function radiusToTheta(r) {
    return (r - module.a) / module.b;
  }

  function milesToRadius(d) {
    const maxDist = module.currentMode === 'urban' ? 1 : 20;
    const minDist = module.currentMode === 'urban' ? 0.1 : 2;
    
    const logMin = Math.log10(minDist);
    const logMax = Math.log10(maxDist);
    const logD = Math.log10(d);
    const t = (logD - logMin) / (logMax - logMin);
    return module.a + t * (module.maxVisualRadius - module.a);
  }

  function buildSpiralPoints() {
    const maxDist = module.currentMode === 'urban' ? 1 : 20;
    const maxR = milesToRadius(maxDist);
    const tMax = radiusToTheta(maxR);
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

  function showFoodOverlay(event, distance, mode) {
    d3.select('.food-overlay').remove();
    
    const foods = getFoodsByDistance(distance, mode);
    const overlay = d3.select('body')
      .append('div')
      .attr('class', 'food-overlay')
      .style('position', 'fixed')
      .style('top', '0')
      .style('left', '0')
      .style('width', '100%')
      .style('height', '100%')
      .style('pointer-events', 'none')
      .style('z-index', '9999')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('gap', '1rem')
      .style('padding', '2rem')
      .style('background', 'rgba(255, 255, 255, 0.97)')
      .style('opacity', '0');

    overlay.append('div')
      .style('font-size', '2.5rem')
      .style('font-weight', 'bold')
      .style('color', getColorForDistance(distance, mode))
      .style('margin-bottom', '1rem')
      .text(`Food options ${distance} mile${distance !== 1 ? 's' : ''} away`);

    const imageGrid = overlay.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
      .style('gap', '1.5rem')
      .style('max-width', '1200px')
      .style('width', '100%');

    foods.forEach((imageUrl, i) => {
      const imgContainer = imageGrid.append('div')
        .style('animation', `fadeInScale 0.6s ease-out ${i * 0.1}s both`)
        .style('border-radius', '12px')
        .style('overflow', 'hidden')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)');

      imgContainer.append('img')
        .attr('src', imageUrl)
        .style('width', '100%')
        .style('height', '200px')
        .style('object-fit', 'cover')
        .style('display', 'block');
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    overlay.transition().duration(400).style('opacity', '1');
  }

  function hideFoodOverlay() {
    d3.select('.food-overlay')
      .transition()
      .duration(200)
      .style('opacity', '0')
      .remove();
  }

  function placeMarkers() {
    const markers = markerGroup.selectAll('.spiral-marker-g')
      .data(module.currentDistances, d => d);
    
    markers.exit()
      .transition()
      .duration(300)
      .style('opacity', 0)
      .remove();

    const enter = markers.enter()
      .append('g')
      .attr('class', 'spiral-marker-g')
      .style('opacity', 0);
    
    enter.append('circle')
      .attr('class', 'spiral-marker')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s');
    
    enter.append('text')
      .attr('class', 'spiral-marker-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -15)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .style('pointer-events', 'none');

    const all = enter.merge(markers);
    
    all.transition()
      .duration(500)
      .style('opacity', 1)
      .attr('transform', d => {
        const r = milesToRadius(d);
        const t = radiusToTheta(r);
        const x = module.center.x + r * Math.cos(t);
        const y = module.center.y + r * Math.sin(t);
        return `translate(${x},${y})`;
      });

    all.select('circle')
      .transition()
      .duration(500)
      .attr('r', 10)
      .attr('fill', d => getColorForDistance(d, module.currentMode))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    all.select('.spiral-marker-label')
      .transition()
      .duration(500)
      .attr('fill', d => getColorForDistance(d, module.currentMode))
      .text(d => `${d} mi`);

    all.select('circle')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 14)
          .attr('stroke-width', 3);
        showFoodOverlay(event, d, module.currentMode);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 10)
          .attr('stroke-width', 2);
        hideFoodOverlay();
      });
  }

  function render() {
    module.viewW = Math.max(320, viz.node().clientWidth || 600);
    module.viewH = Math.max(360, viz.node().clientHeight || 520);
    svg.attr('viewBox', `0 0 ${module.viewW} ${module.viewH}`);
    module.center = { x: module.viewW / 2, y: module.viewH / 2 };
    module.maxVisualRadius = Math.min(module.viewW, module.viewH) * 0.45;

    const line = d3.line();
    svg.select('.spiral-path')
      .transition()
      .duration(500)
      .attr('d', line(buildSpiralPoints()));

    placeMarkers();
  }

  function switchMode(mode) {
    module.currentMode = mode;
    module.currentDistances = mode === 'urban' ? module.urbanDistances : module.ruralDistances;
    
    if (mode === 'urban') {
      urbanBtn
        .style('background', '#667eea')
        .style('color', 'white');
      ruralBtn
        .style('background', 'white')
        .style('color', '#667eea');
    } else {
      ruralBtn
        .style('background', '#667eea')
        .style('color', 'white');
      urbanBtn
        .style('background', 'white')
        .style('color', '#667eea');
    }
    
    render();
  }

  urbanBtn.on('click', () => switchMode('urban'));
  ruralBtn.on('click', () => switchMode('rural'));

  d3.csv(dataPath).then(rows => {
    module.lastRows = rows;
    render();
  }).catch(err => {
    console.warn('CSV load error', err);
    render();
  });

  const resizeHandler = () => render();
  window.addEventListener('resize', resizeHandler);

  setTimeout(() => render(), 60);

  return {
    render: () => render(),
    destroy: () => {
      window.removeEventListener('resize', resizeHandler);
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
  let currentFilter = 'both';
  let allData = [];

  const container = d3.select(containerId);
  if (container.empty()) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  const wrapper = container.append('div').attr('class', 'slider-wrapper');

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

  const infoDisplay = wrapper.append('div').attr('class', 'slider-info-display');
  const tractCount = infoDisplay.append('div').attr('class', 'slider-tract-count').text('0');
  const tractLabel = infoDisplay.append('div').attr('class', 'slider-tract-label').text('tracts');
  const distanceLabel = infoDisplay.append('div').attr('class', 'slider-distance-label').text('at 0.5 miles');

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
  
  const xScale = d3.scalePoint()
    .domain(distances)
    .range([0, sliderWidth])
    .padding(0);

  g.append('line')
    .attr('class', 'slider-track')
    .attr('x1', 0)
    .attr('x2', sliderWidth)
    .attr('y1', 40)
    .attr('y2', 40);

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

  const drag = d3.drag()
    .on('start', function() {
      d3.select(this).style('cursor', 'grabbing');
    })
    .on('drag', function(event) {
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

  toggleContainer.selectAll('.slider-toggle-btn')
    .on('click', function() {
      toggleContainer.selectAll('.slider-toggle-btn').classed('active', false);
      d3.select(this).classed('active', true);
      currentFilter = d3.select(this).attr('data-filter');
      updateVisualization();
    });

  function getFilteredData() {
    const column = distanceColumns[currentDistance];
    
    return allData.filter(row => {
      const hasLimitedAccess = row[column] == 1;
      if (!hasLimitedAccess) return false;

      if (currentFilter === 'both') return true;
      
      const urbanValue = row.Urban !== undefined && row.Urban !== null && row.Urban !== '' ? +row.Urban : null;
      
      if (currentFilter === 'urban') return urbanValue === 1;
      if (currentFilter === 'rural') return urbanValue === 0;
      
      return false;
    });
  }

  function updateVisualization() {
    const filteredData = getFilteredData();
    const count = filteredData.length;

    handle.transition()
      .duration(300)
      .attr('transform', `translate(${xScale(currentDistance)}, 40)`);

    handle.select('.slider-handle-text')
      .text(currentDistance === 0.5 ? '½' : currentDistance === 1 ? '1' : currentDistance);

    tractCount.text(count.toLocaleString());
    
    const filterText = currentFilter === 'both' ? '' : 
                      currentFilter === 'urban' ? ' urban' : ' rural';
    
    distanceLabel.text(`${filterText} tracts at ${currentDistance === 0.5 ? '½' : currentDistance} mile${currentDistance > 1 ? 's' : ''} from food access`);

    markers.selectAll('.slider-marker-circle')
      .transition()
      .duration(300)
      .attr('class', d => d === currentDistance ? 'slider-marker-circle active' : 'slider-marker-circle');
  }

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