define([
  'pex/geom/Vec3',
  'pex/geom/Face3',
  'pex/geom/Face4',
  'pex/geom/FacePolygon',
  'pex/geom/Geometry',
  'pex/geom/hem/HEMesh',
  'pex/geom/hem/HEVertex',
  'pex/geom/hem/HEEdge',
  'pex/geom/hem/HEFace',
  'pex/geom/Edge',
  'pex/geom/gen/LineBuilder'
],
function(Vec3, Face3, Face4, FacePolygon, Geometry, HEMesh, HEVertex, HEEdge, HEFace, Edge, LineBuilder)  {
  function HEGeometryConverter() {
  }

  HEMesh.prototype.fromGeometry = function(geom) {
    this.vertices.length = 0;
    this.faces.length = 0;
    this.edges.length = 0;

    var positions = geom.vertices;

    for(var i=0; i<positions.length; i++) {
      var pos = positions[i];
      this.vertices.push(new HEVertex(pos.x, pos.y, pos.z));
    }

    var indices = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    var newEdges = [null, null, null, null, null];
    var numEdges = 3;
    if (geom.faces && geom.faces.length > 0) {
      for(var i=0; i<geom.faces.length; i++) {
        var f = geom.faces[i];
        var newFace = new HEFace();
        this.faces.push(newFace);

        if (f instanceof Face4) {
          numEdges = 4;
        }
        if (f instanceof FacePolygon) {
          numEdges = f.numVertices;
        }

        for(var j=0; j<numEdges; j++) {
          newEdges[j] = new HEEdge();
          this.edges.push(newEdges[j]);
          var vertexIndex = f[indices[j]];
          newEdges[j].vert = this.vertices[vertexIndex];
          newEdges[j].face = newFace;
        }
        for(var k=0; k<numEdges; k++) {
          newEdges[k].next = newEdges[(k+1) % numEdges];
        }

        newFace.edge = newEdges[0];
      }
    }
    else {
      for(var i=0; i<geom.vertices.length; i+=3) {
        var newFace = new HEFace();
        this.faces.push(newFace);
        var numEdges = 3;
        for(var j=0; j<numEdges; j++) {
          newEdges[j] = new HEEdge();
          this.edges.push(newEdges[j]);
          var vertexIndex = i + j;
          newEdges[j].vert = this.vertices[vertexIndex];
          newEdges[j].face = newFace;
        }
        for(var k=0; k<numEdges; k++) {
          newEdges[k].next = newEdges[(k+1) % numEdges];
        }
        newFace.edge = newEdges[0];
      }
    }

    this.fixDuplicatedVertices();
    this.fixDuplicatedEdges();
    this.fixVertexEdges();
    this.fixEdgePairs();
    this.check();
    return this;
  };

  HEMesh.prototype.toFlatGeometry = function(geometry, selectedOnly) {
    selectedOnly = (typeof(selectedOnly) === 'undefined') ? false : selectedOnly;
    var numVertices = 0;
    var faces = this.faces;
    if (selectedOnly) {
      faces = this.getSelectedFaces();
    }

    faces.forEach(function(f) {
      var faceVertexCount = f.getAllVertices().length;
      if (faceVertexCount == 3) numVertices += 3;
      else if (faceVertexCount == 4) numVertices += 6;
    });

    if (!geometry) {
      geometry = new Geometry({vertices:true, normals:true})
    }

    var positions = geometry.vertices;
    var normals = geometry.normals;

    geometry.vertices.isDirty = true;
    geometry.normals.isDirty = true;

    var vertexIndex = 0;
    var face4Swizzle = [0, 1, 3, 3, 1, 2];

    for(var i in faces) {
      var face = faces[i];
      var faceVertices = face.getAllVertices();
      var faceNormal = face.getNormal();
      if (faceVertices.length == 3) {
        for(var j=0; j<3; j++) {
          if (!positions[vertexIndex+j]) positions[vertexIndex+0] = faceVertices[j].position.clone()
          else positions[vertexIndex+j].copy(faceVertices[j].position);
          if (!normals[vertexIndex+j]) normals[vertexIndex+j] = faceNormal.clone()
          else normals[vertexIndex+j].copy(faceNormal);
        }
        vertexIndex += 3;
      }
      else if (faceVertices.length == 4) {
        for(var j=0; j<6; j++) {
          if (!positions[vertexIndex+j]) positions[vertexIndex+j] = faceVertices[face4Swizzle[j]].position.clone()
          else positions[vertexIndex+j].copy(faceVertices[face4Swizzle[j]].position);
          if (!normals[vertexIndex+j]) normals[vertexIndex+j] = faceNormal.clone()
          else normals[vertexIndex+j].copy(faceNormal);
        }
        vertexIndex += 6;
      }
      else {
        console.log("HEGeometryConverter.thisToFlatGeometry: Unsupported face vertex count:" + faceVertices.length);
      }
    }
    return geometry;
  };

  HEMesh.prototype.toSmoothGeometry = function(geometry) {
    if (!geometry) {
      geometry = new Geometry({vertices:true, normals:true, tangents:true})
    }

    if (!geometry.attribs.tangent) {
      geometry.addAttrib('tangents', 'tangent');
    }

    var positions = geometry.vertices;
    var normals = geometry.normals;
    var tangents = geometry.tangents;

    geometry.vertices.isDirty = true;
    geometry.normals.isDirty = true;
    geometry.tangents.isDirty = true;

    var vertexIndex = 0;
    var face4Swizzle = [0, 1, 3, 3, 1, 2];

    for(var i in this.faces) {
      var face = this.faces[i];
      var faceVertices = face.getAllVertices();
      var faceNormal = face.getNormal();
      if (faceVertices.length == 3) {
        for(var j=0; j<3; j++) {
          if (!positions[vertexIndex+j]) positions[vertexIndex+0] = faceVertices[j].position.clone()
          else positions[vertexIndex+j].copy(faceVertices[j].position);
          if (!normals[vertexIndex+j]) normals[vertexIndex+j] = faceVertices[j].getNormal();
          else normals[vertexIndex+j].copy(faceVertices[j].getNormal());
        }
        vertexIndex += 3;
      }
      else if (faceVertices.length == 4) {
        for(var j=0; j<6; j++) {
          if (!positions[vertexIndex+j]) positions[vertexIndex+j] = faceVertices[face4Swizzle[j]].position.clone()
          else positions[vertexIndex+j].copy(faceVertices[face4Swizzle[j]].position);
          if (!normals[vertexIndex+j]) normals[vertexIndex+j] = faceVertices[face4Swizzle[j]].getNormal();
          else normals[vertexIndex+j].copy(faceVertices[face4Swizzle[j]].getNormal());
          if (!tangents[vertexIndex+j]) tangents[vertexIndex+j] = faceVertices[face4Swizzle[j]].tangent;
          else tangents[vertexIndex+j].copy(faceVertices[face4Swizzle[j]].tangent);
        }
        vertexIndex += 6;
      }
      else {
        console.log("HEGeometryConverter.thisToFlatGeometry: Unsupported face vertex count:" + faceVertices.length);
        //throw("HEGeometryConverter.thisToFlatGeometry: Unsupported face vertex count:" + faceVertices.length);
      }
    }
    return geometry;
  }

  /*
  HEMesh.prototype.toEdgesGeometry = function(offset) {
    offset = (offset !== undefined) ? offset : 0.1;
    var lineBuilder = new LineBuilder();

    var a = Vec3.create();
    var b = Vec3.create();
    this.edges.forEach(function(e) {
      var center = e.face.getCenter();
      a.asSub(center, e.vert.position).scale(offset).add(e.vert.position);
      b.asSub(center, e.next.vert.position).scale(offset).add(e.next.vert.position);
      lineBuilder.addLine(a, b);
    });
    return lineBuilder;
  };
  */

  return HEGeometryConverter;
});
