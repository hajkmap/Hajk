
class EditModel {

  constructor(settings) {
    this.olMap = settings.map;
    setTimeout(() => {
      settings.observer.publish('myEvent', 'Information tool initialized.');
    }, 1000);
  }

}

export default EditModel;