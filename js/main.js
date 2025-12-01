document.addEventListener("DOMContentLoaded", () => {
  if (typeof d3 !== 'undefined') {
    console.log("Page ready. D3 version:", d3.version);

    const communityOrgs = [
      { name: "Feeding America", url: "https://www.feedingamerica.org", image: "images/feeding america logo.jpg" },
      { name: "Food for Thought", url: "https://www.thefoodforthoughtfoundation.org", image: "images/foodthought.jpg" },
      { name: "NAMI", url: "https://www.nami.org", image: "images/nami.jpg" },
      { name: "Rural Minds", url: "https://www.ruralminds.org", image: "images/rural minds.jpg" },
      { name: "Active Minds", url: "https://activeminds.org", image: "images/active minds.jpg" },
      { name: "Food Research and Action Center", url: "https://frac.org", image: "images/frac.jpg" },
      { name: "Wholesome Wave", url: "https://www.wholesomewave.org", image: "images/wholesome wave.jpg" },
      { name: "Feed the Children", url: "https://www.feedthechildren.org", image: "images/feedthechildren.jpg" }
    ];

    const container = d3.select("#voronoi-container");
    const containerRect = container.node().getBoundingClientRect();
    const width = containerRect.width > 0 ? containerRect.width : window.innerWidth - 100; 
    const height = 700; 

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    const defs = svg.append("defs");
    const clipPath = defs.append("clipPath")
      .attr("id", "circle-clip");
    clipPath.append("circle")
      .attr("r", 120)
      .attr("cx", 0)
      .attr("cy", 0);

    const cols = 4;
    const rows = 2;
    const circleRadius = 120;
    const spacing = 60;
    const startX = (width - (cols * (circleRadius * 2 + spacing) - spacing)) / 2;
    const startY = (height - (rows * (circleRadius * 2 + spacing) - spacing)) / 2;

    const circleGroups = svg.selectAll(".community-circle")
      .data(communityOrgs)
      .join("g")
        .attr("class", "community-circle")
        .attr("transform", (d, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = startX + col * (circleRadius * 2 + spacing) + circleRadius;
          const y = startY + row * (circleRadius * 2 + spacing) + circleRadius;
          return `translate(${x}, ${y})`;
        })
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          if (d && d.url) {
            window.open(d.url, "_blank");
          }
        });

    circleGroups.each(function(d, i) {
      const g = d3.select(this);
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (circleRadius * 2 + spacing) + circleRadius;
      const y = startY + row * (circleRadius * 2 + spacing) + circleRadius;
      g.attr("data-x", x).attr("data-y", y);
    });

    circleGroups.each(function(d, i) {
      const g = d3.select(this);
      
      g.append("circle")
        .attr("r", circleRadius)
        .attr("fill", "transparent")
        .attr("stroke", "#667eea")
        .attr("stroke-width", 3)
        .attr("opacity", 0)
        .attr("class", "hover-circle");
      
      g.append("image")
        .attr("href", d.image)
        .attr("x", -circleRadius)
        .attr("y", -circleRadius)
        .attr("width", circleRadius * 2)
        .attr("height", circleRadius * 2)
        .attr("clip-path", "url(#circle-clip)")
        .attr("class", "community-image")
        .attr("preserveAspectRatio", "xMidYMid slice")
        .style("transition", "all 0.3s")
        .on("error", function() {
          d3.select(this)
            .style("display", "none");
          g.append("circle")
            .attr("r", circleRadius)
            .attr("fill", "#e0e0e0")
      .attr("stroke", "#ccc")
            .attr("stroke-width", 2);
          g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "#666")
            .style("font-size", "12px")
            .text(d.name);
        });
    });

    circleGroups
      .on("mouseenter", function() {
        const g = d3.select(this);
        g.select(".hover-circle")
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("stroke-width", 4);
        g.select(".community-image")
          .transition()
          .duration(200)
          .attr("width", circleRadius * 2.1)
          .attr("height", circleRadius * 2.1)
          .attr("x", -circleRadius * 1.05)
          .attr("y", -circleRadius * 1.05);
        const x = parseFloat(g.attr("data-x"));
        const y = parseFloat(g.attr("data-y"));
        g.transition()
          .duration(200)
          .attr("transform", `translate(${x}, ${y}) scale(1.1)`);
      })
      .on("mouseleave", function() {
        const g = d3.select(this);
        g.select(".hover-circle")
          .transition()
          .duration(200)
          .attr("opacity", 0)
          .attr("stroke-width", 3);
        g.select(".community-image")
          .transition()
          .duration(200)
          .attr("width", circleRadius * 2)
          .attr("height", circleRadius * 2)
          .attr("x", -circleRadius)
          .attr("y", -circleRadius);
        const x = parseFloat(g.attr("data-x"));
        const y = parseFloat(g.attr("data-y"));
        g.transition()
          .duration(200)
          .attr("transform", `translate(${x}, ${y})`);
      });
    
    // Initialize spiral visualization with delay to ensure DOM is ready
    setTimeout(() => {
    const spiralContainer = document.getElementById('spiral-container');
    if (spiralContainer) {
        console.log('Initializing spiral visualization');
      createSpiralVisualization('#spiral-container', 'data/food_access.csv');
    }
    }, 100);

    // Initialize distance slider with delay to ensure DOM is ready
    setTimeout(() => {
    const sliderContainer = document.getElementById('distance-slider-container');
    if (sliderContainer) {
        console.log('Initializing distance slider');
      createDistanceSlider('#distance-slider-container', 'data/food_access.csv');
    }
    }, 150);

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
    lastRows: [],
    selectedDistance: null
  };

  const container = d3.select(containerId);
  if (container.empty()) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  const instructText = container.append('p')
    .attr('class', 'spiral-instruction-text')
    .style('text-align', 'center')
    .style('color', '#666')
    .style('font-size', '0.95rem')
    .style('margin-bottom', '2rem')
    .style('margin-top', '2rem')
    .style('font-style', 'italic')
    .text('Click on each distance to uncover food quality in rural and urban food deserts');

  const toggleContainer = container.append('div')
    .attr('class', 'spiral-toggle-container')
    .style('display', 'flex')
    .style('flex-direction', 'row')
    .style('gap', '1rem')
    .style('justify-content', 'center')
    .style('margin-bottom', '2rem');

  const ruralBtn = toggleContainer.append('button')
    .attr('class', 'spiral-toggle-btn')
    .style('padding', '0.5rem 1rem')
    .style('border', '2px solid #667eea')
    .style('background', 'white')
    .style('color', '#667eea')
    .style('border-radius', '8px')
    .style('cursor', 'pointer')
    .style('font-weight', 'bold')
    .style('font-size', '0.85rem')
    .style('transition', 'all 0.3s')
    .style('white-space', 'nowrap')
    .style('min-width', '150px')
    .text('Rural Food Desert: Baldwin');

  const urbanBtn = toggleContainer.append('button')
    .attr('class', 'spiral-toggle-btn active')
    .style('padding', '0.5rem 1rem')
    .style('border', '2px solid #667eea')
    .style('background', '#667eea')
    .style('color', 'white')
    .style('border-radius', '8px')
    .style('cursor', 'pointer')
    .style('font-weight', 'bold')
    .style('font-size', '0.85rem')
    .style('transition', 'all 0.3s')
    .style('white-space', 'nowrap')
    .style('min-width', '150px')
    .text('Urban Food Desert: Maxwell Park');

  const locationDisplay = container.append('div')
    .attr('class', 'spiral-location-display')
    .style('text-align', 'center')
    .style('font-size', '1.5rem')
    .style('font-weight', 'bold')
    .style('color', '#2c3e50')
    .style('margin-bottom', '0.5rem')
    .style('min-height', '2rem')
    .text('Maxwell Park, California');
  
  const vizWrap = container.append('div')
    .attr('class', 'spiral-viz-wrap')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('align-items', 'center')
    .style('position', 'relative')
    .style('width', '100%');
  
  const viz = vizWrap.append('div')
    .attr('class', 'spiral-viz')
    .style('width', '100%')
    .style('max-width', '900px')
    .style('position', 'relative');

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
      0.1: ['images/nothing.jpg'],
      0.3: ['images/nothing.jpg'],
      0.5: ['images/shoprite.jpg', 'images/melrose market.jpg', 'images/island market.jpg'],
      1: ['images/safeway.jpg', 'images/gazzali\'s.jpeg', 'images/handy market.jpg']
    },
    rural: {
      2: ['images/subway logo.jpg', 'images/arbys-logo.jpg', 'images/dollar general.jpg'],
      5: ['images/mcdonalds logo.jpg', 'images/burger king.jpg', 'images/baldwin kwik mart.jpg'],
      10: ['images/walmart logo.jpg', 'images/winn-dixie.jpg', 'images/save-a-lot.jpg'],
      20: ['images/sprouts farmer market.jpg', 'images/shoprite.jpg', 'images/whole foods logo.jpg']
    }
  };

  function getColorForDistance(distance, mode) {
    if (mode === 'urban') {
      if (distance === 0.1) return '#dc2626';
      if (distance === 0.3) return '#ff8c00';
      if (distance === 0.5) return '#5a9216';
      if (distance === 1) return '#2d5016';
    } else {
      if (distance === 2) return '#dc2626';
      if (distance === 5) return '#ff8c00';
      if (distance === 10) return '#5a9216';
      if (distance === 20) return '#2d5016';
    }
    return '#666';
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
    const angleOffset = -tMax - Math.PI / 2;
    const points = [];
    const steps = Math.max(60, Math.ceil(tMax * 12));
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax;
      const r = module.a + module.b * t;
      const angle = t + angleOffset;
      const x = module.center.x + r * Math.cos(angle);
      const y = module.center.y + r * Math.sin(angle);
      points.push([x, y]);
    }
    return points;
  }

  function placeMarkers() {
    const markers = markerGroup.selectAll('.spiral-marker-g').data(module.currentDistances, d => d);
    markers.exit().transition().duration(300).style('opacity', 0).remove();
    const enter = markers.enter().append('g').attr('class', 'spiral-marker-g').style('opacity', 0);
    enter.append('circle').attr('class', 'spiral-marker').style('cursor', 'pointer').style('transition', 'all 0.3s');
    enter.append('text').attr('class', 'spiral-marker-label').attr('text-anchor', 'middle').attr('dy', -15).style('font-size', '12px').style('font-weight', 'bold').style('fill', '#2c3e50').style('pointer-events', 'none');
    const all = enter.merge(markers);
    all.transition().duration(500).style('opacity', 1).attr('transform', d => {
        const r = milesToRadius(d);
        const t = radiusToTheta(r);
      const maxDist = module.currentMode === 'urban' ? 1 : 20;
      const maxR = milesToRadius(maxDist);
      const tMax = radiusToTheta(maxR);
      const angleOffset = -tMax - Math.PI / 2;
      const angle = t + angleOffset;
      const x = module.center.x + r * Math.cos(angle);
      const y = module.center.y + r * Math.sin(angle);
        return `translate(${x},${y})`;
      });
    all.select('circle').transition().duration(500).attr('r', 10).attr('fill', d => getColorForDistance(d, module.currentMode)).attr('stroke', '#fff').attr('stroke-width', 2);
    all.select('.spiral-marker-label').transition().duration(500).attr('fill', d => getColorForDistance(d, module.currentMode)).text(d => `${d} mi`);
    all.select('circle').style('cursor', 'pointer').on('click', function(event, d) {
      event.stopPropagation();
      if (module.selectedDistance === d) {
        module.selectedDistance = null;
        d3.selectAll('.spiral-marker-g circle').transition().duration(200).attr('r', 10).attr('stroke-width', 2);
        d3.select('#spiral-food-popup').transition().duration(200).style('opacity', 0).remove();
      } else {
        module.selectedDistance = d;
        d3.selectAll('.spiral-marker-g circle').transition().duration(200).attr('r', 10).attr('stroke-width', 2);
        d3.select(this).transition().duration(200).attr('r', 14).attr('stroke-width', 3);
        showFoodSidebar(event, d, module.currentMode);
      }
    }).on('mouseenter', function() {
      if (module.selectedDistance === null) {
        d3.select(this).transition().duration(200).attr('r', 12).attr('stroke-width', 2.5);
      }
    }).on('mouseleave', function() {
      if (module.selectedDistance === null) {
        d3.select(this).transition().duration(200).attr('r', 10).attr('stroke-width', 2);
      }
    });
  }

  function showFoodSidebar(event, distance, mode) {
    d3.select('#spiral-food-popup').remove();
    const foods = foodImages[mode][distance] || [];
    const hasNoFood = foods === null || (foods.length === 1 && foods[0].includes('nothing.jpg'));
    const popup = container.append('div').attr('id', 'spiral-food-popup').attr('class', 'spiral-food-popup').style('width', '100%').style('max-width', '800px').style('margin', '0.5rem auto 0').style('background', 'white').style('border-radius', '12px').style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)').style('padding', '0').style('opacity', '0');
    const header = popup.append('div').attr('class', 'panel-header').style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)').style('color', 'white').style('padding', '25px').style('text-align', 'center');
    header.append('h2').style('font-size', '24px').style('margin-bottom', '5px').style('font-weight', 'bold').text(`Food options within a ${distance} mile${distance !== 1 ? 's' : ''} radius`);
    const content = popup.append('div').attr('class', 'panel-content').style('padding', '25px');
    if (hasNoFood) {
      const noFoodContainer = content.append('div').style('text-align', 'center').style('padding', '2rem 0');
      noFoodContainer.append('div').style('font-size', '1.5rem').style('font-weight', 'bold').style('color', '#2c3e50').style('margin-top', '1rem').text('No convenience stores or fast food options');
    } else {
      const imageGrid = content.append('div').style('display', 'grid').style('grid-template-columns', 'repeat(auto-fit, minmax(250px, 1fr))').style('gap', '1.5rem').style('max-width', '100%');
      foods.forEach((imagePath) => {
        const imgContainer = imageGrid.append('div').style('border-radius', '12px').style('overflow', 'visible').style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)').style('background', 'white').style('display', 'flex').style('flex-direction', 'column').style('align-items', 'center');
        imgContainer.append('img').attr('src', imagePath).attr('alt', 'Food option').style('width', '100%').style('max-width', '250px').style('height', 'auto').style('object-fit', 'contain').style('display', 'block').style('padding', '10px');
      });
    }
    popup.transition().duration(300).style('opacity', '1');
  }

  function render() {
    module.viewW = Math.max(600, viz.node().clientWidth || 650);
    module.viewH = Math.max(600, viz.node().clientHeight || 650);
    svg.attr('viewBox', `0 0 ${module.viewW} ${module.viewH}`);
    module.center = { x: module.viewW / 2, y: module.viewH / 2 };
    module.maxVisualRadius = Math.min(module.viewW, module.viewH) * 0.42;
    const line = d3.line();
    svg.select('.spiral-path').transition().duration(500).attr('d', line(buildSpiralPoints()));
    placeMarkers();
  }

  function switchMode(mode) {
    module.currentMode = mode;
    module.currentDistances = mode === 'urban' ? module.urbanDistances : module.ruralDistances;
    if (mode === 'urban') {
      locationDisplay.text('Maxwell Park, California');
      urbanBtn.style('background', '#667eea').style('color', 'white');
      ruralBtn.style('background', 'white').style('color', '#667eea');
    } else {
      locationDisplay.text('Baldwin, Florida');
      ruralBtn.style('background', '#667eea').style('color', 'white');
      urbanBtn.style('background', 'white').style('color', '#667eea');
    }
    module.selectedDistance = null;
    d3.select('#spiral-food-popup').transition().duration(200).style('opacity', 0).remove();
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
}

