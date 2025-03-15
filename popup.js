import { CONFIG } from './config.js';

document.getElementById("testApi").addEventListener("click", async function () {
    const foodItem = document.getElementById("foodInput").value.trim();
    if (!foodItem) return;

    const headers = {
        "x-app-id": CONFIG.APP_ID,
        "x-app-key": CONFIG.API_KEY,
        "Content-Type": "application/json"
    };

    const requestBody = { "query": foodItem };

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.foods && data.foods.length > 0) {
            const food = data.foods[0]; 
            document.getElementById("apiResponse").innerHTML = `
                <strong>${food.food_name}</strong><br>
                Calories: ${food.nf_calories} kcal<br>
                Protein: ${food.nf_protein}g<br>
                Carbs: ${food.nf_total_carbohydrate}g<br>
                Fat: ${food.nf_total_fat}g<br>
                <img src="${food.photo.thumb}" alt="Food Image">
            `;
        } else {
            document.getElementById("apiResponse").innerText = "No data found.";
        }
    } catch (error) {
        document.getElementById("apiResponse").innerText = "API Request Failed.";
        console.error("Error fetching API:", error);
    }
});
