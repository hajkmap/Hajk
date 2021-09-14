import { GeoJSON, WFS } from "ol/format";
import {
  and as andFilter,
  equalTo as equalToFilter,
  like as likeFilter,
} from "ol/format/filter";
import { hfetch } from "utils/FetchWrapper";

class FirWfsService {
  constructor(defaultOptions) {
    this.params = defaultOptions;
  }

  // <wfs:GetFeature
  //        service = 'WFS'
  //        version = '1.1.0'
  //        xmlns:wfs = 'http://www.opengis.net/wfs'
  //        xmlns:ogc = 'http://www.opengis.net/ogc'
  //        xmlns:gml = 'http://www.opengis.net/gml'
  //        xmlns:esri = 'http://www.esri.com'
  //        xmlns:xsi = 'http://www.w3.org/2001/XMLSchema-instance'
  //        xsi:schemaLocation='http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd'
  //        outputFormat="GML3"
  //        maxFeatures= "10000">
  //        <wfs:Query typeName='feature:fastighet_yta_alla_wms' srsName='EPSG:3007'>
  //         <ogc:Filter>

  //         <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">
  //           <ogc:PropertyName>fastbet</ogc:PropertyName>
  //           <ogc:Literal>druv*</ogc:Literal>
  //         </ogc:PropertyIsLike>
  //         </ogc:Filter>
  //        </wfs:Query>
  //     </wfs:GetFeature>

  search(params) {
    let _params = { ...this.params, ...params };

    if (_params.text.trim() === "") {
      console.log("no text to search for");
      return Promise.resolve(null);
    }

    if (!_params.exactMatch) {
      _params.text = _params.text + "*";
    }

    console.log("Will search with params:", _params);

    const featureRequest = new WFS().writeGetFeature({
      srsName: "EPSG:3007",
      featureNS: "https://www.opengis.net",
      outputFormat: "application/json",
      maxFeatures: "10000",
      // featurePrefix: "feature",
      featureTypes: ["feature:fastighet_yta_alla_wms"],
      // outputFormat: "application/json",
      filter: likeFilter("fastbet", _params.text, "*", ".", "!", false),
      // equalToFilter("waterway", "riverbank")

      // filter: andFilter(
      //   likeFilter("fastbet", "druv*")
      //   // equalToFilter("waterway", "riverbank")
      // ),
    });

    const requestXml = new XMLSerializer().serializeToString(featureRequest);

    return new Promise((resolve, reject) => {
      hfetch("https://kommungis-utv.varberg.se/util/geoserver/sbk_fk_v1/wfs", {
        method: "POST",
        body: requestXml,
      })
        .then((response) => {
          return response ? response.json() : null;
        })
        .then((data) => {
          // let translate = {
          //   agare_notering: "note_owner",
          //   namn1: "owner1",
          //   namn2: "owner2",
          //   namn3: "owner3",
          //   fastbet: "name",
          //   fastighetsadress: "address",
          //   totalarea: "total_area",
          //   omrade: "area",
          //   fnr: "id",
          // };

          // data.features.forEach((item) => {
          //   for (let key in translate) {
          //     item.properties[translate[key]] = item.properties[key] || null;
          //     let d
          //   }
          // });

          // console.log(data);
          resolve(new GeoJSON().readFeatures(data));
        });
    });
  }
}

export default FirWfsService;
