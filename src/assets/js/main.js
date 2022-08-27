import * as THREE from "./three.js";

import { GLTFLoader } from "./GLTFLoader.js";

let isBegin = false;

let camera, scene, renderer, stats;

let mixer, actions;

const AUTOMOVE_LENGTH = 120;
const OUTSIDE_LENGTH = 50;
const HALF_WINDOW_WIDTH = window.innerWidth / 2;
const HALF_WINDOW_HEIGHT = window.innerHeight / 2;
const WINDOW_ASPECT = window.innerWidth / window.innerHeight;
const MIN_ROTATION_VALUE = -Math.PI;
const MAX_ROTATION_VALUE = Math.PI;

const random_point = [
  [-HALF_WINDOW_WIDTH - OUTSIDE_LENGTH, 0],
  [0, -HALF_WINDOW_HEIGHT - OUTSIDE_LENGTH],
  [HALF_WINDOW_WIDTH + OUTSIDE_LENGTH, 0],
];
let random_num = 0;

let isAutoMove = true;
let isGravityMove = false;
const autoMoveSpeed = 1;
let autoMoveLog = 0;
let x = 0;
let z = 0;
let px = 0;
let pz = 0;
let x_speed_percent = 1 / 10;
let z_speed_percent = 1 / 30;

let swimAction, dieAction;

let win_score = 0;
let lose_score = 0;

let time = null;
let countdown = 4;

const clock = new THREE.Clock();

const container = document.getElementById("first_container");
const win_score_container = document.getElementById("win_score");
const lose_score_container = document.getElementById("lose_score");
const startButtonElement = document.getElementById("start_button");

win_score_container.value = win_score;
lose_score_container.value = lose_score;

camera = new THREE.OrthographicCamera(
  -HALF_WINDOW_WIDTH,
  HALF_WINDOW_WIDTH,
  HALF_WINDOW_HEIGHT,
  -HALF_WINDOW_HEIGHT,
  1,
  2000
);

camera.position.set(0, 500, 0);
camera.rotation.x = -0.5 * Math.PI;

scene = new THREE.Scene();
scene.background = null;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 2000, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(0, 2000, 200);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 180;
dirLight.shadow.camera.bottom = -100;
dirLight.shadow.camera.left = -120;
dirLight.shadow.camera.right = 120;
scene.add(dirLight);
scene.add(new THREE.CameraHelper(dirLight.shadow.camera));

// load gltf
const loader = new GLTFLoader();
let gltfModel = null;
loader.load("fish.glb", function (gltf) {
  gltfModel = gltf.scene;
  scene.add(gltfModel);
  gltfModel.position.x = 0;
  gltfModel.scale.set(25, 25, 25);
  gltfModel.rotation.x = -0.25 * Math.PI;

  mixer = new THREE.AnimationMixer(gltf.scene);
  swimAction = mixer.clipAction(gltf.animations[7]);
  dieAction = mixer.clipAction(gltf.animations[13]);
  actions = [dieAction, swimAction];

  actions[1].play();
});
renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function initPosition() {
  // init
  if (!isAutoMove) {
    isAutoMove = true;
    startButtonElement.innerText = "自動移動中";
  }
  x = 0;
  z = 0;
  actions[0].stop();
  actions[1].play();
  random_num = randomIntFromInterval(0, 2);
  px = random_point[random_num][0];
  pz = random_point[random_num][1];
  gltfModel.position.x = px;
  gltfModel.position.z = pz;
  if (random_num === 0) {
    gltfModel.rotation.y = 0.5 * Math.PI;
  }
  if (random_num === 1) {
    gltfModel.rotation.y = 0;
  }
  if (random_num === 2) {
    gltfModel.rotation.y = -0.5 * Math.PI;
  }
}

