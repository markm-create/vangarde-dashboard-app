import fetch from 'node-fetch';

const targetUrl = "https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec?action=getPostdatesData";

fetch(targetUrl, { method: 'GET' })
  .then(res => {
    console.log("Postdates GET status:", res.status);
    return res.text();
  })
  .then(text => console.log("Postdates body:", text.substring(0, 100)));