function createDistanceSlider(containerId, dataPath) {
  const distancesByFilter = {
    both: [0.5, 1, 10, 20],
    urban: [0.5, 1],
    rural: [10, 20]
  };

  const distanceColumns = {
    all: { 0.5: 'LAhalfand10', 1: 'LA1and10', 10: 'LA1and10', 20: 'LA1and20' },
    lowincome: { 0.5: 'LILATracts_halfAnd10', 1: 'LILATracts_1And10', 10: 'LILATracts_1And10', 20: 'LILATracts_1And20' }
  };

  let currentDistance = 0.5, currentGeoFilter = 'both', currentIncomeFilter = 'all', allData = [], allDistanceData = {};
  const container = d3.select(containerId);
  if (container.empty()) { console.error(`Container ${containerId} not found`); return null; }

  const wrapper = container.append('div').attr('class', 'slider-wrapper');
  const geoToggleContainer = wrapper.append('div').attr('class', 'slider-toggle-container primary-toggle');
  geoToggleContainer.append('button').attr('class', 'slider-toggle-btn active').attr('data-filter', 'both').text('Both');
  geoToggleContainer.append('button').attr('class', 'slider-toggle-btn').attr('data-filter', 'urban').text('Urban');
  geoToggleContainer.append('button').attr('class', 'slider-toggle-btn').attr('data-filter', 'rural').text('Rural');

  const incomeToggleContainer = wrapper.append('div').attr('class', 'slider-toggle-container secondary-toggle');
  incomeToggleContainer.append('button').attr('class', 'slider-toggle-btn income-btn active').attr('data-filter', 'all').text('All Income Levels');
  incomeToggleContainer.append('button').attr('class', 'slider-toggle-btn income-btn').attr('data-filter', 'lowincome').text('Low-Income Only');

  const infoDisplay = wrapper.append('div').attr('class', 'slider-info-display');
  const tractCount = infoDisplay.append('div').attr('class', 'slider-tract-count').text('0').style('font-size', '64px');
  const distanceLabel = infoDisplay.append('div').attr('class', 'slider-distance-label').text('at ½ mile').style('font-size', '20px');

  // Get container width for responsive sizing - use full available width
  const containerWidth = container.node().offsetWidth || window.innerWidth - 100;
  const sliderWidth = containerWidth - 100, sliderHeight = 120, sliderMargin = { top: 25, right: 100, left: 100, bottom: 50 };
  const sliderSvg = wrapper.append('svg').attr('class', 'slider-svg').attr('viewBox', `0 0 ${sliderWidth} ${sliderHeight}`).attr('preserveAspectRatio', 'xMidYMid meet').style('width', '100%').style('max-width', '100%');
  const sliderG = sliderSvg.append('g').attr('transform', `translate(${sliderMargin.left}, ${sliderMargin.top})`);
  const sliderInnerWidth = sliderWidth - sliderMargin.left - sliderMargin.right;
  const track = sliderG.append('line').attr('class', 'slider-track').attr('y1', 35).attr('y2', 35);
  const markerGroup = sliderG.append('g').attr('class', 'marker-group');
  const handle = sliderG.append('g').attr('class', 'slider-handle').style('cursor', 'grab');
  handle.append('circle').attr('r', 16).attr('class', 'slider-handle-circle');
  handle.append('text').attr('class', 'slider-handle-text').attr('text-anchor', 'middle').attr('dy', 5).style('font-size', '14px');

  const barChartWidth = containerWidth - 100, barChartHeight = 350, barMargin = { top: 50, right: 100, left: 120, bottom: 80 };
  const barSvg = wrapper.append('svg').attr('class', 'bar-chart-svg').attr('viewBox', `0 0 ${barChartWidth} ${barChartHeight}`).attr('preserveAspectRatio', 'xMidYMid meet').style('width', '100%').style('max-width', '100%');
  const barG = barSvg.append('g').attr('transform', `translate(${barMargin.left}, ${barMargin.top})`);
  const barInnerWidth = barChartWidth - barMargin.left - barMargin.right, barInnerHeight = barChartHeight - barMargin.top - barMargin.bottom;
  const xBarScale = d3.scaleBand().range([0, barInnerWidth]).padding(0.3);
  const yBarScale = d3.scaleLinear().range([barInnerHeight, 0]);
  const xAxis = barG.append('g').attr('class', 'bar-x-axis').attr('transform', `translate(0, ${barInnerHeight})`);
  const yAxis = barG.append('g').attr('class', 'bar-y-axis');
  barG.append('text').attr('class', 'bar-y-label').attr('transform', 'rotate(-90)').attr('y', -60).attr('x', -barInnerHeight / 2).attr('text-anchor', 'middle').text('Number of Tracts');

  function getScale() {
    if (currentGeoFilter === 'urban') {
      return d3.scaleLinear().domain([0.5, 1]).range([0, sliderInnerWidth]).clamp(true);
    } else if (currentGeoFilter === 'rural') {
      return d3.scaleLinear().domain([10, 20]).range([0, sliderInnerWidth]).clamp(true);
    } else {
      return d3.scaleLog().domain([0.5, 20]).range([0, sliderInnerWidth]).clamp(true);
    }
  }

  const drag = d3.drag().on('start', function() { d3.select(this).style('cursor', 'grabbing'); }).on('drag', function(event) {
      const xScale = getScale();
      const distances = distancesByFilter[currentGeoFilter];
      const mouseX = Math.max(0, Math.min(sliderInnerWidth, event.x));
      const newDistance = xScale.invert(mouseX);
      let closestDistance = distances[0];
      let minDiff = Math.abs(distances[0] - newDistance);
      distances.forEach(d => {
        const diff = Math.abs(d - newDistance);
      if (diff < minDiff) { minDiff = diff; closestDistance = d; }
    });
    if (closestDistance !== currentDistance) { currentDistance = closestDistance; updateVisualization(); }
  }).on('end', function() { d3.select(this).style('cursor', 'grab'); });

  handle.call(drag);

  geoToggleContainer.selectAll('.slider-toggle-btn').on('click', function() {
      geoToggleContainer.selectAll('.slider-toggle-btn').classed('active', false);
      d3.select(this).classed('active', true);
      const newFilter = d3.select(this).attr('data-filter');
      if (newFilter !== currentGeoFilter) {
        currentGeoFilter = newFilter;
        const newDistances = distancesByFilter[currentGeoFilter];
        currentDistance = newDistances[0];
        updateVisualization();
      }
    });

  incomeToggleContainer.selectAll('.slider-toggle-btn').on('click', function() {
      incomeToggleContainer.selectAll('.slider-toggle-btn').classed('active', false);
      d3.select(this).classed('active', true);
      const newFilter = d3.select(this).attr('data-filter');
    if (newFilter !== currentIncomeFilter) { currentIncomeFilter = newFilter; updateVisualization(); }
  });

  function calculateAllData() {
    allDistanceData = {};
    ['all', 'lowincome'].forEach(incomeLevel => {
      allDistanceData[incomeLevel] = {};
      [0.5, 1, 10, 20].forEach(dist => {
        const column = distanceColumns[incomeLevel][dist];
        const allTracts = allData.filter(row => row[column] && +row[column] > 0);
        const urbanData = allTracts.filter(row => {
          const urbanValue = row.Urban !== undefined && row.Urban !== null && row.Urban !== '' ? +row.Urban : null;
          return urbanValue === 1;
        });
        const ruralData = allTracts.filter(row => {
          const urbanValue = row.Urban !== undefined && row.Urban !== null && row.Urban !== '' ? +row.Urban : null;
          return urbanValue === 0;
        });
        let bothCount, urbanCount, ruralCount;
        if (dist === 0.5 || dist === 1) {
          bothCount = urbanData.length;
          urbanCount = urbanData.length;
          ruralCount = 0;
        } else if (dist === 10 || dist === 20) {
          bothCount = ruralData.length;
          urbanCount = 0;
          ruralCount = ruralData.length;
        } else {
          bothCount = allTracts.length;
          urbanCount = urbanData.length;
          ruralCount = ruralData.length;
        }
        allDistanceData[incomeLevel][dist] = { both: bothCount, urban: urbanCount, rural: ruralCount };
      });
    });
  }

  function updateVisualization() {
    const distances = distancesByFilter[currentGeoFilter];
    const xScale = getScale();
    track.attr('x1', 0).attr('x2', sliderInnerWidth);
    const markers = markerGroup.selectAll('.slider-marker').data(distances, d => d);
    markers.exit().remove();
    const markersEnter = markers.enter().append('g').attr('class', 'slider-marker');
    markersEnter.append('circle').attr('r', 6).attr('class', 'slider-marker-circle');
    markersEnter.append('text').attr('class', 'slider-marker-text').attr('y', 20).attr('text-anchor', 'middle');
    const markersAll = markersEnter.merge(markers);
    markersAll.transition().duration(500).attr('transform', d => `translate(${xScale(d)}, 35)`);
    markersAll.select('text').text(d => d === 0.5 ? '½ mi' : `${d} mi`).style('font-size', '13px');
    markersAll.select('circle').attr('class', d => d === currentDistance ? 'slider-marker-circle active' : 'slider-marker-circle').attr('r', d => d === currentDistance ? 8 : 6);
    handle.transition().duration(500).attr('transform', `translate(${xScale(currentDistance)}, 35)`);
    handle.select('.slider-handle-text').text(currentDistance === 0.5 ? '½' : currentDistance);
    const count = allDistanceData[currentIncomeFilter][currentDistance][currentGeoFilter];
    tractCount.text(count.toLocaleString());
    const geoText = currentGeoFilter === 'both' ? '' : currentGeoFilter === 'urban' ? ' urban' : ' rural';
    const incomeText = currentIncomeFilter === 'lowincome' ? ' low-income' : '';
    distanceLabel.text(`${geoText}${incomeText} tracts with low access at ${currentDistance === 0.5 ? '½' : currentDistance} mile${currentDistance > 1 ? 's' : ''}`);

    const barData = distances.map(d => ({
      distance: d,
      label: d === 0.5 ? '½ mi' : `${d} mi`,
      count: allDistanceData[currentIncomeFilter][d][currentGeoFilter],
      isActive: d === currentDistance
    }));
    xBarScale.domain(barData.map(d => d.label));
    const maxCount = d3.max(barData, d => d.count);
    yBarScale.domain([0, maxCount * 1.1]);
    xAxis.transition().duration(500).call(d3.axisBottom(xBarScale));
    yAxis.transition().duration(500).call(d3.axisLeft(yBarScale).ticks(5).tickFormat(d3.format('.2s')));

    const bars = barG.selectAll('.bar').data(barData, d => d.distance);
    bars.exit().remove();
    const barsEnter = bars.enter().append('rect').attr('class', 'bar').attr('x', d => xBarScale(d.label)).attr('y', barInnerHeight).attr('width', xBarScale.bandwidth()).attr('height', 0);
    barsEnter.merge(bars).transition().duration(500).attr('class', d => d.isActive ? 'bar active' : 'bar').attr('x', d => xBarScale(d.label)).attr('width', xBarScale.bandwidth()).attr('y', d => yBarScale(d.count)).attr('height', d => barInnerHeight - yBarScale(d.count));
  }

  d3.csv(dataPath).then(data => {
    allData = data;
    console.log(`Distance slider loaded ${data.length} rows`);
    calculateAllData();
    updateVisualization();
  }).catch(err => {
    console.error('Error loading data for distance slider:', err);
    tractCount.text('Error');
    distanceLabel.text('Could not load data');
  });
}

