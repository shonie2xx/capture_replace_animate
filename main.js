const main = document.querySelector("main");
// extract only the visible text
const text = main ? main.innerText : "No main element found.";
// replace content with a white canvas
document.body.innerHTML = `<canvas id="textCanvas"></canvas>`;

Object.assign(document.body.style, {
  margin: "0",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffffff",
  overflow: "auto",
  padding: "2rem",
  boxSizing: "border-box",
});

const canvas = document.getElementById("textCanvas");
Object.assign(canvas.style, {
  border: "1px solid #000000",
});

const ctx = canvas.getContext("2d");
const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
canvas.width = size;
canvas.height = size;

ctx.fillStyle = "#000000ff";
ctx.font = "24px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

function drawCenteredText(line) {
  const padding = 20;
  const maxWidth = canvas.width - padding * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const lines = [];
  let currentLine = "";
  const words = line.split(" ");

  for (let word of words) {
    const testLine = currentLine + word;

    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word + " ";
    } else {
      currentLine = testLine + " ";
    }
  }
  lines.push(currentLine);

  const lineHeight = 32;
  let y = canvas.height / 2;
  for (const line of lines) {
    ctx.fillText(line, canvas.width / 2, y);
    y += lineHeight;
  }
}

const lines = text.split("\n");
let idx = 0;
function drawNextLine() {
  if (idx >= lines.length) {
    return;
  }

  drawCenteredText(lines[idx]);
  const timeToChange = Math.max((lines[idx].length / 15) * 1000, 1500);
  console.log({ timeToChange });
  idx++;

  setTimeout(drawNextLine, timeToChange);
}

drawNextLine();
