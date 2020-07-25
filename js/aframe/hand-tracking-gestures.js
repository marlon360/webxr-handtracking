AFRAME.registerComponent('hand-tracking-gestures', {

    dependencies: ['hand-tracking'],

    init: function() {
        this.handTracking = this.el.components['hand-tracking'];

        this.isPinched = false;
    },

    tick: function() {
        if (this.handTracking.hand != null) {
            if (this.pinchCheck(this.handTracking.hand)) {
                if (this.isPinched == false) {
                    console.log("pinched");
                    this.isPinched = true;
                    this.el.emit('started-pinch', {
                        joint: this.handTracking.hand[XRHand.INDEX_PHALANX_TIP].object3D
                    });
                }
            }
            if (this.pinchReleaseCheck(this.handTracking.hand)) {
                if (this.isPinched == true) {
                    console.log("released pinched");
                    this.isPinched = false;
                    this.el.emit('ended-pinch')
                }
            }
        }
    },

    pinchCheck: function (hand) {
        const indexTip = hand[XRHand.INDEX_PHALANX_TIP].object3D;
        const thumbTip = hand[XRHand.THUMB_PHALANX_TIP].object3D;
        const distance = indexTip.position.distanceTo(thumbTip.position);
        return distance < 0.01;
    },
    pinchReleaseCheck: function (hand) {
        const indexTip = hand[XRHand.INDEX_PHALANX_TIP].object3D;
        const thumbTip = hand[XRHand.THUMB_PHALANX_TIP].object3D;
        const distance = indexTip.position.distanceTo(thumbTip.position);
        return distance > 0.03;
    },

});