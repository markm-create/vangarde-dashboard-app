async function test() {
  try {
    const r = await fetch("https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec", {
      method: "POST",
      headers: { "Origin": "https://ais-dev-vtv6tlfgt4o5tujbtwgza3-80654157287.asia-southeast1.run.app", "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "getPostdatesData" }),
      redirect: "manual"
    });
    console.log("Status:", r.status);
    console.log("Headers:", Object.fromEntries(r.headers.entries()));
    const text = await r.text();
    console.log("Body:", text.slice(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
