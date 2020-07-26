
const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

function ColorLerp(a, b, t) {    
    const newR  = a.r + (b.r - a.r) * t;
    const newG  = a.g + (b.g - a.g) * t;
    const newB  = a.b + (b.b - a.b) * t;
    return new THREE.Color(newR, newG, newB);
}

AFRAME.registerComponent('toggle', {
    schema: {
        knobColor: { type: 'color', default: '#ffffff' },
        activeColor: { type: 'color', default: '#0093FF' },
        inactiveColor: { type: 'color', default: '#aaa' },
        active: { type: 'boolean', default: true},
        title: { type: 'string', default: "toggle label"}
      },
        
      init: function () {
        var loader = new THREE.GLTFLoader();

        this.knobSpeed = 0.0001;
        this.knobTranslation = 0.04;

        this.activeColor = new THREE.Color(this.data.activeColor);
        this.inactiveColor = new THREE.Color(this.data.inactiveColor);

        this.backboxMaterial = new THREE.MeshLambertMaterial({color: this.data.active ? this.activeColor : this.inactiveColor });
        this.knobMaterial = new THREE.MeshLambertMaterial({color: this.data.knobColor });
        this.knobGrabbedMaterial = new THREE.MeshLambertMaterial({color: 0x7cc7ed, emissive:0x46b1ff });
        this.chassis = new THREE.Group();

        this.backboxGeo = new THREE.BoxGeometry(0.13, 0.07, 0.01);
        this.backboxGeo.translate(0,0.007,-0.025)
        this.backbox = new THREE.Mesh(this.backboxGeo, this.backboxMaterial);

        this.chassis.add(this.backbox);

        this.el.setObject3D('mesh', this.chassis);
    
        this.controllers = Array.prototype.slice.call(document.querySelectorAll('.hand'));

        const knobURL = "/models/knob.glb";
        loader.load( knobURL,(gltf) => {
            var scene = gltf.scene;
            this.knob = scene.children[0];
            this.knob.scale.set(0.1,0.2, 0.2)
            this.knob.position.set(this.data.active ? this.knobTranslation : -this.knobTranslation,0,0)
            this.knob.rotation.set(0, -Math.PI / 2, 0)
            this.knob.material = this.knobMaterial;
            this.chassis.add( this.knob );
            this.setColor(this.knob.position.x);

        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );
        this.setActiveState(this.data.active);
        this.moving = false;
      },
      play: function () {
        this.grabbed = false;
        this.controllers.forEach(function (controller){
          controller.addEventListener('started-pinch', this.onTriggerDown.bind(this));
          controller.addEventListener('ended-pinch', this.onTriggerUp.bind(this));
        }.bind(this));
      },
      pause: function () {
        this.controllers.forEach(function (controller){
          controller.removeEventListener('started-pinch', this.onTriggerDown.bind(this));
          controller.removeEventListener('ended-pinch', this.onTriggerUp.bind(this));
        }.bind(this));
      },
      onTriggerDown: function(e) {
        var hand = e.detail.joint;
    
        var handBB = new THREE.Box3().setFromObject(hand);
        var knobBB = new THREE.Box3().setFromObject(this.knob);
        var collision = handBB.intersectsBox(knobBB);
    
        if (collision) {
          let handWorld = new THREE.Vector3();
          hand.getWorldPosition(handWorld);
          let knobWorld = new THREE.Vector3();;
          this.knob.getWorldPosition(knobWorld);
          let distance = handWorld.distanceTo(knobWorld);
          if (distance < 0.1) {
            this.grabbed = hand;
            this.knob.material = this.knobGrabbedMaterial;
          }
        };
      },
      onTriggerUp: function() {
        if (this.grabbed) {
          this.grabbed = false;
          this.knob.material = this.knobMaterial;
          this.grabOffset = null;
        }
      },
      tick: function(time, timeDelta) {
        if (this.grabbed) {
          var hand = this.grabbed;
          var knob = this.knob;
        //   var sliderSize = this.data.size;
        //   var sliderRange = (sliderSize * this.data.innerSize);
    
          var handWorld = new THREE.Vector3().setFromMatrixPosition(hand.matrixWorld);
          knob.parent.worldToLocal(handWorld);
          
          if (this.grabOffset == null) {
            this.grabOffset = knob.position.x - handWorld.x;
            }
    
            // if (Math.abs(handWorld.x) > sliderRange / 2) {
            //     lever.position.x = sliderRange / 2 * Math.sign(lever.position.x);
            // // this.el.emit('rangeout');
            // } else {
                knob.position.x = handWorld.x + this.grabOffset;
            // }    
            // var value = this.leverPositionToValue(knob.position.x);
            this.setActiveState(knob.position.x > 0)
            // if (Math.abs(this.value - value) >= Math.pow(10, -this.data.precision)) {
            //     this.el.emit('change', { value: 1 });
            //     this.value = value;
            // }
            if (Math.abs(knob.position.x) > this.knobTranslation + 0.005) {
                this.onTriggerUp()
            }
            this.setColor(this.knob.position.x);
            this.moving = true;
        } else {
            if (this.knob && this.moving) {
                if (this.active) {
                    if (Math.abs(this.knob.position.x - this.knobTranslation) > 0.001) {
                        if (this.knob.position.x > this.knobTranslation) {
                            this.knob.position.x -= this.knobSpeed * timeDelta;
                        } else {
                            this.knob.position.x += this.knobSpeed * timeDelta;
                        }
                    } else {
                        this.knob.position.x = this.knobTranslation;
                        this.moving = false;
                    }
                } else {
                    if (Math.abs(this.knob.position.x - -this.knobTranslation) > 0.001) {
                        if (this.knob.position.x > -this.knobTranslation) {
                            this.knob.position.x -= this.knobSpeed * timeDelta;
                        } else {
                            this.knob.position.x += this.knobSpeed * timeDelta;
                        }
                    } else {
                        this.knob.position.x = -this.knobTranslation;
                        this.moving = false;
                    }
                }
                this.setColor(this.knob.position.x);
            }
        }
      },
      setActiveState: function(active) {
        if (this.active != active) {
            this.el.emit('change', { active });
            if (active) {
                this.el.emit('active');
            } else {
                this.el.emit('inactive');
            }
        }
        this.active = active;
      },
      setColor: function(x) {
        const t = map(x, -this.knobTranslation, this.knobTranslation, 0, 1);        
        const newColor = ColorLerp(this.inactiveColor, this.activeColor, t)
        this.backboxMaterial.color = newColor;
      }
})