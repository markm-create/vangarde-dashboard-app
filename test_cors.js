import fetch from 'node-fetch';

const urlHome = "https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec?action=getPostdatesData";
fetch(urlHome, { method: 'GET', redirect: 'manual' })
  .then(res => {
    console.log("Postdates GET manual:", res.status, res.headers.get('location'));
  });

fetch(urlHome, { method: 'POST', redirect: 'manual', body: JSON.stringify({ action: 'getPostdatesData'}) })
  .then(res => {
    console.log("Postdates POST manual:", res.status, res.headers.get('location'));
    console.log("CORS Allow Origin:", res.headers.get('access-control-allow-origin'));
  });
