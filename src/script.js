import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import CANNON from 'cannon'

const gui = new dat.GUI()
const debugObject = {};

let count = 0;

const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({})
)
sphere.position.y = 15
sphere.position.x = 10
scene.add(sphere)

/*const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4
    })
);
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor);
*/

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const createSphere = (radius, position) => {
    console.log('test pos: ' + position);
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 20, 20),
        new THREE.MeshStandardMaterial()
    )

    mesh.position.set(position.x, position.y, position.z);
    scene.add(mesh);
    return mesh;
}

const objectsToUpdate = [];

const world = new CANNON.World();

var Nx = 50;
var Ny = 50;

var particles = [];

const sphereShape = new CANNON.Sphere(0.5);
const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(10,15,0),
    shape: sphereShape
})

const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
defaultMaterial,
defaultMaterial,
{
    friction: 0.1,
    restitution: 0.7
}
)

/*const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
    material: defaultMaterial
});
*/


function initCannon(){
    



    world.addBody(sphereBody)

    //floorBody.mass = 1;
    //floorBody.addShape(floorShape)
    //floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5);

    world.addContactMaterial(defaultContactMaterial)

    //world.addBody(floorBody);

    world.gravity.set(0, -0.982, 0);

    for (var i = 0, il = Nx + 1; i !== il; i++ ){
        particles.push([]);
        for (var j = 0, jl = Ny + 1; j !== jl; j++){
            var particle = new CANNON.Body({
                material: defaultMaterial,
                mass: 0,
                position: new CANNON.Vec3(i, 3, j),
                shape: sphereShape
            });

            particles[i].push(particle);
            world.addBody(particle);

            const mesh = createSphere(0.5, {x: particle.position.x, y: particle.position.y, z: particle.position.z});
            
            objectsToUpdate.push({
                mesh: mesh,
                body: particle
            })
        }
    }
}
var waveWidth = 20;
var waveHeight = 10;
var waveSpeed = 2;
const waveCheck = (elapsed) => {
    
    var delta = clock.getDelta();
    //var elapsed = clock.getElapsedTime();

    for(var i = 0; i < objectsToUpdate.length; i++){
        objectsToUpdate[i].body.position.y = Math.cos( (elapsed + (objectsToUpdate[i].body.position.x / waveWidth) + (objectsToUpdate[i].body.position.z / waveWidth)) * waveSpeed) * waveHeight;
    }
}

const clock = new THREE.Clock()
let oldElapsedTime = 0;

var waveElv = 0.01;
var waveFre = new THREE.Vector2(2, 0.75);
var waveSpeed = 0.75;

const tick = () =>
{
    const elapsed = clock.getElapsedTime();
    const deltaTime = elapsed - oldElapsedTime;
    oldElapsedTime = elapsed;

    world.step(1 / 60, deltaTime, 3)
    //waveCheck(elapsedTime);
    sphere.position.copy(sphereBody.position)
    //floor.position.copy(floorBody.position);
    for(var i = 0; i < objectsToUpdate.length; i++){

        objectsToUpdate[i].body.position.y += (Math.sin(objectsToUpdate[i].body.position.x * waveFre.x + elapsed * waveSpeed) + Math.sin(objectsToUpdate[i].body.position.z * waveFre.y + elapsed * waveSpeed)) * waveElv;
        
    };    
    for(const object of objectsToUpdate)
    {
        //object.body.applyForce(new CANNON.Vec3(- 0.5, 0, 0), object.body.position)
        
        object.mesh.position.copy(object.body.position);
    }
    //particleCheck();
    //particleWave();
    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}
initCannon();
//createCheckSphere();
//waveCheck();
//particleCheck();
tick();