import fetch from 'node-fetch';

const targetUrl = "https://script.google.com/macros/s/AKfycbxjOoPRA0WoS45ehHUpJu_HR_ZJsYVGI5Wk85UuAgMkZAWrX4d09rKD_8kQlCskYZ9fVA/exec?action=getBillingAudit";

fetch(targetUrl, { method: 'GET' })
  .then(res => {
    console.log("Billing GET status:", res.status);
    return res.text();
  })
  .then(text => console.log("Billing body:", text.substring(0, 100)));
