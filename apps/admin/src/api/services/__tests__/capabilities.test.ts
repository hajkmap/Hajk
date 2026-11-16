import { describe, it, expect } from "vitest";
import {
  chooseProjection,
  crsCode,
  parseCapabilitiesFromXML,
} from "../capabilities";

// The service has no abstract of its own, but its layers have.
const WMS = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service>
    <Name>WMS</Name>
    <Title>Kommunens karttjänst</Title>
    <Abstract></Abstract>
    <ContactInformation>
      <ContactPersonPrimary>
        <ContactPerson>GIS-gruppen</ContactPerson>
        <ContactOrganization>Exempelkommunen</ContactOrganization>
      </ContactPersonPrimary>
    </ContactInformation>
  </Service>
  <Capability>
    <Layer>
      <Title>Alla lager</Title>
      <Abstract>Rotlagrets beskrivning</Abstract>
      <CRS>EPSG:4326</CRS>
      <CRS>EPSG:3006</CRS>
      <CRS>EPSG:3010</CRS>
      <Layer queryable="1">
        <Name>ws:byggnader</Name>
        <Title>Byggnader</Title>
        <Abstract>Byggnader i kommunen</Abstract>
        <CRS>EPSG:3857</CRS>
        <Style>
          <Name>default</Name>
          <LegendURL><OnlineResource xlink:href="https://example.org/legend.png"/></LegendURL>
        </Style>
      </Layer>
      <Layer>
        <Name>ws:vagar</Name>
        <Title>Vägar</Title>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

const WFS = `<?xml version="1.0" encoding="UTF-8"?>
<WFS_Capabilities version="2.0.0" xmlns="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1">
  <ows:ServiceIdentification>
    <ows:Title>Adresser</ows:Title>
    <ows:Abstract>Gällande adresser</ows:Abstract>
  </ows:ServiceIdentification>
  <ows:ServiceProvider>
    <ows:ProviderName>Exempelkommunen</ows:ProviderName>
  </ows:ServiceProvider>
  <FeatureTypeList>
    <FeatureType>
      <Name>adr:adresser</Name>
      <Title>Adresser</Title>
      <DefaultCRS>urn:ogc:def:crs:EPSG::3007</DefaultCRS>
      <OtherCRS>urn:ogc:def:crs:EPSG::3006</OtherCRS>
    </FeatureType>
    <FeatureType>
      <Name>adr:gator</Name>
      <Title>Gator</Title>
      <Abstract>Gatunamn</Abstract>
      <DefaultCRS>http://www.opengis.net/def/crs/EPSG/0/3006</DefaultCRS>
    </FeatureType>
  </FeatureTypeList>
</WFS_Capabilities>`;

describe("parseCapabilitiesFromXML, WMS", () => {
  const capabilities = parseCapabilitiesFromXML(WMS, "WMS");

  it("reads the service's own part, never a layer's", () => {
    expect(capabilities.metadata).toEqual({
      title: "Kommunens karttjänst",
      description: undefined,
      organization: "Exempelkommunen",
    });
  });

  it("lists the named layers with their workspaces and styles", () => {
    expect(capabilities.layers).toEqual(["ws:byggnader", "ws:vagar"]);
    expect(capabilities.workspaces).toEqual(["ws"]);
    expect(capabilities.styles?.["ws:byggnader"]).toEqual([
      { name: "default", legendUrl: "https://example.org/legend.png" },
    ]);
  });

  it("reads each layer's own title and abstract", () => {
    expect(capabilities.layerInfo).toEqual({
      "ws:byggnader": { title: "Byggnader", abstract: "Byggnader i kommunen" },
      "ws:vagar": { title: "Vägar", abstract: undefined },
    });
  });

  it("lists the coordinate systems every layer has, inherited ones first", () => {
    expect(capabilities.projections).toEqual([
      "EPSG:4326",
      "EPSG:3006",
      "EPSG:3010",
    ]);
  });
});

describe("parseCapabilitiesFromXML, WFS", () => {
  const capabilities = parseCapabilitiesFromXML(WFS, "WFS");

  it("reads the service's identification and provider", () => {
    expect(capabilities.metadata).toEqual({
      title: "Adresser",
      description: "Gällande adresser",
      organization: "Exempelkommunen",
    });
  });

  it("reads each feature type's title and abstract", () => {
    expect(capabilities.layerInfo?.["adr:gator"]).toEqual({
      title: "Gator",
      abstract: "Gatunamn",
    });
  });

  it("lists the coordinate systems every feature type has", () => {
    expect(capabilities.projections).toEqual(["EPSG:3006"]);
  });
});

describe("crsCode", () => {
  it.each([
    ["EPSG:3006", "EPSG:3006"],
    ["urn:ogc:def:crs:EPSG::3006", "EPSG:3006"],
    ["urn:x-ogc:def:crs:EPSG:6.11:3006", "EPSG:3006"],
    ["http://www.opengis.net/def/crs/EPSG/0/3006", "EPSG:3006"],
    ["epsg:3010", "EPSG:3010"],
    ["CRS:84", "CRS:84"],
  ])("%s is %s", (value, code) => {
    expect(crsCode(value)).toBe(code);
  });
});

describe("chooseProjection", () => {
  const offered = ["EPSG:3006", "EPSG:3007", "EPSG:3857"];

  it("keeps the default when the service lists it", () => {
    expect(
      chooseProjection("EPSG:3007", ["EPSG:4326", "EPSG:3007"], offered),
    ).toBe("EPSG:3007");
  });

  it("else takes the first listed one admin offers", () => {
    expect(
      chooseProjection(
        "EPSG:3010",
        ["EPSG:4326", "EPSG:3034", "EPSG:3857", "EPSG:3006"],
        offered,
      ),
    ).toBe("EPSG:3857");
  });

  it("keeps the default when none of the listed ones is offered", () => {
    expect(chooseProjection("EPSG:3007", ["EPSG:4326"], offered)).toBe(
      "EPSG:3007",
    );
  });

  it("keeps the default when the answer lists none", () => {
    expect(chooseProjection("EPSG:3007", [], offered)).toBe("EPSG:3007");
  });
});
