import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry';
import { Loaders } from './Loaders';
import { ObjectLookup } from '../Utils/ObjectLookup';
import { SceneBuilder } from '../Builders/SceneBuilder';
import { CameraBuilder } from '../Builders/CameraBuilder';
import { Transforms } from '../Utils/Transforms';
import { Text } from 'troika-three-text';
import { MeshBuilder } from '../Builders/MeshBuilder';
import {
    AnimationMixer,
    Clock,
    Color,
    GridHelper,
    LineBasicMaterial,
    LineSegments,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
    Event as ThreeEvent,
} from 'three';


import ThreeMeshUI from 'three-mesh-ui';
import { MenuBuilder } from '../Builders/MenuBuilder';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Viewer3D {
    private options: any;
    private container: any;
    private settings: any;
    private webGLRenderer: WebGLRenderer;
    private scene: Scene;
    private camera: OrthographicCamera | PerspectiveCamera;
    private controls: OrbitControls;
    private mouse: Vector2 = new Vector2();
    private raycaster: Raycaster = new Raycaster();
    private uiElementSelectState = false;
    private lastSelectedGuid = null;
    private animationMixers: Array<AnimationMixer> = [];
    private clock: Clock;

    private INTERSECTED: any = null;
    private HasLoaded = false;
    public AnimationRequest: any = null;

    private LoadedObjectComplete(uuid: string) {
        DotNet.invokeMethodAsync('BlazorThreeJS', 'LoadedObjectComplete', uuid);
    }

    public Initialize3DViewer(spec: string) {
        if ( this.HasLoaded ) return;
        this.HasLoaded = true;

        console.log('In Initialize3DViewer');

        const options = JSON.parse(spec);
        this.clock = new Clock();

        this.setListeners();
        this.settings = options.viewerSettings;

        let container = document.getElementById(this.settings.containerId) as HTMLDivElement;

        if (!container) {
            console.warn('Container not found');
            return;
        }

        this.options = options;
        this.container = container;

        this.scene = new Scene();
        this.InitializeScene(this.scene, options);
        this.setCamera();

        this.webGLRenderer = new WebGLRenderer({
            antialias: this.settings.webGLRendererSettings.antialias,
            preserveDrawingBuffer: true
        });

        const requestedWidth = this.settings.width;
        const requestedHeight = this.settings.height;
        if (Boolean(requestedWidth) && Boolean(requestedHeight)) {
            this.webGLRenderer.setSize(requestedWidth, requestedHeight, true);
        }
        else {
            this.webGLRenderer.domElement.style.width = '100%';
            this.webGLRenderer.domElement.style.height = '100%';
        }

        // this.renderer.domElement.onclick = (event) => {
        //     if (this.options.viewerSettings.canSelect == true) {
        //         this.selectObject(event);
        //     }
        //     if (this.options.camera.animateRotationSettings.stopAnimationOnOrbitControlMove == true) {
        //         this.options.camera.animateRotationSettings.animateRotation = false;
        //     }
        // };

        this.container.appendChild(this.webGLRenderer.domElement);

        // this.addTestText('How do we pass text values?');

        this.setOrbitControls();
        this.onResize();


        this.StartAnimation();
        console.log('Exit Initialize3DViewer');
    }

    public InitializeScene(scene: Scene, options: any) {
        // console.log('in setScene this.options=', this.options);
        scene.background = new Color(options.scene.backGroundColor);
        scene.uuid = options.scene.uuid;

        //add the floor
        const grid = new GridHelper(30, 30, 0x848484, 0x848484);
        scene.add(grid);

        // this.addAxes();  we should control this from FoundryBlazor by default
        //this.addRoom();

        if (Boolean(options.scene.children)) {
            options.scene.children.forEach((childOptions: any) => {
                const child = SceneBuilder.BuildPeripherals(this.scene, childOptions);
                if (child) {
                    scene.add(child);
                }
            });
        }
        // Add cached meshes.
        //SceneState.renderToScene(this.scene, this.options);
    }

    //clear out animation
    public Finalize3DViewer() 
    {
        console.log('In Finalize3DViewer');
        this.StopAnimation();
    }

    private RenderJS(self: any) 
    {
        if ( self.AnimationRequest == null ) return;
        // request another animation frame
        try {
            DotNet.invokeMethodAsync('BlazorThreeJS', 'TriggerAnimationFrame');  
            self.AnimationRequest = window.requestAnimationFrame(() => self.RenderJS(self));
            self.render();
        } catch (error) {
            console.log('Error in RenderJS', error); 
        }
    }

    public StartAnimation() {
        console.log('In StartAnimation');
        if (this.AnimationRequest == null)
            this.AnimationRequest = window.requestAnimationFrame(() => {
                this.RenderJS(this);
            });
    }

    public StopAnimation() {
        console.log('In StopAnimation');
        if (this.AnimationRequest != null) 
            window.cancelAnimationFrame(this.AnimationRequest);

        this.AnimationRequest = null;
    }

    public deleteFromScene(uuid: string):boolean {
        let obj = this.scene.getObjectByProperty('uuid', uuid);
        console.log('deleteFromScene obj=', obj);
        if (obj) {
            this.scene.remove(obj);
            return true;
        }
        return false
    }

    private render() {
        ThreeMeshUI.update();
        this.updateUIElements();
        // this.selectObject();

        for (let i = 1, l = this.scene.children.length; i < l; i++) {
            const item = this.scene.children[i];
            if (item.userData.isTextLabel) {
                item.lookAt(this.camera.position);
            }
        }

        var delta = this.clock.getDelta();
        if (Boolean(this.animationMixers.length)) {
            for (const mixer of this.animationMixers) {
                mixer.update(delta);
            }
        }
        this.webGLRenderer.render(this.scene, this.camera);
    }

    private setListeners() {
        window.addEventListener('pointermove', (event: PointerEvent) => {
            let canvas = this.webGLRenderer.domElement;

            this.mouse.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
            this.mouse.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
        });

        window.addEventListener('pointerdown', () => {
            this.selectObject();
            this.uiElementSelectState = true;
        });

        window.addEventListener('pointerup', () => {
            this.uiElementSelectState = false;
        });
    }

    private onResize() {
        // OrthographicCamera does not have aspect property
        if (this.camera.type === 'PerspectiveCamera') {
            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        }

        if (this.camera.type === 'OrthographicCamera' && this.options && this.options.camera) {
            this.camera.left = this.options.camera.left;
            this.camera.right = this.options.camera.right;
            // OrthographicCamera does not have aspect property
            // this.camera.left = this.options.camera.left * this.camera.aspect;
            // this.camera.right = this.options.camera.right * this.camera.aspect;
        }

        this.camera.updateProjectionMatrix();

        this.webGLRenderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight,
            false // required
        );
    }




    //can we be smart here and call the correct method based on the type of object we are adding?
    public updateScene(spec: string) {
        //console.log('inside updateScene spec=', spec);
        const options = JSON.parse(spec);
        //console.log('updateScene sceneOptions=', options);
        this.options.scene = options;

        //var hasChildren = Boolean(options.children);
        //console.log('updateScene hasChildren=', hasChildren);


        var members = options.children;
        for (let index = 0; index < members.length; index++) {
            const element = members[index];

            //console.log('updateScene element.type=', element.type);
            //console.log('updateScene element=', index, element);

            //look for the object in the scene if it exists update it
            //let obj = this.scene.getObjectByProperty('uuid', element.uuid);
            if ( element.type == 'Text3D' ) {
                this.establish3DLabel(element);
            }
            if ( element.type == 'Mesh3D' ) {
                this.establish3DGeometry(element);
            }

        
            //     if (options.type == 'Group') {
            //         return MeshBuilder.CreateMesh(options);
            //     }
            // }
        }

    }

    public setCamera() {
        const builder = new CameraBuilder();
        this.camera = builder.BuildCamera(
            this.options.camera,
            this.container.offsetWidth / this.container.offsetHeight
        );
    }

    public updateCamera(options: string) {
        const newCamera = JSON.parse(options) as OrthographicCamera | PerspectiveCamera;
        this.options.camera = newCamera;
        this.setCamera();
        this.setOrbitControls();
    }

    public showCurrentCameraInfo() {
        console.log('Current camera info:', this.camera);
        console.log('Orbit controls info:', this.controls);
    }

    private setOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.webGLRenderer.domElement);
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = this.options.orbitControls.minDistance;
        this.controls.maxDistance = this.options.orbitControls.maxDistance;
        let { x, y, z } = this.options.camera.lookAt;
        this.controls.target.set(x, y, z);
        this.controls.update();
    }

    private playGltfAnimation(model: GLTF) {
        const animations = model.animations;
        animations?.forEach((animation) => {
            if (Boolean(animation) && Boolean(animation.tracks.length)) {
                const mixer = new AnimationMixer(model.scene);
                this.animationMixers.push(mixer);
                const animationAction = mixer.clipAction(animation);
                animationAction.play();
            }
        });
    }

    public establish3DGeometry(options: any): Object3D | null {

        const guid = options.uuid;

        var entity = ObjectLookup.findPrimitive(guid) as Object3D;
        var exist = Boolean(entity)
        entity = exist ? entity : MeshBuilder.CreateMesh(options);

        MeshBuilder.RefreshMesh(options, entity);

        if ( !exist )
        {
            this.scene.add(entity);
            ObjectLookup.addPrimitive(guid, entity);
            this.LoadedObjectComplete(guid);
            console.log('label Added to Scene', entity);
        }
        return entity;
    }

    public request3DGeometry(spec: string): Object3D | null {
        const options = JSON.parse(spec);
        console.log('request3DGeometry modelOptions=', options);
        var geometry = this.establish3DGeometry(options);
        return geometry;
    }

    private establish3DLabel(options: any): Text | null {
        console.log('establish3DLabel modelOptions=', options);

        const guid = options.uuid;

        var label = ObjectLookup.findLabel(guid) as Text;
        var exist = Boolean(label)
        label = exist ? label : new Text();

        label.uuid = guid;
        label.text = options.text;
        label.color = options.color;
        label.fontSize = options.fontSize;
        label.userData = { isTextLabel: true, };

        const { x, y, z } = options.transform.position  as Vector3;
        label.position.x = x;
        label.position.y = y;
        label.position.z = z;

        // Update the rendering:
        label.sync();
        
        if ( !exist )
        {
            this.scene.add(label);
            ObjectLookup.addLabel(guid, label);
            this.LoadedObjectComplete(guid);
            console.log('label Added to Scene', label);
        }

        return label;
    }

    public request3DLabel(spec: string): Text | null {
        const options = JSON.parse(spec);
        console.log('request3DLabel modelOptions=', options);
        var label = this.establish3DLabel(options);
        return label;
    }

    public request3DModel(spec: string) {
        const options = JSON.parse(spec);
        console.log('request3DModel modelOptions=', options);
        
        const loaders = new Loaders();
        loaders.import3DModel(options, (model: GLTF) => this.playGltfAnimation(model),
            (group) => {
                //this.addDebuggerWindow(url, group);
                this.scene.add(group);
                ObjectLookup.addGroup(group.uuid, group);
                this.LoadedObjectComplete(group.uuid);
                console.log('Group Added to Scene', group);
            })
    }


    public moveObject(object3D: Object3D): boolean {
        const moved = SceneState.moveObject(this.scene, object3D);
        return Boolean(moved);
    }

    public getSceneItemByGuid(guid: string):string {
        let item = this.scene.getObjectByProperty('uuid', guid);
        const json = {
            uuid: item.uuid,
            type: item.type,
            name: item.name,
            children: item.type == 'Group' ? this.iterateGroup(item.children) : [],
        };
        return JSON.stringify(json);
    }

    private iterateGroup(children: any[]) {
        let result = [];
        for (let i = 0; i < children.length; i++) {
            result.push({
                uuid: children[i].uuid,
                type: children[i].type,
                name: children[i].name,
                children: children[i].type == 'Group' ? this.iterateGroup(children[i].children) : [],
            });
        }
        return result;
    }

    private findRootGuid(item: Object3D<ThreeEvent>): Object3D<ThreeEvent> {
        const userData = item.userData;
        if (userData.isGLTFGroup) return item;

        if (item.parent !== null) return this.findRootGuid(item.parent);
        return null;
    }

    private selectObject() {
        let intersect: any = null;

        if (this.mouse.x !== null && this.mouse.y !== null) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            intersect = this.raycast(Array.from(MenuBuilder.elementButtons.values()));
        }

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Ignore object selection if this is a UI element.  UI elements are handled in updateUIElements
        if (intersect && intersect.object.isUI) {
            return;
        } else {
            if (intersects.length === 0) {
                // this.INTERSECTED = null;
                // DotNet.invokeMethodAsync(
                //     'BlazorThreeJS',
                //     'ReceiveSelectedObjectUUID',
                //     this.options.viewerSettings.containerId,
                //     null
                // );
                return;
            }

            this.INTERSECTED = null;
            for (let value of intersects) {
                this.INTERSECTED = this.findRootGuid(value.object);
                if (this.INTERSECTED !== null) break;
            }
            if (Boolean(this.INTERSECTED) && Boolean(this.INTERSECTED.userData)) {
                console.log('this.INTERSECTED=', this.INTERSECTED);
                const size: Vector3 = this.INTERSECTED.userData.size;

                // So a better job SRS  2021-09-29
                //DotNet.invokeMethodAsync('BlazorThreeJS', 'ReceiveSelectedObjectUUID', this.INTERSECTED.uuid, size);
            }
        }
    }

    public setCameraPosition(position: Vector3, lookAt: Vector3) {
        Transforms.setPosition(this.camera, position);
        if (lookAt != null && this.controls && this.controls.target) {
            let { x, y, z } = lookAt;
            this.camera.lookAt(x, y, z);
            this.controls.target.set(x, y, z);
        }
    }

    // private getFirstNonHelper(intersects: any) {
    //     for (let i = 0; i < intersects.length; i++) {
    //         if (!intersects[i].object.type.includes('Helper')) {
    //             return intersects[i].object;
    //         }
    //     }
    //     return null;
    // }



    public clearScene() {
        const self = this;
        // SceneState.clearScene(this.scene, this.options.scene, function onClearScene() {
        //     self.setScene();
        //     self.setOrbitControls();
        // });
    }

    private addRoom() {
        const room = new LineSegments(
            new BoxLineGeometry(30, 30, 30, 30, 30, 30).translate(0, 15, 0),
            new LineBasicMaterial({ color: 0x808080 })
        );
        this.scene.add(room);
    }

    private addFloor() {
        const grid = new GridHelper(30, 30, 0x848484, 0x848484);
        this.scene.add(grid);
    }

    private addAxes() {
        // const axesHelper = new AxesHelper(3);
        // this.scene.add(axesHelper);

        const url = 'assets/fiveMeterAxis.glb';

        const loader = new GLTFLoader();
        loader.loadAsync(url).then((model: GLTF) => {
            this.scene.add(model.scene);
            this.playGltfAnimation(model);
        });
    }

    private onObjectSelected(uuid: string) {
        DotNet.invokeMethodAsync('BlazorThreeJS', 'OnClickButton', this.settings.containerId, uuid);
    }

    private updateUIElements() {
        // Find closest intersecting object
        let intersect: any = null;

        if (this.mouse.x !== null && this.mouse.y !== null) {
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // intersect = this.raycastUIElements();
            intersect = this.raycast(Array.from(MenuBuilder.elementButtons.values()));
        }

        // Update non-targeted buttons state
        MenuBuilder.elementButtons.forEach((obj) => {
            obj['setState']('idle');
        });
        // Update targeted button state (if any)
        if (intersect && intersect.object.isUI) {
            const currentMouseState = this.uiElementSelectState ? 'selected' : 'hovered';
            if (currentMouseState === 'selected') {
                const uuid = intersect.object?.uuid;
                if (uuid !== this.lastSelectedGuid) {
                    this.lastSelectedGuid = uuid;
                    this.onObjectSelected(uuid);
                    setTimeout(() => {
                        this.lastSelectedGuid = null;
                    }, 1000);
                }
            }
            intersect.object.setState(currentMouseState);
        }
    }

    //

    private raycast(items: any[]) {
        return items.reduce((closestIntersection, obj) => {
            const intersection = this.raycaster.intersectObject(obj, true);

            if (!intersection[0]) return closestIntersection;

            if (!closestIntersection || intersection[0].distance < closestIntersection.distance) {
                intersection[0].object = obj;

                return intersection[0];
            }

            return closestIntersection;
        }, null);
    }
}
