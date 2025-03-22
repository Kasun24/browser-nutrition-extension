// UI Blacklist to remove non-food words (e.g., prices, menu sections)
const uiBlacklist = [
  "rs",
  "total",
  "checkout",
  "subtotal",
  "discount",
  "order",
  "menu",
  "price",
  "cart",
];

// Website-specific food name selectors (supports .lk, .uk, etc.)
const websiteSelectors = [
  {
    domain: "ubereats",
    selector: '[data-testid="rich-text"]',
  },
  {
    domain: "mcdonalds",
    selector: "div.cmp-category__item-name, h2.product-title",
  },
  {
    domain: "kfc",
    selector: "h3.menu-item-name, div.product-name",
  },
  {
    domain: "burgerking",
    selector: "h2.menu-item-title, span.food-name",
  },
];

// Function to clean text and remove non-food words
function cleanText(text) {
  text = text.toLowerCase().trim();
  return uiBlacklist.some((word) => text.includes(word)) ? "" : text;
}

// Function to find selector based on current hostname
function getWebsiteSelector() {
  const hostname = window.location.hostname;
  for (let site of websiteSelectors) {
    if (hostname.includes(site.domain)) {
      return site.selector;
    }
  }
  return null;
}

// Extract food names from selected elements dynamically
function detectFoodNames() {
  let detectedFoodItems = new Map();
  let selector = getWebsiteSelector();

  let elements;
  if (selector) {
    elements = document.querySelectorAll(selector);
  } else {
    console.warn("⚠️ No predefined structure. Using general detection.");
    elements = document.querySelectorAll(
      "p, h1, h2, h3, h4, span, div, a, li, strong"
    );
  }

  elements.forEach((el) => {
    let text = cleanText(el.innerText);
    if (!text || text.split(" ").length < 2) return; // Ensure at least 2 words in food name

    if (!detectedFoodItems.has(text)) {
      detectedFoodItems.set(text, el);
    }
  });

  insertNutritionButtons(detectedFoodItems);
}

// Button Placement
function insertNutritionButtons(foodItems) {
  foodItems.forEach((element, foodName) => {
    if (element.querySelector(".nutrition-btn")) return; // Avoid duplicates

    let button = document.createElement("button");
    button.className = "nutrition-btn";
    button.innerText = "🍔 Nutrition Info";
    button.style.marginLeft = "10px";
    button.style.padding = "5px";
    button.style.fontSize = "12px";
    button.style.cursor = "pointer";
    button.style.borderRadius = "5px";
    button.style.backgroundColor = "#007bff";
    button.style.color = "white";
    button.style.border = "none";

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      fetchNutritionData(foodName);
    });

    element.appendChild(button);
  });
}

// Function to fetch nutrition data from API
function fetchNutritionData(foodName) {
  showNutritionPopup(foodName); // 👈 Show popup immediately with loader

  const headers = {
    "x-app-id": window.CONFIG.APP_ID,
    "x-app-key": window.CONFIG.API_KEY,
    "Content-Type": "application/json",
  };

  fetch(window.CONFIG.API_URL, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ query: foodName }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.foods && data.foods.length > 0) {
        updateNutritionPopup(data.foods[0]); // 👈 Populate data after fetch
      } else {
        updateNutritionPopup({
          serving_weight_grams: "N/A",
          nf_calories: "N/A",
          nf_protein: "N/A",
          nf_total_carbohydrate: "N/A",
          nf_total_fat: "N/A",
        });
      }
    })
    .catch((error) => {
      console.error("API Request Failed:", error);
      updateNutritionPopup({
        serving_weight_grams: "N/A",
        nf_calories: "Error",
        nf_protein: "-",
        nf_total_carbohydrate: "-",
        nf_total_fat: "-",
      });
    });
}

// Function to show popup with nutrition info
function showNutritionPopup(foodName) {
  // Remove existing popup if any
  const existingPopup = document.getElementById("nutrition-popup");
  if (existingPopup) existingPopup.remove();

  // Create base popup with loading indicator
  const popup = document.createElement("div");
  popup.id = "nutrition-popup";
  popup.innerHTML = `
    <div class="card shadow-lg border-0" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%);
         z-index:9999; width:300px; font-family:sans-serif;">
      <div class="card-body text-center">
        <h5 class="card-title mb-3">${foodName}</h5>
        <div id="nutrition-loading">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3">Fetching nutrition info...</p>
        </div>
        <div id="nutrition-result" style="display:none;"></div>
        <button id="close-popup" class="btn btn-sm btn-danger mt-3">❌ Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  // Close handler
  document.getElementById("close-popup").addEventListener("click", () => {
    popup.remove();
  });
}

// Call this after fetch success
function updateNutritionPopup(foodData) {
  const loadingDiv = document.getElementById("nutrition-loading");
  const resultDiv = document.getElementById("nutrition-result");

  if (loadingDiv) loadingDiv.style.display = "none";
  if (!resultDiv) return;

  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <p><strong>Serving:</strong> ${foodData.serving_weight_grams}g</p>
    <p><strong>Calories:</strong> ${foodData.nf_calories} kcal</p>
    <p><strong>Protein:</strong> ${foodData.nf_protein}g</p>
    <p><strong>Carbs:</strong> ${foodData.nf_total_carbohydrate}g</p>
    <p><strong>Fat:</strong> ${foodData.nf_total_fat}g</p>
  `;
}

// Run detection
detectFoodNames();
