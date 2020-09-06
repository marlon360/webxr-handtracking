AFRAME.registerComponent('painter', {

  schema: {
      color: {
        default: 'white',
        type: 'color'
      }
  },

  init: function () {
    this.painter = new TubePainter();
    this.painter.setSize(0.5);
    this.painter.setColor(new THREE.Color(this.data.color));
    this.cursor = new THREE.Vector3();
    this.userData = {};
    let first = true;

    this.el.sceneEl.object3D.add(this.painter.mesh);

    this.el.addEventListener('started-pinch', (evt) => {
      if (first) {
        first = false;   
        return;
      }
      this.userData.isSelecting = true;
      this.userData.bone = evt.detail.joint;
      // set start
      this.cursor.setFromMatrixPosition(this.userData.bone.matrixWorld);
      this.painter.moveTo(this.cursor);
    });
    this.el.addEventListener('ended-pinch', (bone) => {
      this.userData.isSelecting = false;
    });
    this.userData.isSelecting = false;
  },

  update() {
    this.painter.setColor(new THREE.Color(this.data.color));
  },

  tick: function () {
    var userData = this.userData;
    var painter = this.painter;

    if (userData.isSelecting === true) {
      this.cursor.setFromMatrixPosition(userData.bone.matrixWorld);
      painter.lineTo(this.cursor);
      painter.update();
    }
  }

});
