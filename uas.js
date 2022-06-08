"use strict";

// Globals
var canvas;
var gl;

var primitiveType;
var offset = 0;
var count = 36;

var points = [];
var normals = [];

var vertices = [
	vec4(-0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, 0.5, 0.5, 1.0),
	vec4(0.5, 0.5, 0.5, 1.0),
	vec4(0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, -0.5, -0.5, 1.0),
	vec4(-0.5, 0.5, -0.5, 1.0),
	vec4(0.5, 0.5, -0.5, 1.0),
	vec4(0.5, -0.5, -0.5, 1.0)
];




// Interactive settings
// Array of rotation angles (in degrees) for each rotation axis
var theta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var animate = false
var wireframe = false
var shiftViewpoint = false

var settings = {
	count,
	wireframe
}

var angleCam = 0;
var angleFOV = 60;
var fRotationRadians = 0;

// Shader transformation matrices
var modelViewMatrix, projectionMatrix;
var uSamplerLocation;

var cameraMatrix;
var viewMatrix;
var viewProjectionMatrix;

var worldViewProjectionMatrix;
var worldInverseTransposeMatrix;
var worldInverseMatrix;
var worldMatrix;

// Camera globals
var FOV_Radians; //field of view
var aspect; //projection aspect ratio
var zNear; //near view volume
var zFar; //far view volume

var cameraPosition = [0, 50, 300]; //eye/camera coordinates
var defaultCameraPosition = [0, 50, 300];
var viewingModelData;
var UpVector = [0, 1, 0]; //up vector
var fPosition = [0, -5, 0]; //at 

var worldViewProjectionLocation;
var worldInverseTransposeLocation;

var lightWorldPositionLocation;
var worldLocation;

var modelViewMatrixLoc;

// Spotlight globals
// Locations
var shininessLocation;
var viewWorldPositionLocation;
var lightColorLocation;
var specularColorLocation;
var lightDirectionLocation;
var innerLimitLocation;
var outerLimitLocation;

// Defaults
var lightRotationX = 0;
var lightRotationY = 0;
var lightDirection = [0, 0, 1];
var lightPosition;
var innerLimit = 10;
var outerLimit = 20;
var shininess = 150;

// Dirlight globals
var reverseLightDirectionLocation

// Light toggle
var lightType = 0
var lightTypeLocation

// Mesh globals
// Buffers
var vBuffer;
var normalBuffer;
var texCoordBuffer;

// Locations
var positionLocation;
var normalLocation;
var texCoordLocation;

// Models
var sheep = null;
var man = null;
var creeper = null;
var squid = null;
var drill = null;

window.onload = function init() {
	// Check WebGL availability
	canvas = document.getElementById("gl-canvas");

	gl = canvas.getContext('webgl2');
	if (!gl) alert("WebGL 2.0 isn't available");



	//  Configure WebGL
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);



	// Init interaction modules
	initMovementSliders();
	initSpotlightSliders();
	initCameraSliders();

	var angleCamValue = document.getElementById("Cameravalue");
	angleCamValue.innerHTML = angleCam;
	document.getElementById("sliderCam").oninput = function (event) {
		angleCamValue.innerHTML = event.target.value;
		fRotationRadians = degToRad(event.target.value);
	};


	/**
	 * Initial defaults
	 */

	// Camera and Projection
	fRotationRadians = degToRad(0);
	FOV_Radians = degToRad(60);
	aspect = canvas.width / canvas.height;
	zNear = 1;
	zFar = 2000;
	projectionMatrix = m4.perspective(FOV_Radians, aspect, zNear, zFar);

	// Spotlight
	innerLimit = degToRad(10);
	outerLimit = degToRad(20);

	// Other
	primitiveType = gl.TRIANGLES;



	// Shaders
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// Buffers
	vBuffer = gl.createBuffer();
	normalBuffer = gl.createBuffer();
	texCoordBuffer = gl.createBuffer();

	// Attribute locations
	positionLocation = gl.getAttribLocation(program, "a_position");
	normalLocation = gl.getAttribLocation(program, "a_normal");
	texCoordLocation = gl.getAttribLocation(program, "aVertexTextureCoords");

	/**
	 * Uniform Locations
	 */

	// Main
	modelViewMatrixLoc = gl.getUniformLocation(program, "u_modelViewMatrix");
	worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
	worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
	lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
	worldLocation = gl.getUniformLocation(program, "u_world");
	lightTypeLocation = gl.getUniformLocation(program, "u_lightType");
	uSamplerLocation = gl.getUniformLocation(program, 'uSampler');

	// Spotlight
	shininessLocation = gl.getUniformLocation(program, "u_shininess");
	viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
	worldLocation = gl.getUniformLocation(program, "u_world");
	// lightColorLocation = gl.getUniformLocation(program, "u_lightColor");
	// specularColorLocation = gl.getUniformLocation(program, "u_specularColor");
	lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
	innerLimitLocation = gl.getUniformLocation(program, "u_innerLimit");
	outerLimitLocation = gl.getUniformLocation(program, "u_outerLimit");

	// Dirlight
	reverseLightDirectionLocation =  gl.getUniformLocation(program, "u_reverseLightDirection");


	// Place a cube
	colorCube();
	initTexture();

	toggleAnimation();
	render();
}

