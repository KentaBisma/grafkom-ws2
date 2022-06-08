
class TreeNode {
    constructor(key, value = key, parent = null) {
        this.key = key;
        this.value = value;
        this.parent = parent;
        this.children = [];
    }

    get isLeaf() {
        return this.children.length === 0;
    }

    get hasChildren() {
        return !this.isLeaf;
    }

    calculateMatrix() {
        var dim = this.value.dim
        var s = scale(
            dim[0],
            dim[1],
            dim[2]);

        if (this.parent != null) {
            this.value.modelView = mult(this.parent.value.modelView, this.value.modelView)
            this.value.localPosition = mult(this.parent.value.localPosition, this.value.localPosition)
            this.value.localRotation = mult(this.parent.value.localRotation, this.value.localRotation)
        }
        this.value.localPosition = mult(this.value.localPosition, this.value.offset)
        this.value.modelView = mult(this.value.modelView, this.value.rot);

        if (this.camera) {
            let mat = mult(this.value.modelView, this.value.offset)
            this.finalLookAtPosition = mult(mat, this.lookAtPosition)
            this.finalPosition = mult(mat, this.cameraPosition)
        }

        var instanceMatrix = mult(this.value.offset, s);

        var t = mult(this.value.modelView, instanceMatrix);
        return {
            t: t,
            localPosition: this.value.localPosition,
            localRotation: this.value.localRotation,
            modelView: this.value.modelView,
        }
    }
}

class ModelData {
    static SCALE_MULTIPLIER = 10
    constructor(origin, offset, rot, dim) {
        // decompose and rescale
        this.modelView = translate(
            origin[0] * ModelData.SCALE_MULTIPLIER,
            origin[1] * ModelData.SCALE_MULTIPLIER,
            origin[2] * ModelData.SCALE_MULTIPLIER,
            );
        this.offset = translate(
            offset[0] * ModelData.SCALE_MULTIPLIER,
            offset[1] * ModelData.SCALE_MULTIPLIER,
            offset[2] * ModelData.SCALE_MULTIPLIER,
            );
        this.rot = rotate(
            rot[0],
            rot[1]
        );
        this.dim = [
            dim[0] * ModelData.SCALE_MULTIPLIER,
            dim[1] * ModelData.SCALE_MULTIPLIER,
            dim[2] * ModelData.SCALE_MULTIPLIER,
        ];
        this.localPosition = this.modelView;
        this.localRotation = this.rot;
        this.built = false;
    }


}

class Tree {
    constructor(key, value = key, gl, loc, settings) {
        this.root = new TreeNode(key, value);
        this.gl = gl;
        this.loc = loc;
        this.settings = settings;
    }

    makeMesh(node) {
        this.gl.uniformMatrix4fv(this.loc, false, flatten(node.calculateMatrix().t));
        let mode = this.settings.wireframe ? this.gl.LINES : this.gl.TRIANGLES;
        this.gl.drawArrays(mode, 0, this.settings.count);
    }


    *preOrderTraversal(node = this.root) {
        yield node;
        if (!node.built) {
            this.makeMesh(node)
            node.built = true;
        }
        if (node.children.length) {
            for (let child of node.children) {
                yield* this.preOrderTraversal(child);
            }
        }

    }

    insert(parentNodeKey, key, value = key, camera = false) {
        for (let node of this.preOrderTraversal()) {
            if (node.key === parentNodeKey) {
                let newNode = new TreeNode(key, value, node)
                if (camera) {
                    newNode.camera = true;
                    newNode.cameraPosition = vec4(0, 30, 0, 1)
                    newNode.finalPosition = vec4(1, 1, 1, 1)
                    newNode.lookAtPosition = vec4(30, 0, 0, 1)
                    newNode.finalLookAtPosition = vec4(1, 1, 1, 1)
                }
                node.children.push(newNode);
                return true;
            }
        }
        return false;
    }

    remove(key) {
        for (let node of this.preOrderTraversal()) {
            const filtered = node.children.filter(c => c.key !== key);
            if (filtered.length !== node.children.length) {
                node.children = filtered;
                return true;
            }
        }
        return false;
    }

    find(key) {
        for (let node of this.preOrderTraversal()) {
            if (node.key === key) return node;
        }
        return undefined;
    }
}