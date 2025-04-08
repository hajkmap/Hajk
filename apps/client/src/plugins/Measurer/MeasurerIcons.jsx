import { SvgIcon } from "@mui/material";

function svg2Base64(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export function MeasurerIcon(props) {
  const d = `M732.1,10L500.9,241.3l84.9,84.9l-34,34l-84.9-84.9l-91,91l84.9,84.9l-34,34l-84.9-84.9l-99.3,99.3l84.9,84.9l-34,34l-84.9-84.9L10,732.1L267.9,990L990,267.9L732.1,10z M230.8,819.7c-13.9,13.9-36.5,13.9-50.4,0c-13.9-13.9-13.9-36.5,0-50.4c13.9-13.9,36.5-13.9,50.4,0C244.7,783.2,244.7,805.8,230.8,819.7z`;

  return (
    <SvgIcon {...props} width="20pt" height="20pt" viewBox="0 0 1000 1000">
      <path d={d} />
    </SvgIcon>
  );
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

export function IconCircle() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
		<circle cx="12" cy="12" r="10" style="fill:#ebebeb;fill-opacity:0;stroke:#000;stroke-width:1.8px;"/>
	</svg>
  `;

  return svg2Base64(svg);
}

export function IconSegment() {
  const svg = `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
    <g>
      <rect x="0" y="-0" width="24" height="24" style="fill:#f00;fill-opacity:0;" />
      <g>
        <path d="M5.278,18.804l13.438,-13.438" style="fill:none;stroke:#000;stroke-width:1.4px;" />
              <polygon points="10,11, 7,10 9,8" style="fill:#000;stroke:#000;stroke-width:1.4px;" />
      </g>
    </g>
  </svg>
  `;

  return svg2Base64(svg);
}
