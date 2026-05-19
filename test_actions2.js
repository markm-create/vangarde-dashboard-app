const url = "https://script.google.com/macros/s/AKfycbwtnQ2B1i6yvcbZ29-D1FWaVzsLz14sQzFT1TTJGBnzK2oyPUcTp01oafeMw-VTbaQz/exec";

async function run() {
  console.log("Fetching action:");
  const res = await fetch(`${url}`);
  const text = await res.text();
  console.log("Status:", res.status, "Length:", text.length, "Preview:", text);
}
run();
