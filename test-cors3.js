async function test() {
  try {
    const r = await fetch("https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRcEDvp8unaBjToRqftoAL-GAvbjhRsx-jHI6-xokpsfmk6IgOrNdQRnhbHJIZ54w6uVjUWXSZvmbQE7P4UJx3rjinry9I4DuOljcNh0pKseU5GTYStHBlxYKFKzxMcoFp7iB9jQDb8x7tD_4qOHKckZKYDJdmUSg-OMbnZDHbgaFGutZ9jXZO7U_IPuhWGgK6RUON5UsTko1AmKHA3lFAWhYOmcixAGmoR4fJtJwQbgc0zPUwcvfsF06vOCksF--GWlxoFmTicoas9aJ9kXi8dpJqFUFSfTGTy8m5Zxm1uXNIMkbs&lib=MipAX257VlMVQTYfqdsYCw4iZeVQPmepy", {
      method: "GET",
      headers: { "Origin": "https://ais-dev-vtv6tlfgt4o5tujbtwgza3-80654157287.asia-southeast1.run.app" },
      redirect: "manual"
    });
    console.log("Status:", r.status);
    console.log("Headers:", Object.fromEntries(r.headers.entries()));
    const text = await r.text();
    console.log("Body:", text.slice(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