function initTexture() {
	var texture = gl.createTexture();

	// use texture unit 0
	gl.activeTexture(gl.TEXTURE0 + 0);

	// bind to the TEXTURE_2D bind point of texture unit 0
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		new Uint8Array([0, 0, 255, 255]));

	// Asynchronously load an image
	var image = new Image();
	image.src = "/common/images/creeper.png";
	image.addEventListener('load', function () {
		// Now that the image has loaded make copy it to the texture.
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D);
	});
}

function initSpotlightSliders() {
	document.getElementById("sliderXRotation").oninput = function (event) {
		lightRotationX = event.target.value;
	};

	document.getElementById("sliderYRotation").oninput = function (event) {
		lightRotationY = event.target.value;
	};

	document.getElementById("sliderInner").oninput = function (event) {
		innerLimit = degToRad(event.target.value);
	};

	document.getElementById("sliderOuter").oninput = function (event) {
		outerLimit = degToRad(event.target.value);
	};
}

function initCameraSliders() {
	document.getElementById("sliderCamX").oninput = function (event) {
		defaultCameraPosition[0] = event.target.value;
	};

	document.getElementById("sliderCamY").oninput = function (event) {
		defaultCameraPosition[1] = event.target.value;
	};

	document.getElementById("sliderCamZ").oninput = function (event) {
		defaultCameraPosition[2] = event.target.value;
	};
}

function initMovementSliders() {
	for (let i = 0; i < 35; i++) {
		document.getElementById("slider" + i).oninput = function (event) {
			theta[i] = event.target.value;
		};
	}
}

function uploadData(buffer, loc, size, data) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	gl.vertexAttribPointer(loc, size, gl.FLOAT, true, 0, 0);
	gl.enableVertexAttribArray(loc)
}

function render() {
	let currentTarget = fPosition
	let cameraPosition = defaultCameraPosition
	// Compute the camera's matrix using look at.

	// If is shifting viewpoint, look at a point a few units away from camera origin
	if (shiftViewpoint) {
		let cameraTranslation = viewingModelData.finalPosition
		let target = viewingModelData.finalLookAtPosition
		cameraPosition = [cameraTranslation[0], cameraTranslation[1], cameraTranslation[2]]
		currentTarget = [target[0], target[1], target[2]]
	}

	cameraMatrix = m4.lookAt(cameraPosition, currentTarget, UpVector);

	// Make a view matrix from the camera matrix
	viewMatrix = m4.inverse(cameraMatrix);

	// Compute a view projection matrix
	viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

	worldMatrix = m4.yRotation(fRotationRadians);

	// Multiply the matrices.
	worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
	worldInverseMatrix = m4.inverse(worldMatrix);
	worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

	// Set the matrices
	gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
	gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
	gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

	// set the light direction.
	gl.uniform3fv(lightWorldPositionLocation, [0, 100, 0]);

	// set the light type.
	gl.uniform1i(lightTypeLocation, lightType);

	/**
	 * Spotlight matrices
	 */
	// set the light position.
	lightPosition = [0, 100, 0];
	// gl.uniform3fv(lightWorldPositionLocation, lightPosition);

	// set the camera/view position
	gl.uniform3fv(viewWorldPositionLocation, cameraPosition);

	// set the shininess
	gl.uniform1f(shininessLocation, shininess);

	// set the spotlight uniforms

	// since we don't have a plane like most spotlight examples
	// let's point the spot light at the F
	{
		var lmat = m4.lookAt(lightPosition, fPosition, UpVector);
		lmat = m4.multiply(m4.xRotation(lightRotationX), lmat);
		lmat = m4.multiply(m4.yRotation(lightRotationY), lmat);
		// get the zAxis from the matrix
		// negate it because lookAt looks down the -Z axis
		lightDirection = [-lmat[8], -lmat[9], -lmat[10]];
	}

	gl.uniform3fv(lightDirectionLocation, lightDirection);
	gl.uniform1f(innerLimitLocation, Math.cos(innerLimit));
	gl.uniform1f(outerLimitLocation, Math.cos(outerLimit));

	// Dirlight uniforms
	gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if (animate) {
		for (let i = 0; i < 35; i++) {
			if (i % 3) {
				theta[i] = theta[i] + 0.8 % 360
			} else {
				theta[i] = theta[i] - 0.4 % 360
			}
		}
	}

	// Render world cube
	let worldCubeData = worldCube(1000);
	let worldPoints = worldCubeData[0];
	let worldNormals = worldCubeData[1];
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, m4.identity());
	uploadData(vBuffer, positionLocation, 4, flatten(worldPoints))
	uploadData(normalBuffer, normalLocation, 3, new Float32Array(worldNormals))
	uploadData(texCoordBuffer, texCoordLocation, 2, TEXTCOORDS_CUBE)
	gl.drawArrays(gl.TRIANGLES, 0, 36);

	// Data binding for mesh cube
	uploadData(vBuffer, positionLocation, 4, flatten(points))
	uploadData(normalBuffer, normalLocation, 3, new Float32Array(normals))
	uploadData(texCoordBuffer, texCoordLocation, 2, TEXTCOORDS_CUBE)

	buildModelTrees()
	requestAnimationFrame(render);
}

