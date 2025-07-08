console.log("Claude Sound Notification: Extension loaded");

// Global settings
let settings = {
  enabled: true,
  volume: 50,
};

// Global audio element
let audio;

// Initialize when page is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

async function initialize() {
  console.log("Claude Sound Notification: Initializing...");

  // Load saved settings
  const savedSettings = await chrome.storage.sync.get({
    enabled: true,
    volume: 50,
  });
  settings = savedSettings;
  console.log("Claude Sound Notification: Settings loaded", settings);

  // Create audio element with your sound
  const audioUrl = chrome.runtime.getURL("sounds/default_notification.mp3");
  console.log("Claude Sound Notification: Audio URL:", audioUrl);

  // Pre-load the audio
  audio = new Audio(audioUrl);
  audio.volume = settings.volume / 100;

  // Pre-load the audio to avoid loading delays
  audio.load();

  // Debug: Check if audio is loaded
  audio.addEventListener("canplaythrough", () => {
    console.log("Claude Sound Notification: Audio loaded and ready to play");
  });

  audio.addEventListener("error", (e) => {
    console.error("Claude Sound Notification: Audio loading error:", e);
  });

  // Track if we've interacted with the page (for Chrome's autoplay policy)
  let hasInteracted = false;

  // Listen for any user interaction
  const interactionEvents = ["click", "keydown", "touchstart"];
  interactionEvents.forEach((event) => {
    document.addEventListener(
      event,
      () => {
        if (!hasInteracted) {
          hasInteracted = true;
          console.log(
            "Claude Sound Notification: User interaction detected, audio should now work"
          );

          // Try to play a silent sound to "unlock" audio
          const tempAudio = audio.cloneNode();
          tempAudio.volume = 0;
          tempAudio
            .play()
            .then(() => {
              tempAudio.pause();
              console.log(
                "Claude Sound Notification: Audio unlocked successfully"
              );
            })
            .catch(() => {
              console.log(
                "Claude Sound Notification: Could not unlock audio yet"
              );
            });
        }
      },
      { once: true }
    );
  });

  // Function to play notification sound
  function playNotificationSound() {
    if (!settings.enabled) {
      console.log(
        "Claude Sound Notification: Notifications disabled, skipping sound"
      );
      return;
    }

    console.log("Claude Sound Notification: Attempting to play sound...");

    // Clone the audio to allow overlapping sounds if needed
    const audioClone = audio.cloneNode();
    audioClone.volume = settings.volume / 100;

    audioClone
      .play()
      .then(() => {
        console.log("Claude Sound Notification: Sound played successfully!");
      })
      .catch((err) => {
        console.error("Claude Sound Notification: Audio playback failed:", err);
        console.log("Claude Sound Notification: Error details:", {
          error: err.message,
          hasInteracted: hasInteracted,
          audioUrl: audioUrl,
        });

        // Fallback: Try the original audio element
        audio.volume = settings.volume / 100;
        audio.play().catch((e) => {
          console.error(
            "Claude Sound Notification: Fallback audio also failed:",
            e
          );
        });
      });
  }

  // Your proven MutationObserver setup
  const responseObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-is-streaming" &&
        mutation.target.getAttribute("data-is-streaming") === "false" &&
        mutation.oldValue === "true"
      ) {
        console.log(
          "Claude Sound Notification: Response complete, playing sound"
        );

        // Small delay to ensure response is truly complete
        setTimeout(() => {
          playNotificationSound();
        }, 100);
      }
    });
  });

  // Start observing
  responseObserver.observe(document.body, {
    attributes: true,
    attributeOldValue: true,
    subtree: true,
    attributeFilter: ["data-is-streaming"],
  });

  console.log("Claude Sound Notification: Observer started");

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "settingsUpdated") {
      settings = request.settings;
      audio.volume = settings.volume / 100;
      console.log("Claude Sound Notification: Settings updated", settings);
    }
  });

  // Test function you can call from console
  window.testClaudeNotification = () => {
    console.log("Claude Sound Notification: Manual test triggered");
    playNotificationSound();
  };
  console.log(
    "Claude Sound Notification: Test function available - run 'testClaudeNotification()' in console"
  );
}
