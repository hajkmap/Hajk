import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/system";

import { useMapClickViewerContext } from "../../MapClickViewerContext";

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    // Probably CORS issue, or the URL is not working.
    return { ok: false, status: 0 };
  }
}

const Markdown = (props) => {
  const { feature, featureCollection } = props;

  const [reactComponent, setReactComponent] = useState(null);
  const containerRef = useRef(null);

  const { featurePropsParsing } = useMapClickViewerContext();

  useEffect(() => {
    featurePropsParsing
      .setMarkdownAndProperties({
        markdown: featureCollection.infoclickDefinition,
        properties: featurePropsParsing.extractPropertiesFromJson(
          feature.getProperties()
        ),
      })
      .mergeFeaturePropsWithMarkdown()
      .then((MarkdownComponent) => {
        setReactComponent(MarkdownComponent);
      })
      .catch((error) => {
        setReactComponent(null);
      });
  }, [feature, featureCollection, featurePropsParsing]);

  useEffect(() => {
    if (!containerRef.current || !reactComponent) return;

    const links = containerRef.current.querySelectorAll("a[link-check]");
    if (links.length === 0) return;

    let cancelled = false;

    links.forEach((link) => {
      checkUrl(link.href).then(({ ok, status }) => {
        if (cancelled) return;
        link.setAttribute("link-check-result", status);
        if (ok) {
          link.removeAttribute("link-check");
        } else {
          const fallbackText = link.getAttribute("link-check-fallback");
          if (fallbackText) {
            const span = document.createElement("span");
            span.className = "link-check-fallback";
            span.textContent = fallbackText;
            link.after(span);
          }
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [reactComponent]);

  return (
    <Box
      ref={containerRef}
      sx={{
        userSelect: "text",
        cursor: "auto",
        "& summary": {
          cursor: "pointer",
        },
        "& a[link-check]": {
          display: "none",
        },
      }}
    >
      {reactComponent}
    </Box>
  );
};

export default Markdown;
