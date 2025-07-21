// DOM Elements
const elements = {
  displayName: document.getElementById("displayName"),
  username: document.getElementById("username"),
  postText: document.getElementById("postText"),
  likes: document.getElementById("likes"),
  retweets: document.getElementById("retweets"),
  replies: document.getElementById("replies"),
  timeStamp: document.getElementById("timeStamp"),
  avatarUrl: document.getElementById("avatarUrl"),
  verified: document.getElementById("verified"),
  charCount: document.getElementById("charCount"),
  downloadBtn: document.getElementById("downloadBtn"),
  copyBtn: document.getElementById("copyBtn"),
  printBtn: document.getElementById("printBtn"),
  twitterPost: document.getElementById("twitterPost"),

  // Preview elements
  previewDisplayName: document.getElementById("previewDisplayName"),
  previewUsername: document.getElementById("previewUsername"),
  previewPostText: document.getElementById("previewPostText"),
  previewLikes: document.getElementById("previewLikes"),
  previewRetweets: document.getElementById("previewRetweets"),
  previewReplies: document.getElementById("previewReplies"),
  previewTime: document.getElementById("previewTime"),
  verifiedBadge: document.getElementById("verifiedBadge"),
  postAvatar: document.getElementById("postAvatar"),
};

// Utility Functions
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

