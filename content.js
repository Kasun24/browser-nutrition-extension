console.log("✅ content.js is running");

// Define a list of common food names to improve accuracy
const foodDictionary = [
    "burger", "pizza", "sandwich", "wrap", "nuggets", "fries", "salad",
    "pasta", "hotdog", "donut", "cheeseburger", "sushi", "burrito", "steak",
    "fish", "beef", "noodles", "rice", "taco", "falafel", "shawarma", "kebab",
    "wings", "cheese", "sausage", "panini", "gyro", "quesadilla", "ramen",
    "curry", "muffin", "bagel", "toast", "lasagna", "dimsum", "dumplings", "spring rolls"
];

// Function to detect food names using AI (compromise.js)
function detectFoodNamesWithAI() {
    let elements = document.querySelectorAll("p, h1, h2, h3, h4, span, div");
    let foodItems = [];

    elements.forEach(el => {
        let text = el.innerText.trim();
        
        // Process text using NLP
        let doc = nlp(text);
        let detectedWords = doc.nouns().text().toLowerCase().split(" "); // Extract detected nouns
        
        // Filter out non-food words
        let filteredFood = detectedWords.filter(word => foodDictionary.includes(word));

        if (filteredFood.length > 0) {
            let foodName = filteredFood.join(" "); // Join multiple words if needed
            foodItems.push({ element: el, name: foodName });
        }
    });

    console.log("🍔 AI Detected Food Names (Filtered):", foodItems);
    insertNutritionButtons(foodItems);
}

// Function to add buttons next to detected food items
function insertNutritionButtons(foodItems) {
    foodItems.forEach(item => {
        let button = document.createElement("button");
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
            console.log("🍽️ Fetching Nutrition for:", item.name);
            fetchNutritionData(item.name);
        });

        item.element.appendChild(button);
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
    .then(response => response.json())
    .then(data => {
        if (data.foods && data.foods.length > 0) {
            showNutritionPopup(data.foods[0]);
        } else {
            alert("⚠️ No nutrition data found for " + foodName);
        }
    })
    .catch(error => {
        console.error("❌ API Request Failed:", error);
        alert("❌ Nutrition API failed.");
    });
}

// Function to show popup with nutrition info
function showNutritionPopup(foodData) {
    let popup = document.createElement("div");
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
            <button onclick="this.parentElement.remove()">❌ Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}

// Start AI-based food detection
detectFoodNamesWithAI();
