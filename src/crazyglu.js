/** @author Benjamin DeLillo */
/*
     *  Copyright (c) 2009 Benjamin P. DeLillo
     *  
     *  Permission is hereby granted, free of charge, to any person
     *  obtaining a copy of this software and associated documentation
     *  files (the "Software"), to deal in the Software without
     *  restriction, including without limitation the rights to use,
     *  copy, modify, merge, publish, distribute, sublicense, and/or sell
     *  copies of the Software, and to permit persons to whom the
     *  Software is furnished to do so, subject to the following
     *  conditions:
     *  
     *  The above copyright notice and this permission notice shall be
     *  included in all copies or substantial portions of the Software.
     *  
     *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
     *  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     *  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     *  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
     *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
     *  OTHER DEALINGS IN THE SOFTWARE.
*/

$W.AMBIENT = 'ambient';
$W.SPECULAR = 'specular';
$W.DIFFUSE = 'diffuse';
$W.POSITION = 'position';

$W.constants.LightSourceUniform = "wglu_LightSource";


$W.GLSL.util.handleIncludes = function(source) {
    var maxIncludeDepth = 32;
    var includeDepth = 0;


    var includes = source.match(/^#pragma\s*INCLUDE.*/gm);
    if (includes !== null) {
    }
    while (includes !== null && includeDepth < maxIncludeDepth) {
        for (var i = 0; i < includes.length; i++) {
            var include = includes[i].replace(/^#pragma\s*INCLUDE\s*/g, "");
            include = include.replace(/["'<>]/g,"");

            console.log ("Including " + include);

            source = source.replace(includes[i], 
                    $W.util.loadFileAsText($W.paths.shaders + include));
        }
        var includes = source.match(/^#pragma.*/gm);
        includeDepth++;
    }
    return source
};

$W.GLSL.util.handlePragmas =  function(source) {
    var pragmas = source.match(/^#pragma.*/gm);

    if (pragmas !== null) {
        for (var i = 0; i < pragmas.length; i++) {
            if (pragmas[i] !== null) {
                var pragma = pragmas[i].split(/\s+/g);
                
                if (pragma[1] === "WEBGLU_LIGHTS") {
                    source = source.replace(pragmas[i], 
                            "#pragma INCLUDE 'lighting.glsl'");

                    $W.lights = [];
                    for (var j = 0; j < 3; j++) {
                        $W.lights[j] = {
                            ambient:[0,0,0,0],
                            diffuse:[0,0,0,0],
                            specular:[0,0,0,0],
                            position:[0,0,0,0]
                        };
                    }
                    console.log("Lighting uniforms enabled");
                }
            }
        }
        source = $W.GLSL.util.handleIncludes(source);
    }
    return source;
}

/*
$W.defaultUniformActions[$W.constants.LightSourceUniform] = 
    function(uniform, object, material) {
        $W.GL.uniform4fv(this.location, false, 
                new WebGLFloatArray($W.lights[0].position));
};
*/

$W.usePicking = function() {
    $W.newProgram('pick');
    $W.programs.pick.attachShader('pickVS', $W.paths.shaders + 'pick.vert');
    $W.programs.pick.attachShader('pickFS', $W.paths.shaders + 'pick.frag');

    try{
        $W.pickBuffer = new $W.Framebuffer();
        $W.pickBuffer.attachTexture($W.GL.RGBA, $W.canvas.width, $W.canvas.height, $W.GL.COLOR_ATTACHMENT0);
        $W.pickBuffer.attachRenderbuffer($W.GL.DEPTH_COMPONENT16, $W.canvas.width, $W.canvas.height, $W.GL.DEPTH_ATTACHMENT);
    }catch (e) {
        console.error(e);
    }
}

$W.drawForPicking = function() {
    $W.modelview.pushMatrix();

    $W.modelview.translate(this.animatedPosition().elements);
    $W.modelview.multMatrix(this.animatedRotation().matrix());
    $W.modelview.scale(this.animatedScale().elements);

    for (var i = 0; i < this._children.length; i++) {
        $W.drawForPicking.call(this._children[i]);
    }

    $W.programs.pick.use();
    $W.programs.pick.setUniform( 'pickColor', this.id / 255 );
    $W.programs.pick.processUniforms(this);

    this._bufferArrays();
    this._drawFunction();

    $W.modelview.popMatrix();
    $W.GL.bindTexture($W.GL.TEXTURE_2D, null);
};

$W.updatePickBuffer = function(shouldUnbind) {
    $W._setupMatrices();
    $W.pickBuffer.bind();

    $W.GL.clearColor(1.0, 1.0, 1.0, 1.0);
    $W.GL.clear($W.GL.COLOR_BUFFER_BIT | $W.GL.DEPTH_BUFFER_BIT);
    $W.GL.disable($W.GL.BLEND);
    $W.GL.lineWidth(7);


    for (var i = 0; i < $W.pickables.length; i++) {
        $W.drawForPicking.call($W.pickables[i]);
    }

    if (shouldUnbind !== false) {
        $W.pickBuffer.unbind();
    }
    $W.GL.enable($W.GL.BLEND);
    $W.GL.lineWidth(1);
    $W.GL.clearColor(0.9, 0.9, 0.9, 1.0);
}

$W.getObjectIDAt = function(x, y) {
    $W.updatePickBuffer(false);
    var id = $W.GL.readPixels(x,$W.canvas.height-y,1,1, 
                         $W.GL.RGBA, $W.GL.UNSIGNED_BYTE)[0];
    $W.pickBuffer.unbind();

    return id;
}

if (typeof(V3) === 'undefined') {
    $W.util.include($W.paths.external + 'mjs.js');
}

V3.equals = function V3_equals(a, b) {
    return ((a[0] == b[0]) && 
            (a[1] == b[1]) && 
            (a[2] == b[2]));   
}


V3.Zero = V3.$(0,0,0);

V3.parallelComponent = function(vec, unitBasis) {
    var projection = V3.dot(vec, unitBasis);
    return V3.scale(unitBasis, projection);
}

V3.perpendicularComponent = function(vec, unitBasis) {
    return V3.sub(vec, V3.parallelComponent(vec, unitBasis) );
}

V3.truncateLength = function(vec, maxLength) {
    var maxLengthSquared = maxLength * maxLength;
    var vecLengthSquared = V3.lengthSquared(vec);

    if (vecLengthSquared <= maxLengthSquared) {
        return vec;
    }else {
        return V3.scale(vec, (maxLength / Math.sqrt(vecLengthSquared)));
    }

}

V3.elements = function(vec) {
    return [vec[0], vec[1], vec[2]];
}

$W.util.blendScalar = function(smoothRate, newValue, smoothedAccumulator) {
    return $W.util.lerp($W.util.clip(smoothRate, 0, 1), smoothedAccumulator, newValue);
}

$W.util.blendVector = function(smoothRate, newValue, smoothedAccumulator) {
    var vA = [smoothedAccumulator[0], smoothedAccumulator[1], smoothedAccumulator[2]];
    var vB = [newValue[0], newValue[1], newValue[2]];

    return $W.util.lerpTriple($W.util.clip(smoothRate, 0, 1), vA, vB);
};

$W.util.sphericalWrapAround = function(position, center, radius) {
    var offset = V3.sub(position, center);
    var r = V3.length(offset);

    var neg2radius = -2 * radius;
    var offsetOver_r = V3.scale(offset, 1/r);
    var change = V3.scale(offsetOver_r, neg2radius);
    //console.log(V3.elements(position),V3.elements(change));



    if (r > radius) {
        return V3.add(position, V3.scale(
                        V3.scale(offset, 1/r), (radius * -2)));
    }else {
        return position;
    }
}

$W.OS= {};
// OpenSteer -- Steering Behaviors for Autonomous Characters
//
// Copyright (c) 2002-2005, Sony Computer Entertainment America
// Original author: Craig Reynolds <craig_reynolds@playstation.sony.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
$W.OS.vecLimitDeviationAngleUtility= function(isInside, source, cosineOfConeAngle, basis) {
    // immediately return zero length input vectors
    var sourceLength = V3.length(source);
    if (sourceLength == 0) {
        return source;
    }

    // measure the angular diviation of "source" from "basis"
    var direction = V3.scale(source, 1 / sourceLength);
    var cosineOfSourceAngle = V3.dot(direction, basis);

    // Simply return "source" if it already meets the angle criteria.
    if (isInside) {
        // source vector is already inside the cone, just return it
        if (cosineOfSourceAngle >= cosineOfConeAngle) return source;

    }else {
        // source vector is already outside the cone, just return it
        if (cosineOfSourceAngle <= cosineOfConeAngle) return source;
    }

    // find the portion of "source" that is perpendicular to "basis"
    var perp = V3.perpendicularComponent(source, basis);

    // normalize that perpendicular
    var unitPerp = V3.normalize(perp);

    // construct a new vector whose length equals the source vector,
    // and lies on the intersection of a plane (formed the source and
    // basis vectors) and a cone (whose axis is "basis" and whose
    // angle corresponds to cosineOfConeAngle)
    var perpDist = Math.sqrt(1 - (cosineOfConeAngle * cosineOfConeAngle));
    var c0 = V3.scale(basis, cosineOfConeAngle);
    var c1 = V3.scale(unitPerp, perpDist);

    return V3.scale( (V3.add(c0, c1)), sourceLength);
};

$W.OS.limitMaxDeviationAngle= function limitMaxDeviationAngle(source, cosineOfConeAngle, basis) {
    return $W.OS.vecLimitDeviationAngleUtility(true, source, cosineOfConeAngle, basis);
};

$W.OS.RandomVectorInUnitRadiusSphere=function RandomVectorInUnitRadiusSphere() {
    var v;


    do {
        v = V3.$((Math.random()*2) - 1,
                 (Math.random()*2) - 1,
                 (Math.random()*2) - 1);

    }while (V3.length(v) >= 1);

    return v;
};

$W.OS.RandomUnitVector=function RandomUnitVector() {
    return V3.normalize($W.OS.RandomVectorInUnitRadiusSphere());
};

$W.OS.LocalSpace=function LocalSpace() {
    var up;
    var side;
    var forward;
    var position;

    this.up       = function OS_LS_up() { return up; }
    this.side     = function OS_LS_side() { return side; }
    this.forward  = function OS_LS_forward() { return forward; }
    this.position = function OS_LS_position() { return position; }

    this.setUp       = function(u) { up = u; }
    this.setSide     = function(s) { side = s; }
    this.setForward  = function(f) { forward = f; }
    this.setPosition = function(p) { position = p; }

    this.rotationMatrix = function() {
        var m = [[],[],[],[]];

        m[0][0]=side[0];
        m[0][1]=side[1];
        m[0][2]=side[2];
        m[0][3]=0.0;
        
        m[1][0]=up[0];
        m[1][1]=up[1];
        m[1][2]=up[2];
        m[1][3]=0.0;

        m[2][0]=forward[0];
        m[2][1]=forward[1];
        m[2][2]=forward[2];
        m[2][3]=0.0;	

        m[3][0]=0;
        m[3][1]=0;
        m[3][2]=0;
        m[3][3]=1.0;

        return $M(m);
    }

    this.setUnitSideFromForwardAndUp = function() {
        side = V3.cross(forward, up);
        side = V3.normalize(side);
    }

    this.regenerateOrthonormalBasisUF = function(newUnitForward) {
        forward = newUnitForward;

        this.setUnitSideFromForwardAndUp();

        up = V3.cross(side, forward);
    }

    this.localRotateForwardToSide = function(v) {
        return V3.$(-v[2], v[1], v[0]);
    }

    this.resetLocalSpace = function() {
        forward = V3.$(0,0,1);
        side = this.localRotateForwardToSide(forward);
        up = V3.$(0,1,0);
        position = V3.$(0,0,0);
    }

    this.resetLocalSpace();
};

$W.OS.SimpleVehicle=function SimpleVehicle() {
    $W.OS.LocalSpace.call(this);
    $W.OS.steering.call(this);
    
    var mass     = 0.5;
    var radius   = 0.5;
    var speed    = 0;
    var maxForce = 0.1;
    var maxSpeed = 1.0;

    var smoothedAcceleration = V3.$(0,0,0);
    var smoothedPosition = this.position();

    this.smoothedPosition = function() { return smoothedPosition; }
    this.syncSmoothedPosition = function() { smoothedPosition = this.position(); }
    
    this.mass = function() { return mass; }
    this.radius = function() { return radius; }
    this.speed = function() { return speed; } 
    this.maxForce = function() { return maxForce; }
    this.maxSpeed = function() { return maxSpeed; }

    this.velocity = function() { return V3.scale(this.forward(), this.speed()); }

    this.setMass = function(m) { mass = m; }
    this.setRadius = function(r) { radius = r; }
    this.setSpeed = function(s) { speed = s; }
    this.setMaxForce = function(mf) { maxForce = mf; }
    this.setMaxSpeed = function(ms) { maxSpeed = ms; }

    this.resetSV = function() {
        this.setMass(1);
        this.setSpeed(0);
        
        this.setRadius(0.5);

        this.setMaxForce(0.1);
        this.setMaxSpeed(1.0);
    }

    this.reset = this.resetSV;

    this.adjustRawSteeringForce = function(force, elapsedTime) {
        var maxAdjustedSpeed = 0.2 * this.maxSpeed();

        if ((this.speed() > maxAdjustedSpeed) || (V3.equals(force, V3.Zero))) {
            return force;

        }else {
            var range = this.speed() / maxAdjustedSpeed;
            var cosine = $W.util.lerp(Math.pow(range, 20), 1.0, -1.0);
            return $W.OS.limitMaxDeviationAngle(force, cosine, this.forward());
        }
    }

    this.regenerateLocalSpace = function(newVelocity, elapsedTime) {
        if (this.speed() > 0) {
            this.regenerateOrthonormalBasisUF(
                    V3.scale(newVelocity, 1 / this.speed()));
        }
    }

    this.regenerateLocalSpaceForBanking = function(newVelocity, elapsedTime) {

        // the length of this global-upward-pointing vector controls the vehicle's
        // tendency to right itself as it is rolled over from turning acceleration
        var globalUp = V3.$(0, 0.5, 0);

        // acceleration points toward the center of local path curvature, the
        // length determines how much the vehicle will roll while turning
        var accelUp = V3.scale(smoothedAcceleration, 0.00);

        // combined banking, sum of UP due to turning and global UP
        var bankUp = V3.add(accelUp, globalUp);

        // blend bankUp into vehicle's UP basis vector
        var smoothRate = elapsedTime * 3;
        var tempUp = this.up();

        tempUp = $W.util.blendVector(smoothRate, bankUp, tempUp);
        
        this.setUp(V3.normalize(tempUp));

        // adjust orthonormal basis vectors to be aligned with new velocity
        if (this.speed() > 0) {
            this.regenerateOrthonormalBasisUF(
                    V3.scale(newVelocity, 1 / this.speed()));
        }
    }

    this.applySteeringForce = function(force, elapsedTime) {
        var adjustedForce = this.adjustRawSteeringForce(force, elapsedTime);

        // enforce limit on magnitude of steering force
        var clippedForce = V3.truncateLength(adjustedForce, this.maxForce());

        // compute acceleration and velocity
        var newAcceleration = V3.scale(clippedForce, 1 / this.mass());
        var newVelocity = this.velocity();

        // damp out abrupt changes and oscillations in steering acceleration
        // (rate is proportional to time step, then clipped into useful range)
        if (elapsedTime > 0) {
            var smoothRate = $W.util.clip(9 * elapsedTime, 0.15, 0.4)
            smoothedAcceleration = 
                $W.util.blendVector(smoothRate, newAcceleration, smoothedAcceleration);
            
        }
        // Euler integrate (per frame) acceleration into velocity
        V3.add(V3.scale(smoothedAcceleration, elapsedTime), newVelocity, newVelocity);

        // enforce speed limit
        newVelocity = V3.truncateLength(newVelocity, this.maxSpeed());

        // update Speed
        this.setSpeed (V3.length(newVelocity));


        // Euler integrate (per frame) velocity into position
        this.setPosition(V3.add(this.position(), 
                                V3.scale(newVelocity, elapsedTime)));


        // regenerate local space (by default: align vehicle's forward axis with
        // new velocity, but this behavior may be overridden by derived classes.)
        this.regenerateLocalSpace (newVelocity, elapsedTime);

        // maintain path curvature information
        // XXX implement
        //measurePathCurvature (elapsedTime);

        // running average of recent positions
        smoothedPosition = $W.util.blendVector(elapsedTime * 0.06,
                                               this.position(),
                                               this.smoothedPosition());
        smoothedPosition = this.position();

    }

    this.reset();
};

$W.OS.Boid=function Boid() {
    $W.OS.SimpleVehicle.call(this);

    this.update = function(elapsedTime, flock, worldRadius) {
        this.applySteeringForce(this.steerToFlock(flock), elapsedTime);
        this.sphericalWrapAround(worldRadius);
    }

    this.sphericalWrapAround = function(worldRadius) {
        if (V3.length(this.position()) > worldRadius) {
            this.setPosition($W.util.sphericalWrapAround(this.position(), 
                                                    V3.Zero, worldRadius));
            this.syncSmoothedPosition();
        }
    }

    this.regenerateLocalSpace = this.regenerateLocalSpaceForBanking;


    this.resetB = function() {
        this.resetSV();
        
        this.setMaxForce(.17);

        this.setMaxSpeed(.9);

        this.setSpeed(this.maxSpeed() * 0.3);

        var fwd = $W.OS.RandomUnitVector();
        fwd[1] = 0.3 * fwd[1];

        this.regenerateOrthonormalBasisUF(V3.normalize(fwd));


        this.setPosition(V3.scale($W.OS.RandomVectorInUnitRadiusSphere(),200));
    }

    this.reset = this.resetB;
    this.reset();
};

$W.OS.Flock=function Flock(boidCount, boidModel) {
    this.boidModel = boidModel;
    this.flock = [];
    this.worldRadius = 70;
    this.scale = 5;

    for (var i = 0; i < boidCount; i++) {
        this.flock.push(new $W.OS.Boid());
    };

    this.update = function OS_Flock_update(dt) {
        for(var i = 0; i < this.flock.length; i++) {
            this.flock[i].update(dt, this.flock, this.worldRadius);
        }

    }

    this.draw = function OS_Flock_draw() {
        for(var i = 0; i < this.flock.length; i++) {
            var dir = this.flock[i].side();
            this.boidModel.drawAt( V3.elements( V3.scale(this.flock[i].smoothedPosition(), 1/this.scale) ),
                                   this.flock[i].rotationMatrix(),
                                   this.boidModel.scale.elements );
        }
    }
};

$W.OS.steering=function steering() {
    this.steerToFlock = function OS_steerToFlock(flock) {
        var radiusScale = 2;
        var separationRadius =  5.0 * radiusScale;
        var separationAngle  = -0.707;
        var separationWeight =  8.0;
        
        var alignmentRadius = 7.5 * radiusScale;
        var alignmentAngle  = 0.7;
        var alignmentWeight = 10.0;
         
        var cohesionRadius = 9.0 * radiusScale;
        var cohesionAngle  = -0.15;
        var cohesionWeight = 10.0;

        var neighbors = [];

        for (var i = 0; i < flock.length; i++) {
            var other = flock[i];

            if (this.inBoidNeighborhood(other, separationRadius, cohesionRadius, 
                                         alignmentAngle)) {
                neighbors.push(other);
            }
        }

        var separation = this.steerForSeparation (separationRadius, separationAngle, neighbors);
        var alignment  = this.steerForAlignment  (alignmentRadius, alignmentAngle, neighbors);
        var cohesion   = this.steerForCohesion   (cohesionRadius, cohesionAngle, neighbors);

        separation = V3.scale(separation, separationWeight);
        alignment = V3.scale(alignment, alignmentWeight);
        cohesion = V3.scale(cohesion, cohesionWeight);

        return  V3.add(separation, V3.add(alignment, cohesion));
    }

    this.steerForSeparation = function OS_steerForSeparation(maxDistance, cosMaxAngle, flock) {
        // steering accumulator and count of neighbors, both initially zero
        var steering = V3.$(0,0,0);
        var neighbors = 0;

        // for each of the other vehicles...
        for (var i = 0; i < flock.length; i++) {
            var other = flock[i];

            if (this.inBoidNeighborhood(other, this.radius() * 3, maxDistance, cosMaxAngle)) {
                
                // add in steering contribution
                // (opposite of the offset direction, divided once by distance
                // to normalize, divided another time to get 1/d falloff)
                var offset = V3.sub(other.position(), this.position());
                var invNegDistSquared = 1 / -(V3.dot(offset, offset));
                var scaledOffset = V3.scale(offset, invNegDistSquared);
                steering = V3.add(scaledOffset, steering);

                // count neighbors
                neighbors++;
            }
        }

        steering[1] = 0.1 * steering[1];
        steering = V3.normalize(steering);
        return steering;
    }

    this.steerForAlignment = function OS_steerForAlignment(maxDistance, cosMaxAngle, flock) {    
        var steering = V3.$(0,0,0);
        var neighbors = 0;

        // for each of the other vehicles...
        for (var i = 0; i < flock.length; i++) {
            var other = flock[i];

            if (this.inBoidNeighborhood(other, this.radius() * 3, maxDistance, cosMaxAngle)) {

                // accumulate sum of neighbor's heading
                V3.add(other.forward(), steering, steering);

                // count neighbors
                neighbors++;
            }
        }

        // divide by neighbors, subtract off current position to get error-
        // correcting direction, then normalize to pure direction
        if (neighbors > 0) {
            steering = V3.normalize( 
                                V3.sub( V3.scale(steering, 1 / neighbors),       
                                        this.forward()));
        }

        return steering;
    }

    this.steerForCohesion = function OS_steerForCohesion(maxDistance, cosMaxAngle, flock) {    
        var steering = V3.$(0,0,0);
        var neighbors = 0;

        // for each of the other vehicles...
        for (var i = 0; i < flock.length; i++) {
            var other = flock[i];

            if (this.inBoidNeighborhood(other, this.radius() * 3, maxDistance, cosMaxAngle)) {
                // accumulate sum of neighbor's positions
                V3.add(other.position(), steering, steering);

                // count neighbors
                neighbors++;
            }
        }


        // divide by neighbors, subtract off current position to get error-
        // correcting direction, then normalize to pure direction
        if (neighbors > 0) {
            steering = V3.normalize( 
                                V3.sub( V3.scale(steering, 1 / neighbors),       
                                        this.position()));
        }

        return steering;

    }


    this.inBoidNeighborhood = function OS_inBoidNeighborhood(other, minDistance, maxDistance, cosMaxAngle) {
        if (other === this) {
            return false;

        }else {
            var offset = V3.sub(other.position(), this.position());
            var distanceSquared = V3.lengthSquared(offset);

            // definitely in neighborhood if inside minDistance sphere
            if (distanceSquared < (minDistance * minDistance)){
                return true;
            }else {
                // definitely not in neighborhood if outside maxDistance sphere
                if (distanceSquared > (maxDistance * maxDistance)) {
                    return false;
                }else {
                    // otherwise, test angular offset from forward axis
                    var unitOffset = V3.scale(offset, 1 / Math.sqrt(distanceSquared));
                    var forwardness= V3.dot(this.forward(), unitOffset);
                    return forwardness > cosMaxAngle;
                }
            }
        }
    }
};



/** @class A Particle emitter utility class.
 * @param {Vector} position The point in space particles will
 * be emitted from.
 * @param {Function} init Class function for a single particle.
 * @param {Function} update Function to call to update each particle.
 */
$W.PointPartcleEmitter = function(position, init, update) {
    $W.ObjectState.call(this); // subclass of ObjectState
    

}


/** @class A physical simulation.  */
$W.SimulatedObject = function(physType) {
    $W.Object.call(this, $W.GL.TRIANGLES);

    if (typeof($W.world) == 'undefined') {
        $W.world = { 
            objects:[],
            age:0,

            update:function(dt) {
                // Cleared per frame
                for (var i = 0; i < this.objects.length; i++) {
                    this.objects[i].alreadyCollidedWith = [];
                }
                for (var i = 0; i < this.objects.length; i++) {
                    this.objects[i].updateSim(dt);
                }
            }
        }
    }
    this.index = $W.world.objects.length;
    $W.world.objects.push(this); // Add this to global physical object list

    /** Forces to be applied this frame.
     * Cleared with each call to update()
     */
    this.impulses = [];

    this.alreadyCollidedWith = [];

    /** Type of object to simulate
     * "sphere" or "wall" are valid
     */
    this.physType = physType;

    /** Bounding sphere radius */
    this.radius = 5;
    /** Object mass */
    this.mass = 1;
    /** Object velocity */
    this.velocity = Vector.Zero(3);
    /** Angular velocity */
    this.omega = Vector.Zero(3);
    /** Coefficient of restitution */
    this.restitution = 1;

    this.maxSpeed = 0.02;

    this.applyImpulse = function(impulse) {
        this.impulses.push(impulse);
    }

    this.shouldTestCollisionWith = function(object) {
        // Walls don't collide
        if (this.physType == "wall" && object.physType == "wall"){
            return false;
        }

        // Don't test collision against self
        if (this.index === object.index) {
            return false;
        }

        // Don't recalc collisions if we've already tested
        for (var i = 0; i < object.alreadyCollidedWith.length; i++) {
            if (this.index === object.alreadyCollidedWith[i]) {
                return false;
            }
        }

        return true;
    }

    this.tempSphereForWallCollision = function(other) {
        var sphere = {};
        sphere.velocity = this.velocity;
        sphere.impulses = [];
        sphere.applyImpulse = function(){};
        sphere.radius = this.radius;
        sphere.position = this.line.pointClosestTo(other.position);
        sphere.physType = "wall";
        return sphere;
    }

    this.performCollisions = function(dt) {
        for (var i = 0; i < $W.world.objects.length; i++) {
            var object = $W.world.objects[i];

            if (this.shouldTestCollisionWith(object) && this.isColliding(object)) {
                var a = this;
                var b = object;

                if (a.physType == "wall") {
                    a = a.tempSphereForWallCollision(b);
                }
                if (b.physType == "wall") {
                    b = b.tempSphereForWallCollision(a);
                }

                var t = collisionDeltaOffset(this, object);
                dt += t;

                var actionNormal = a.position.subtract(b.position).toUnitVector();
                a.position = a.position.add(b.velocity.x(t));
                b.position = b.position.add(a.velocity.x(t));

                var vDiff = a.velocity.subtract(b.velocity);
                var relativeNormalVelocity = vDiff.dot(actionNormal);

                var impulse = actionNormal.x(relativeNormalVelocity);
                object.applyImpulse(impulse.x(1 / object.mass).x(this.restitution));
                this.applyImpulse(impulse.invert().x(1 / this.mass).x(object.restitution));
            }

            object.alreadyCollidedWith.push(this.index);
        }
    }

    this.updateSim = function(dt) {
        //--- calculate forces ---
        this.performCollisions(dt);


        //--- calculate velocities ---
        // Apply accrued impulses
        while (this.impulses.length > 0) {
            this.velocity = this.velocity.add(this.impulses.pop());
        }

        var temp = V3.$(this.velocity.e(1), this.velocity.e(2), this.velocity.e(3));
        //this.velocity.elements = V3.elements(V3.truncateLength(temp, this.maxSpeed));

        //--- integrate position/rotation ---
        this.position = this.position.add(this.velocity.x(dt));
    }

    var areColliding = function(a, b) {
        return didCollide(a, b, 0);
    }

    var collisionDeltaOffset = function(a, b) {
        // Back up to when the collision occurred
        // Otherwise objects could get stuck inside one another
        var t = 0;
        while (t < $W.timer.dt && didCollide(a, b, t++)) {}
        return t; // to catch back up
    }

    var didCollide = function(a, b, t) {
        if (a.physType == "wall" && b.physType == "wall") { return false; }
        var pa;
        var pb;

        if (a.physType == "sphere") {
            pa = a.position;
        }else if (a.physType == "wall") {
            pa = a.line.pointClosestTo(b.position);
        }

        if (b.physType == "sphere") {
            pb = b.position;
        }else if (b.physType == "wall") {
            pb = b.line.pointClosestTo(a.position);
        }

        return $W.util.sphereCollide(
                pa.subtract(a.velocity.x(t)),
                pb.subtract(b.velocity.x(t)), 
                a.radius, b.radius);
    }

    this.isColliding = function(obj) {
        return areColliding(this, obj);
    }
}


/** Parse a .obj model file
 * XXX Not quite working.
 * @return model An object containing model data as flat
 * arrays.
 * @return model.vertices Vertices of the object.
 * @return model.normals Normals of the object.
 * @return model.texCoords Texture coordinates of the object.
 * @return model.faces Element indices of the object.
 */
$W.util.parseOBJ = function(obj) {
    console.group("Processing .obj file...");
    var data = {};
    var model = {};
    var counts = [0,0,0,0];

    var getDataFromLinesStartingWith = function(str) {
        var data = [];
        var linePattern = new RegExp("^" + str + "\\s.*", 'gim');


        var lines = obj.match(linePattern);
        if (lines !== null) {
            for (var i = 0; i < lines.length; i++) {
                data.push(lines[i].match(/[-0-9e/\.\+]+/gi));
            }
        }

        return data;
    };


    data.vertices   = getDataFromLinesStartingWith('v');
    data.normals    = getDataFromLinesStartingWith('vn');
    data.texCoords  = getDataFromLinesStartingWith('vt');
    data.faces      = getDataFromLinesStartingWith('f');

    for (var f = 0; f < data.faces.length; f++) {
        var face = data.faces[f];

        if (face.length === 4) {
            data.faces[f] = [face[0],face[1],face[2]];
            data.faces.push([face[1],face[2],face[3]]);
        }
    }

    model.vertices   = [];
    model.normals    = [];
    model.texCoords  = [];
    // face format : v/vt/vn
    for (var f = 0; f < data.faces.length; f++) {
        for (var v = 0; v < data.faces[f].length; v++) {
            var vertex = data.faces[f][v].split('/');;

            model.vertices  = 
                model.vertices.concat (data.vertices [vertex[0]-1]); // v
            model.texCoords = 
                model.texCoords.concat(data.texCoords[vertex[1]-1]); // vt
            model.normals   = 
                model.normals.concat  (data.normals  [vertex[2]-1]); // vn
        }
    };

    model.vertexCount = model.vertices.length / 3;

    console.log(data.vertices.length + " unique vertices" +
            "\n" + data.faces.length + " faces" +
            "\nfor a total of " + model.vertexCount + " model vertices"
            );
    console.groupEnd();

    model.data = data;
    return model;
}
