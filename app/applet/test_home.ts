const url = "https://script.google.com/macros/s/AKfycbzItlApZGUH_5sp27xauWfzKfrO0DwmuS_PHCQfmYMRBoUVt2KCXyJefVjseXoei3eW/exec?action=getHomeData";
fetch(url)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data.homeData.dailyMetrics, null, 2)))
  .catch(err => console.error(err));
