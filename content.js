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
  // Step 1: show spinner immediately
  showLoadingPopup(foodName);

  // Step 2: fetch data
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
        updateNutritionPopup(data.foods[0]);
      } else {
        updateNutritionPopup(null, "⚠️ No nutrition data found.");
      }
    })
    .catch((error) => {
      console.error("❌ API Request Failed:", error);
      updateNutritionPopup(null, "❌ Failed to fetch data.");
    });
}

function showLoadingPopup(foodName) {
  // Remove existing popup
  const old = document.getElementById("nutrition-popup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "nutrition-popup";
  popup.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.2);
    border-radius: 12px; z-index: 999999; min-width: 280px; text-align: center;
    font-family: Arial, sans-serif;
  `;

  popup.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">Fetching: ${foodName}</div>
    <div class="spinner" style="
      width: 40px; height: 40px;
      border: 4px solid #007bff;
      border-top: 4px solid transparent;
      border-radius: 50%;
      margin: 0 auto;
      animation: spin 1s linear infinite;
    "></div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  `;

  document.body.appendChild(popup);
}

function updateNutritionPopup(foodData, errorMsg = "") {
  const popup = document.getElementById("nutrition-popup");
  if (!popup) return;

  if (errorMsg) {
    popup.innerHTML = `<p>${errorMsg}</p><button onclick="document.getElementById('nutrition-popup').remove()" style="margin-top:10px; padding:8px 12px; background:crimson; color:white; border:none; border-radius:6px;">❌ Close</button>`;
    return;
  }

  popup.innerHTML = `
    <h3 style="margin-bottom: 10px; margin-top:0;"><b>${foodData.food_name}</b> (${foodData.serving_weight_grams}g)</h3>
    <p style="line-height: 1;"><b>Calories:</b> ${foodData.nf_calories} kcal</p>
    <p style="line-height: 1;"><b>Protein:</b> ${foodData.nf_protein}g</p>
    <p style="line-height: 1;"><b>Carbs:</b> ${foodData.nf_total_carbohydrate}g</p>
    <p style="line-height: 1;"><b>Fat:</b> ${foodData.nf_total_fat}g</p>
    <div style="text-align: center; margin-top: 15px;">
      <button onclick="document.getElementById('nutrition-popup').remove()" style="
        background-color: crimson;
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
      ">Close</button>
    </div>
  `;
}

// Run detection
detectFoodNames();
