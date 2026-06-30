document.addEventListener("DOMContentLoaded", async () => {
  const longUrlInput = document.getElementById("long-url");
  const serviceSelect = document.getElementById("service-select");
  const shortenBtn = document.getElementById("shorten-btn");
  const resultContainer = document.getElementById("result-container");
  const shortUrlInput = document.getElementById("short-url");
  const copyBtn = document.getElementById("copy-btn");
  const qrCodeImg = document.getElementById("qr-code");
  const qrSection = document.querySelector(".qr-section");
  const longUrlField = longUrlInput.closest(".field");

  let userSettings = {};

  const domainField = document.getElementById("domain-field");
  const domainSelect = document.getElementById("domain-select");
  const customAliasInput = document.getElementById("custom-alias");

  const upgradeBanner = document.getElementById("upgrade-banner");

  // 1. Load preferences & apply themes/UI states
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
    "isPro"
  ], async (settings) => {
    userSettings = settings;
    const isPro = settings.isPro || false;

    // Apply Night Mode Theme
    if (settings.prefDarkmode) {
      document.body.classList.add("dark-mode");
    }

    // Hide input field if checked
    if (settings.prefHideinput && longUrlField) {
      longUrlField.style.display = "none";
    }

    // Enforce Freemium / Pro limitations
    if (!isPro) {
      // Show upgrade banner
      if (upgradeBanner) {
        upgradeBanner.classList.remove("hidden");
      }
      
      // Lock custom alias
      if (customAliasInput) {
        customAliasInput.disabled = true;
        customAliasInput.placeholder = "🔒 Locked (PRO feature)";
        customAliasInput.style.backgroundColor = "#f3f4f6";
        customAliasInput.style.cursor = "not-allowed";
      }
    }

    // Set selected service in dropdown (sync from options page)
    let activeService = settings.service || "tinyurl";
    
    // Fallback if free user somehow saved a pro service
    if (!isPro && ["custom", "bitly", "cuttly"].includes(activeService)) {
      activeService = "tinyurl";
    }

    if (serviceSelect) {
      serviceSelect.value = activeService;
    }

    // Toggle Custom Domains section based on active service
    toggleDomainField(activeService);

    // Populate custom domains select options dynamically (from server or fallback local list)
    if (isPro) {
      if (settings.backendUrl) {
        try {
          const res = await fetch(`${settings.backendUrl}/api/domains`);
          const data = await res.json();
          if (data.success && data.domains && data.domains.length > 0) {
            populateCustomDomains(data.domains);
          } else {
            populateCustomDomains(settings.customDomains || []);
          }
        } catch (err) {
          populateCustomDomains(settings.customDomains || []);
        }
      } else {
        populateCustomDomains(settings.customDomains || []);
      }
    } else {
      populateCustomDomains([]);
    }

    // Fetch tab URL
    await getActiveTabUrl();

    // Auto-copy on open (if enabled and URL is valid)
    if (settings.prefAutocopy) {
      const longUrl = longUrlInput.value;
      if (longUrl && !longUrl.startsWith("Could not") && longUrl !== "https://example.com") {
        await handleShorten();
      }
    }
  });

  // Watch service selector change to toggle custom domain options visibility and enforce Pro checks
  if (serviceSelect) {
    serviceSelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      const isPro = userSettings.isPro || false;

      if (!isPro && ["custom", "bitly", "cuttly"].includes(selected)) {
        alert(`The "${e.target.options[e.target.selectedIndex].text.replace("🔒 PRO", "")}" service is a PRO feature. Please activate Pro in settings to unlock.`);
        serviceSelect.value = "tinyurl";
        toggleDomainField("tinyurl");
        return;
      }
      toggleDomainField(selected);
    });
  }

  function toggleDomainField(service) {
    if (service === "custom") {
      domainField.classList.remove("hidden");
    } else {
      domainField.classList.add("hidden");
    }
  }

  function populateCustomDomains(domains) {
    // Clear dynamic options, keep default
    domainSelect.innerHTML = `<option value="default">yoursite.com/r/ (Default)</option>`;
    domains.forEach((domain) => {
      const option = document.createElement("option");
      option.value = domain;
      option.textContent = `${domain} (Custom)`;
      domainSelect.appendChild(option);
    });
  }

  async function getActiveTabUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        longUrlInput.value = tab.url;
      } else {
        longUrlInput.value = "Could not detect active tab URL";
      }
    } catch (err) {
      longUrlInput.value = "https://example.com";
    }
  }

  // 2. Shortening Logic
  async function handleShorten() {
    const longUrl = longUrlInput.value;
    const service = serviceSelect ? serviceSelect.value : (userSettings.service || "tinyurl");

    if (!longUrl || longUrl.startsWith("Could not")) {
      alert("Please open a valid web page to shorten.");
      return;
    }

    shortenBtn.textContent = "Shortening...";
    shortenBtn.disabled = true;

    try {
      let shortUrl = "";

      if (service === "custom") {
        const backendUrl = userSettings.backendUrl;
        if (!backendUrl) {
          chrome.runtime.openOptionsPage();
          throw new Error("Custom Backend URL not configured. Opening Settings page so you can configure it...");
        }

        const selectedDomain = domainSelect.value;
        const customDomain = selectedDomain === "default" ? null : selectedDomain;
        const customAlias = customAliasInput.value.trim();

        const res = await fetch(`${backendUrl}/api/shorten`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            longUrl,
            customDomain,
            customAlias: customAlias || undefined
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Backend error");

        // Format short URL
        if (customDomain) {
          const protocol = customDomain.includes('localhost') ? 'http://' : 'https://';
          shortUrl = `${protocol}${customDomain}/r/${data.code}`;
        } else {
          shortUrl = `${backendUrl}/r/${data.code}`;
        }

      } else if (service === "isgd" || service === "vgd") {
        const urlHost = service === "isgd" ? "is.gd" : "v.gd";
        const res = await fetch(`https://${urlHost}/create.php?format=json&url=${encodeURIComponent(longUrl)}`);
        const text = await res.text();
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(text || `Failed to parse ${urlHost} response`);
        }

        if (data.errorcode) {
          throw new Error(data.errormessage || `${urlHost} error`);
        }
        shortUrl = data.shorturl;

      } else if (service === "tinyurl") {
        // Fallback free TinyURL API (no token required)
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        if (!res.ok) throw new Error("TinyURL error");
        shortUrl = await res.text();

      } else if (service === "bitly") {
        const token = userSettings.bitlyToken;
        if (!token) {
          chrome.runtime.openOptionsPage();
          throw new Error("API Token required for Bit.ly. Opening Settings page so you can configure it...");
        }
        const res = await fetch("https://api-ssl.bitly.com/v4/shorten", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ long_url: longUrl })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Bitly error");
        shortUrl = data.link;

      } else if (service === "cuttly") {
        const token = userSettings.cuttlyToken;
        if (!token) {
          chrome.runtime.openOptionsPage();
          throw new Error("API Token required for Cutt.ly. Opening Settings page so you can configure it...");
        }
        // Cuttly requires a CORS proxy or fetch from extension context
        const res = await fetch(`https://cutt.ly/api/api.php?key=${token}&short=${encodeURIComponent(longUrl)}`);
        const data = await res.json();
        if (data.url.status !== 7) {
          const errMsg = {
            1: "The link passed is already shortened",
            2: "The link passed is not a valid URL",
            3: "The link passed is a blocked domain",
            4: "Invalid Cuttly API key"
          }[data.url.status] || "Cuttly error";
          throw new Error(errMsg);
        }
        shortUrl = data.url.shortLink;
      }

      shortUrlInput.value = shortUrl;

      // 3. QR Code Handling
      const isPro = userSettings.isPro || false;
      if (isPro && userSettings.prefGenerateqr !== false) {
        qrSection.classList.remove("hidden");
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`;
        qrCodeImg.src = qrApiUrl;
      } else {
        qrSection.classList.add("hidden");
      }

      // Show Results
      resultContainer.classList.remove("hidden");

      // Auto-copy to Clipboard
      await navigator.clipboard.writeText(shortUrl);
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1500);

      // 4. Save to History Logs in Local Storage
      chrome.storage.local.get(["history"], (data) => {
        const history = data.history || [];
        const newLog = {
          originalUrl: longUrl,
          shortUrl: shortUrl,
          service: service.toUpperCase(),
          timestamp: Date.now()
        };
        history.push(newLog);
        chrome.storage.local.set({ history });
      });

    } catch (err) {
      alert(`Error shortening URL: ${err.message}`);
    } finally {
      shortenBtn.textContent = "Shorten Link";
      shortenBtn.disabled = false;
    }
  }

  // Bind shortening click
  shortenBtn.addEventListener("click", handleShorten);

  // Manual Copy Button Click
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(shortUrlInput.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1500);
  });
});
