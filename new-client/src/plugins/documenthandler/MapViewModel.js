export default class MapViewModel {
  constructor(settings) {
    console.log(settings, "settings");
    this.localObserver = settings.localObserver;
    this.map = settings.map;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("fly-to", this.flyTo);
  };

  flyTo = ({ center, zoom }) => {
    const duration = 1500;
    this.map.getView().animate({
      zoom: zoom,
      center: center,
      duration: duration
    });
  };
  /*
  setView = () => {
    let url = item.presetUrl.toLowerCase();
    if (url.includes("x=") && url.includes("y=") && url.includes("z=")) {
      this.handleClose(); // Ensure that popup menu is closed
      let url = item.presetUrl.split("&");
      let x = url[1].substring(2);
      let y = url[2].substring(2);
      let z = url[3].substring(2);
      let l = url[4]?.substring(2);

      const view = this.map.getView();
      let location = [x, y];
      let zoom = z;

      if (l) {
        this.setState({
          view: view,
          location: location,
          zoom: zoom
        });
        this.openDialog();
      } else {
        this.flyTo(view, location, zoom);
      }
    } else {
      this.props.enqueueSnackbar(
        "Länken till platsen är tyvärr felaktig. Kontakta administratören av karttjänsten för att åtgärda felet.",
        {
          variant: "warning"
        }
      );
      console.error(
        "Fel i verktyget Snabbval. Länken til : \n" +
          item.name +
          "\n" +
          item.presetUrl +
          "\när tyvärr felaktig. Någon av följande parametrar saknas: &x=, &y=, &z= eller innehåller fel."
      );
    }
  };*/
}
