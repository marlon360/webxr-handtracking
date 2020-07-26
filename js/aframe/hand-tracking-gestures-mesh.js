AFRAME.registerComponent('hand-tracking-gestures-mesh', {

    dependencies: ['hand-tracking-mesh'],

    init: function() {
        this.handTracking = this.el.components['hand-tracking-mesh'];

        this.isPinched = false;
        var geometry = new THREE.BoxGeometry( 0.01, 0.01, 0.01 );
        var material = new THREE.MeshBasicMaterial();
        this.pinchHelper = new THREE.Mesh( geometry, material );
        this.pinchHelper.visible = false;
        this.el.sceneEl.object3D.add(this.pinchHelper)
    },

    tick: function() {
        if (this.handTracking.jointsLoaded() && this.handTracking.mesh != null) {
            const position = this.handTracking.getJoints()[XRHand.THUMB_PHALANX_TIP].position.clone();
            this.pinchHelper.position.copy(position.add(new THREE.Vector3(0, 1.5, 0)));
            if (this.pinchCheck(this.handTracking)) {
                if (this.isPinched == false) {
                    this.isPinched = true;
                    this.el.emit('started-pinch', {
                        joint: this.pinchHelper
                    });
                }
            }
            if (this.pinchReleaseCheck(this.handTracking)) {
                if (this.isPinched == true) {
                    this.isPinched = false;
                    this.el.emit('ended-pinch')
                }
            }
        }
    },

    pinchCheck: function (hand) {
        const joints = hand.getJoints();
        const indexTip = joints[XRHand.INDEX_PHALANX_TIP];
        const thumbTip = joints[XRHand.THUMB_PHALANX_TIP];
        const distance = indexTip.position.distanceTo(thumbTip.position);
        return distance < 0.01;
    },
    pinchReleaseCheck: function (hand) {
        const joints = hand.getJoints();
        const indexTip = joints[XRHand.INDEX_PHALANX_TIP];
        const thumbTip = joints[XRHand.THUMB_PHALANX_TIP];
        const distance = indexTip.position.distanceTo(thumbTip.position);
        return distance > 0.03;
    },

});