const main = document.querySelector("main");
const textContent = main ? main.innerText : "No main element found.";

// Replace page content with canvas
document.body.innerHTML = `<canvas id="textCanvas"></canvas>`;

Object.assign(document.body.style, {
  margin: "0",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#000000ff",
  overflow: "auto",
  padding: "2rem",
  boxSizing: "border-box",
});

const canvas = document.getElementById("textCanvas");
Object.assign(canvas.style, {
  border: "1px solid #353434ff",
  backgroundColor: "#ffffff",
});

const ctx = canvas.getContext("2d");
const canvasSize = Math.min(window.innerWidth, window.innerHeight) * 0.9;
canvas.width = canvasSize;
canvas.height = canvasSize;

ctx.fillStyle = "#000000";
ctx.font = "24px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

// Draws a single block of text (wrapped and centered)
function renderTextBlock(textBlock) {
  const padding = 20;
  const lineHeight = 32;
  const maxWidth = canvas.width - padding * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

// Sequentially render multiple text blocks (paragraphs)
function renderTextSequence(fullText) {
  const textBlocks = fullText
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  let blockIndex = 0;

  const renderNextBlock = () => {
    if (blockIndex >= textBlocks.length) return;

    const textBlock = textBlocks[blockIndex];
    const charsPerSecond = 15;
    const displayDuration = Math.max(
      (textBlock.length / charsPerSecond) * 1000,
      1500
    );

    renderTextBlock(textBlock);
    blockIndex++;
    setTimeout(renderNextBlock, displayDuration);
  };

  renderNextBlock();
}

renderTextSequence(textContent);
