
AFRAME.registerComponent('painter-color-picker', {

    dependencies: ['hand-tracking-mesh'],

    init: function() {
        this.handTracking = this.el.components['hand-tracking-mesh'];
        
        this.painter = document.querySelector("[painter]");

        this.picker1 = document.createElement("a-box");
        this.picker1.setAttribute("width", 0.02);
        this.picker1.setAttribute("height", 0.02);
        this.picker1.setAttribute("depth", 0.02);
        this.picker1.setAttribute("material", {
            color: "white"
        });
        this.picker1.addEventListener('raycaster-intersected', evt => {
            this.picker1.setAttribute('scale', '1.2 1.2 1.2');
            this.painter.setAttribute('painter', {
                color: "white"
            })
        });
        this.picker1.addEventListener('raycaster-intersected-cleared', evt => {
            this.picker1.setAttribute('scale', '1 1 1');
        });
        this.el.sceneEl.appendChild(this.picker1);
        
        this.picker2 = document.createElement("a-box");
        this.picker2.setAttribute("width", 0.02);
        this.picker2.setAttribute("height", 0.02);
        this.picker2.setAttribute("depth", 0.02);
        this.picker2.setAttribute("material", {
            color: "#ff9100"
        });
        this.picker2.addEventListener('raycaster-intersected', evt => {
            this.picker2.setAttribute('scale', '1.2 1.2 1.2');
            this.painter.setAttribute('painter', {
                color: "#ff9100"
            })
        });
        this.picker2.addEventListener('raycaster-intersected-cleared', evt => {
            this.picker2.setAttribute('scale', '1 1 1');
        });
        this.el.sceneEl.appendChild(this.picker2);
        
        this.picker3 = document.createElement("a-box");
        this.picker3.setAttribute("width", 0.02);
        this.picker3.setAttribute("height", 0.02);
        this.picker3.setAttribute("depth", 0.02);
        this.picker3.setAttribute("material", {
            color: "#0091ff"
        });
        this.picker3.addEventListener('raycaster-intersected', evt => {
            this.picker3.setAttribute('scale', '1.2 1.2 1.2');
            this.painter.setAttribute('painter', {
                color: "#0091ff"
            })
        });
        this.picker3.addEventListener('raycaster-intersected-cleared', evt => {
            this.picker3.setAttribute('scale', '1 1 1');
        });
        this.el.sceneEl.appendChild(this.picker3);
        
    },

    tick: function() {
        if (this.handTracking.jointsLoaded() && this.handTracking.mesh != null) {
            const joint = this.handTracking.getJoints()[0]
            
            this.picker1.setAttribute('visible', joint.visible);
            this.picker2.setAttribute('visible', joint.visible);
            this.picker3.setAttribute('visible', joint.visible);

            this.picker1.object3D.position.copy(joint.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
            this.picker1.object3D.quaternion.copy(new THREE.Quaternion(joint.orientation.x, joint.orientation.y, joint.orientation.z, joint.orientation.w));
            this.picker1.object3D.rotateY(Math.PI / 2);
            this.picker1.object3D.translateZ(-0.04);
            
            this.picker2.object3D.position.copy(joint.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
            this.picker2.object3D.quaternion.copy(new THREE.Quaternion(joint.orientation.x, joint.orientation.y, joint.orientation.z, joint.orientation.w));
            this.picker2.object3D.rotateY(Math.PI / 2);
            this.picker2.object3D.translateZ(-0.07);
            
            this.picker3.object3D.position.copy(joint.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
            this.picker3.object3D.quaternion.copy(new THREE.Quaternion(joint.orientation.x, joint.orientation.y, joint.orientation.z, joint.orientation.w));
            this.picker3.object3D.rotateY(Math.PI / 2);
            this.picker3.object3D.translateZ(-0.1);

        }

    }

});