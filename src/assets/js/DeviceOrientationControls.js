import * as THREE from "./three.js";
const DeviceOrientationControls = function () {
  // var scope = this;

  // this.enabled = true;
  console.log(this);

  this.deviceOrientation = {};
  this.screenOrientation = 0;

  this.horizontalOffset = 0; // degrees
  this.verticalOffset = 0; // degrees

  var onDeviceOrientationChangeEvent = function (event) {
    scope.deviceOrientation = event;
  };

  var onScreenOrientationChangeEvent = function () {
    scope.screenOrientation = window.orientation || 0;
  };

  // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

  // var setObjectQuaternion = (function () {
  //   var zee = new THREE.Vector3(0, 0, 1);

  //   var euler = new THREE.Euler();

  //   var q0 = new THREE.Quaternion();

  //   var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis

  //   return function (quaternion, alpha, beta, gamma, orient) {
  //     euler.set(beta, alpha, -gamma, "YXZ"); // 'ZXY' for the device, but 'YXZ' for us

  //     quaternion.setFromEuler(euler); // orient the device

  //     quaternion.multiply(q1); // camera looks out the back of the device, not the top

  //     quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
  //   };
  // })();

  this.connect = function () {
    onScreenOrientationChangeEvent(); // run once on load

    window.addEventListener(
      "orientationchange",
      onScreenOrientationChangeEvent,
      false
    );
    window.addEventListener(
      "deviceorientation",
      onDeviceOrientationChangeEvent,
      false
    );

    // scope.enabled = true;
  };

  this.disconnect = function () {
    window.removeEventListener(
      "orientationchange",
      onScreenOrientationChangeEvent,
      false
    );
    window.removeEventListener(
      "deviceorientation",
      onDeviceOrientationChangeEvent,
      false
    );

    // scope.enabled = false;
  };

  this.update = function (_horizontalOffset, _verticalOffset) {
    // if (scope.enabled === false) return;

    if (_horizontalOffset != undefined)
      scope.horizontalOffset = _horizontalOffset;
    if (_verticalOffset != undefined) scope.verticalOffset = _verticalOffset;

    if (!scope.deviceOrientation) {
      scope.deviceOrientation = { alpha: 90, beta: 90, gamma: 0 };
      scope.screenOrientation = 0;
    }
    var device = scope.deviceOrientation;

    var alpha = THREE.Math.degToRad(device.alpha); // Z
    var beta = THREE.Math.degToRad(device.beta); // X'
    var gamma = THREE.Math.degToRad(device.gamma); // Y''
    console.log("alpha", alpha);
    console.log("beta", beta);
    console.log("gamma", gamma);

    var orient = THREE.Math.degToRad(scope.screenOrientation); // O

    setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);

    scope.object.rotateX(THREE.Math.degToRad(scope.verticalOffset));
    var axisY = new THREE.Vector3(0, 1, 0);
    scope.object.rotateOnWorldAxis(
      axisY,
      THREE.Math.degToRad(scope.horizontalOffset)
    );
  };

  this.dispose = function () {
    scope.disconnect();
  };

  this.connect();
};

export { DeviceOrientationControls };
