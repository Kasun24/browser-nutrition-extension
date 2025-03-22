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
        showNutritionPopup(data.foods[0]);
      } else {
        alert("⚠️ No nutrition data found for " + foodName);
      }
    })
    .catch((error) => {
      console.error("❌ API Request Failed:", error);
    });
}

// Function to show popup with nutrition info
function showNutritionPopup(foodData) {
  // Prevent multiple popups
  const existingPopup = document.getElementById("nutrition-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  let popup = document.createElement("div");
  popup.id = "nutrition-popup";
  popup.innerHTML = `
    <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    background:white; padding:15px; box-shadow:0px 4px 6px rgba(0,0,0,0.1); border-radius:10px;
    z-index:9999; min-width:250px; text-align:center; pointer-events: auto;">
        <h3>${foodData.food_name} (${foodData.serving_weight_grams}g)</h3>
        <p>Calories: ${foodData.nf_calories} kcal</p>
        <p>Protein: ${foodData.nf_protein}g</p>
        <p>Carbs: ${foodData.nf_total_carbohydrate}g</p>
        <p>Fat: ${foodData.nf_total_fat}g</p>
        <img src="${foodData.photo.thumb}" alt="Food Image">
        <br><br>
        <button id="close-popup" style="padding:6px 10px; background:red; color:white; border:none; border-radius:4px;">❌ Close</button>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("close-popup").addEventListener("click", () => {
    popup.remove();
  });
}

// Run detection
detectFoodNames();