function generateAvatarText(name) {
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function updateCharacterCount() {
  const count = elements.postText.value.length;
  elements.charCount.textContent = count;
  elements.charCount.style.color = count > 280 ? "#ff6b6b" : "#657786";
}

function updateAvatar() {
  const avatarUrl = elements.avatarUrl.value.trim();
  const displayName = elements.displayName.value.trim();

  if (avatarUrl) {
    elements.postAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar" onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                                         <span class="avatar-text" style="display: none;">${generateAvatarText(
                                           displayName
                                         )}</span>`;
  } else {
    elements.postAvatar.innerHTML = `<span class="avatar-text">${generateAvatarText(
      displayName
    )}</span>`;
  }
}

function updatePreview() {
  // Update text content
  elements.previewDisplayName.textContent =
    elements.displayName.value || "Anonymous";
  elements.previewUsername.textContent = elements.username.value || "anonymous";
  elements.previewPostText.textContent =
    elements.postText.value || "Your post will appear here...";
  elements.previewTime.textContent = elements.timeStamp.value || "1m";

  // Update stats
  elements.previewLikes.textContent = formatNumber(
    parseInt(elements.likes.value) || 0
  );
  elements.previewRetweets.textContent = formatNumber(
    parseInt(elements.retweets.value) || 0
  );
  elements.previewReplies.textContent = formatNumber(
    parseInt(elements.replies.value) || 0
  );

  // Update verified badge
  elements.verifiedBadge.style.display = elements.verified.checked
    ? "flex"
    : "none";

  // Update avatar
  updateAvatar();

  // Update character count
  updateCharacterCount();
}

function updateTheme() {
  const theme = document.querySelector('input[name="theme"]:checked').value;
  elements.twitterPost.className = `twitter-post ${theme}-theme`;
}

// Event Listeners
function setupEventListeners() {
  // Input event listeners
  Object.values(elements).forEach((element) => {
    if (
      element &&
      (element.type === "text" ||
        element.type === "number" ||
        element.type === "url" ||
        element.tagName === "TEXTAREA")
    ) {
      element.addEventListener("input", updatePreview);
    }
  });

  // Checkbox event listener
  elements.verified.addEventListener("change", updatePreview);

  // Theme change listeners
  document.querySelectorAll('input[name="theme"]').forEach((radio) => {
    radio.addEventListener("change", updateTheme);
  });

  // Download button
  elements.downloadBtn.addEventListener("click", downloadScreenshot);

  // Copy to clipboard button
  elements.copyBtn.addEventListener("click", copyToClipboard);

  // Print button
  elements.printBtn.addEventListener("click", printPost);

  // Character limit for post text
  elements.postText.addEventListener("input", function () {
    if (this.value.length > 280) {
      this.value = this.value.substring(0, 280);
    }
    updateCharacterCount();
  });
}

// Screenshot functionality
async function downloadScreenshot() {
  try {
    elements.downloadBtn.textContent = "📸 Generating...";
    elements.downloadBtn.disabled = true;

    // Check if html2canvas is available
    if (typeof html2canvas !== "undefined") {
      // Use html2canvas if available
      const canvas = await html2canvas(elements.twitterPost, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: elements.twitterPost.offsetWidth,
        height: elements.twitterPost.offsetHeight,
      });

      canvas.toBlob(
        (blob) => {
          downloadBlob(blob, `viral-post-${Date.now()}.png`);
          resetDownloadButton();
        },
        "image/png",
        1.0
      );
    } else {
      // Fallback to SVG method
      await downloadScreenshotSVG();
    }
  } catch (error) {
    console.error("Error generating screenshot:", error);
    // Try SVG fallback
    try {
      await downloadScreenshotSVG();
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      alert(
        'Screenshot generation failed. Try the "Copy as Image" method below.'
      );
      resetDownloadButton();
    }
  }
}

// SVG-based screenshot method (fallback)
async function downloadScreenshotSVG() {
  const postElement = elements.twitterPost;
  const rect = postElement.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(postElement);

  // Create SVG
  const svgData = createSVGFromElement(postElement, rect, computedStyle);

  // Convert SVG to canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const scale = 2;

  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  ctx.scale(scale, scale);

  const img = new Image();
  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        downloadBlob(blob, `viral-post-${Date.now()}.png`);
        resetDownloadButton();
      },
      "image/png",
      1.0
    );
  };

  img.onerror = function () {
    // Final fallback - create a styled canvas manually
    drawPostToCanvas(ctx, rect);
    canvas.toBlob(
      (blob) => {
        downloadBlob(blob, `viral-post-${Date.now()}.png`);
        resetDownloadButton();
      },
      "image/png",
      1.0
    );
  };

  const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  img.src = url;
}

// Create SVG representation of the element
function createSVGFromElement(element, rect, computedStyle) {
  const isDark = element.classList.contains("dark-theme");
  const bgColor = isDark ? "#15202b" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#0f1419";
  const secondaryColor = isDark ? "#71767b" : "#536471";

  // Get text content
  const displayName = elements.previewDisplayName.textContent;
  const username = "@" + elements.previewUsername.textContent;
  const timeText = elements.previewTime.textContent;
  const postText = elements.previewPostText.textContent;
  const likes = elements.previewLikes.textContent;
  const retweets = elements.previewRetweets.textContent;
  const replies = elements.previewReplies.textContent;
  const isVerified = elements.verifiedBadge.style.display !== "none";

  return `
        <svg width="${rect.width}" height="${
    rect.height
  }" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .post-bg { fill: ${bgColor}; }
                    .primary-text { fill: ${textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                    .secondary-text { fill: ${secondaryColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                    .bold { font-weight: bold; }
                </style>
            </defs>
            
            <!-- Background -->
            <rect width="100%" height="100%" class="post-bg" rx="16"/>
            
            <!-- Avatar -->
            <circle cx="44" cy="44" r="24" fill="url(#avatarGradient)"/>
            <defs>
                <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1da1f2"/>
                    <stop offset="100%" style="stop-color:#1991db"/>
                </linearGradient>
            </defs>
            <text x="44" y="44" text-anchor="middle" dominant-baseline="central" class="primary-text bold" font-size="16" fill="white">${generateAvatarText(
              displayName
            )}</text>
            
            <!-- Display Name -->
            <text x="80" y="35" class="primary-text bold" font-size="15">${displayName}</text>
            ${
              isVerified
                ? '<circle cx="' +
                  (85 + displayName.length * 8) +
                  '" cy="35" r="8" fill="#1d9bf0"/><text x="' +
                  (85 + displayName.length * 8) +
                  '" y="35" text-anchor="middle" dominant-baseline="central" fill="white" font-size="10">✓</text>'
                : ""
            }
            
            <!-- Username and time -->
            <text x="80" y="52" class="secondary-text" font-size="15">${username} · ${timeText}</text>
            
            <!-- Post content -->
            ${createSVGTextLines(postText, 20, 90, textColor)}
            
            <!-- Stats line -->
            <line x1="20" y1="${rect.height - 50}" x2="${
    rect.width - 20
  }" y2="${rect.height - 50}" stroke="${
    isDark ? "#2f3336" : "#ebeef0"
  }" stroke-width="1"/>
            
            <!-- Stats -->
            <text x="20" y="${
              rect.height - 25
            }" class="secondary-text" font-size="13">💬 ${replies}</text>
            <text x="120" y="${
              rect.height - 25
            }" class="secondary-text" font-size="13">🔁 ${retweets}</text>
            <text x="220" y="${
              rect.height - 25
            }" class="secondary-text" font-size="13">❤️ ${likes}</text>
            <text x="320" y="${
              rect.height - 25
            }" class="secondary-text" font-size="13">📤</text>
        </svg>
    `;
}

// Helper function to create SVG text with line breaks
function createSVGTextLines(text, x, startY, color) {
  const lines = text.split("\n");
  const lineHeight = 20;
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${
          startY + i * lineHeight
        }" class="primary-text" font-size="15" fill="${color}">${escapeXml(
          line
        )}</text>`
    )
    .join("\n");
}

