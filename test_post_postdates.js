import fetch from 'node-fetch';

const urlPostdates = "https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec";
fetch(urlPostdates, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: JSON.stringify({ action: 'getPostdatesData' })
})
  .then(res => {
    console.log("Postdates POST status:", res.status);
    return res.text();
  })
  .then(text => console.log("Postdates POST body:", text.substring(0, 100)))
  .catch(err => console.error("Postdates POST err:", err));
