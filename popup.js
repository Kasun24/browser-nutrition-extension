document.addEventListener("DOMContentLoaded", () => {
  const appIdInput = document.getElementById("appId");
  const apiKeyInput = document.getElementById("apiKey");
  const toggleCheckbox = document.getElementById("toggleExtension");
  const saveBtn = document.getElementById("saveBtn");
  const alertBox = document.getElementById("alertBox");

  // Load saved settings
  chrome.storage.local.get(["appId", "apiKey", "extensionEnabled"], (data) => {
    if (data.appId) appIdInput.value = data.appId;
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    toggleCheckbox.checked = data.extensionEnabled !== false;
  });

  // Save button click
  saveBtn.addEventListener("click", () => {
    const appId = appIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const extensionEnabled = toggleCheckbox.checked;

    if (!appId || !apiKey) {
      showAlert("App ID and API Key are required.", "danger");
      return;
    }

    // Disable button and show spinner
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...`;

    // Validate credentials with test API request
    fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
      method: "POST",
      headers: {
        "x-app-id": appId,
        "x-app-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "apple" }),
    })
      .then((response) => {
        if (response.ok) return response.json();
        else throw new Error("Invalid credentials");
      })
      .then((data) => {
        chrome.storage.local.set({ appId, apiKey, extensionEnabled }, () => {
          showAlert("Settings saved successfully!", "success");

          setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
            });
          }, 1000);
        });
      })
      .catch((error) => {
        console.error("Credential validation failed:", error);
        showAlert("Invalid App ID or API Key.", "danger");
      })
      .finally(() => {
        // Restore button after request
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      });
  });

  // Toggle ON/OFF change handler
  toggleCheckbox.addEventListener("change", () => {
    chrome.storage.local.set({ extensionEnabled: toggleCheckbox.checked });
  });

  // Bootstrap alert helper
  function showAlert(message, type = "success") {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    alertBox.classList.add("show");

    setTimeout(() => {
      alertBox.classList.add("d-none");
      alertBox.classList.remove("show");
    }, 2500);
  }
});
