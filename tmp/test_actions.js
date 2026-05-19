const url = "https://script.google.com/macros/s/AKfycbwtnQ2B1i6yvcbZ29-D1FWaVzsLz14sQzFT1TTJGBnzK2oyPUcTp01oafeMw-VTbaQz/exec";

async function run() {
  const actions = ['getBillingAudit', 'getKPI', 'getCollectorPerformance', 'getCallPerformance'];
  for (const action of actions) {
    console.log("Fetching action:", action);
    try {
        const res = await fetch(`${url}?action=${action}`);
        const text = await res.text();
        console.log("Status:", res.status, "Length:", text.length, "Preview:", text.substring(0, 100));
    } catch(e) {
        console.log("Err:", e);
    }
  }
}
run();
