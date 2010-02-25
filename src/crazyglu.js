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
    this.radius = 1;
    /** Object mass */
    this.mass = 1;
    /** Object velocity */
    this.velocity = Vector.Zero(3);
    /** Angular velocity */
    this.omega = Vector.Zero(3);
    /** Coefficient of restitution */
    this.restitution = 1;

    this.applyImpulse = function(impulse) {
        this.impulses.push(impulse);
    }

    this.shouldTestCollisionWith = function(object) {
        // Walls don't collide
        if (this.physType == "wall" && object.physType == "wall"){
            return false;
        }

        // Don't test collision against self
        if (this.index == object.index) {
            return false;
        }

        // Don't recalc collisions if we've already tested
        for (var j = 0; j < object.alreadyCollidedWith.length; j++) {
            if (this.index == object.alreadyCollidedWith[j]) {
                //return false;
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
                a.position = a.position.subtract(a.velocity.x(t/10));
                b.position = b.position.subtract(b.velocity.x(t/10));

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

        //--- integrate position/rotation ---
        this.position = this.position.add(this.velocity.x(dt/10));
    }

    var areColliding = function(a, b) {
        return didCollide(a, b, 0);
    }

    var collisionDeltaOffset = function(a, b) {
        // Back up to when the collision occurred
        // Otherwise objects could get stuck inside one another
        var t = 0;
        while (didCollide(a, b, t++)) {}
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
                pa.subtract(a.velocity.x(t/10)),
                pb.subtract(b.velocity.x(t/10)), 
                a.radius, b.radius);
    }

    this.isColliding = function(obj) {
        return areColliding(this, obj);
    }
}

$W.Boid = function() {
    $W.Object.call(this, $W.GL.TRIANGLES);

    this.velocity = Vector.Zero(3);
    this.speed = 0;
    this.radius = 1;
    this.maxForce = 1;
    this.forward = null;
    this.side = null;
    this.up = null;

    this.predictFuturePosition = function(atTime) {
    }


}

/** Parse a .obj model file
 * XXX Should I build the vertex/normal/texture coordinate arrays
 * explicitly from the face data? Can it work otherwise?
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

    // Parse vertices
    model.vertices = obj.match(/^v\s.+/gm);
    if (model.vertices !== null) {
        console.log("Parsing vertices");
        for (var i = 0; i < model.vertices.length; i++) {
            model.vertices[i] = model.vertices[i].match(/[-0-9\.]+/g);
            counts[0]++;
        }
        model.vertices = model.vertices.flatten();
        model.vertices = model.vertices.flatten();

        // convert to numbers
        for (var i = 0; i < model.vertices.length; i++) {
            model.vertices[i] = model.vertices[i] * 1; 
            counts[0]++;
        }
    }

    // Parse normals
    model.normals = obj.match(/^vn.+/gm);
    if (model.normals !== null) {
        console.log("Parsing normals");
        for (var i = 0; i < model.normals.length; i++) {
            model.normals[i] = model.normals[i].match(/[0-9\.]+/g);
            counts[1]++;
        }
        model.normals = model.normals.flatten();
    }

    // Parse texture coordinates
    model.texCoords = obj.match(/^vt.+/gm);
    if (model.texCoords !== null) {
        console.log("Parsing texture coordinates");
        for (var i = 0; i < model.texCoords.length; i++) {
            model.texCoords[i] = model.texCoords[i].match(/[0-9\.]+/g);
            counts[2]++;
        }
        model.texCoords = model.texCoords.flatten();
        model.texCoords = model.texCoords.flatten();
    }
    /*
    // parse faces
    // faces start with `f `
    // `f v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3 [v4/vt4/vn4]
    model.faces = obj.match(/^f[\s.]+/gm); 
    if (model.faces != null) {}
    model.indices = {};
    console.log("parsing faces");
    // face format : v/vt/vn

    // pull the vertices from each face
    model.indices.vertex = [];
    for (var i = 0; i < model.faces.length; i++) {
// vertex indices match ` 123/`
model.indeces.vertex.push(/\s\d*\//g);
model.faces[i] = model.faces[i].match(/\s\d*\//g);

}
*/

// Parse faces
model.faces = obj.match(/^f.+/gm);
if (model.faces !== null) {
    console.log("Parsing faces");
    // face format : v/vt/vn
    for (var i = 0; i < model.faces.length; i++) {
        // Parse face vertices
        model.faces[i] = model.faces[i].match(/\s\d*\//g);
        for (var j = 0; j < model.faces[i].length; j++) {
            model.faces[i][j] = model.faces[i][j].slice(1, model.faces[i][j].length-1) - 1; // -1 to force into numeral form and change to zero indexing
        }



        //model.faces[i] = model.faces[i].match(/[0-9\/]+/g);

        // Convert quads to triangles
        /*
           if (model.faces[i].length == 4) {
           model.faces[i] = [
           model.faces[i][0],model.faces[i][1],model.faces[i][2],
           model.faces[i][1],model.faces[i][2],model.faces[i][3]
           ];
           }

           for (var j = 0; j < model.faces[i].length; j++) {
           model.faces[i][j] = (model.faces[i][j]).split("/");
           }
           */
        counts[3]++;
    }
    model.faces = model.faces.flatten();
    model.faces = model.faces.flatten();

    // convert to numbers
    for (var i = 0; i < model.faces.length; i++) {
        model.faces[i] = model.faces[i] * 1; 
        counts[0]++;
    }
}

console.log("Processed\n  " + counts[0] + " vertices" +
        "\n  " + counts[1] + " normals" +
        "\n  " + counts[2] + " texture coordinates" +
        "\n  " + counts[3] + " faces"
        );
console.groupEnd();
return model;
}
