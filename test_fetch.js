import fetch from 'node-fetch';

const urlHome = "https://script.google.com/macros/s/AKfycbzItlApZGUH_5sp27xauWfzKfrO0DwmuS_PHCQfmYMRBoUVt2KCXyJefVjseXoei3eW/exec?action=getHomeData";
fetch(urlHome)
  .then(res => {
    console.log("Home status:", res.status);
    return res.text();
  })
  .then(text => console.log("Home body:", text.substring(0, 100)))
  .catch(err => console.error("Home err:", err));

const urlOverdue = "https://script.google.com/macros/s/AKfycbwlQQdBpbrjopy3t_V-6_TR5ZUJmkIEis-pSQR9aXY_RH3AKxGRJ_Rs9_7m9jvN2AOodg/exec";
fetch(urlOverdue, { method: 'POST', body: JSON.stringify({ action: 'getPayments' })})
  .then(res => {
    console.log("Overdue status:", res.status);
    return res.text();
  })
  .then(text => console.log("Overdue body:", text.substring(0, 100)))
  .catch(err => console.error("Overdue err:", err));
