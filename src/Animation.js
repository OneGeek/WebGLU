/** @class A procedurally generated animation. 
 * Starts updating immediately.
 */
$W.ProceduralAnimation = function ProceduralAnimation() {
    $W.ObjectState.call(this); // subclass of ObjectState

    /** XXX The right way to do this? */
    var ptyp = $W.ProceduralAnimation.prototype;

    /** The time in milliseconds since this animation began */
    this.age = 0;

    /** Call to advance the animation by `dt` milliseconds */
    this.update = function(dt){};
    this._update = function(dt){};

    /** Internal.
     * @return {Function} Update this animation.
     */
    this._play = function(dt) {
        this.preUpdate(dt);

        this.age += dt;

        this._update(dt);

        this.updatePosition(dt);
        this.updateRotation(dt);
        this.updateScale(dt);

        this.postUpdate(dt);
    }

    /** Internal.
     * @return {Function} Do nothing.
     */
    this._pause = function() { }

    /** This animation will advance on subsequent update() 
     * calls.
     */
    this.play = function() {
        this.update = this._play;
    }

    /** This animation will not change on subsequent update() 
     * calls.
     */
    this.pause = function() {
        this.update = this._pause;
    }

    /** Called before `dt` is added to this.age 
     * Does nothing by default.
     */
    this.preUpdate      = function(dt){}

    /** Update the position. Does nothing by default. */
    this.updatePosition = function(dt){}
    /** Update the rotation. Does nothing by default. */
    this.updateRotation = function(dt){}
    /** Update the scale. Does nothing by default. */
    this.updateScale    = function(dt){}

    /** Called after all other update calls.
     * Does nothing by default.
     */
    this.postUpdate     = function(dt){}

    this.play();
};


/** @class A single frame of animation.
 * A position, rotation, and scale at a particular point in time.
 *
 * @param {3 Array} pos Position.
 * @param {3 Array} rot Rotation.
 * @param {3 Array} scl Scale.
 * @param {Number} atTime Time, in seconds, this keyframe occurs at.
 */
$W.Keyframe = function Keyframe(pos, rot, scl, atTime) {
    if (arguments.length == 4) {
        $W.ObjectState.call(this, pos, rot, scl); // Subclass ObjectState
        this.atTime = atTime * 1000; // time, in seconds, this keyframe occurs at
    }else {
        $W.ObjectState.call(this); 
        this.atTime = 0;
    }
};

/** @class A keyframe based animation 
 * Rotations interpolation uses quaternions.
 */
$W.KeyFrameAnimation = function() {
    $W.ProceduralAnimation.call(this); // Subclass ProceduralAnimation

    this.keyframes = [];
    /** Frame index to interpolate from. */
    this.A = 0; 
    /** Frame index to interpolate to. */
    this.B = 1; 

    /** Time scale multiplier */
    this.timeScale = 1;


    this.update = function(dt) {
        this.age += dt * this.timeScale;

        // Time for next frame?
        if (this.age >= (this.keyframes[this.B]).atTime) {

            // Increment frame counters
            this.A = ++this.A % this.keyframes.length;
            this.B = ++this.B % this.keyframes.length;

            // Account for slop (by throwing it out)
            this.age = (this.keyframes[this.A]).atTime;
        }


        var progress = this.age - (this.keyframes[this.A]).atTime;
        var duration = (this.keyframes[this.B]).atTime - (this.keyframes[this.A]).atTime;
        var t = progress / duration;


        // Interpolate position
        this.position.elements = $W.util.lerpTriple(t, 
                this.keyframes[this.A].position.elements,
                this.keyframes[this.B].position.elements);

        // Interpolate quaternions for rotation
        this.q = $W.util.slerp(t,
                this.keyframes[this.A].q,
                this.keyframes[this.B].q);

        // Interpolate scale
        this.scale.elements = $W.util.lerpTriple(t, 
                this.keyframes[this.A].scale.elements,
                this.keyframes[this.B].scale.elements);
    }

    /** Add a new keyframe. 
     * For now it needs to be added in time order as it
     * doesn't sort on its own.
     * @param {Keyframe} keyframe The keyframe to add.
     */
    this.addKeyframe = function(keyframe) {
        this.keyframes.push(keyframe);
    }

    /** Remove the keyframe at index from the list of keyframes.
     * @param {Integer} index The index of the keyframe to remove.
     */
    this.removeKeyframe = function(index) {
        var result = [];

        // - 1 for frame -1
        for (var i = 0; i < this.keyframes.length - 1; i++) {
            if (i != index) {
                result.push(this.keyframes[i]);
            }
        }
    }
};


