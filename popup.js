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

    chrome.storage.local.set({ appId, apiKey, extensionEnabled }, () => {
      // ✅ Show success alert
      alertBox.classList.remove("d-none");
      alertBox.classList.add("show");

      // ✅ After short delay, reload the current active tab
      setTimeout(() => {
        alertBox.classList.add("d-none");
        alertBox.classList.remove("show");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }, 1000);
    });
  });

  // Save toggle immediately on change
  toggleCheckbox.addEventListener("change", () => {
    chrome.storage.local.set({ extensionEnabled: toggleCheckbox.checked });
  });
});
