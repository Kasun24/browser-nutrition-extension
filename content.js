console.log("✅ content.js is running");

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

// Website-specific food name selectors
const websiteSelectors = {
  "ubereats.com": ".db.dc.dd.de.b1", // UberEats - Corrected to ignore prices
  "mcdonalds.com": "div.cmp-category__item-name, h2.product-title",
  "kfc.com": "h3.menu-item-name, div.product-name",
  "burgerking.com": "h2.menu-item-title, span.food-name",
};

// Function to clean text and remove non-food words
function cleanText(text) {
  text = text.toLowerCase().trim();
  return uiBlacklist.some((word) => text.includes(word)) ? "" : text;
}

// Function to detect which website the user is on
function getWebsite() {
  let hostname = window.location.hostname;
  for (let site in websiteSelectors) {
    if (hostname.includes(site)) {
      return site;
    }
  }
  return "unknown";
}

// Extract food names from selected elements dynamically
function detectFoodNames() {
  let detectedFoodItems = new Map();
  let currentWebsite = getWebsite();

  let elements;
  if (currentWebsite !== "unknown") {
    console.log(`🟢 Using predefined food selectors for: ${currentWebsite}`);
    elements = document.querySelectorAll(websiteSelectors[currentWebsite]);
  } else {
    console.log("🟠 No predefined structure. Using general detection.");
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

  console.log("🍔 Food Names Detected:", detectedFoodItems);
  insertNutritionButtons(detectedFoodItems);
}

// Button Placement Improvement
function insertNutritionButtons(foodItems) {
  foodItems.forEach((element, foodName) => {
    if (element.querySelector(".nutrition-btn")) return; // Prevent duplicate buttons

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

    button.addEventListener("click", function () {
      console.log("🍽️ Fetching Nutrition for:", foodName);
      fetchNutritionData(foodName);
    });

    element.appendChild(button);
  });
}

// Function to fetch nutrition data from API
function fetchNutritionData(foodName) {
  console.log("📢 Fetching nutrition for:", foodName);

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
      alert("❌ Nutrition API failed.");
    });
}

// Function to show popup with nutrition info
function showNutritionPopup(foodData) {
  let popup = document.createElement("div");
  popup.id = "nutrition-popup";
  popup.innerHTML = `
        <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        background:white; padding:15px; box-shadow:0px 4px 6px rgba(0,0,0,0.1); border-radius:10px;
        z-index:9999; min-width:250px; text-align:center;">
            <h3>${foodData.food_name}</h3>
            <p>Calories: ${foodData.nf_calories} kcal</p>
            <p>Protein: ${foodData.nf_protein}g</p>
            <p>Carbs: ${foodData.nf_total_carbohydrate}g</p>
            <p>Fat: ${foodData.nf_total_fat}g</p>
            <img src="${foodData.photo.thumb}" alt="Food Image">
            <br><br>
            <button id="close-popup">❌ Close</button>
        </div>
    `;
  document.body.appendChild(popup);

  document.getElementById("close-popup").addEventListener("click", function () {
    document.getElementById("nutrition-popup").remove();
  });
}

// Run detection
detectFoodNames();
