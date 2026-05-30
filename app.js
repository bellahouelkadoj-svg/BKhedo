// Facade Designer - Three.js Pure

// Données
const MATERIALS = [
    { id: 'brick', name: 'Brique Rouge', color: '#B22222', price: 120 },
    { id: 'stone', name: 'Pierre Grise', color: '#A9A9A9', price: 200 },
    { id: 'wood', name: 'Bois Clair', color: '#DEB887', price: 180 },
    { id: 'crete', name: 'Crépi Blanc', color: '#F5F5DC', price: 80 },
    { id: 'modern', name: 'Béton Moderne', color: '#505050', price: 150 },
    { id: 'tile', name: 'Carrelage', color: '#CD853F', price: 220 },
];

const ELEMENTS = [
    { id: 'window', name: 'Fenêtre', width: 1.2, height: 1.5, depth: 0.1, color: '#87CEEB', price: 2500 },
    { id: 'door', name: 'Porte', width: 1.0, height: 2.1, depth: 0.1, color: '#8B4513', price: 1800 },
    { id: 'garage', name: 'Porte Garage', width: 2.5, height: 2.2, depth: 0.1, color: '#696969', price: 4500 },
    { id: 'balcony', name: 'Balcon', width: 2.0, height: 1.0, depth: 1.0, color: '#A9A9A9', price: 8000 },
    { id: 'chimney', name: 'Cheminée', width: 0.6, height: 1.5, depth: 0.6, color: '#8B0000', price: 3000 },
];

// Variables globales
let scene, camera, renderer, controls;
let houseGroup, elementsGroup;
let selectedMaterial = 'brick';
let placedElements = [];
let selectedElementId = null;
let showPrices = false;
let totalPrice = 0;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Initialisation
function init() {
    const canvas = document.getElementById('canvas3d');
    const container = canvas.parentElement;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    // Camera
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 1.5, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x6f6f6f, 0x6f6f6f);
    scene.add(gridHelper);

    // House group
    houseGroup = new THREE.Group();
    scene.add(houseGroup);

    elementsGroup = new THREE.Group();
    scene.add(elementsGroup);

    // Build initial house
    buildHouse();

    // Events
    setupEvents();

    // Hide loading
    document.getElementById('loading').style.display = 'none';

    // Start render loop
    animate();
}

function buildHouse() {
    // Clear existing
    while(houseGroup.children.length > 0) {
        houseGroup.remove(houseGroup.children[0]);
    }

    const mat = MATERIALS.find(m => m.id === selectedMaterial);
    const material = new THREE.MeshStandardMaterial({ color: mat.color });

    // Front wall
    const frontWall = new THREE.Mesh(
        new THREE.BoxGeometry(8, 3, 0.3),
        material
    );
    frontWall.position.set(0, 1.5, 0);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    houseGroup.add(frontWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 6),
        material
    );
    leftWall.position.set(-4, 1.5, -3);
    leftWall.castShadow = true;
    houseGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 6),
        material
    );
    rightWall.position.set(4, 1.5, -3);
    rightWall.castShadow = true;
    houseGroup.add(rightWall);

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(8, 3, 0.3),
        material
    );
    backWall.position.set(0, 1.5, -6);
    backWall.castShadow = true;
    houseGroup.add(backWall);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(6, 2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 4.1, -3);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Re-add elements
    placedElements.forEach(el => addElementToScene(el));
}

function addElementToScene(elementData) {
    const geometry = new THREE.BoxGeometry(elementData.width, elementData.height, elementData.depth);
    const material = new THREE.MeshStandardMaterial({ 
        color: elementData.color,
        transparent: elementData.id === 'window',
        opacity: elementData.id === 'window' ? 0.6 : 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(elementData.posX, elementData.posY, elementData.posZ);
    mesh.castShadow = true;
    mesh.userData = { id: elementData.instanceId, type: elementData.id };

    // Selection highlight
    if (selectedElementId === elementData.instanceId) {
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffff00 }));
        mesh.add(line);
    }

    elementsGroup.add(mesh);
}

