'use strict';

document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) {
            showError("No active tab found");
            return;
        }

        const url = new URL(tabs[0].url);
        const hostname = url.hostname;

        // Route to different popups based on hostname
        if (hostname === "simpcity.su" || hostname.endsWith(".simpcity.su")) {
            // Load the link collector popup for the specific website
            window.location.href = "linkCollectorPopup.html";
        } else {
            // Load a default popup for other websites
            window.location.href = "defaultPopup.html";
        }
    });
});

function showError(message) {
    document.getElementById('loading').textContent = "Error: " + message;
}