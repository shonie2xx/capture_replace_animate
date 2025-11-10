// Capture all visible text content
function getVisibleTextFromDocument(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim())
          return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName ? parent.tagName.toLowerCase() : "";
        if (
          ["script", "style", "noscript", "svg", "canvas", "iframe"].includes(
            tag
          )
        )
          return NodeFilter.FILTER_REJECT;

        let el = parent;
        while (el && el !== document.documentElement) {
          if (
            el.hasAttribute("hidden") ||
            el.getAttribute("aria-hidden") === "true"
          )
            return NodeFilter.FILTER_REJECT;
          const cs = window.getComputedStyle(el);
          if (
            cs.display === "none" ||
            cs.visibility === "hidden" ||
            cs.opacity === "0"
          )
            return NodeFilter.FILTER_REJECT;
          el = el.parentElement;
        }
        if (parent.getClientRects && parent.getClientRects().length === 0)
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  const parts = [];
  let node;
  while ((node = walker.nextNode())) {
    parts.push(node.nodeValue.replace(/\s+/g, " ").trim());
  }
  return parts.join(" ").trim();
}

const textContent = getVisibleTextFromDocument();

// Replace the entire page with white canvas
document.body.innerHTML = `
<div id="container">
  <canvas id="textCanvas"></canvas>
  <div id="buttonsBar">
    <button id="recordingBtn">Start Recording</button>
  </div>
</div>
`;

Object.assign(document.body.style, {
  margin: "0",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
});

Object.assign(document.getElementById("container").style, {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
});

const canvas = document.getElementById("textCanvas");
Object.assign(canvas.style, {
  border: "1px solid #353434ff",
  backgroundColor: "#ffffff",
});

Object.assign(document.getElementById("buttonsBar").style, {
  display: "flex",
  gap: "1rem",
  marginTop: "1rem",
});

// Canvas initialization
const ctx = canvas.getContext("2d");
const canvasSize = Math.min(window.innerWidth, window.innerHeight) * 0.9;
canvas.width = canvasSize;
canvas.height = canvasSize;

ctx.font = "24px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

// Draw text block with fade-in/fade-out
function drawTextBlock(textBlock, alpha) {
  const padding = 20;
  const lineHeight = 32;
  const maxWidth = canvas.width - padding * 2;

  // Reset canvas
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#1a1a1a";

  const words = textBlock.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + word + " ";
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine.trim());

  // Center vertically
  const totalHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });
}

// Split text into readable sentences
function splitIntoSentences(text) {
  return (
    text
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]*/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || []
  );
}

function renderTextSequence(fullText) {
  const sentences = splitIntoSentences(fullText);
  let index = 0;
  let startTime = performance.now();
  const charsPerSecond = 15;
  let fadeDuration = 500;
  let fadePhase = "in";
  let alpha = 0;

  function animate(now) {
    if (index >= sentences.length) return;

    const sentence = sentences[index];
    const displayDuration = Math.max(
      (sentence.length / charsPerSecond) * 1000,
      1500
    );

    const elapsed = now - startTime;

    // Fade logic
    if (fadePhase === "in") {
      alpha = Math.min(1, elapsed / fadeDuration);
      if (elapsed >= fadeDuration) {
        fadePhase = "show";
        startTime = now;
      }
    } else if (fadePhase === "show") {
      alpha = 1;
      if (elapsed >= displayDuration) {
        fadePhase = "out";
        startTime = now;
      }
    } else if (fadePhase === "out") {
      alpha = 1 - Math.min(1, elapsed / fadeDuration);
      if (elapsed >= fadeDuration) {
        index++;
        fadePhase = "in";
        startTime = now;
      }
    }

    drawTextBlock(sentence, alpha);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

renderTextSequence(textContent);

let isRecording = false;
let mediaRecorder;
let recordedChunks = [];

document.getElementById("recordingBtn").addEventListener("click", async () => {
  isRecording = !isRecording;

  if (isRecording) {
    // start recording
    const stream = canvas.captureStream(30); // 30 FPS
    recordedChunks = [];

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start();

    recordingBtn.textContent = "Stop Recording";
    recordingBtn.style.backgroundColor = "#ff4c4cff";
  } else {
    // stop recording
    mediaRecorder.stop();

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      recordedChunks = [];
    };
    recordingBtn.textContent = "Start Recording";
    recordingBtn.style.backgroundColor = "";
  }
});
