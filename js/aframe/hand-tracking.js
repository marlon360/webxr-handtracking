AFRAME.registerComponent('hand-tracking', {

    schema: {
        color: {default: 'white', type: 'color'},
        segmentSizeMultiplier: {default: 0.9, type: 'number'},
        hand: { default: 'left', oneOf: ['left', 'right'] },
        physicsEnabled: { default: false }
    },

    init: function() {
        this.createMesh = this.createMesh.bind(this);
    },

    createMesh: function () {
        this.hand = this.system.hands[this.data.hand].map(() => {
            const joint = document.createElement('a-sphere');
            joint.setAttribute('geometry', {
                radius: 1 * this.data.segmentSizeMultiplier
            });
            joint.setAttribute('material', {
                color: this.data.color
            });
            if (this.data.physicsEnabled) {
                joint.setAttribute('static-body',{
                    shape: 'sphere',
                    sphereRadius: 0.01
                });
            }
            this.el.appendChild(joint);
            return joint;
        });
    },

    tick: function() {
        if (this.hand == null && this.system.hands != null) {
            this.createMesh();
        }
        if (this.hand != null) {
            for (let index = 0; index < this.system.hands[this.data.hand].length; index++) {
                const joint = this.system.hands[this.data.hand][index];
                const mesh = this.hand[index].object3D;
                if (joint.visible) {
                    mesh.visible = true;
                    mesh.position.set(joint.position.x, joint.position.y + 1.5, joint.position.z);
                    const q = new THREE.Quaternion(joint.orientation.x,joint.orientation.y, joint.orientation.z, joint.orientation.w);
                    mesh.quaternion.copy(q);
                    let radius = joint.radius;
                    if (joint.radius == null) {
                        const lastJoint = this.system.hands[this.data.hand][index - 1];
                        radius = lastJoint.radius != null ? lastJoint.radius * 0.9 : null;
                    }
                    if (this.data.physicsEnabled) {
                        this.hand[index].setAttribute('static-body',{
                            sphereRadius: radius * 0.001
                        });
                    }
                    mesh.scale.set(radius, radius, radius);
                } else {
                    mesh.visible = false;
                }
            }
        }
    }

});
AFRAME.registerSystem('hand-tracking', {
    init: function () {
        this.updateReferenceSpace = this.updateReferenceSpace.bind(this);
        this.el.addEventListener('enter-vr', this.updateReferenceSpace);
        this.el.addEventListener('exit-vr', this.updateReferenceSpace);
        this.hands = null;
    },

    tick: function () {
        this.updateHands();
    },

    initHands: function () {
        var self = this;
        const joints_left = [];
        const joints_right = [];
        self.hands = { left: joints_left, right: joints_right};
        if (XRHand) {
            for (let i = 0; i <= XRHand.LITTLE_PHALANX_TIP; i++) {
                joints_left.push({
                    visible: false,
                    position: new THREE.Vector3(),
                    orientation: new THREE.Quaternion(),
                    radius: null,
                    offset: i,
                });
                joints_right.push({
                    visible: false,
                    position: new THREE.Vector3(),
                    orientation: new THREE.Quaternion(),
                    radius: null,
                    offset: i,
                });
            }
            console.log("emit");
            self.el.emit("init-hands", undefined, false);
        }
    },

    updateReferenceSpace: function () {
        var self = this;
        var xrSession = this.el.xrSession;
        if (!xrSession) {
            this.referenceSpace = undefined;
            return;
        }
        var refspace = self.el.sceneEl.systems.webxr.sessionReferenceSpaceType;
        xrSession.requestReferenceSpace(refspace).then(function (referenceSpace) {
            self.referenceSpace = referenceSpace.getOffsetReferenceSpace(new XRRigidTransform({x: 0, y: 1.5, z: 0}));
        }).catch(function (err) {
            self.el.sceneEl.systems.webxr.warnIfFeatureNotRequested(refspace, 'tracked-controls-webxr uses reference space "' + refspace + '".');
            throw err;
        });
        self.initHands();
    },

    updateHands: function () {
        var self = this;
        var xrSession = self.el.xrSession;
        if (xrSession != null) {
            const frame = self.el.sceneEl.frame;
            if (self.hands != null) {
                self.updateInputSources(xrSession, frame, self.referenceSpace);
            }
        }
    },

    updateInputSources: function (session, frame, refSpace) {
        for (let inputSource of session.inputSources) {
            if (!inputSource.hand) {
                continue;
            } else {
                for (const joint of this.hands[inputSource.handedness]) {
                    let jointPose = null;
                    if (inputSource.hand[joint.offset] !== null) {
                        jointPose = frame.getJointPose(inputSource.hand[joint.offset], refSpace);
                    }
                    if (jointPose !== null) {
                        joint.visible = true;
                        joint.position = jointPose.transform.position;
                        joint.orientation = jointPose.transform.orientation;
                        joint.radius = jointPose.radius;
                    } else {
                        joint.visible = false;
                    }
                }
            }
        }
    }

});