// Escape XML special characters
function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Manual canvas drawing (final fallback)
function drawPostToCanvas(ctx, rect) {
  const isDark = elements.twitterPost.classList.contains("dark-theme");

  // Background
  ctx.fillStyle = isDark ? "#15202b" : "#ffffff";
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Text
  ctx.fillStyle = isDark ? "#ffffff" : "#0f1419";
  ctx.font =
    'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("Screenshot Generated", 20, 50);

  ctx.font =
    '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("Your viral post content appears here", 20, 80);
  ctx.fillText(
    `@${elements.username.value} • ${elements.timeStamp.value}`,
    20,
    100
  );

  // Stats
  ctx.fillStyle = isDark ? "#71767b" : "#536471";
  ctx.fillText(
    `${elements.replies.value} replies • ${elements.retweets.value} retweets • ${elements.likes.value} likes`,
    20,
    rect.height - 20
  );
}

// Helper functions
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetDownloadButton() {
  elements.downloadBtn.textContent = "📱 Download Screenshot";
  elements.downloadBtn.disabled = false;
}

// Copy to clipboard functionality
async function copyToClipboard() {
  try {
    elements.copyBtn.textContent = "📸 Copying...";
    elements.copyBtn.disabled = true;

    if (typeof html2canvas !== "undefined") {
      const canvas = await html2canvas(elements.twitterPost, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });

      canvas.toBlob(
        async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            elements.copyBtn.textContent = "✅ Copied!";
            setTimeout(() => {
              elements.copyBtn.textContent = "📋 Copy to Clipboard";
              elements.copyBtn.disabled = false;
            }, 2000);
          } catch (clipboardError) {
            console.error("Clipboard error:", clipboardError);
            // Fallback to download
            downloadBlob(blob, `viral-post-${Date.now()}.png`);
            elements.copyBtn.textContent = "📋 Copy to Clipboard";
            elements.copyBtn.disabled = false;
          }
        },
        "image/png",
        1.0
      );
    } else {
      throw new Error("html2canvas not available");
    }
  } catch (error) {
    console.error("Copy failed:", error);
    alert("Copy to clipboard not supported. Try download instead.");
    elements.copyBtn.textContent = "📋 Copy to Clipboard";
    elements.copyBtn.disabled = false;
  }
}

