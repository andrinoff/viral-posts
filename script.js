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
                    .primary-text { fill: ${textColor}; font-family: "TwitterChirp", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    .secondary-text { fill: ${secondaryColor}; font-family: "TwitterChirp", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    .bold { font-weight: bold; }
                </style>
            </defs>
            
            <rect width="100%" height="100%" class="post-bg" rx="16"/>
            
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
            
            <text x="80" y="52" class="secondary-text" font-size="15">${username} · ${timeText}</text>
            
            ${createSVGTextLines(postText, 20, 90, textColor)}
            
            <line x1="20" y1="${rect.height - 50}" x2="${
    rect.width - 20
  }" y2="${rect.height - 50}" stroke="${
    isDark ? "#2f3336" : "#ebeef0"
  }" stroke-width="1"/>
            
            <g transform="translate(20, ${rect.height - 35})">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="${secondaryColor}"><g><path d="M1.751 10.25c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.9-1.54 5.44-3.823 6.81l-2.06 1.22-.002-3.69c.008-2.5-2.038-4.52-4.532-4.52H5.75c-1.105 0-2-.9-2-2s.895-2 2-2h8.25c.414 0 .75.34.75.75s-.336.75-.75.75H5.75c-.276 0-.5.22-.5.5s.224.5.5.5h6.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5H6.26l-1.07-1.07c-1.37-1.37-2.19-3.12-2.19-5.01zm21.5 8.5c.414 0 .75-.34.75-.75v-3.03c0-1.2-.81-2.24-1.95-2.47-4.22-.85-8.2-1.93-11.07-3.29-.28-.13-.59-.2-.9-.2H5.75c-.276 0-.5.22-.5.5s.224.5.5.5h2.75c.16 0 .32.04.47.11 2.85 1.36 6.8 2.43 11.03 3.28.28.06.49.3.49.58v2.22l-2.14-1.27c-1.1-.65-2.43-.98-3.78-.98H5.75c-1.105 0-2 .9-2 2s.895 2 2 2h4.51c1.29 0 2.5.52 3.39 1.41l3.1 3.1c.15.15.34.22.53.22h.01c.19 0 .38-.07.53-.22l2.12-2.12.01-.01z"></path></g></svg>
                <text x="25" y="15" class="secondary-text" font-size="13">${replies}</text>
            </g>
            <g transform="translate(120, ${rect.height - 35})">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="${secondaryColor}"><g><path d="M1.75 5.5c0-1.24 1.01-2.25 2.25-2.25h16.5c1.24 0 2.25 1.01 2.25 2.25v13c0 1.24-1.01 2.25-2.25 2.25H4c-1.24 0-2.25-1.01-2.25-2.25v-13zm2.25-.75c-.41 0-.75.34-.75.75v13c0 .41.34.75.75.75h16.5c.41 0 .75-.34.75-.75v-13c0-.41-.34-.75-.75-.75H4z"></path><path d="M12 8.75c-1.04 0-1.89.85-1.89 1.89v2.25h-2.25c-.41 0-.75.34-.75.75s.34.75.75.75h2.25v2.25c0 .41.34.75.75.75s.75-.34.75-.75v-2.25h2.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75h-2.25V10.5c0-1.04-.85-1.89-1.89-1.89zM19 15.5c0-1.24-1.01-2.25-2.25-2.25H7.25c-1.24 0-2.25 1.01-2.25 2.25v1.25c0 .41.34.75.75.75s.75-.34.75-.75V15.5c0-.41.34-.75.75-.75h9.5c.41 0 .75.34.75.75v1.25c0 .41.34.75.75.75s.75-.34.75-.75v-1.25z"></path></g></svg>
                <text x="25" y="15" class="secondary-text" font-size="13">${retweets}</text>
            </g>
            <g transform="translate(220, ${rect.height - 35})">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="${secondaryColor}"><g><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 6.03 11.536 8.55 11.536.002 0 .004 0 .005-.002.002 0 .003 0 .005 0 2.52-.002 8.55-5.797 8.55-11.535 0-2.267-1.823-4.255-3.904-4.255-1.927 0-3.182 1.432-3.838 2.28-.15.2-.42.2-.572 0-.654-.848-1.91-2.28-3.838-2.28z"></path></g></svg>
                <text x="25" y="15" class="secondary-text" font-size="13">${likes}</text>
            </g>
             <g transform="translate(320, ${rect.height - 35})">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="${secondaryColor}"><g><path d="M12 2.5c-5.25 0-9.5 4.25-9.5 9.5s4.25 9.5 9.5 9.5 9.5-4.25 9.5-9.5-4.25-9.5-9.5-9.5zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path><path d="M12 11.25c-.41 0-.75.34-.75.75v4.5c0 .41.34.75.75.75s.75-.34.75-.75v-4.5c0-.41-.34-.75-.75-.75zm0-3.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"></path></g></svg>
            </g>
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
    'bold 15px "TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillText("Screenshot Generated", 20, 50);

  ctx.font =
    '13px "TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
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
                    font-family: "TwitterChirp", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .twitter-post {
                    max-width: 500px;
                    border-radius: 16px;
                    padding: 20px;
                    font-family: "TwitterChirp", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
    '14px "TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
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
                body { margin: 0; padding: 20px; background: white; font-family: "TwitterChirp", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
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
