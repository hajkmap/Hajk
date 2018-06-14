
class DrawModel {

  constructor(settings) {
    this.olMap = settings.map;
    setTimeout(() => {
      settings.observer.publish('myEvent', 'Draw tool initialized.');
    }, 1000);
  }

}

export default DrawModel;