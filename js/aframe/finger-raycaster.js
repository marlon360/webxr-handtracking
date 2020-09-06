
AFRAME.registerComponent('finger-raycaster', {

    dependencies: ['hand-tracking-mesh'],

    init: function() {
        this.handTracking = this.el.components['hand-tracking-mesh'];
        var geometry = new THREE.BoxGeometry( 0.01, 0.01, 0.01 );
        var material = new THREE.MeshBasicMaterial();
        this.pinchHelper = new THREE.Mesh( geometry, material );
        this.pinchHelper.visible = false;
        this.el.sceneEl.object3D.add(this.pinchHelper)

        this.el.setAttribute('raycaster', {
            useWorldCoordinates: true,
            far: 0.02
        });
        this.el.setAttribute('line', {
            visible: false,
            color: "red",
            opacity: 0.75
        })
    },

    tick: function() {
        if (this.handTracking.jointsLoaded() && this.handTracking.mesh != null) {
            const joint = this.handTracking.getJoints()[XRHand.INDEX_PHALANX_TIP]
            const position = joint.position.clone();
            this.pinchHelper.position.copy(position.add(new THREE.Vector3(0, 1.5, 0)));
            this.pinchHelper.quaternion.copy(new THREE.Quaternion(joint.orientation.x, joint.orientation.y, joint.orientation.z, joint.orientation.w));
            this.pinchHelper.rotateY(-Math.PI / 2);

            const direction = new THREE.Vector3();
            this.pinchHelper.getWorldDirection(direction);

            this.el.setAttribute('raycaster', {
                origin: this.pinchHelper.position.clone(),
                enabled: true,
                direction: direction
            });
            const dir = this.el.getAttribute('raycaster').direction;
            const far = this.el.getAttribute('raycaster').far;
            const end = new THREE.Vector3(0,0,0);
            end.copy(this.pinchHelper.position.clone().add((new THREE.Vector3(dir.x, dir.y, dir.z)).multiplyScalar(far)));
            this.el.setAttribute('line', {
                start: this.pinchHelper.position.clone(),
                end: end
            })
        }
    }

});