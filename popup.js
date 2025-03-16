import { CONFIG } from "./config.js";

// Listen for messages from content.js (Extracted Food Data)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "cartData") {
    console.log("Received cart data:", message.data);
    if (message.data.length > 0) {
      fetchNutritionData(message.data);
    } else {
      document.getElementById("apiResponse").innerText = "No food data found.";
    }
  }
});

// Function to Fetch Nutrition Data from API
async function fetchNutritionData(cartItems) {
  for (const item of cartItems) {
    const query = item.portionSize !== "unknown" ? `${item.portionSize} ${item.foodName}` : item.foodName;

    const headers = {
      "x-app-id": CONFIG.APP_ID,
      "x-app-key": CONFIG.API_KEY,
      "Content-Type": "application/json",
    };

    const requestBody = { query: query };

    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];

        // Append data for multiple items
        const resultHTML = `
          <strong>${food.food_name}</strong><br>
          Calories: ${food.nf_calories} kcal<br>
          Protein: ${food.nf_protein}g<br>
          Carbs: ${food.nf_total_carbohydrate}g<br>
          Fat: ${food.nf_total_fat}g<br>
          <img src="${food.photo.thumb}" alt="Food Image">
          <hr>
        `;

        document.getElementById("apiResponse").innerHTML += resultHTML;
      } else {
        document.getElementById("apiResponse").innerText = "No data found.";
      }
    } catch (error) {
      document.getElementById("apiResponse").innerText = "API Request Failed.";
      console.error("Error fetching API:", error);
    }
  }
}

// Debugging Button (Manual API Test - Still Available)
document.getElementById("testApi").addEventListener("click", async function () {
  const foodItem = document.getElementById("foodInput").value.trim();
  if (!foodItem) return;

  // Manually trigger API request if the user enters food
  fetchNutritionData([{ foodName: foodItem, portionSize: "unknown" }]);
});
