import fetch from 'node-fetch';

const urlOverdue = "https://script.google.com/macros/s/AKfycbwlQQdBpbrjopy3t_V-6_TR5ZUJmkIEis-pSQR9aXY_RH3AKxGRJ_Rs9_7m9jvN2AOodg/exec?action=getPayments";
fetch(urlOverdue)
  .then(res => {
    console.log("Overdue GET status:", res.status);
    return res.text();
  })
  .then(text => console.log("Overdue GET body:", text.substring(0, 100)))
  .catch(err => console.error("Overdue GET err:", err));
