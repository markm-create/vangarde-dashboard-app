import fetch from 'node-fetch';

const urlHome = "https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec";

fetch(urlHome, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'getPostdatesData'}) })
  .then(res => {
    console.log("Postdates POST manual (text/plain):", res.status, res.headers.get('location'));
    const targetUrl = res.headers.get('location');
    
    fetch(targetUrl, { method: 'GET', headers: { 'Origin': 'https://ais-dev.run.app' } })
      .then(r => {
         console.log("Redirect target CORS:", r.headers.get('access-control-allow-origin'));
      })
  });
