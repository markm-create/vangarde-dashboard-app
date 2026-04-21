import fetch from 'node-fetch';

const targetUrl = "https://script.googleusercontent.com/macros/echo?user_content_key=AWDtjMVEgQsFBb0QqTjrBWoQDKNEtQn0e6Ox6mdkoOJuC8DN3_5STprAkMOj-LMIImnL2nVZWCaQ2IWwwlXRmRig_zoPpunP1KLMyHznlszc4pBiLu2mKwrLnGizL9nYTyO88kWbhrH_h0Okc7RxI64DULlXzaq_2ZaCjYyhYal2DDcg6X6WCNz-9Svy9LBACGvCmy_xG-guWxioB_vWoilV30HiMHyek5KvnOnlPcB-MuUvJXsji98Y_gTt7bRb-B3gUFV_2TN-_cwiXyWFuJAYDUJJoWXyYrvR3R70oBbN5sduPoFvw-dU1YRSUEhIdw&lib=MzCh3CXg9vKHaN6DzrFYoyIiZeVQPmepy";

fetch(targetUrl, { method: 'GET' })
  .then(res => {
    console.log("Redirect target status:", res.status);
    console.log("Redirect target CORS:", res.headers.get('access-control-allow-origin'));
  });
