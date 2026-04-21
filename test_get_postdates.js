import fetch from 'node-fetch';

const urlPostdates = "https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec?action=getPostdatesData";
fetch(urlPostdates)
  .then(res => {
    console.log("Postdates GET status:", res.status);
    return res.text();
  })
  .then(text => console.log("Postdates GET body:", text.substring(0, 100)))
  .catch(err => console.error("Postdates GET err:", err));
