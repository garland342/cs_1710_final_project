# Mapping the Weight of Distance  
**CS 1710 Final Project – Food Insecurity, Health, and Distance in the U.S.**

This project is an interactive, story-driven visualization that explores how **food insecurity**, **chronic health outcomes**, and **distance to food resources** intersect across the United States. It combines a narrative slide carousel with multiple D3-based visualizations to help users:

- Understand what food deserts are and where they occur.
- Compare food insecurity to health outcomes across states and counties.
- Explore how distance to grocery stores varies in urban vs. rural areas.
- Discover real-world organizations working on hunger and mental health.

The site is entirely front-end (HTML/CSS/JS) and runs as a static, data-driven web page.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Key Visual Components](#key-visual-components)  
   - [Narrative Carousel](#narrative-carousel)
   - [Food Access Spiral](#food-access-spiral)  
   - [Distance Slider Visualization](#distance-slider-visualization)    
   - [Dual Map Dashboard](#dual-map-dashboard-food-insecurity-vs-health-outcomes)  
   - [Community Organizations Grid](#community-organizations-grid)  
3. [Data Sources](#data-sources)  
4. [Tech Stack](#tech-stack)  
5. [Project Structure](#project-structure)  
6. [Getting Started](#getting-started)  
7. [Configuration & Customization](#configuration--customization)  
8. [Team](#team)

---

## Project Overview

**Goal:**  
To illustrate how **food insecurity** is correlated with negative health outcomes (especially **diabetes**, **depression**, and **high blood pressure**), with a particular emphasis on how these burdens fall unevenly across regions—especially in the **South** and **West**.

The experience is structured as a narrative slideshow. As the user moves through the slides, they encounter several interactive visualizations that deepen the story:

- A definition and framing of food deserts.
- A spiral plot that qualitatively encodes distance to food access.
- A distance slider that quantitatively encodes distance to food access.
- A dual map dashboard that compares food insecurity to health outcomes with contextual panels.
- An action-oriented slide highlighting organizations and resources.

---

## Key Visual Components

### Narrative Carousel

The entire page is organized as a **carousel of slides**, each representing a section of the story. The carousel:

- Is controlled by **Next/Previous** buttons and/or clickable navigation elements.
- Includes a **“Back to National View”** button at the top for quickly resetting the main maps.
- Uses distinct layout sections for text, images, and visualizations (maps, spiral, organizations grid, etc.).

**Slides (high level):**

1. **Title & Introduction**  
   - “Mapping the Weight of Distance: How Poverty, Health, and Hunger Intersect in America.”
   - Introduces the core question: how distance, poverty, and health stack together.

2. **What Is a Food Desert?**  
   - Defines food deserts and explains why distance + transportation + income are key.

3. **Food Access Spiral**  
   - Visually encodes distances to grocery stores in urban vs. rural contexts.
  
4. **Distance Slider & Story**  
   - Interactive slider that shows how changing distance thresholds changes who is “close” or “far” from food.

5. **Dual Map Dashboard**  
   - Side-by-side maps: food insecurity vs. health outcomes by county/state.

6. **Communities Leading the Way**  
   - Grid of organizations (e.g., Feeding America, NAMI, Wholesome Wave) with clickable logos.

7. **Meet the Team**  
   - Final slide with team member bios/headshots.

--- 

### Food Access Spiral

Implemented in **`js/main.js`** (`createSpiralVisualization`).

**Purpose:**  
To show how **distance to the nearest grocery store** changes what “access” means for **urban** vs **rural** communities.

**Data:**  
Uses `data/food_access.csv`, which includes indicators of:

- Distance to nearest grocery store.
- Urban vs. rural categories.
- Quality of food options at certain distance thresholds.

**Behavior:**

- The spiral is drawn in an SVG using a parametric spiral (`r = a + bθ`) with configurable parameters (`a`, `b`).
- Points or segments along the spiral correspond to **distance buckets** (e.g., 0.1, 0.3, 0.5, 1 mile for urban; 2, 5, 10, 20 miles for rural).
- A mode toggle switches between:
  - **Urban distances**
  - **Rural distances**
- On interaction (e.g., clicking a distance), the visualization:
  - Highlights the selected distance.
  - Updates to show food options at that threshold.

This view emphasizes that for both urban and rural food deserts, food quality increases with distance.

---

### Distance Slider Visualization

Also in **`js/main.js`** (`createDistanceSlider`).

**Purpose:**  
To add a quantititave, data-driven lens to exploring the same distance thresholds used in the spiral visualization.

**Behavior:**

- Slider is bound to distance values from `data/food_access.csv`.
- As the slider moves:
  - Textual explanations update: e.g., “X tracts with low access at Y miles”
  - Simple bar/indicator visuals adjust to reflect the new threshold.
- This complements the spiral by giving a direct, numeric interaction.

---

---

### Dual Map Dashboard: Food Insecurity vs Health Outcomes

Implemented primarily in **`js/map.js`**.

**Data:**  
Uses `data/agg_health.csv`, which includes:

- Food insecurity estimates (`FOODINSECU_CrudePrev`).
- Health outcomes (e.g., `DIABETES_CrudePrev`, `DEPRESSION_CrudePrev`, `BPHIGH_CrudePrev`).
- Geography fields (`StateDesc`, `CountyName`).

**Layout:**

- **Left map:** Always shows **food insecurity** (baseline metric).
- **Right map:** Shows a **selectable health outcome** using a dropdown:
  - Diabetes prevalence (`DIABETES_CrudePrev`)
  - Depression prevalence (`DEPRESSION_CrudePrev`)
  - High blood pressure prevalence (`BPHIGH_CrudePrev`)

**Key interactions:**

- **Hover:** Tooltips display the state/county and metric values.
- **Click a state:**  
  - Zooms both maps into that state.  
  - Filters bar charts and info panels to that state.  
  - Shows the “← Back to National View” reset button.
- **Reset button (`#reset-button`):**
  - Calls `resetBothMaps()` in `map.js`.
  - Returns to full national view.
  - Resets zoom and restores the default info panel.

**Color scales & legends:**

- Uses D3 color interpolators (`d3.interpolateBlues`, `d3.interpolateGreens`, `d3.interpolatePurples`, `d3.interpolateReds`).
- Each metric has its own legend so users can interpret relative values.

**Bar charts and regions:**

- The map code computes **state-level** and **regional-level** aggregations.
- States are grouped into **Northeast, Midwest, South, West** via a `stateToRegion` mapping.
- A toggle (e.g., “State” vs “Region”) switches the bar charts between:
  - **State-level bars** (within an individual state, when zoomed).
  - **Regional bars** (aggregate across all states in a region).
- This highlights how **the South and West** often bear a higher combined burden of food insecurity and chronic disease.

---

### Community Organizations Grid

Defined in **`js/main.js`** as `const communityOrgs = [...]`.

**Purpose:**  
To connect data and visualization back to **real-world action** by highlighting organizations working on food insecurity and mental health.

**Behavior:**

- Displays logos in a responsive grid/circle layout that feels like a Voronoi / bubble chart hybrid.
- Each logo is:
  - Rendered as a circle image.
  - Clickable – opens the organization’s website in a new tab.
- Current set includes organizations like:
  - **Feeding America**
  - **Food for Thought**
  - **Active Minds**
  - **Feed the Children**
  - etc.

This slide encourages users to move from awareness to engagement.

---

## Data Sources

The data files live in `data/`:

- `agg_health.csv`  
  - Aggregated state/county level data on:
    - Food insecurity (`FOODINSECU_CrudePrev`)
    - Diabetes, depression, high blood pressure, and other health outcomes.
  - Combined from health datasets and food access sources (see PDFs for full inventory).

- `food_access.csv`  
  - Distance-based food access metrics (urban vs. rural).
  - Used for the spiral and distance slider visualizations.

Additional documentation about how these were cleaned / merged is in:

- `Updated Aggregate Health Data.pdf`
- `Updated Food Access Data.pdf`
- `Process Book 1710 (Dani, Garland, and Oscar).pdf`

---

## Tech Stack

- **HTML5** — Main structure (`index.html`)
- **CSS3** — Styling (`css/styles.css`)
- **JavaScript (ES6+)**  
  - D3.js v7 (`https://d3js.org/d3.v7.min.js`)
  - TopoJSON (`https://d3js.org/topojson.v3.min.js`)
  - Custom scripts:
    - `js/map.js` – dual map dashboard + bar charts
    - `js/main.js` – carousel logic, spiral, slider, organizations grid

No backend or database is required; this is a static front-end project.

---

## Project Structure

```text
cs_1710_final_project/
├── index.html                      # Main entry point
├── css/
│   └── styles.css                  # Page-wide styling
├── js/
│   ├── map.js                      # Dual map dashboard + bar charts
│   └── main.js                     # Carousel, spiral, slider, orgs grid
├── data/
│   ├── agg_health.csv              # Food insecurity + health metrics
│   └── food_access.csv             # Distance-based food access metrics
├── images/                         # Images, logos, maps
│   ├── ...                         # e.g., org logos, background photos
├── finalvideo171.mov               # Final presentation video (optional)
├── Updated Aggregate Health Data.pdf
├── Updated Food Access Data.pdf
├── Process Book 1710 (...).pdf     # Design and process documentation
└── .gitignore
