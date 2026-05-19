async function testUrl(name, url) {
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log(name, "Status:", res.status, "Length:", text.length, "Preview:", text.substring(0, 50));
    } catch(e) {
        console.log(name, "Fetch Err:", e.message);
    }
}
async function run() {
    await testUrl("BILLING_AUDIT", "https://script.google.com/macros/s/AKfycbxjOoPRA0WoS45ehHUpJu_HR_ZJsYVGI5Wk85UuAgMkZAWrX4d09rKD_8kQlCskYZ9fVA/exec");
    await testUrl("KPI", "https://script.google.com/macros/s/AKfycbw2-0NgTNlwg4OISWXS4Q9A2Glmhg8tBZjAVoXkrYc28V-yBz905pobt4kndKH18fImbw/exec");
    await testUrl("CALL_PERFORMANCE", "https://script.google.com/macros/s/AKfycbz4fW8c9mXuOR_n54z3yctPJJeDpOgbxT_k0ZdNzUHuur_U36vVIDJyWElEpR0m5ssNUw/exec");
    await testUrl("COLLECTOR", "https://script.google.com/macros/s/AKfycbztWl_oMqMewV2Pa4AHrUcxcI6QwEXLj4-myvoh6cKSXL5o_5Xp6XdPT1yxq-FUAFak8A/exec");
}
run();
