async function test() {
  try {
    const r = await fetch("https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnR6sWOY0lIcboQC4cmpReTQ77XcjVG-m5MBCs6eG8xL_CYogqxW2EshutoD0JHNAkYzp7_0FrYD5sHfXf_2h1AUaMxGNaTJVl9CZfDp1Ulxb_CsZGfvBkROdAzMOM3dIB4rdaadPByIAyLGfPimcepUOOktapJi_ZFnEsV5QdqmmVXm_UZmCS-fNj2AIsBn46sw-nhNdit8s1VL0US-SgsYIgViDQhg9UD011pkkjaejF-vOogFiFyS3EkN9XCi-slmf7dvaO2_ef8i4MgNL6A0duvn6A&lib=MzCh3CXg9vKHaN6DzrFYoyIiZeVQPmepy", {
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
