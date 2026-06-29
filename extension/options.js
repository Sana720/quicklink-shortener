document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("save-btn");
  const bitlyRadio = document.querySelector('input[value="bitly"]');
  const cuttlyRadio = document.querySelector('input[value="cuttly"]');
  const bitlyTokenContainer = document.getElementById("bitly-token-container");
  const cuttlyTokenContainer = document.getElementById("cuttly-token-container");
  const customBackendContainer = document.getElementById("custom-backend-container");
  
  // Inputs
  const bitlyTokenInput = document.getElementById("bitly-token");
  const cuttlyTokenInput = document.getElementById("cuttly-token");
  const backendUrlInput = document.getElementById("backend-url");
  const customDomainsListInput = document.getElementById("custom-domains-list");
  const autocopyCheck = document.getElementById("pref-autocopy");
  const darkmodeCheck = document.getElementById("pref-darkmode");
  const generateqrCheck = document.getElementById("pref-generateqr");
  const hideinputCheck = document.getElementById("pref-hideinput");

  // Keyboard shortcuts button
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  
  // Delete History button
  const deleteHistoryBtn = document.getElementById("delete-history-btn");

  // Load current settings from storage
  chrome.storage.local.get([
    "service",
    "bitlyToken",
    "cuttlyToken",
    "backendUrl",
    "customDomains",
    "prefAutocopy",
    "prefDarkmode",
    "prefGenerateqr",
    "prefHideinput"
  ], (settings) => {
    // Select Service Radio
    const service = settings.service || "tinyurl";
    const radio = document.querySelector(`input[value="${service}"]`);
    if (radio) radio.checked = true;

    // Toggle custom token input boxes visibility
    toggleTokenContainers(service);

    // Populate token & backend values
    bitlyTokenInput.value = settings.bitlyToken || "";
    cuttlyTokenInput.value = settings.cuttlyToken || "";
    backendUrlInput.value = settings.backendUrl || "";
    customDomainsListInput.value = settings.customDomains ? settings.customDomains.join("\n") : "";

    // Preferences
    autocopyCheck.checked = settings.prefAutocopy || false;
    darkmodeCheck.checked = settings.prefDarkmode || false;
    generateqrCheck.checked = settings.prefGenerateqr !== false; // Default true
    hideinputCheck.checked = settings.prefHideinput || false;

    // Night mode check on settings load
    if (settings.prefDarkmode) {
      document.body.classList.add("dark-mode");
    }
  });

  // Watch for Service Selection Changes to toggle API Token forms
  document.querySelectorAll('input[name="service"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      toggleTokenContainers(e.target.value);
    });
  });

  function toggleTokenContainers(selectedService) {
    if (selectedService === "bitly") {
      bitlyTokenContainer.classList.remove("hidden");
    } else {
      bitlyTokenContainer.classList.add("hidden");
    }

    if (selectedService === "cuttly") {
      cuttlyTokenContainer.classList.remove("hidden");
    } else {
      cuttlyTokenContainer.classList.add("hidden");
    }

    if (selectedService === "custom") {
      customBackendContainer.classList.remove("hidden");
    } else {
      customBackendContainer.classList.add("hidden");
    }
  }

  // Save Settings
  saveBtn.addEventListener("click", () => {
    const selectedService = document.querySelector('input[name="service"]:checked').value;
    const bitlyToken = bitlyTokenInput.value.trim();
    const cuttlyToken = cuttlyTokenInput.value.trim();
    const backendUrl = backendUrlInput.value.trim();
    const customDomains = customDomainsListInput.value.split("\n").map(d => d.trim()).filter(d => d);
    const prefAutocopy = autocopyCheck.checked;
    const prefDarkmode = darkmodeCheck.checked;
    const prefGenerateqr = generateqrCheck.checked;
    const prefHideinput = hideinputCheck.checked;

    // Validate tokens / backends if selected
    if (selectedService === "bitly" && !bitlyToken) {
      alert("Please enter your Bitly API token.");
      return;
    }
    if (selectedService === "cuttly" && !cuttlyToken) {
      alert("Please enter your Cuttly API token.");
      return;
    }
    if (selectedService === "custom" && !backendUrl) {
      alert("Please enter your Custom Backend URL.");
      return;
    }

    chrome.storage.local.set({
      service: selectedService,
      bitlyToken,
      cuttlyToken,
      backendUrl,
      customDomains,
      prefAutocopy,
      prefDarkmode,
      prefGenerateqr,
      prefHideinput
    }, () => {
      // Toggle body dark mode class
      if (prefDarkmode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }

      // Visual feedback
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Saved!";
      saveBtn.style.backgroundColor = "#10b981"; // Success green
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.backgroundColor = ""; // Reset
      }, 1500);
    });
  });

  // Change Keyboard Shortcuts
  shortcutsBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  // Delete History
  deleteHistoryBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to permanently delete all shortened link history? This cannot be undone.")) {
      chrome.storage.local.set({ history: [] }, () => {
        alert("Link history deleted successfully!");
      });
    }
  });
});