function radToDeg(r) {
	return r * 180 / Math.PI;
}

function degToRad(d) {
	return d * Math.PI / 180;
}

function quad(a, b, c, d) {
	points.push(vertices[a]);
	points.push(vertices[b]);
	points.push(vertices[c]);
	points.push(vertices[a]);
	points.push(vertices[c]);
	points.push(vertices[d]);
}

function wireQuad(a, b, c, d) {
	points.push(vertices[a]);
	points.push(vertices[b]);
	points.push(vertices[c]);
	points.push(vertices[d]);
	points.push(vertices[a]);
}

function wireCube() {
	wireQuad(1, 0, 3, 2);
	addNormal("F")
	wireQuad(2, 3, 7, 6);
	addNormal("R")
	wireQuad(3, 0, 4, 7);
	addNormal("D")
	wireQuad(6, 5, 1, 2);
	addNormal("U")
	wireQuad(4, 5, 6, 7);
	addNormal("B")
	wireQuad(5, 4, 0, 1);
	addNormal("L")
}

function colorCube() {
	quad(1, 0, 3, 2);
	addNormal("F")
	quad(2, 3, 7, 6);
	addNormal("R")
	quad(3, 0, 4, 7);
	addNormal("D")
	quad(6, 5, 1, 2);
	addNormal("U")
	quad(4, 5, 6, 7);
	addNormal("B")
	quad(5, 4, 0, 1);
	addNormal("L")
}

function worldCube(size) {
	let worldVertices = []
	let worldPoints = []
	let worldNormals = []
	for (let vertex of vertices) {
		worldVertices.push(vec4(vertex[0] * size, vertex[1] * size, vertex[2] * size, vertex[3]))
	}

	const worldQuad = (a, b, c, d) => {
		worldPoints.push(worldVertices[a]);
		worldPoints.push(worldVertices[b]);
		worldPoints.push(worldVertices[c]);
		worldPoints.push(worldVertices[a]);
		worldPoints.push(worldVertices[c]);
		worldPoints.push(worldVertices[d]);
	}

	const worldNormal = (code) => {
		const iterate = (x, y, z) => {
			for (let i = 0; i < 6; i++) {
				worldNormals.push(x, y, z)
			}
		}
		switch (code) {
			case "U":
				iterate(0, 1, 0)
				break
			case "D":
				iterate(0, -1, 0)
				break
			case "F":
				iterate(0, 0, 1)
				break
			case "B":
				iterate(0, 0, -1)
				break
			case "R":
				iterate(1, 0, 0)
				break
			case "L":
				iterate(-1, 0, 0)
				break
			default:
				return
		}
	}

	worldQuad(1, 0, 3, 2);
	worldNormal("B")
	worldQuad(2, 3, 7, 6);
	worldNormal("L")
	worldQuad(3, 0, 4, 7);
	worldNormal("U")
	worldQuad(6, 5, 1, 2);
	worldNormal("D")
	worldQuad(4, 5, 6, 7);
	worldNormal("F")
	worldQuad(5, 4, 0, 1);
	worldNormal("R")

	return [worldPoints, worldNormals]
}

