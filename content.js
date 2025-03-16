function extractCartItems() {
    let items = [];

    // Find food item names (update selector to match the website)
    document.querySelectorAll(".cart, .item-name, .food-title, .menu-item-name").forEach(item => {
        let foodName = item.innerText.trim();
        let portionSize = detectPortionSize(foodName);

        // **Filter out invalid names (too short or contains numbers/prices)**
        if (foodName.length > 2 && !/\d/.test(foodName) && !foodName.includes("Rs.")) {
            items.push({ foodName, portionSize });
        }
    });

    console.log("✅ Extracted Food Items:", items);

    // ✅ Send only valid food names to `popup.js`
    chrome.runtime.sendMessage({ action: "cartData", data: items });
}

// Function to detect portion size from food name
function detectPortionSize(foodName) {
    if (foodName.toLowerCase().includes("large")) return "large";
    if (foodName.toLowerCase().includes("medium")) return "medium";
    if (foodName.toLowerCase().includes("small")) return "small";
    return "unknown";
}

// Run extraction when the page loads
window.onload = extractCartItems;
