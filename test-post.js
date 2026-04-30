const fetch = require('node-fetch');
async function test() {
  try {
    const r = await fetch("https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "getPostdatesData" })
    });
    const text = await r.text();
    console.log("Status:", r.status);
    console.log("Body:", text.slice(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