function addElement(type) {
    const elementDef = ELEMENTS.find(e => e.id === type);
    if (!elementDef) return;

    const newElement = {
        ...elementDef,
        instanceId: Date.now() + Math.random(),
        posX: (Math.random() - 0.5) * 6,
        posY: type === 'chimney' ? 3.5 : (Math.random() * 1.5 + 0.5),
        posZ: type === 'balcony' ? 0.5 : 0.2
    };

    placedElements.push(newElement);
    totalPrice += elementDef.price;

    // Rebuild scene
    rebuildElements();
    updatePrices();
}

function rebuildElements() {
    while(elementsGroup.children.length > 0) {
        elementsGroup.remove(elementsGroup.children[0]);
    }
    placedElements.forEach(el => addElementToScene(el));
}

function selectElement(instanceId) {
    selectedElementId = instanceId;
    rebuildElements();
    document.getElementById('btnDelete').disabled = !instanceId;
}

function deleteSelected() {
    if (selectedElementId) {
        const el = placedElements.find(e => e.instanceId === selectedElementId);
        if (el) totalPrice -= el.price;
        placedElements = placedElements.filter(e => e.instanceId !== selectedElementId);
        selectedElementId = null;
        rebuildElements();
        updatePrices();
        document.getElementById('btnDelete').disabled = true;
    }
}

function togglePrices() {
    showPrices = !showPrices;
    document.getElementById('priceBox').style.display = showPrices ? 'block' : 'none';
    updatePrices();
}

function updatePrices() {
    document.getElementById('elementsPrice').textContent = totalPrice.toLocaleString() + ' DH';
    document.getElementById('totalPrice').textContent = totalPrice.toLocaleString() + ' DH';
}

function exportImage() {
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = 'ma-facade-design.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
}

function resetAll() {
    placedElements = [];
    totalPrice = 0;
    selectedElementId = null;
    rebuildElements();
    updatePrices();
    document.getElementById('btnDelete').disabled = true;
}

function setupEvents() {
    const canvas = document.getElementById('canvas3d');

    // Mouse events for rotation
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            // Rotate camera around center
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 1.5, 0);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const scale = e.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(scale);
        camera.position.clampLength(5, 20);
    });

    // Click to select element
    canvas.addEventListener('click', (e) => {
        if (isDragging) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(elementsGroup.children);

        if (intersects.length > 0) {
            selectElement(intersects[0].object.userData.id);
        } else {
            selectElement(null);
        }
    });

    // Resize
    window.addEventListener('resize', () => {
        const container = canvas.parentElement;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// UI Generation
function generateUI() {
    // Materials
    const materialsDiv = document.getElementById('materials');
    MATERIALS.forEach(mat => {
        const btn = document.createElement('button');
        btn.className = 'material-btn' + (mat.id === selectedMaterial ? ' active' : '');
        btn.innerHTML = `
            <div class="material-color" style="background: ${mat.color}"></div>
            <div>${mat.name}</div>
            ${showPrices ? `<div style="font-size:10px;color:#aaa">${mat.price} DH/m²</div>` : ''}
        `;
        btn.onclick = () => {
            selectedMaterial = mat.id;
            document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            buildHouse();
        };
        materialsDiv.appendChild(btn);
    });

    // Elements
    const elementsDiv = document.getElementById('elements');
    ELEMENTS.forEach(el => {
        const btn = document.createElement('button');
        btn.className = 'element-btn';
        btn.innerHTML = `
            <span>+ ${el.name}</span>
            ${showPrices ? `<span style="color:#e94560;font-size:12px">${el.price} DH</span>` : ''}
        `;
        btn.onclick = () => addElement(el.id);
        elementsDiv.appendChild(btn);
    });
}

// Start
generateUI();
init();
