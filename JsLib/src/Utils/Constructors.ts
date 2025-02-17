import { ObjectLookup } from '../Utils/ObjectLookup';
import { MeshBuilder } from '../Builders/MeshBuilder';

import {
    AnimationMixer,
    Object3D,
    Event as ThreeEvent,
    Group,
    BoxGeometry,
    CylinderGeometry,
    MeshBasicMaterial,
    MeshPhongMaterial,
    Mesh,
    Scene,
    Box3,
    Vector3,
    Quaternion,
} from 'three';

//import { Text } from 'three-mesh-ui';
import { Text } from 'troika-three-text';
import { LightBuilder } from '../Builders/LightBuilder';
import { Transforms } from './Transforms';

import { Loaders } from '../Viewer/Loaders';


export class FactoryClass {
    
    private makers = new Map<string, Function>();
    private destroyers = new Map<string, Function>();

    public constructor() {
        
        this.makers.set('AmbientLight', LightBuilder.BuildAmbientLight);
        this.makers.set('PointLight', LightBuilder.BuildPointLight);
        this.makers.set('Mesh3D', this.establish3DGeometry.bind(this));
        this.makers.set('Model3D', this.establish3DModel.bind(this));
        this.makers.set('Text3D', this.establish3DLabel.bind(this));
        //this.makers.set('Group3D', this.establish3DGroup.bind(this));
        //this.makers.set('PanelMenu3D', this.establish3DMenu.bind(this));

        this.destroyers.set('Mesh3D', this.destroy3DGeometry.bind(this));
        this.destroyers.set('Model3D', this.destroy3DModel.bind(this));
        this.destroyers.set('Text3D', this.destroy3DLabel.bind(this));
    }

    private LoadedObjectComplete(uuid: string) {
        DotNet.invokeMethodAsync('BlazorThreeJS', 'LoadedObjectComplete', uuid);
    }

   public establish3DGeometry(options: any, parent: Object3D): Object3D | null {

        const guid = options.uuid;

        var entity = ObjectLookup.findPrimitive(guid) as Mesh;
        var exist = Boolean(entity)
        if ( !exist ) 
        {
            const result = MeshBuilder.CreateMesh(options);
            ObjectLookup.addMaterial(guid, result.material);
            ObjectLookup.addGeometry(guid, result.geometry);
            ObjectLookup.addPrimitive(guid, result.mesh);

            entity = result.mesh;
            //console.log('Mesh Created', entity);
            parent.add(entity);
        }

        //MeshBuilder.ApplyMeshMaterial(options, entity);
        MeshBuilder.ApplyMeshTransform(options, entity);

        this.establish3DChildren(options, entity);

        if ( options.geometry.type === 'BoundaryGeometry' )
        {
            const box = new Box3().setFromObject(entity);
            const size = box.getSize(new Vector3());
            var mesh = entity as Mesh;
            var geom = mesh.geometry as BoxGeometry;
            geom.parameters.width = size.x;
            geom.parameters.height = size.y;
            geom.parameters.depth = size.z;

            console.log('BoundaryGeometry is sized to fit the children', geom);
        }


        if ( !exist && parent.type === 'Scene' )
        {
            this.LoadedObjectComplete(guid);
            console.log('Geometry Added to Scene', entity);
        }
        return entity;
    }

    public destroy3DGeometry(options: any, parent: Object3D, scene : Scene) {

        const guid = options.uuid;

        var entity = ObjectLookup.findPrimitive(guid) as Object3D;
        var exist = Boolean(entity)
        if ( !exist )
            return;


        ObjectLookup.deletePrimitive(guid);
        this.destroy3DChildren(options, entity, scene);
        parent.remove(entity);
    }


    private establish3DLabel(options: any, parent: Object3D): Text | null {
        console.log('establish3DLabel modelOptions=', options, parent);

        const guid = options.uuid;

        var entity = ObjectLookup.findLabel(guid) as Text;
        var exist = Boolean(entity)
        if (!exist) {
            entity = new Text();
            entity.uuid = guid;
            ObjectLookup.addLabel(guid, entity);
            parent.add(entity);
        }

        entity.text = options.text;
        entity.color = options.color;
        entity.opacity = options.opacity;
        entity.fontSize = options.fontSize;
        entity.textAlign = options.textAlign; // "left", "center", "right", "justify"
        entity.anchorX = options.anchorX; // "left", "center", "right"
        entity.anchorY = options.anchorY; // "top", "middle", "bottom"
        entity.maxWidth = options.maxWidth;
        entity.lineHeight = options.lineHeight;

        //Transforms.setTransform(entity, options.transform);
        if (Boolean(options.transform)) {
            const { position: pos } = options.transform;
            entity.position.x = pos.x;
            entity.position.y = pos.y;
            entity.position.z = pos.z;
        }

        // Update the rendering:
        entity.sync();

        console.log('Text establish3DLabel', entity);

        //MeshBuilder.ApplyMeshTransform(options, entity);
        this.establish3DChildren(options, entity);

        if (!exist && parent.type === 'Scene') {
            this.LoadedObjectComplete(guid);
            //console.log('Text Added to Scene', entity);
        }
        return entity;
    }

