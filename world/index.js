import * as THREE from './js/three.module.js';
import { FontLoader } from './js/loaders/FontLoader.js';
import { TextGeometry } from './js/geometries/TextGeometry.js';
import Stats from './js/libs/stats.module.js';

let clock = new THREE.Clock();
let walls = [];
let physicsWorld;
let ballBody;
var myWorld = document.getElementById('myWorld');
let worldWidth = window.innerWidth;
let worldHeight = window.innerHeight;
let sky, sun;

// 单平面大小
let planeWidth = 40;
let planeDepth = 40;

// 配置
let URL = {
    "github": "https://github.com/Mote-Z",
}
//box textures
let boxTexture = {
    "github": './world/resources/github.png',
};


Ammo().then( function( AmmoLib ) {
    Ammo = AmmoLib;
    console.log("初始化物理世界")
    initPhysics();
    console.log("初始化场景")
    init();
    // animate();

} );

// init physical world here
function initPhysics() {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration); 
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    // 设置物理世界的重力向量，这里设置的是向下的重力，大小为9.8m/s²
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));  
}

// 初始化场景和物理
function init() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(100, worldWidth / worldHeight, 0.1, 1000);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(worldWidth, worldHeight);
    myWorld.appendChild(renderer.domElement);

    // 显示帧数
    const stats = new Stats()
    myWorld.appendChild( stats.dom );

    // 创建平面
    const helper = new THREE.GridHelper( 40, 10, 0xffffff, 0xffffff );
    scene.add( helper );
    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeDepth);
    const planeMaterial = new THREE.MeshBasicMaterial({color: 0xAAAAAA, side: THREE.DoubleSide, transparent: true, opacity: 0.2});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = - Math.PI / 2;
    scene.add(plane);
    // Ammo.js - 平面刚体、变换矩阵初始化、物体质量设置为零表示静态、惯性张量
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(20, 1, 20));
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -1, 0));
    const mass = 0;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
    const groundRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, groundMotionState, groundShape, localInertia);
    const groundBody = new Ammo.btRigidBody(groundRigidBodyInfo);
    physicsWorld.addRigidBody(groundBody);

    // 创建围栏
    function createWalls(planeWidth, planeDepth) {
        const wallThickness = 0.5;
        const wallHeight = 1;
        const positions = [
            // X轴正方向的墙的两个角
            { x: 0, y: wallHeight / 2, z: planeDepth / 2 + wallThickness / 2 },
            { x: 0, y: wallHeight / 2, z: -(planeDepth / 2 + wallThickness / 2) },
            // Z轴正方向的墙的两个角
            { x: planeWidth / 2 + wallThickness / 2, y: wallHeight / 2, z: 0 },
            { x: -(planeWidth / 2 + wallThickness / 2), y: wallHeight / 2, z: 0 },
        ];
        const wallShapeX = new THREE.BoxGeometry(planeWidth + 2 * wallThickness, wallHeight, wallThickness);
        const wallShapeZ = new THREE.BoxGeometry(wallThickness, wallHeight, planeDepth + 2 * wallThickness);
        const wallMaterial = new THREE.MeshBasicMaterial({color: 0xAAAAAA, side: THREE.DoubleSide, transparent: true, opacity: 0.2});
        for (let i = 0; i < 2; i++) {
            const wall = new THREE.Mesh(wallShapeX, wallMaterial);
            wall.position.set(positions[i].x, positions[i].y, positions[i].z);
            scene.add(wall);
            walls.push(wall);
            // Ammo.js - 墙体刚体 高度设为了墙的10倍，避免球体因为碰撞掉出平面
            const wallShape = new Ammo.btBoxShape(new Ammo.btVector3((planeWidth + 2 * wallThickness) / 2, 10 *wallHeight, wallThickness / 2));
            const wallTransform = new Ammo.btTransform();
            wallTransform.setIdentity();
            wallTransform.setOrigin(new Ammo.btVector3(positions[i].x, positions[i].y, positions[i].z));
            const wallMass = 0;
            const wallLocalInertia = new Ammo.btVector3(0, 0, 0);
            const wallMotionState = new Ammo.btDefaultMotionState(wallTransform);
            const wallRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(wallMass, wallMotionState, wallShape, wallLocalInertia);
            const wallBody = new Ammo.btRigidBody(wallRigidBodyInfo);
            physicsWorld.addRigidBody(wallBody);
        }

        for (let i = 2; i < 4; i++) {
            const wall = new THREE.Mesh(wallShapeZ, wallMaterial);
            wall.position.set(positions[i].x, positions[i].y, positions[i].z);
            scene.add(wall);
            walls.push(wall);
            // Ammo.js - 墙体刚体
            const wallShape = new Ammo.btBoxShape(new Ammo.btVector3(wallThickness / 2, 10 * wallHeight, (planeDepth + 2 * wallThickness) / 2));
            const wallTransform = new Ammo.btTransform();
            wallTransform.setIdentity();
            wallTransform.setOrigin(new Ammo.btVector3(positions[i].x, positions[i].y, positions[i].z));
            const wallMass = 0;
            const wallLocalInertia = new Ammo.btVector3(0, 0, 0);
            const wallMotionState = new Ammo.btDefaultMotionState(wallTransform);
            const wallRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(wallMass, wallMotionState, wallShape, wallLocalInertia);
            const wallBody = new Ammo.btRigidBody(wallRigidBodyInfo);
            physicsWorld.addRigidBody(wallBody);
        }
    }
    createWalls(planeWidth, planeDepth);

    // 创建一个星云效果的粒子系统
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: 0.1,
    });
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(200);  // -100 到 100 之间的随机数
        const y = THREE.MathUtils.randFloatSpread(200);  // -100 到 100 之间的随机数
        const z = THREE.MathUtils.randFloatSpread(200);  // -100 到 100 之间的随机数
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    // 调整星云的位置，使其位于平面下方
    stars.position.y = -10;

    // 创建小球
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({
        color: 0x66CCFF, // 设置颜色属性
        transparent: true, // 如果需要透明度，设置为true
        opacity: 0.8, // 设置透明度的值，范围从0（完全透明）到1（完全不透明）
      });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.y = 0.5;
    scene.add(ball);

    // Ammo.js - 小球刚体
    const ballShape = new Ammo.btSphereShape(0.5);
    const ballTransform = new Ammo.btTransform();
    ballTransform.setIdentity();
    ballTransform.setOrigin(new Ammo.btVector3(0, 0.5, 0));
    const ballMass = 1;
    const ballLocalInertia = new Ammo.btVector3(0, 0, 0);
    ballShape.calculateLocalInertia(ballMass, ballLocalInertia);
    const ballMotionState = new Ammo.btDefaultMotionState(ballTransform);
    const ballRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(ballMass, ballMotionState, ballShape, ballLocalInertia);
    ballBody = new Ammo.btRigidBody(ballRigidBodyInfo);
    physicsWorld.addRigidBody(ballBody);


    
  //loads text for Floyd Mesh
  function loadSimpleText(x,y,z,message, size) {
    var text_loader = new FontLoader();
    text_loader.load('./world/resources/Roboto_Regular.json', function (font) {
        var xMid;
        var text = message;
        var fontsize = size;
        var color = 0xfffc00;
        var textMaterials = [
            new THREE.MeshBasicMaterial({ color: color }), // front
            new THREE.MeshPhongMaterial({ color: color }), // side
        ];
        var geometry = new TextGeometry(text, {
            font: font,
            size: fontsize,
            depth: 0.1,
            curveSegments: 5,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
            bevelOffset: 0,
            bevelSegments: 1,
        });
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();
        xMid = -0.15 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        geometry.translate(xMid, 0, 0);
        text = new THREE.Mesh(geometry, textMaterials);
        text.position.z = z;
        text.position.y = y;
        text.position.x = x;
        text.receiveShadow = true;
        text.castShadow = true;
        scene.add(text);
    });
  }
  loadSimpleText(0, 0, -1, 'Mote', 0.5)
  loadSimpleText(-2, 4, -5, 'Github', 0.3)
  loadSimpleText(2, 4, -5, 'Email', 0.3)


