document.addEventListener("DOMContentLoaded", () => {
  const historyTbody = document.getElementById("history-tbody");
  const emptyRow = document.getElementById("empty-row");
  const clearBtn = document.getElementById("clear-btn");
  const exportBtn = document.getElementById("export-btn");

  // Load history, theme setting, and backendUrl from storage
  chrome.storage.local.get(["history", "prefDarkmode", "backendUrl"], (data) => {
    // Night Mode styling check
    if (data.prefDarkmode) {
      document.body.classList.add("dark-mode");
    }

    const history = data.history || [];
    const backendUrl = data.backendUrl;
    
    if (history.length > 0) {
      emptyRow.classList.add("hidden");
      // Render table rows (newest first)
      history.reverse().forEach((item) => {
        const row = document.createElement("tr");
        
        // Date formatting
        const dateStr = item.timestamp 
          ? new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
          : "N/A";

        const service = item.service || "TINYURL";
        let clicksDisplay = "—";
        const clicksCellId = `clicks-${Math.random().toString(36).substring(2, 9)}`;

        if (service === "CUSTOM") {
          clicksDisplay = `<span id="${clicksCellId}">Loading...</span>`;
          // Fetch click counts from the backend in the background
          if (backendUrl) {
            const code = item.shortUrl.split('/').pop();
            fetch(`${backendUrl}/api/clicks?code=${code}`)
              .then(res => res.json())
              .then(clickData => {
                const cell = document.getElementById(clicksCellId);
                if (cell) {
                  cell.textContent = clickData.clicksCount !== undefined ? clickData.clicksCount : "0";
                }
              })
              .catch(() => {
                const cell = document.getElementById(clicksCellId);
                if (cell) cell.textContent = "0";
              });
          }
        }

        row.innerHTML = `
          <td>
            <a href="${item.originalUrl}" target="_blank" class="orig-url" title="${item.originalUrl}">
              ${item.originalUrl}
            </a>
          </td>
          <td>
            <a href="${item.shortUrl}" target="_blank" class="short-url-link">
              ${item.shortUrl}
            </a>
          </td>
          <td>
            <div class="meta-info">
              <span class="date-text">${dateStr}</span>
              <span class="service-badge">${service}</span>
              <span class="clicks-badge" style="font-size: 11px; font-weight: 700; color: #10b981; margin-top: 2px; display: block;">Clicks: ${clicksDisplay}</span>
            </div>
          </td>
        `;
        historyTbody.appendChild(row);
      });
    }
  });

  // Clear History Logs
  clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to permanently delete all shortened link history? This cannot be undone.")) {
      chrome.storage.local.set({ history: [] }, () => {
        // Clear all dynamically generated rows except the empty state row
        const rows = historyTbody.querySelectorAll("tr:not(#empty-row)");
        rows.forEach(r => r.remove());
        emptyRow.classList.remove("hidden");
        alert("Link history deleted successfully!");
      });
    }
  });

  // Export History as CSV
  exportBtn.addEventListener("click", () => {
    chrome.storage.local.get(["history"], (data) => {
      const history = data.history || [];
      if (history.length === 0) {
        alert("No history logs available to export.");
        return;
      }

      // Build CSV String
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `"Original URL","Short URL","Service","Date"\n`;

      history.forEach((item) => {
        const dateStr = item.timestamp ? new Date(item.timestamp).toISOString() : "N/A";
        const escapedOrig = item.originalUrl.replace(/"/g, '""');
        const escapedShort = item.shortUrl.replace(/"/g, '""');
        csvContent += `"${escapOrig}","${escapShort}","${item.service || "TinyURL"}","${dateStr}"\n`;
      });

      // Trigger download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `quicklink_history_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
});