// Print functionality
function printPost() {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  const postHTML = elements.twitterPost.outerHTML;
  const isDark = elements.twitterPost.classList.contains("dark-theme");

  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Viral Post Screenshot</title>
            <style>
                @media print {
                    body { margin: 0; padding: 20px; }
                    .twitter-post { box-shadow: none !important; }
                }
                body { 
                    margin: 0; 
                    padding: 20px; 
                    background: ${isDark ? "#000" : "#fff"}; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .twitter-post {
                    max-width: 500px;
                    border-radius: 16px;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                .dark-theme {
                    background: #15202b;
                    color: #ffffff;
                }
                .light-theme {
                    background: #ffffff;
                    color: #0f1419;
                    border: 1px solid #ebeef0;
                }
                .post-header {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                .avatar-container {
                    margin-right: 12px;
                }
                .avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #1da1f2, #1991db);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }
                .avatar-text {
                    color: white;
                    font-weight: bold;
                    font-size: 18px;
                }
                .user-info {
                    flex: 1;
                }
                .display-name {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-weight: 700;
                    font-size: 15px;
                    line-height: 20px;
                }
                .verified-badge {
                    color: #1d9bf0;
                    font-size: 16px;
                    background: #1d9bf0;
                    color: white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                }
                .username-time {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 2px;
                }
                .username, .time, .separator {
                    color: #71767b;
                    font-size: 15px;
                }
                .light-theme .username, 
                .light-theme .time, 
                .light-theme .separator {
                    color: #536471;
                }
                .post-content {
                    margin-bottom: 16px;
                }
                .post-text {
                    font-size: 15px;
                    line-height: 20px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .post-stats {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 12px;
                    border-top: 1px solid #2f3336;
                    max-width: 425px;
                }
                .light-theme .post-stats {
                    border-top-color: #ebeef0;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #71767b;
                    font-size: 13px;
                }
                .light-theme .stat-item {
                    color: #536471;
                }
                .stat-icon {
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            ${postHTML}
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
  printWindow.document.close();
}

// Manual canvas drawing function (simplified html2canvas alternative)
async function drawElementToCanvas(ctx, element, rect) {
  const computedStyle = window.getComputedStyle(element);

  // Fill background
  ctx.fillStyle = computedStyle.backgroundColor || "#15202b";
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Set text properties
  ctx.fillStyle = computedStyle.color || "#ffffff";
  ctx.font =
    '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = "top";

  // This is a simplified version - for full functionality, you'd want to use html2canvas library
  // Draw a placeholder message
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(
    "Screenshot functionality requires html2canvas library",
    20,
    rect.height / 2
  );
  ctx.font = "14px sans-serif";
  ctx.fillText(
    "Copy the HTML/CSS/JS to use with html2canvas for full functionality",
    20,
    rect.height / 2 + 30
  );
}

// Alternative download using browser print
function downloadScreenshotAlt() {
  // Create a new window with just the post
  const printWindow = window.open("", "_blank");
  const postHTML = elements.twitterPost.outerHTML;

  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Viral Post Screenshot</title>
            <style>
                body { margin: 0; padding: 20px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .twitter-post { margin: 0 auto; }
                ${
                  document.querySelector("style")
                    ? document.querySelector("style").innerHTML
                    : ""
                }
            </style>
        </head>
        <body>
            ${postHTML}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 1000);
                };
            </script>
        </body>
        </html>
    `);
  printWindow.document.close();
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  setupEventListeners();
  updatePreview();
  updateTheme();
});

// Add some sample presets
function loadPreset(preset) {
  const presets = {
    viral: {
      displayName: "Tech Guru",
      username: "techguru",
      postText:
        "🚨 BREAKING: Just discovered this AI trick that will change everything!\n\nIt's so simple yet powerful...\n\nThread 👇 (1/7)",
      likes: 15400,
      retweets: 3200,
      replies: 890,
      timeStamp: "3h",
      verified: true,
    },
    motivational: {
      displayName: "Success Mindset",
      username: "successmindset",
      postText:
        "Your biggest competitor is who you were yesterday.\n\nStop comparing yourself to others.\nStart comparing yourself to who you were.\n\n💪 #GrowthMindset",
      likes: 8700,
      retweets: 1500,
      replies: 340,
      timeStamp: "5h",
      verified: true,
    },
    funny: {
      displayName: "Meme Lord",
      username: "memelord420",
      postText:
        "Me: I'll just check Twitter for 5 minutes\n\n*3 hours later*\n\nAlso me: Wait, what year is it? 😅",
      likes: 24600,
      retweets: 6800,
      replies: 1200,
      timeStamp: "1h",
      verified: false,
    },
  };

  const selectedPreset = presets[preset];
  if (selectedPreset) {
    Object.keys(selectedPreset).forEach((key) => {
      if (elements[key]) {
        if (elements[key].type === "checkbox") {
          elements[key].checked = selectedPreset[key];
        } else {
          elements[key].value = selectedPreset[key];
        }
      }
    });
    updatePreview();
  }
}