// ============================================
// CAROUSEL FUNCTIONALITY (Integrated)
// ============================================

class DashboardCarousel {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 5;
        this.isTransitioning = false;
        this.transitionDuration = 500; // ms
        
        this.carouselWrapper = document.querySelector('.carousel-wrapper');
        this.slides = document.querySelectorAll('.carousel-slide');
        this.prevBtn = document.querySelector('.carousel-btn.prev-btn');
        this.nextBtn = document.querySelector('.carousel-btn.next-btn');
        this.indicators = document.querySelectorAll('.indicator');
        
        if (this.carouselWrapper) {
            this.init();
        }
    }

    init() {
        // Initialize event listeners
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Indicator click handlers
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Touch/swipe support
        let touchStartX = 0;
        this.carouselWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.carouselWrapper.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (diff > 50) {
                this.nextSlide();
            } else if (diff < -50) {
                this.previousSlide();
            }
        });

        // Set initial state
        this.updateSlide();
    }

    goToSlide(index) {
        if (index >= 0 && index < this.totalSlides && !this.isTransitioning) {
            this.currentSlide = index;
            this.updateSlide();
        }
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1 && !this.isTransitioning) {
            this.currentSlide++;
            this.updateSlide();
        }
    }

    previousSlide() {
        if (this.currentSlide > 0 && !this.isTransitioning) {
            this.currentSlide--;
            this.updateSlide();
        }
    }

    updateSlide() {
        this.isTransitioning = true;

        // Calculate transform
        const offset = -this.currentSlide * 100;
        this.carouselWrapper.style.transform = `translateX(${offset}%)`;

        // Update button states
        this.prevBtn.disabled = this.currentSlide === 0;
        this.nextBtn.disabled = this.currentSlide === this.totalSlides - 1;

        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });

        // Hide reset button if not on slide 4 (index 3)
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            if (this.currentSlide !== 3) {
                resetButton.classList.remove('visible');
            } else {
                // Reset maps when returning to slide 4
                if (typeof resetBothMaps === 'function') {
                    resetBothMaps();
                }
            }
        }

        // Trigger specific visualization rendering for each slide
        setTimeout(() => {
            this.renderSlideContent();
        }, 300);

        // Trigger resize for D3 visualizations
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, this.transitionDuration);

        // Reset transition flag
        setTimeout(() => {
            this.isTransitioning = false;
        }, this.transitionDuration);
    }

    renderSlideContent() {
        // Re-render or refresh visualizations when slide becomes visible
        switch(this.currentSlide) {
            case 1: // Slide 2: Spiral visualization
                console.log('Rendering slide 2 - Spiral');
                const spiralContainer = document.getElementById('spiral-container');
                if (spiralContainer && spiralContainer.offsetParent !== null) {
                    // Trigger window resize to refresh D3
                    window.dispatchEvent(new Event('resize'));
                }
                break;
            case 2: // Slide 3: Distance slider
                console.log('Rendering slide 3 - Distance slider');
                const sliderContainer = document.getElementById('distance-slider-container');
                if (sliderContainer && sliderContainer.offsetParent !== null) {
                    // Trigger window resize to refresh D3
                    window.dispatchEvent(new Event('resize'));
                }
                break;
            case 3: // Slide 4: Maps
                console.log('Rendering slide 4 - Maps');
                const mapLeft = document.querySelector('#map-left svg');
                const mapRight = document.querySelector('#map-right svg');
                if (mapLeft || mapRight) {
                    window.dispatchEvent(new Event('resize'));
                }
                break;
            case 6: // Slide 5: Community orgs
                console.log('Rendering slide 7 - Community organizations');
                window.dispatchEvent(new Event('resize'));
                break;
        }
    }

    handleKeyboard(e) {
        if (e.key === 'ArrowRight') {
            this.nextSlide();
        } else if (e.key === 'ArrowLeft') {
            this.previousSlide();
        }
    }

    getCurrentSlide() {
        return this.currentSlide;
    }
}

// Initialize carousel when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.carousel = new DashboardCarousel();
    console.log('Carousel initialized with', window.carousel.totalSlides, 'slides');
});