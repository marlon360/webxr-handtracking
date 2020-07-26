AFRAME.registerComponent('hand-tracking-mesh', {

    schema: {
        color: {default: 'white', type: 'color'},
        segmentSizeMultiplier: {default: 0.9, type: 'number'},
        hand: { default: 'left', oneOf: ['left', 'right'] },
        physicsEnabled: { default: false }
    },

    init: function() {
        this.createMesh = this.createMesh.bind(this);
        this.modelUrl = this.data.hand === 'right' ? '/models/r_hand.glb' : '/models/l_hand.glb' ;

        const prefix = this.data.hand === 'right' ? 'b_r_' : 'b_l_'
        this.mapping = [];
        this.mapping[0] = prefix + "wrist";
        this.mapping[1] = prefix + "thumb1";
        this.mapping[2] = prefix + "thumb2";
        this.mapping[3] = prefix + "thumb3";
        this.mapping[4] = prefix + "thumb_null";
        this.mapping[5] = null;
        this.mapping[6] = prefix + "index1";
        this.mapping[7] = prefix + "index2";
        this.mapping[8] = prefix + "index3";
        this.mapping[9] = prefix + "index_null";
        this.mapping[10] = null;
        this.mapping[11] = prefix + "middle1";
        this.mapping[12] = prefix + "middle2";
        this.mapping[13] = prefix + "middle3";
        this.mapping[14] = prefix + "middle_null";
        this.mapping[15] = null;
        this.mapping[16] = prefix + "ring1";
        this.mapping[17] = prefix + "ring2";
        this.mapping[18] = prefix + "ring3";
        this.mapping[19] = prefix + "ring_null";
        this.mapping[20] = prefix + "pinky0";
        this.mapping[21] = prefix + "pinky1";
        this.mapping[22] = prefix + "pinky2";
        this.mapping[23] = prefix + "pinky3";
        this.mapping[24] = prefix + "pinky_null";

        this.loading = false;
    },

    getBone(name) {
        for (const bone of this.bones) {
            if (bone.name == name) {
                return bone
            }
        }
        console.log("couldnt find: " + name);
        return null;
    },

    createMesh: function () {
        this.loading = true;
        this.loader = new THREE.GLTFLoader();
        this.loader.setCrossOrigin('anonymous');

        this.loader.load(this.modelUrl, (gltf) => {
            console.log(gltf);
            this.mesh = gltf.scene.children[0];
            this.skinnedMesh = this.mesh.children[24]
            this.mesh.position.set(0,1.5,0);
            this.mesh.rotation.set(0,0,0);
            this.bones = this.skinnedMesh.skeleton.bones;
            this.skinnedMesh.frustumCulled = false;
            this.skinnedMesh.material = new THREE.MeshStandardMaterial({skinning: true, color: this.data.color});
	
            this.el.sceneEl.object3D.add(this.mesh);
        });
    },

    jointsLoaded: function() {
        return this.system.hands != null;
    },

    getJoints: function() {
        return this.system.hands[this.data.hand];
    },

    getBoneOfJointNumber: function(jointNumber) {
        return this.getBone(this.mapping[jointNumber]);
    },

    tick: function() {
        if (this.loading == false) {
            this.createMesh();
        }
        if (this.mesh != null && this.system.hands != null) {
            for (let index = 0; index < this.getJoints().length; index++) {
                const joint = this.system.hands[this.data.hand][index];
                if (this.mapping[index] != null) {
                    const bone = this.getBone(this.mapping[index]);
                    if (bone != null && joint.visible) {
                        this.mesh.visible = true;
                        bone.position.copy(joint.position.clone().multiplyScalar(100));

                        const jointQuat = new THREE.Quaternion(joint.orientation.x, joint.orientation.y, joint.orientation.z, joint.orientation.w);
                        let rotation = jointQuat;
                        bone.quaternion.copy(rotation);
                    } else {
                        this.mesh.visible = false;
                    }
                }
            }
        }
    }

});
AFRAME.registerSystem('hand-tracking-mesh', {
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
                        joint.position = new THREE.Vector3(jointPose.transform.position.x, jointPose.transform.position.y, jointPose.transform.position.z);
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