// 在场景中添加一个公告栏展示图片
function addImageBoard(scene, imageUrl, position, boardSize) {
    // 板的大小参数，格式为 { width: 5, height: 3 }
    boardSize = boardSize;

    // 加载图片纹理
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageUrl, function(texture) {
        // 图片加载完成后，更新纹理
        texture.needsUpdate = true;
    });

    // 创建公告栏的几何形状
    const boardGeometry = new THREE.PlaneGeometry(boardSize.width, boardSize.height);
    // 创建材质并设置图片纹理
    const boardMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    // 创建网格并设置材质
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.copy(position);
    // 聚光灯
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.copy(board.position);
    spotLight.angle = Math.PI / 6;

    // 将公告栏、边框和 聚光灯添加到场景中
    scene.add(board);
    // scene.add(frame);
    // scene.add(spotLight);

    // 返回创建的公告栏、边框和 聚光灯
    return { board: board,  light: spotLight };
}
const imageUrl = './world/resources/village.jpeg'; // 图片的URL
const boardSize = { width: 3, height: 4 };
let boardPosition = new THREE.Vector3(-10, 4, -20); // 公告栏的位置
addImageBoard(scene, imageUrl, boardPosition, boardSize);
boardPosition = new THREE.Vector3(-5, 4, -20); // 公告栏的位置
addImageBoard(scene, imageUrl, boardPosition, boardSize);
boardPosition = new THREE.Vector3(0, 4, -20); // 公告栏的位置
addImageBoard(scene, imageUrl, boardPosition, boardSize);
boardPosition = new THREE.Vector3(5, 4, -20); // 公告栏的位置
addImageBoard(scene, imageUrl, boardPosition, boardSize);
boardPosition = new THREE.Vector3(10, 4, -20); // 公告栏的位置
addImageBoard(scene, imageUrl, boardPosition, boardSize);

