/* eslint-disable */
console.log("Hello from the client side!");

export const displayMap = locations => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoibmFkamliOSIsImEiOiJjbTAyc3FrZHQwNTUwMmtxbDZuOGkyMTh0In0.kvg0iEc9_gdx6dG14EGZEw";

  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/nadjib9/cm03osr2800bu01qw1l5r9qi7", // style URL
    scrollZoom: false
    //   center: [-119.01085177568844, 35.37000514889885], // starting position [lng, lat]
    //   zoom: 7 // starting zoom
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement("div");
    el.className = "marker"; // from the style file

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom"
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
