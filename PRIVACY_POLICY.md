# Privacy Policy for QuickLink Shortener

**Last Updated:** June 30, 2026

At QuickLink Shortener, we respect your privacy and are committed to protecting it. This Privacy Policy explains how our Chrome extension collects, uses, and discloses information.

---

## 1. Information We Collect

QuickLink Shortener is designed with data minimization in mind. We do not collect or store any personal identification data.

* **Locally Saved Data:** All of your extension settings, custom domain configurations, API tokens (Bit.ly/Cutt.ly), and shortened link history logs are stored **locally on your device** using Google Chrome's secure storage API (`chrome.storage.local`).
* **Active URLs:** When you click the QuickLink icon, the extension retrieves the URL of your active tab. This is processed locally and sent only to your selected shortening service to generate the short URL. We do not track, log, or store your browsing history.

---

## 2. Third-Party Services

When you shorten a link, the target URL is sent to the shortening service you select:
* **TinyURL** (Privacy Policy: [https://tinyurl.com/privacy-policy](https://tinyurl.com/privacy-policy))
* **is.gd / v.gd** (Privacy Policy: [https://is.gd/privacy.php](https://is.gd/privacy.php))
* **Bit.ly** (If configured with your own API token)
* **Cutt.ly** (If configured with your own API token)
* **Your Custom Backend:** If you configure a custom backend server (e.g. your Vercel deployment), the URL is sent directly to your server and database.

---

## 3. Chrome Permissions Used

* **`activeTab`**: Allows the extension to get the URL of the tab you are viewing *only* when you click the extension icon. It does not monitor background browsing.
* **`clipboardWrite`**: Allows the extension to automatically copy the shortened link to your clipboard.
* **`storage`**: Allows the extension to save your preferences and local history log on your machine.

---

## 4. Data Security

Since your sensitive data (like API tokens and history logs) is saved locally in your browser sandbox, it is secured by Google Chrome's built-in application sandboxing. We recommend keeping your browser updated to ensure standard security controls.

---

## 5. Contact Us

If you have any questions about this Privacy Policy, contact us at:
* **Email:** support@ahmadblogs.com
* **GitHub:** [https://github.com/Sana720/quicklink-shortener](https://github.com/Sana720/quicklink-shortener)