    private destroy3DLabel(options: any, parent: Object3D, scene: Scene) {
        //console.log('destroy3DLabel modelOptions=', options);

        const guid = options.uuid;

        var entity = ObjectLookup.findLabel(guid) as Text;
        var exist = Boolean(entity)
        if ( !exist ) 
            return;

        ObjectLookup.deleteLabel(guid);
        this.destroy3DChildren(options, entity, scene);
        parent.remove(entity);
    }


    public establish3DModel(options: any, parent: Object3D) {
        ////console.log('establish3DModel modelOptions=', options);
        
        var model = ObjectLookup.findModel(options.uuid) as Group;
        if (Boolean(model)) {
            Transforms.setTransform(model, options.transform);

            this.establish3DChildren(options, model);
            return;
        }


        //if you have this glrf resource then just clone 

        const loaders = new Loaders();
        loaders.import3DModel(options, (gltf, item) => {
            //console.log('Model Added to Scene', item);

            parent.add(item);
            ObjectLookup.addModel(item.uuid, item);

            Transforms.setTransform(item, options.transform);
            this.establish3DChildren(options, item);
            //this.addDebuggerWindow(url, group);
            if ( parent.type === 'Scene' )
            {
                this.LoadedObjectComplete(item.uuid);
            }
        })
    }

    public destroy3DModel(options: any, parent: Object3D, scene: Scene) {
        ////console.log('destroy3DModel modelOptions=', options);
        const guid = options.uuid;

        var model = ObjectLookup.findModel(guid) as Group;
        if ( !Boolean(model) )
            return;

        ObjectLookup.deleteModel(guid);
        this.destroy3DChildren(options, model, scene);
        parent.remove(model);
    }

    public establish3DHitBoundary(guid: string): any 
    {
        var entity = ObjectLookup.findAny(guid);
        var exist = Boolean(entity)
        if ( !exist ) {
            //console.log('UUID NOT FOUND guid=', guid);
            return;
        }

        entity.updateMatrixWorld(true);

        const gPosition = entity.getWorldPosition(new Vector3());
        const gQuaternion = entity.getWorldQuaternion(new Quaternion());
        //const gScale = entity.getWorldScale(new Vector3());

        const box = new Box3().setFromObject(entity, true);
        const size = box.getSize(new Vector3());

        var boundary = {
            uuid: guid,
            name: entity.name,
            x: gPosition.x,
            y: gPosition.y,
            z: gPosition.z,
            qx: gQuaternion.x,
            qy: gQuaternion.y,
            qz: gQuaternion.z,
            qw: gQuaternion.w,
            width: size.x,
            height: size.y,
            depth: size.z,  
        }

        ////console.log('Boundary Computed!', boundary);
        return boundary;
   
    }

    //can we be smart here and call the correct method based on the type of object we are adding?
    public establish3DChildren(options: any, parent: Object3D) 
    {
        ////console.log('establish3DChildren options=', options);
        var members = options.children;
        for (let index = 0; index < members.length; index++) {
            
            const element = members[index];
            ////console.log('establish3DChildren element.type=', element.type, element);
            ////console.log('establish3DChildren element=', index, element);
            
            try {
                var funct = this.makers.get(element.type);
                if (funct) 
                    funct(element, parent);
                else
                    console.log('No Constructor for', element.type);
                
            } catch (error) {
                console.log('Error in establish3DChildren', error);
            }
        }    
    }

    public removeFromSceneByUuid(scene: Scene, uuid: string):boolean {
        let obj = scene.getObjectByProperty('uuid', uuid);
        if (obj) {
            scene.remove(obj);
            return true;
        }
        return false
    }

    public destroy3DChildren(options: any, parent: Object3D, scene: Scene) 
    {
        //console.log('destroy3DChildren options=', options);
        var members = options.children;
        for (let index = 0; index < members.length; index++) {
            
            const element = members[index];
            var uuid = element.uuid;

            console.log('destroy3DChildren element.type=', element.type, uuid, element);
            //console.log('destroy3DChildren element=', index, element);

            try {
                var funct = this.destroyers.get(element.type);
                if (funct) 
                    funct(element, parent, scene);
                else
                    console.log('No Deconstructor for', element.type);

                if (this.removeFromSceneByUuid(scene, uuid)) {
                    console.log('destroy3DChildren', uuid);
                }
                
            } catch (error) {
                console.log('Error in destroy3DChildren', error);
            }
        }    
    }

}

export const Constructors = new FactoryClass();
