function svg2Base64(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export function IconMarker(color = "#00aeef") {
  const svg = `<svg width="200" height="307" viewBox="0 0 200 307" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
<g>
  <path d="M100.219,302.45c0,0.055 0.11,0.164 0.11,0.164c-0,0 96,-147.469 96,-195.931c-0,-71.323 -48.658,-102.352 -96.11,-102.462c-47.452,0.11 -96.109,31.139 -96.109,102.462c-0,48.462 96.054,195.931 96.054,195.931l0.055,-0.164Zm-33.26,-199.824c-0,-18.42 14.904,-33.332 33.315,-33.332c18.411,0 33.315,14.912 33.315,33.332c0,18.42 -14.959,33.331 -33.37,33.331c-18.356,0 -33.26,-14.911 -33.26,-33.331Z" style="fill:${color};fill-rule:nonzero;" />
</g>
</svg>`;
  return svg2Base64(svg);
}

export function IconPolygon() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
<g>
  <rect x="0" y="0" width="24" height="24" style="fill:#f00;fill-opacity:0;" />
  <g>
    <path d="M12.112,2.706l10.001,7.266l-3.82,11.757l-12.362,-0l-3.82,-11.757l10.001,-7.266Z" style="fill:#ebebeb;fill-opacity:0;stroke:#000;stroke-width:1.42px;" />
    <circle cx="12.21" cy="2.763" r="2.5" />
    <circle cx="2.618" cy="9.85" r="2.5" />
    <circle cx="21.45" cy="9.85" r="2.5" />
    <circle cx="5.654" cy="21.407" r="2.5" />
    <circle cx="17.928" cy="21.352" r="2.5" />
  </g>
</g>
</svg>`;

  return svg2Base64(svg);
}

export function IconRect() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
	<g>
		<rect x="0" y="0" width="24" height="24" style="fill:#f00;fill-opacity:0;" />
		<g>
			<rect x="3.652" y="6.224" width="16.699" height="11.77" style="fill:#ebebeb;fill-opacity:0;stroke:#000;stroke-width:1.4px;" />
			<circle cx="3.657" cy="6.271" r="2.5" />
			<circle cx="20.286" cy="6.319" r="2.5" />
			<circle cx="3.697" cy="18.005" r="2.5" />
			<circle cx="20.367" cy="18.029" r="2.5" />
		</g>
	</g>
</svg>`;

  return svg2Base64(svg);
}

export function IconLine() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
	<g>
		<rect x="0" y="-0" width="24" height="24" style="fill:#f00;fill-opacity:0;" />
		<g>
			<path d="M5.278,18.804l13.438,-13.438" style="fill:none;stroke:#000;stroke-width:1.4px;" />
			<circle cx="5.19" cy="18.986" r="2.5" />
			<circle cx="18.494" cy="5.611" r="2.5" />
		</g>
	</g>
</svg>`;

  return svg2Base64(svg);
}

export function IconPoint() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
	<g>
		<rect x="0" y="0" width="24" height="24" style="fill:#f00;fill-opacity:0;" />
		<circle cx="12" cy="12" r="3.96" />
	</g>
</svg>
`;

  return svg2Base64(svg);
}

export function IconEdp() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 320 320" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
	<circle id="path641" cx="159.819" cy="159.819" r="159.819" style="fill:#8c1a14;" />
	<path id="path475" d="M188.515,202.381c3.318,-9.723 5.933,-17.779 5.81,-17.901c-0.122,-0.123 -1.928,0.358 -4.013,1.069c-2.981,1.015 -6.442,1.232 -16.211,1.015c-13.808,-0.308 -16.552,-1.2 -17.446,-5.673l-0.46,-2.301l-3.648,3.211c-5.172,4.553 -11.325,6.696 -19.349,6.74c-7.364,0.039 -12.561,-1.526 -15.997,-4.818l-2.186,-2.094l-4.743,2.329l-4.744,2.329l-23.442,0.239c-26.819,0.273 -34.101,-0.531 -42.576,-4.704c-8.54,-4.204 -11.7,-9.523 -11.7,-19.695c0,-7.248 1.863,-12.104 6.654,-17.346c4.802,-5.254 10.268,-8.525 18.574,-11.116c5.473,-1.706 7.659,-1.903 21.159,-1.903c13.283,-0 15.726,0.212 20.752,1.802c9.08,2.872 14.242,8.27 14.242,14.895c-0,5.064 -3.872,9.602 -11.483,13.459c-3.802,1.927 -4.476,1.989 -21.449,1.989l-17.524,0l-0,2.495c-0,3.704 1.293,5.474 4.689,6.417c1.756,0.488 12.359,0.847 25.082,0.849l22.039,0.005l-0.362,-4.364c-1.366,-16.473 10.415,-30.828 29.525,-35.98c3.015,-0.813 10.159,-1.52 18.673,-1.849l13.79,-0.532l6.225,-17.572c3.423,-9.665 6.486,-17.996 6.806,-18.514c0.405,-0.656 4.902,-0.942 14.776,-0.942c11.565,-0 14.193,0.209 14.193,1.129c0,0.972 -23.131,67.022 -26.466,75.572l-1.19,3.052l11.862,-0l7.221,-21.258l7.22,-21.257l24.481,0.414c26.582,0.449 30.369,0.976 36.232,5.039c6.259,4.337 8.504,14.386 4.96,22.195c-2.067,4.552 -8.26,11.085 -12.499,13.183l-3.399,1.682l20.955,0.001c19.855,0.001 20.956,0.08 20.956,1.508c-0,2.779 -3.605,7.007 -7.733,9.072c-4.062,2.032 -4.104,2.035 -31.228,2.27c-29.529,0.255 -32.363,-0.075 -37.47,-4.373l-2.324,-1.956l-6.806,19.927l-6.806,19.927l-29.654,0.012l6.032,-17.678l0,0Zm46.556,-28.169c9.579,-2.007 14.804,-7.493 15.51,-16.281c0.371,-4.63 0.216,-5.287 -1.823,-7.71c-2.597,-3.087 -6.009,-5.031 -8.829,-5.031c-2.169,-0 -2.297,0.288 -9.342,20.955c-3.515,10.311 -3.797,9.803 4.484,8.067Zm-73.404,-13.153c2.345,-6.714 4.522,-13.031 4.839,-14.038l0.574,-1.831l-20.154,-0l-3.567,10.429c-3.249,9.503 -3.473,10.653 -2.521,12.951c1.431,3.456 5.59,5.048 12.6,4.823l3.965,-0.127l4.264,-12.207Zm-89.659,-8.71l9.612,-7.159l-16.039,-0l-2.262,6.714c-1.245,3.692 -2.466,7.222 -2.715,7.844c-0.6,1.497 -0.133,1.194 11.404,-7.399Z" style="fill:#fff;fill-rule:nonzero;" />
