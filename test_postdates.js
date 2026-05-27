const u = "https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec";
fetch(u, {
      method: 'POST',
      credentials: 'omit',
      redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getPostdatesData' })
    }).then(r=>r.text()).then(t=>console.log(t.substring(0, 1000))).catch(console.error);
