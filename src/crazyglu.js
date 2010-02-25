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
