// Generated by CoffeeScript 1.6.2
define(function(require) {
  var Camera, Mat4, Vec2, Vec3, Vec4, _ref;

  _ref = require('pex/geom'), Vec2 = _ref.Vec2, Vec3 = _ref.Vec3, Vec4 = _ref.Vec4, Mat4 = _ref.Mat4;
  return Camera = (function() {
    var projected;

    function Camera(fov, aspectRatio, near, far, position, target, up) {
      this.fov = fov || 60;
      this.aspectRatio = aspectRatio || 4 / 3;
      this.near = near || 0.1;
      this.far = far || 100;
      this.position = position || Vec3.create(0, 0, 5);
      this.target = target || Vec3.create(0, 0, 0);
      this.up = up || Vec3.create(0, 1, 0);
      this.projectionMatrix = Mat4.create();
      this.viewMatrix = Mat4.create();
      this.updateMatrices();
    }

    Camera.prototype.getFov = function() {
      return this.fov;
    };

    Camera.prototype.getAspectRatio = function() {
      return this.aspectRatio;
    };

    Camera.prototype.getNear = function() {
      return this.near;
    };

    Camera.prototype.getFar = function() {
      return this.far;
    };

    Camera.prototype.getPosition = function() {
      return this.position;
    };

    Camera.prototype.getTarget = function() {
      return this.target;
    };

    Camera.prototype.getUp = function() {
      return this.up;
    };

    Camera.prototype.getViewMatrix = function() {
      return this.viewMatrix;
    };

    Camera.prototype.getProjectionMatrix = function() {
      return this.projectionMatrix;
    };

    Camera.prototype.setFov = function(fov) {
      this.fov = fov;
      return this.updateMatrices();
    };

    Camera.prototype.setAspectRatio = function(ratio) {
      this.aspectRatio = ratio;
      return this.updateMatrices();
    };

    Camera.prototype.setFar = function(far) {
      this.far = far;
      return this.updateMatrices();
    };

    Camera.prototype.setNear = function(near) {
      this.near = near;
      return this.updateMatrices();
    };

    Camera.prototype.setPosition = function(position) {
      this.position = position;
      return this.updateMatrices();
    };

    Camera.prototype.setTarget = function(target) {
      this.target = target;
      return this.updateMatrices();
    };

    Camera.prototype.setUp = function(up) {
      this.up = up;
      return this.updateMatrices();
    };

    Camera.prototype.lookAt = function(target, eyePosition, up) {
      if (target) {
        this.target = target;
      }
      if (eyePosition) {
        this.position = eyePosition;
      }
      if (up) {
        this.up = up;
      }
      return this.updateMatrices();
    };

    Camera.prototype.updateMatrices = function() {
      this.projectionMatrix.identity().perspective(this.fov, this.aspectRatio, this.near, this.far);
      return this.viewMatrix.identity().lookAt(this.position, this.target, this.up);
    };

    projected = Vec4.create();

    Camera.prototype.getScreenPos = function(point, windowWidth, windowHeight) {
      var out;

      projected.set(point.x, point.y, point.z, 1.0);
      projected.transformMat4(this.viewMatrix);
      projected.transformMat4(this.projectionMatrix);
      out = Vec2.create().set(projected.x, projected.y);
      out.x /= projected.w;
      out.y /= projected.w;
      out.x = out.x * 0.5 + 0.5;
      out.y = out.y * 0.5 + 0.5;
      out.x *= windowWidth;
      out.y *= windowHeight;
      return out;
    };

    return Camera;

  })();
});