// this function was enlighted by  https://0xfloyd.com/
function createBox(x, y, z, texturePath) {
    // 创建BoxGeometry，指定box的宽度、高度和深度
    var geometry = new THREE.BoxGeometry(1, 1, 0.2);
    // 加载图片作为材质贴图
    const githubTexture = new THREE.TextureLoader().load(texturePath);
    const loadedTexture = new THREE.MeshBasicMaterial({
        map: githubTexture,
        color: 0xffffff,
      });
    // 创建材质
    const githubMaterials = [
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // left
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // right
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // top
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // bottom
        loadedTexture, // front
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // back
    ];
    // 使用BoxGeometry和材质创建Mesh
    var githubBox = new THREE.Mesh(geometry, githubMaterials);
    scene.add(githubBox);
    // 将box的位置设置到场景中
    githubBox.position.set(x, y, z);
    console.log(githubBox);
    // 创建Ammo的刚体
    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(0.5, 0.5, 0.1)); // 单位尺寸的box
    const boxTransform = new Ammo.btTransform();
    boxTransform.setIdentity();
    boxTransform.setOrigin(new Ammo.btVector3(x, y, z));
    const boxMass = 0; // 质量
    const boxLocalInertia = new Ammo.btVector3(0, 0, 0);
    const boxMotionState = new Ammo.btDefaultMotionState(boxTransform);
    const boxRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(boxMass, boxMotionState, boxShape, boxLocalInertia);
    const boxBody = new Ammo.btRigidBody(boxRigidBodyInfo);
    physicsWorld.addRigidBody(boxBody);
}
createBox(4, 0.5, 4, './world/resources/github.jpg');
createBox(6, 0.5, 4, './world/resources/github.jpg');
createBox(8, 0.5, 4, './world/resources/github.jpg');
createBox(10, 0.5, 4, './world/resources/github.jpg');


