// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Get elements
  const enabledToggle = document.getElementById("enabledToggle");
  const volumeSlider = document.getElementById("volume");
  const volumeValue = document.getElementById("volumeValue");
  const githubLink = document.getElementById("githubLink");

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    enabled: true,
    volume: 50,
  });

  // Apply saved settings to UI
  enabledToggle.classList.toggle("active", settings.enabled);
  volumeSlider.value = settings.volume;
  volumeValue.textContent = settings.volume + "%";

  // Toggle enabled/disabled
  enabledToggle.addEventListener("click", async () => {
    const isEnabled = !enabledToggle.classList.contains("active");
    enabledToggle.classList.toggle("active");

    // Save setting
    await chrome.storage.sync.set({ enabled: isEnabled });

    // Notify content script
    const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
    tabs.forEach((tab) => {
      chrome.tabs
        .sendMessage(tab.id, {
          type: "settingsUpdated",
          settings: { enabled: isEnabled, volume: volumeSlider.value },
        })
        .catch(() => {
          // Tab might not have content script loaded yet
        });
    });
  });

  // Volume slider
  volumeSlider.addEventListener("input", async (e) => {
    const volume = e.target.value;
    volumeValue.textContent = volume + "%";

    // Save setting
    await chrome.storage.sync.set({ volume: parseInt(volume) });

    // Notify content script
    const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
    tabs.forEach((tab) => {
      chrome.tabs
        .sendMessage(tab.id, {
          type: "settingsUpdated",
          settings: {
            enabled: enabledToggle.classList.contains("active"),
            volume: volume,
          },
        })
        .catch(() => {
          // Tab might not have content script loaded yet
        });
    });
  });

  // GitHub link
  githubLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: "https://github.com/luisdavidtrejosrojas/Claude-Sound-Notification",
    });
  });
});