</svg>`;

  return svg2Base64(svg);
}

export function IconExcel() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 2290 2130" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
	<path d="M1437.75,1011.75l-905.25,-159.75l0,1180.39c0,53.907 43.7,97.607 97.607,97.607l1562.04,0c53.907,0 97.607,-43.7 97.607,-97.607l0,-434.893l-852,-585.75Z" style="fill:#185c37;fill-rule:nonzero;" />
	<path d="M1437.75,0l-807.643,0c-53.907,0 -97.607,43.7 -97.607,97.607l0,434.893l905.25,532.5l479.25,159.75l372.75,-159.75l0,-532.5l-852,-532.5Z" style="fill:#21a366;fill-rule:nonzero;" />
	<rect x="532.5" y="532.5" width="905.25" height="532.5" style="fill:#107c41;fill-rule:nonzero;" />
	<path d="M1180.39,426l-647.893,0l0,1331.25l647.893,0c53.834,-0.175 97.432,-43.773 97.607,-97.607l0,-1136.04c-0.175,-53.834 -43.773,-97.432 -97.607,-97.607Z" style="fill-opacity:0.1;fill-rule:nonzero;" />
	<path d="M1127.14,479.25l-594.643,0l0,1331.25l594.643,0c53.834,-0.175 97.432,-43.773 97.607,-97.607l0,-1136.04c-0.175,-53.834 -43.773,-97.432 -97.607,-97.607Z" style="fill-opacity:0.2;fill-rule:nonzero;" />
	<path d="M1127.14,479.25l-594.643,0l0,1224.75l594.643,0c53.834,-0.175 97.432,-43.773 97.607,-97.607l0,-1029.54c-0.175,-53.834 -43.773,-97.432 -97.607,-97.607Z" style="fill-opacity:0.2;fill-rule:nonzero;" />
	<path d="M1073.89,479.25l-541.393,0l0,1224.75l541.393,0c53.834,-0.175 97.432,-43.773 97.607,-97.607l0,-1029.54c-0.175,-53.834 -43.773,-97.432 -97.607,-97.607Z" style="fill-opacity:0.2;fill-rule:nonzero;" />
	<path d="M97.607,479.25l976.285,0c53.907,0 97.607,43.7 97.607,97.607l0,976.285c0,53.907 -43.7,97.607 -97.607,97.607l-976.285,0c-53.907,0.001 -97.607,-43.699 -97.607,-97.606l-0,-976.286c-0,-53.907 43.7,-97.607 97.607,-97.607Z" style="fill:url(#_Linear1);fill-rule:nonzero;" />
	<path d="M302.3,1382.26l205.332,-318.169l-188.132,-316.412l151.336,-0l102.666,202.35c9.479,19.223 15.975,33.494 19.49,42.919l1.331,-0c6.745,-15.336 13.845,-30.228 21.3,-44.677l109.748,-200.485l138.929,-0l-192.925,314.548l197.825,319.925l-147.822,-0l-118.588,-222.105c-5.586,-9.45 -10.326,-19.376 -14.164,-29.66l-1.757,-0c-3.474,10.075 -8.083,19.722 -13.739,28.755l-122.102,223.011l-148.728,-0Z" style="fill:#fff;fill-rule:nonzero;" />
	<path d="M2192.14,0l-754.393,0l0,532.5l852,0l0,-434.893c0,-53.907 -43.7,-97.607 -97.607,-97.607Z" style="fill:#33c481;fill-rule:nonzero;" />
	<rect x="1437.75" y="1065" width="852" height="532.5" style="fill:#107c41;fill-rule:nonzero;" />
	<defs>
		<linearGradient id="_Linear1" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(764.474,1324.04,-1324.04,764.474,203.513,402.982)">
			<stop offset="0" style="stop-color:#18884f;stop-opacity:1" />
			<stop offset="0.5" style="stop-color:#117e43;stop-opacity:1" />
			<stop offset="1" style="stop-color:#0b6631;stop-opacity:1" />
		</linearGradient>
	</defs>
</svg>
`;

  return svg2Base64(svg);
}
