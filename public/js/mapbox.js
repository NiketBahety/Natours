/* eslint-disable */
export const displayMap = (locations) => {
   mapboxgl.accessToken =
      'pk.eyJ1IjoibmlrZXQwOTA5IiwiYSI6ImNreDk3M25rZjB3ZXUybm1ubnl0aHU3Z2IifQ.8JaNSKkMC4QIo7mfyvtRTA';
   var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/niket0909/ckx985kc5apsq14k5vu8fwhty',
      scrollZoom: false,
   });

   const bounds = new mapboxgl.LngLatBounds();

   locations.forEach((loc) => {
      // Create Marker
      const el = document.createElement('div');
      el.className = 'marker';

      // Add Marker
      new mapboxgl.Marker({
         element: el,
         anchor: 'bottom',
      })
         .setLngLat(loc.coordinates)
         .addTo(map);

      // Add popup
      new mapboxgl.Popup({
         offset: 30,
      })
         .setLngLat(loc.coordinates)
         .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
         .addTo(map);

      //Extend map bounds to include current locations
      bounds.extend(loc.coordinates);
   });

   map.fitBounds(bounds, {
      padding: {
         top: 200,
         bottom: 150,
         left: 100,
         right: 100,
      },
   });
};
