import { THREE } from './app.js'
import { MeshSet, Line } from './geo.js';

export function ray_demo(scene, options) {
    let meshes = MeshSet(scene);
    let { line, setPos } = Line(scene);
    meshes.add(line);
    line.material.setValues({ color: 0xffff00 });


    let plane = meshes.create(6);
    plane.material.setValues({ color: 0x333333 });
    plane.material.side = THREE.DoubleSide;
    plane.receiveShadow = true;
    plane.position.set(0, -0.5, 0);
    plane.rotation.x = -Math.PI / 3;

    /////////////////////////////////////////////////
    /// Laser & Raycaster
    let raycaster = new THREE.Raycaster();

    // for matrix de-composition
    let position = new THREE.Vector3();
    let quaternion = new THREE.Quaternion();
    let scale = new THREE.Vector3();

    let direction = new THREE.Vector3();
    let rayEnd = new THREE.Vector3();

    const MAX_RANDOM = 2;
    function RND() {
        return Math.random() * MAX_RANDOM - (MAX_RANDOM / 2);
    }

    let array_of_objects = [];
    for (let i = 0; i < 30; ++i) {
        let box = meshes.create(0);
        box.castShadow = true;
        box.matrixAutoUpdate = false;
        box.position.set(RND(), RND(), RND());
        box.updateMatrix();
        array_of_objects.push(box);
    }

    let raylength = 5;
    function update_laser(cursor) {
        cursor.matrix.decompose(position, quaternion, scale);
        setPos(0, position);
        direction.set(0, 0, -1);
        direction.applyQuaternion(quaternion);
        raycaster.set(position, direction);
        let intersects = raycaster.intersectObjects(array_of_objects);
        if (intersects.length > 0) {
            setPos(1, intersects[0].point);
            raylength = intersects[0].distance;
            return intersects[0].object;
        } else {
            raylength = 5;
            rayEnd.addVectors(position, direction.multiplyScalar(raylength));
            setPos(1, rayEnd);
        }
    }

    function grabbed_laser(cursor) {
        cursor.matrix.decompose(position, quaternion, scale);
        setPos(0, position);
        direction.set(0, 0, -1);
        direction.applyQuaternion(quaternion);
        rayEnd.addVectors(position, direction.multiplyScalar(raylength));
        setPos(1, rayEnd);
    }
    /////////////////////////////////////////////////
    /// Grabbing
    let inverse = new THREE.Matrix4(),
        currentMatrix,
        initialGrabbed, hitObject,
        validGrabMatrix = false;


    function grabbing(cursor, hitObject, is_grabbed) {
        if (hitObject && is_grabbed) {
            if (validGrabMatrix) {
                currentMatrix = initialGrabbed.clone(); // Ti-1 * Li
                currentMatrix.premultiply(cursor.matrix); // Ln = Tn * Ti-1 * Li
                hitObject.matrix.copy(currentMatrix); // Ln LKS des zu bewegenden Obj.
            } else {
                inverse.copy(cursor.matrix).invert(); // Ti-1
                initialGrabbed = hitObject.matrix.clone(); // Li
                initialGrabbed.premultiply(inverse); // Ti-1 * Li
                validGrabMatrix = true;
            }
        } else {
            validGrabMatrix = false;
        }
    }

    meshes.update = function (time, options) {
        if (hitObject && options.is_grabbed) {
            grabbed_laser(options.cursor);
        } else {
            hitObject = update_laser(options.cursor);
        }
        grabbing(options.cursor, hitObject, options.is_grabbed)
    }
    return meshes;
}