function createBulletinBoard() {
    // Create the wooden post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 32); // Adjust the height as needed
    const postTexture = new THREE.TextureLoader().load('./world/resources/wood.jpeg');
    const postMaterial = new THREE.MeshBasicMaterial({ map: postTexture });
    const woodenPost = new THREE.Mesh(postGeometry, postMaterial);

    // Position the post below the bulletin board
    woodenPost.position.set(0, 0, 0); // Adjust position to connect with the board
    scene.add(woodenPost);
    // Create the bulletin board
    const boardGeometry = new THREE.BoxGeometry(4, 2, 0.1);
    const boardTexture = new THREE.TextureLoader().load('./world/resources/village.jpeg');
    const boardMaterial = new THREE.MeshBasicMaterial({ map: boardTexture });
    const bulletinBoard = new THREE.Mesh(boardGeometry, boardMaterial);

    // Position the board slightly above the ground
    bulletinBoard.position.set(0, 2, 0);
    scene.add(bulletinBoard);
    // Load the font
    const loader = new FontLoader();
    loader.load('./world/resources/Roboto_Regular.json', function (font) {
        const textGeometry = new TextGeometry('Bulletin Board', {
            font: font,
            size: 0.4,
            height: 0.1,
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Position the text under the board
        textMesh.position.set(-1, 0, 2);
        scene.add(textMesh);
    });
}
createBulletinBoard();

// 移动速度
const moveSpeed = 5;

// 按键状态追踪
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'w':
            console.log("w-keydown")
            keys.w = true;
            break;
        case 's':
            console.log("s-keydown")
            keys.s = true;
            break;
        case 'a':
            console.log("a-keydown")
            keys.a = true;
            break;
        case 'd':
            console.log("d-keydown")
            keys.d = true;
            break;
        case ' ': // 添加空格键的监听
            console.log("space-keydown")
            keys.space = true;
            break;
    }
});

document.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w':
            console.log("w-keyup")
            keys.w = false;
            break;
        case 's':
            console.log("s-keyup")
            keys.s = false;
            break;
        case 'a':
            console.log("a-keyup")
            keys.a = false;
            break;
        case 'd':
            console.log("d-keyup")
            keys.d = false;
            break;
        case ' ': // 添加空格键的监听
            console.log("space-keyup")
            keys.space = false;
            break;
    }
});

    // const controls = new OrbitControls( camera, renderer.domElement );
    // controls.addEventListener( 'change', animate );
    // // controls.maxPolarAngle = Math.PI / 2;
    // controls.enableZoom = false;
    // controls.enablePan = false;
    

    window.addEventListener('resize', () => {
        console.log("window resize")
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 渲染循环
    function animate() {
        stats.update();
        requestAnimationFrame(animate);

        // 移动小球
        const ballVelocity = ballBody.getLinearVelocity();
        if (keys.w) ballVelocity.setZ(-moveSpeed);
        if (keys.s) ballVelocity.setZ(moveSpeed);
        if (keys.a) ballVelocity.setX(-moveSpeed);
        if (keys.d) ballVelocity.setX(moveSpeed);
        if (keys.space) { // 当按下空格键时，将速度设置为零
            ballVelocity.setX(0);
            ballVelocity.setY(0);
            ballVelocity.setZ(0);
        };
        ballBody.setLinearVelocity(ballVelocity);



        // 更新物理世界
        const deltaTime = clock.getDelta();
        physicsWorld.stepSimulation(deltaTime, 10);

        // 更新小球的位置
        const ballTransform = new Ammo.btTransform();
        ballBody.getMotionState().getWorldTransform(ballTransform);
        const origin = ballTransform.getOrigin();
        const rotation = ballTransform.getRotation();
        ball.position.set(origin.x(), origin.y(), origin.z());
        ball.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());

        // 相机跟随小球
        camera.position.set(origin.x(), origin.y() + 5, origin.z() + 5);
        camera.lookAt(ball.position);

        renderer.render(scene, camera);
    }

    animate();
}