// model移動相關
startButtonElement.onclick = () => {
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
    // true
  ) {
    isBegin = true;
    initPosition();

    DeviceMotionEvent.requestPermission();
    startButtonElement.setAttribute("disabled", true);

    window.addEventListener("deviceorientation", (event) => {
      if (!isAutoMove && isGravityMove) {
        if (event?.gamma) {
          z = Number(event?.beta.toFixed(1)) * z_speed_percent;
        }
        if (event?.beta) {
          x = Number(event?.gamma.toFixed(1)) * x_speed_percent;
        }
      }
    });
  } else {
    startButtonElement.setAttribute("disabled", true);
    startButtonElement.innerText = "設備不支持";
  }
};
function autoMove() {
  if (random_num === 0) {
    px += autoMoveSpeed;
    autoMoveLog += autoMoveSpeed;
  }
  if (random_num === 1) {
    pz += autoMoveSpeed;
    autoMoveLog += autoMoveSpeed;
  }
  if (random_num === 2) {
    px -= autoMoveSpeed;
    autoMoveLog += autoMoveSpeed;
  }

  gltfModel.position.x = px;
  gltfModel.position.z = pz;
}
function cancelAutoMove() {
  if (autoMoveLog > 100) {
    autoMoveLog = 0;
    isAutoMove = false;
    isGravityMove = true;
    startButtonElement.innerText = "重力感應中";
  }
}

// rotation
function fixedRotation() {
  if (x > 0 && z > 0) {
    gltfModel.rotation.y = 0.25 * Math.PI;
  }
  if (x > 0 && z < 0) {
    gltfModel.rotation.y = 0.75 * Math.PI;
  }
  if (x < 0 && z > 0) {
    gltfModel.rotation.y = -0.25 * Math.PI;
  }
  if (x < 0 && z < 0) {
    gltfModel.rotation.y = -0.75 * Math.PI;
  }
}

// debounce
function Countdown() {
  time = setInterval(() => {
    --countdown;
    if (countdown >= 0) {
      startButtonElement.innerText = `捕捉中...${countdown}`;
    }
  }, 1000);
}

function ClearCountdown() {
  if (time) {
    startButtonElement.innerText = `重力感應`;
    clearInterval(time);
    time = null;
    countdown = 4;
  }
}

function gravityMove() {
  px += x;
  pz += z;

  gltfModel.position.x = px;
  gltfModel.position.z = pz;
}

function getWinGoal() {
  if (px < 50 && px > -50 && pz < 50 && pz > -50) {
    if (!time) {
      Countdown();
    }

    if (countdown === -1) {
      startButtonElement.innerText = `捕捉成功`;
      actions[0].play();
      actions[1].stop();
      isGravityMove = false;
      x = 0;
      z = 0;
    }

    if (countdown === -4) {
      win_score_container.value = ++win_score;
      initPosition();
      clearInterval(time);
      countdown = 4;
      time = null;
    }
  } else {
    ClearCountdown();
  }
}

function getLoseGoal() {
  if (
    px > HALF_WINDOW_WIDTH ||
    px < -HALF_WINDOW_WIDTH ||
    pz > HALF_WINDOW_HEIGHT ||
    pz < -HALF_WINDOW_HEIGHT
  ) {
    if (!isAutoMove) {
      lose_score_container.value = ++lose_score;
      initPosition();
    }
  }
}

function displayLog() {
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function" &&
    isBegin === true
  ) {
    document.getElementById("demo_x").innerHTML = `x = ${x.toFixed(1)}`;
    document.getElementById("demo_z").innerHTML = `z = ${z.toFixed(1)}`;
    document.getElementById(
      "demo_cube_x"
    ).innerHTML = `px=${gltfModel.position.x.toFixed(2)}`;
    document.getElementById(
      "demo_cube_z"
    ).innerHTML = `pz=${gltfModel.position.z.toFixed(2)}`;
    document.getElementById("countdown").innerHTML = `cd=${countdown}`;
    document.getElementById(
      "needAnimateChange"
    ).innerHTML = `NAC=${needAnimateChange}`;
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (isBegin) {
    displayLog();
    fixedRotation();
    if (isAutoMove) {
      autoMove();
      cancelAutoMove();
    } else {
      gravityMove();
      getWinGoal();
      getLoseGoal();
    }
  }
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
  // stats.update();
}

animate();
