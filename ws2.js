"use strict";

var canvas;
var gl;

var primitiveType;
var offset = 0;
var count = 36;

var points = [];
var normals = [];
var colors = [];

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

// RGBA colors
var vertexColors = [
	vec4(0.0, 0.0, 0.0, 1.0),  // black
	vec4(1.0, 0.0, 0.0, 1.0),  // red
	vec4(1.0, 1.0, 0.0, 1.0),  // yellow
	vec4(0.0, 1.0, 0.0, 1.0),  // green
	vec4(0.0, 0.0, 1.0, 1.0),  // blue
	vec4(1.0, 0.0, 1.0, 1.0),  // magenta
	vec4(1.0, 1.0, 1.0, 1.0),  // white
	vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

// Shader transformation matrices
var modelViewMatrix, projectionMatrix;
var uSamplerLocation;
// Array of rotation angles (in degrees) for each rotation axis
var theta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var animate = false

var angleCam = 0;
var angleFOV = 60;
var fRotationRadians = 0;

var cameraMatrix;
var viewMatrix;
var viewProjectionMatrix;

var worldViewProjectionMatrix;
var worldInverseTransposeMatrix;
var worldInverseMatrix;
var worldMatrix;

var FOV_Radians; //field of view
var aspect; //projection aspect ratio
var zNear; //near view volume
var zFar;  //far view volume

var cameraPosition = [100, 110, 200]; //eye/camera coordinates
var UpVector = [0, 1, 0]; //up vector
var fPosition = [0, -5, 0]; //at 

var worldViewProjectionLocation;
var worldInverseTransposeLocation;

var lightWorldPositionLocation;
var worldLocation;

var modelViewMatrixLoc;

// Buffers
var vBuffer, cBuffer;

// Models
var sheep = null;
var man = null;
var creeper = null;
window.onload = function init() {

	canvas = document.getElementById("gl-canvas");

	gl = canvas.getContext('webgl2');
	if (!gl) alert("WebGL 2.0 isn't available");

	//  Configure WebGL

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);


	gl.enable(gl.CULL_FACE); //enable depth buffer
	gl.enable(gl.DEPTH_TEST);

	//initial default

	fRotationRadians = degToRad(0);
	FOV_Radians = degToRad(60);
	aspect = canvas.width / canvas.height;
	zNear = 1;
	zFar = 2000;

	projectionMatrix = m4.perspective(FOV_Radians, aspect, zNear, zFar); //setup perspective viewing volume

	colorCube();

	//  Load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// Load the data into the GPU

	worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
	worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
	lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
	worldLocation = gl.getUniformLocation(program, "u_world");
	uSamplerLocation = gl.getUniformLocation(program, 'uSampler');


	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	console.log(flatten(points))
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	var positionLocation = gl.getAttribLocation(program, "a_position");
	gl.vertexAttribPointer(positionLocation, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLocation);

	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var colorLoc = gl.getAttribLocation(program, "a_color");
	gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(colorLoc);

	var normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	var normalLocation = gl.getAttribLocation(program, "a_normal");
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(normalLocation);

	var texCoordLocation = gl.getAttribLocation(program, "aVertexTextureCoords");
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, true, 0, 0);
	gl.enableVertexAttribArray(texCoordLocation);

	var texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	setTexcoords(gl);

	var texture = gl.createTexture();

	// use texture unit 0
	gl.activeTexture(gl.TEXTURE0 + 0);

	// bind to the TEXTURE_2D bind point of texture unit 0
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		new Uint8Array([0, 0, 255, 255]));

	// Asynchronously load an image
	var image = new Image();
	image.src = "/common/images/kentashap.jpg";
	image.addEventListener('load', function () {
		// Now that the image has loaded make copy it to the texture.
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D);
	});

	initSliders();

	// Associate out shader variables with our data buffer
	modelViewMatrixLoc = gl.getUniformLocation(program, "u_modelViewMatrix");

	//update FOV
	var angleCamValue = document.getElementById("Cameravalue");
	angleCamValue.innerHTML = angleCam;
	document.getElementById("sliderCam").oninput = function (event) {
		angleCamValue.innerHTML = event.target.value;
		fRotationRadians = degToRad(event.target.value);
	};

	primitiveType = gl.TRIANGLES;
	render(); //default render
}

function initSliders() {
	for (let i = 0; i < 20; i++) {
		document.getElementById("slider" + i).oninput = function (event) {
			theta[i] = event.target.value;
		};
	}
}

function render() {
	// Compute the camera's matrix using look at.
	cameraMatrix = m4.lookAt(cameraPosition, fPosition, UpVector);

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
	gl.uniform3fv(lightWorldPositionLocation, [20, 30, 60]);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if (animate) {
		for (let i = 0; i < 20; i++) {
			if (i % 3) {
				theta[i] = theta[i] + 0.8 % 360
			} else {
				theta[i] = theta[i] - 0.4 % 360
			}
		}
	}

	buildModelTrees()
	gl.drawArrays(primitiveType, offset, count);
	requestAnimationFrame(render);
}

function radToDeg(r) {
	return r * 180 / Math.PI;
}

function degToRad(d) {
	return d * Math.PI / 180;
}

function quad(a, b, c, d) {
	colors.push(vertexColors[a]);
	points.push(vertices[a]);
	colors.push(vertexColors[a]);
	points.push(vertices[b]);
	colors.push(vertexColors[a]);
	points.push(vertices[c]);
	colors.push(vertexColors[a]);
	points.push(vertices[a]);
	colors.push(vertexColors[a]);
	points.push(vertices[c]);
	colors.push(vertexColors[a]);
	points.push(vertices[d]);
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

function setTexcoords(gl) {
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([
			// front
			0, 0,
			0, 1,
			1, 0,
			0, 1,
			1, 1,
			1, 0,

			// right
			0, 0,
			1, 1,
			0, 1,
			0, 0,
			1, 0,
			1, 1,

			// bottom
			0, 0,
			0, 1,
			1, 1,
			0, 0,
			1, 1,
			1, 0,

			// top
			0, 0,
			1, 0,
			1, 1,
			0, 0,
			1, 1,
			0, 1,

			// back
			0, 0,
			1, 0,
			0, 1,
			0, 1,
			1, 0,
			1, 1,

			// left
			0, 0,
			0, 1,
			1, 1,
			0, 0,
			1, 1,
			1, 0,
		]),
		gl.STATIC_DRAW);
}

function buildModelTrees() {
	sheep = new Tree("body",
		new ModelData(
			[-3, -2, 0],
			[0, 1, 0],
			[theta[0], vec3(0, 1, 0)],
			[4, 3, 4]
		),
		gl,
		modelViewMatrixLoc
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
		modelViewMatrixLoc
	)
	man.insert("body", "head",
		new ModelData(
			[0, 5, 0],
			[0, 1, 0],
			[theta[19], vec3(0, 1, 0)],
			[2, 2, 2]
		)
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
		modelViewMatrixLoc
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

	let _ = [...sheep.preOrderTraversal()]
	let __ = [...man.preOrderTraversal()]
	let ___ = [...creeper.preOrderTraversal()]
}

function toggleAnimation() {
	theta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let sliders = document.getElementsByTagName("input")
	for (let slider of sliders) {
		slider.value = 0
		slider.disabled = !slider.disabled
	}
	animate = !animate
}
