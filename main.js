const main = document.querySelector("main");
const textContent = main ? main.innerText : "No main element found.";

// Replace page content with canvas
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

// canvas init
const ctx = canvas.getContext("2d");
const canvasSize = Math.min(window.innerWidth, window.innerHeight) * 0.9;
canvas.width = canvasSize;
canvas.height = canvasSize;
ctx.fillStyle = "#000000";
ctx.font = "24px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

// Canvas draw func. Draws a block of text centered both horizontally and vertically
function drawTextBlock(textBlock) {
  const padding = 20;
  const lineHeight = 32;
  const maxWidth = canvas.width - padding * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "24px sans-serif";

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

// Main rendering loop
function renderTextSequence(fullText) {
  const textBlocks = fullText
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  let blockIndex = 0;
  let startTime = performance.now();
  // Person can read on avarage around 15-20 characters per second
  const charsPerSecond = 15;

  // use requestAnimationFrame for smooth timing and recording
  function animate(now) {
    if (blockIndex >= textBlocks.length) return;

    const textBlock = textBlocks[blockIndex];

    // Calculate display duration based on text length
    const displayDuration = Math.max(
      (textBlock.length / charsPerSecond) * 1000,
      1500
    );

    const elapsed = now - startTime;

    drawTextBlock(textBlock);

    if (elapsed >= displayDuration) {
      blockIndex++;
      startTime = now;
    }

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
