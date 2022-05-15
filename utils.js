
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
}

class ModelData {
    constructor(origin, offset, rot, dim) {
        this.modelView = origin;
        this.origin = origin;
        this.offset = offset;
        this.rot = rot;
        this.dim = dim;
        this.built = false;
    }


}

class Tree {
    constructor(key, value = key, gl, loc) {
        this.root = new TreeNode(key, value);
        this.gl = gl;
        this.loc= loc;
    }

    makeMesh(node) {
        var dim = node.value.dim
        var s = scale(dim[0], dim[1], dim[2]);

        if(node.parent != null){
          node.value.modelView = mult(node.parent.value.modelView, node.value.modelView)
        }

        node.value.modelView = mult(node.value.modelView, node.value.rot);
        
        var instanceMatrix = mult(node.value.offset, s);
        // instanceMatrix = mult(node.origin, instanceMatrix);
    
        var t = mult(node.value.modelView, instanceMatrix);
        this.gl.uniformMatrix4fv(this.loc,  false, flatten(t) );

        // 36 for cubes
        this.gl.drawArrays( this.gl.TRIANGLES, 0, 36);
    }
    

    *preOrderTraversal(node = this.root) {
        yield node;  
        if(!node.built){
            this.makeMesh(node)
            node.built = true;
        }
        if (node.children.length) {
            for (let child of node.children) {
                yield* this.preOrderTraversal(child);
            }
        }
        
    }

    insert(parentNodeKey, key, value = key) {
        for (let node of this.preOrderTraversal()) {
            if (node.key === parentNodeKey) {
                node.children.push(new TreeNode(key, value, node));
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