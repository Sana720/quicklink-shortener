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

  // Premium Activation Inputs
  const licenseKeyInput = document.getElementById("license-key");
  const gumroadProductInput = document.getElementById("gumroad-product");
  const activateBtn = document.getElementById("activate-btn");
  const proBadge = document.getElementById("pro-badge");

  // Keyboard shortcuts button
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  
  // Delete History button
  const deleteHistoryBtn = document.getElementById("delete-history-btn");

  // Helper to update Pro Badge UI
  function updateProBadge(isPro, planName) {
    if (isPro) {
      proBadge.textContent = planName ? `PRO ACTIVE (${planName})` : "PRO ACTIVE";
      proBadge.className = "badge pro-badge";
      activateBtn.textContent = "Deactivate";
      activateBtn.style.backgroundColor = "#ef4444";
      activateBtn.style.color = "white";
    } else {
      proBadge.textContent = "FREE";
      proBadge.className = "badge free-badge";
      activateBtn.textContent = "Activate Pro";
      activateBtn.style.backgroundColor = "";
      activateBtn.style.color = "";
    }
  }

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
    "prefHideinput",
    "isPro",
    "licenseKey",
    "gumroadProduct",
    "planName"
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
    
    // License Key settings
    licenseKeyInput.value = settings.licenseKey || "";
    gumroadProductInput.value = settings.gumroadProduct || "hjejk";
    const isPro = settings.isPro || false;
    const planName = settings.planName || "";
    updateProBadge(isPro, planName);

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

  // Activate / Deactivate Pro License Key
  activateBtn.addEventListener("click", () => {
    chrome.storage.local.get(["isPro", "licenseKey", "gumroadProduct"], (settings) => {
      const currentPro = settings.isPro || false;
      if (currentPro) {
        // Deactivate & Decrement Uses
        activateBtn.textContent = "Deactivating...";
        activateBtn.disabled = true;

        const key = settings.licenseKey;
        const product = settings.gumroadProduct || "hjejk";

        fetch("https://api.gumroad.com/v2/licenses/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_permalink: product,
            license_key: key,
            decrement_uses_count: true
          })
        }).finally(() => {
          chrome.storage.local.set({ isPro: false, licenseKey: "", gumroadPurchaseData: null, planName: "" }, () => {
            licenseKeyInput.value = "";
            activateBtn.disabled = false;
            updateProBadge(false);
            alert("License deactivated. This slot has been freed on Gumroad. You are now on the Free tier.");
          });
        });
      } else {
        // Activate & Increment Uses
        const key = licenseKeyInput.value.trim();
        const product = gumroadProductInput.value.trim() || "hjejk";
        if (!key) {
          alert("Please enter your Gumroad License Key.");
          return;
        }

        activateBtn.textContent = "Verifying...";
        activateBtn.disabled = true;

        // Verify with Gumroad API
        fetch("https://api.gumroad.com/v2/licenses/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_permalink: product,
            license_key: key,
            increment_uses_count: true
          })
        })
        .then(res => res.json())
        .then(data => {
          activateBtn.disabled = false;
          if (data.success && data.purchase) {
            const purchase = data.purchase;

            // 1. Check if the purchase is active, not refunded or chargebacked
            if (purchase.refunded || purchase.chargebacked) {
              throw new Error("This license has been refunded or chargebacked.");
            }

            // 2. Check subscription status (cancelled, failed)
            if (purchase.subscription_cancelled_at || purchase.subscription_failed_at) {
              throw new Error("This subscription is cancelled or has failed payment.");
            }

            // 3. Enforce single device / single user activation limit
            if (data.uses > 1) {
              // Automatically decrement count back since this attempt failed
              fetch("https://api.gumroad.com/v2/licenses/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  product_permalink: product,
                  license_key: key,
                  decrement_uses_count: true
                })
              });
              throw new Error("This license key is already active on another device (Single-User Limit Exceeded).");
            }

            // Extract variant name if present (Method A)
            let planName = "Pro";
            if (purchase.variants) {
              planName = purchase.variants.replace(/.*:\s*/, "");
            } else if (purchase.variant) {
              planName = purchase.variant.replace(/.*:\s*/, "");
            }

            // Save Pro activation data
            chrome.storage.local.set({
              isPro: true,
              licenseKey: key,
              gumroadProduct: product,
              gumroadPurchaseData: purchase,
              planName: planName
            }, () => {
              updateProBadge(true, planName);
              alert("Pro status activated successfully! Thank you for upgrading.");
            });

          } else {
            throw new Error(data.message || "Invalid license key.");
          }
        })
        .catch(err => {
          activateBtn.disabled = false;
          updateProBadge(false);
          alert(`Activation failed: ${err.message}`);
        });
      }
    });
  });

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

    chrome.storage.local.get(["isPro"], (settings) => {
      const isPro = settings.isPro || false;
      const licenseKey = licenseKeyInput.value.trim();
      const gumroadProduct = gumroadProductInput.value.trim();

      chrome.storage.local.set({
        service: selectedService,
        bitlyToken,
        cuttlyToken,
        backendUrl,
        customDomains,
        prefAutocopy,
        prefDarkmode,
        prefGenerateqr,
        prefHideinput,
        licenseKey,
        gumroadProduct
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
