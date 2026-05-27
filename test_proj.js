const u = "https://script.google.com/macros/s/AKfycbzroRKitu4i5ngpjnra-hPQXcHQYelTAWoD3Fmdt1yRgMgrH__qSl58zqUiQLChZZzN1w/exec";
fetch(u).then(r=>r.text()).then(t=>console.log(t.substring(0, 1000))).catch(console.error);