function addNormal(code) {
	const iterate = (x, y, z) => {
		for (let i = 0; i < 6; i++) {
			normals.push(x, y, z)
		}
	}
	switch (code) {
		case "U":
			iterate(0, 1, 0)
			break
		case "D":
			iterate(0, -1, 0)
			break
		case "F":
			iterate(0, 0, 1)
			break
		case "B":
			iterate(0, 0, -1)
			break
		case "R":
			iterate(1, 0, 0)
			break
		case "L":
			iterate(-1, 0, 0)
			break
		default:
			return
	}
}

function buildModelTrees() {
	settings = {
		count,
		wireframe
	}

	sheep = new Tree("body",
		new ModelData(
			[-3, -2, 0],
			[0, 1, 0],
			[theta[0], vec3(0, 1, 0)],
			[4, 3, 4]
		),
		gl,
		modelViewMatrixLoc,
		settings
	)
	sheep.insert("body", "head",
		new ModelData(
			[-3, 2, 0],
			[0, 0, 0],
			[theta[18], vec3(0, 0, 1)],
			[2, 2, 2]
		)
	)
	sheep.insert("body", "left front thigh",
		new ModelData(
			[-1.5, 0.5, 1.5],
			[0, -0.5, 0],
			[theta[1], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	sheep.insert("left front thigh", "left front calf",
		new ModelData(
			[0, -1, 0],
			[0, -0.5, 0],
			[theta[2], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	sheep.insert("body", "right front thigh",
		new ModelData(
			[-1.5, 0.5, -1.5],
			[0, -0.5, 0],
			[theta[3], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	sheep.insert("right front thigh", "right front calf",
		new ModelData(
			[0, -1, 0],
			[0, -0.5, 0],
			[theta[4], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	sheep.insert("body", "left back thigh",
		new ModelData(
			[1.5, 0.5, 1.5],
			[0, -0.5, 0],
			[theta[5], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	sheep.insert("left back thigh", "left back calf",
		new ModelData(
			[0, -1, 0],
			[0, -0.5, 0],
			[theta[6], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	sheep.insert("body", "right back thigh",
		new ModelData(
			[1.5, 0.5, -1.5],
			[0, -0.5, 0],
			[theta[7], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	sheep.insert("right back thigh", "right back calf",
		new ModelData(
			[0, -1, 0],
			[0, -0.5, 0],
			[theta[8], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)
	man = new Tree("body",
		new ModelData(
			[5, -2, 0],
			[0, 3.25, 0],
			[theta[9], vec3(0, 1, 0)],
			[2, 3.5, 1]
		),
		gl,
		modelViewMatrixLoc,
		settings
	)
	man.insert("body", "head",
		new ModelData(
			[0, 5, 0],
			[0, 1, 0],
			[theta[19], vec3(0, 1, 0)],
			[2, 2, 2]
		)
	)
	man.insert("head", "camera",
		new ModelData(
			[0, 1.5, 0],
			[0, 1, 0],
			[0, vec3(0, 1, 0)],
			[0, 0, 0]
		),
		true
	)
	man.insert("body", "left upper arm",
		new ModelData(
			[-1, 5, 0],
			[-0.5, -1, 0],
			[theta[10], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)

	man.insert("left upper arm", "left lower arm",
		new ModelData(
			[-1, -2, 0],
			[0.5, -1, 0],
			[theta[11], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)

	man.insert("body", "right upper arm",
		new ModelData(
			[1, 5, 0],
			[0.5, -1, 0],
			[theta[12], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)

	man.insert("right upper arm", "right lower arm",
		new ModelData(
			[1, -2, 0],
			[-0.5, -1, 0],
			[theta[13], vec3(0, 0, 1)],
			[1, 2, 1]
		)
	)

	man.insert("body", "left thigh",
		new ModelData(
			[-0.5, 2, 0],
			[0, -1, 0],
			[theta[14], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	man.insert("left thigh", "left calf",
		new ModelData(
			[0, -2, 0],
			[0, -1, 0],
			[theta[15], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	man.insert("body", "right thigh",
		new ModelData(
			[0.5, 2, 0],
			[0, -1, 0],
			[theta[16], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	man.insert("right thigh", "right calf",
		new ModelData(
			[0, -2, 0],
			[0, -1, 0],
			[theta[17], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	creeper = new Tree("body",
		new ModelData(
			[-15, -2, 0],
			[0, 3.25, 0],
			[theta[20], vec3(0, 1, 0)],
			[2, 3.5, 1]
		),
		gl,
		modelViewMatrixLoc,
		settings
	)
	creeper.insert("body", "head",
		new ModelData(
			[0, 5, 0],
			[0, 1, 0],
			[theta[25], vec3(0, 1, 0)],
			[2, 2, 2]
		)
	)
	creeper.insert("body", "left front leg",
		new ModelData(
			[-0.5, 2, 0],
			[0, -1, 1],
			[theta[21], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	creeper.insert("body", "left back leg",
		new ModelData(
			[-0.5, 2, 0],
			[0, -1, -1],
			[theta[22], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	creeper.insert("body", "right front leg",
		new ModelData(
			[0.5, 2, 0],
			[0, -1, 1],
			[theta[23], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	creeper.insert("body", "right back leg",
		new ModelData(
			[0.5, 2, 0],
			[0, -1, -1],
			[theta[24], vec3(1, 0, 0)],
			[1, 2, 1]
		)
	)

	squid = new Tree("body",
		new ModelData(
			[-15, 2, -10],
			[0, 3.25, 0],
			[theta[26], vec3(0, 1, 0)],
			[3, 4, 3]
		),
		gl,
		modelViewMatrixLoc,
		settings
	)

	squid.insert("body", "left front leg",
		new ModelData(
			[-1, 2, 0],
			[0, -3.5, 1],
			[theta[27], vec3(1, 0, 0)],
			[1, 7, 1]
		)
	)

	squid.insert("body", "left back leg",
		new ModelData(
			[-1, 2, 0],
			[0, -3.5, -1],
			[theta[28], vec3(1, 0, 0)],
			[1, 7, 1]
		)
	)

	squid.insert("body", "right front leg",
		new ModelData(
			[1, 2, 0],
			[0, -3.5, 1],
			[theta[29], vec3(1, 0, 0)],
			[1, 7, 1]
		)
	)

	squid.insert("body", "right back leg",
		new ModelData(
			[1, 2, 0],
			[0, -3.5, -1],
			[theta[30], vec3(1, 0, 0)],
			[1, 7, 1]
		)
	)

	drill = new Tree("body",
		new ModelData(
			[-5, 4, -10],
			[0, 0, 0],
			[theta[31], vec3(1, 0, 0)],
			[7, 7, 7]
		),
		gl,
		modelViewMatrixLoc,
		settings
	)

	drill.insert("body", "smallbody",
		new ModelData(
			[3.5, 0, 0],
			[0, 0, 0],
			[theta[32], vec3(1, 0, 0)],
			[5, 5, 5]
		)
	)

	drill.insert("smallbody", "smallerbody",
		new ModelData(
			[2.5, 0, 0],
			[0, 0, 0],
			[theta[33], vec3(1, 0, 0)],
			[3, 3, 3]
		)
	)

	drill.insert("smallerbody", "smallestbody",
		new ModelData(
			[1.5, 0, 0],
			[0, 0, 0],
			[theta[34], vec3(1, 0, 0)],
			[3, 1, 1]
		)
	)



	let _ = [...sheep.preOrderTraversal()]
	let __ = [...man.preOrderTraversal()]
	let ___ = [...creeper.preOrderTraversal()]
	let ____ = [...squid.preOrderTraversal()]
	let _____ = [...drill.preOrderTraversal()]

	// Get camera
	viewingModelData = __[2]
}

function toggleAnimation() {
	theta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let sliders = document.getElementsByTagName("input")
	for (let slider of sliders) {
		if (!/slider(?![0-9])/.test(slider.id)) {
			slider.value = 0
			slider.disabled = !slider.disabled
		}
	}
	animate = !animate
}

function toggleViewpoint() {
	shiftViewpoint = !shiftViewpoint
	let sliders = document.getElementsByTagName("input")
	for (let slider of sliders) {
		if (slider.id.startsWith('sliderCam')) {
			if (slider.id == "sliderCamY") {
				slider.value = 50
			} else if (slider.id == "sliderCamZ") {
				slider.value = 300
			} else {
				slider.value = 0
			}
			slider.disabled = !slider.disabled
			let val = document.getElementById("Cameravalue")
			fRotationRadians = 0;
			val.innerHTML = 0
		}
	}
}

function toggleRenderingMode() {
	wireframe = !wireframe
}

function changeLightType() {
	lightType += 1
	if (lightType > 3) {
		lightType = 0
	}

	let lightTypes = [
		"ALL",
		"DIR",
		"POINT",
		"SPOT"
	]
	let span = document.getElementById("light")
	span.innerHTML = lightTypes[lightType]
}