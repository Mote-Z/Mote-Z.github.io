
import * as THREE from 'https://mote-z.github.io/js/three.module.js';

// 假设这是你的JSON数据的URL
const jsonUrl = 'https://mote-z.github.io/json/articles.json';

// 使用fetch API从URL获取JSON数据
fetch(jsonUrl)
  .then(response => {
    // 确保响应是成功的
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json(); // 解析JSON数据
  })
  .then(data => {
    // 使用获取到的数据来创建立方体
    console.log(data);
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });



class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.updatables = [];
  }
  render() {
  	renderer.render(scene, camera);
  }
  start() {
  	this.renderer.setAnimationLoop(() => {
	    // tell every animated object to tick forward one frame
	    this.tick();
	    // render a frame
	    this.renderer.render(this.scene, this.camera);
  	});
  }
  stop() {
  	this.renderer.setAnimationLoop(null);
  }
  tick() {
  	// Code to update animations
  	for (const object of this.updatables) {
  		object.tick();
  	}
  }
}

// init
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 70, 900 / 700, 0.1, 100 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
const loop = new Loop(camera, scene, renderer)
renderer.setSize( 900, 500 );
document.body.appendChild( renderer.domElement );

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle mouse move event
function onMouseMove(event) {
    event.preventDefault();
    var bounds = renderer.domElement.getBoundingClientRect();
    var divX = bounds.left;
    var divY = bounds.top;
    var divWidth = bounds.width;
    var divHeight = bounds.height;
    if (event.clientX >= divX && event.clientX <= divX + divWidth && event.clientY >= divY && event.clientY <= divY + divHeight) {
        mouse.x = ((event.clientX - divX) / divWidth) * 2 - 1;
        mouse.y = -((event.clientY - divY) / divHeight) * 2 + 1;
        console.log((event.clientX - divX), divWidth, mouse.x)
        console.log((event.clientY - divY), divHeight, mouse.y)
        raycaster.setFromCamera(mouse, camera);
    
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            console.log(intersects)
            if (intersectedObject.userData) {
                document.getElementById('infoCard').style.display = 'block';
                document.getElementById('infoCard').innerHTML = `
                    <h3>${intersectedObject.userData.categories.join(', ')}</h3>
                    <p>Link: <a href="${intersectedObject.userData.link}" target="_blank">Open PDF</a></p>
                `;
            }
        } else{
            document.getElementById('infoCard').style.display = 'none';
        }
    }

}

// Add event listeners
window.addEventListener('mousemove', onMouseMove);


function createScene(name, link, categories) {
    const geometry = new THREE.BoxGeometry( Math.random() * 9, 3, 3 ); 
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    cube.name = name;
    cube.userData = {link: link, categories: categories};
    cube.tick = () => {
        cube.rotation.z += 0.01;
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    }
    return cube;
}

//
const menu = {
home: document.getElementById('home'),
publications: document.getElementById('publications')
};

// 类似画册 gallery的文章效果

// 
const scenes = {
home: createScene('Home', 'https://mote-z.github.io/pdf/Home.pdf', ["category_1","category_2"]),
publications: createScene('Publications', 'https://mote-z.github.io/pdf/Publications.pdf', ["category_1","category_2"])
};
let currentScene = scenes.home;
scene.add(currentScene);
loop.render();
loop.start();

function switchScene(sceneName) {
    scene.remove(currentScene);
    currentScene = scenes[sceneName];
    scene.add(currentScene);
    loop.updatables = [];
    loop.updatables.push(currentScene);
    console.log(`Switched to ${sceneName}`);
}

// add event listener
Object.keys(menu).forEach(key => {
    menu[key].addEventListener('click', () => {
        switchScene(key);
    });
});

camera.position.z = 5;