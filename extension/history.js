document.addEventListener("DOMContentLoaded", () => {
  const historyTbody = document.getElementById("history-tbody");
  const emptyRow = document.getElementById("empty-row");
  const clearBtn = document.getElementById("clear-btn");
  const exportBtn = document.getElementById("export-btn");

  // Load history & theme setting from storage
  chrome.storage.local.get(["history", "prefDarkmode"], (data) => {
    // Night Mode styling check
    if (data.prefDarkmode) {
      document.body.classList.add("dark-mode");
    }

    const history = data.history || [];
    
    if (history.length > 0) {
      emptyRow.classList.add("hidden");
      // Render table rows (newest first)
      history.reverse().forEach((item) => {
        const row = document.createElement("tr");
        
        // Date formatting
        const dateStr = item.timestamp 
          ? new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
          : "N/A";

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
              <span class="service-badge">${item.service || "TinyURL"}</span>
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
