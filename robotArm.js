"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
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


// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT = 5.0;
var BASE_WIDTH = 5.0;
var LOWER_ARM_HEIGHT = 3.0;
var LOWER_ARM_WIDTH = 0.5;
var UPPER_ARM_HEIGHT = 3.0;
var UPPER_ARM_WIDTH = 0.5;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;


var theta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

init();

//----------------------------------------------------------------------------

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
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


//--------------------------------------------------


function init() {

    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    document.getElementById("slider0").onchange = function (event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider1").onchange = function (event) {
        theta[1] = event.target.value;
    };
    document.getElementById("slider2").onchange = function (event) {
        theta[2] = event.target.value;
    };
    document.getElementById("slider3").onchange = function (event) {
        theta[3] = event.target.value;
    };
    document.getElementById("slider4").onchange = function (event) {
        theta[4] = event.target.value;
    };
    document.getElementById("slider5").onchange = function (event) {
        theta[5] = event.target.value;
    };
    document.getElementById("slider6").onchange = function (event) {
        theta[6] = event.target.value;
    };
    document.getElementById("slider7").onchange = function (event) {
        theta[7] = event.target.value;
    };
    document.getElementById("slider8").onchange = function (event) {
        theta[8] = event.target.value;
    };
    document.getElementById("slider9").onchange = function (event) {
        theta[9] = event.target.value;
    };
    document.getElementById("slider10").onchange = function (event) {
        theta[10] = event.target.value;
    };
    document.getElementById("slider11").onchange = function (event) {
        theta[11] = event.target.value;
    };
    document.getElementById("slider12").onchange = function (event) {
        theta[12] = event.target.value;
    };
    document.getElementById("slider13").onchange = function (event) {
        theta[13] = event.target.value;
    };
    document.getElementById("slider14").onchange = function (event) {
        theta[14] = event.target.value;
    };
    document.getElementById("slider15").onchange = function (event) {
        theta[15] = event.target.value;
    };
    document.getElementById("slider16").onchange = function (event) {
        theta[16] = event.target.value;
    };
    document.getElementById("slider17").onchange = function (event) {
        theta[17] = event.target.value;
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    testRender();
    // render();
}

//----------------------------------------------------------------------------


function base(modelViewMatrix) {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    //console.log("s", s);
    var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);
    //var instanceMatrix = mult(s,  translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ));

    //console.log("instanceMatrix", instanceMatrix);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

    //console.log("base", t);
}

//----------------------------------------------------------------------------


function upperArm(modelViewMatrix) {
    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    //console.log("s", s);

    var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);
    //var instanceMatrix = mult(s, translate(  0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ));

    //console.log("instanceMatrix", instanceMatrix);

    var t = mult(modelViewMatrix, instanceMatrix);

    //console.log("upper arm mv", modelViewMatrix);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

    //console.log("upper arm t", t);

}

//----------------------------------------------------------------------------


function lowerArm(modelViewMatrix) {
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

}

//----------------------------------------------------------------------------


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelViewMatrix = rotate(theta[Base], vec3(0, 1, 0));
    base(modelViewMatrix);

    let modelViewMatrix3 = translate(0.25 * BASE_WIDTH, BASE_HEIGHT, 0.0)
    modelViewMatrix3 = mult(modelViewMatrix, modelViewMatrix3);
    modelViewMatrix3 = mult(modelViewMatrix3, rotate(theta[LowerArm], vec3(0, 0, 1)));
    lowerArm(modelViewMatrix3);
    // printm(translate(0.0, BASE_HEIGHT, 0.0));
    // printm(modelViewMatrix);

    let modelViewMatrix2 = translate(-0.25 * BASE_WIDTH, BASE_HEIGHT, 0.0);
    modelViewMatrix2 = mult(modelViewMatrix2, modelViewMatrix);
    modelViewMatrix2 = mult(modelViewMatrix2, rotate(theta[UpperArm], vec3(0, 0, 1)));
    upperArm(modelViewMatrix2);

    //printm(modelViewMatrix);

    requestAnimationFrame(render);
}

function testRender() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var sheep = new Tree("body",
        new ModelData(
            translate(-3, -2, 0),
            translate(0, 1.5, 0),
            rotate(theta[0], vec3(0, 1, 0)),
            [4, 3, 4]
        ),
        gl,
        modelViewMatrixLoc
    )
    sheep.insert("body", "head", 
        new ModelData(
            translate(-3, 1, 0),
            translate(0, 1, 0),
            rotate(0, vec3(0, 0, 1)),
            [2, 2, 2]
            )
    )

    sheep.insert("body", "left front thigh", 
        new ModelData(
            translate(-1.5, 0.5, 1.5),
            translate(0, -0.5, 0),
            rotate(theta[1], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )

    sheep.insert("left front thigh", "left front calf", 
        new ModelData(
            translate(0, -1, 0),
            translate(0, -0.5, 0),
            rotate(theta[2], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )

    sheep.insert("body", "right front thigh", 
        new ModelData(
            translate(-1.5, 0.5, -1.5),
            translate(0, -0.5, 0),
            rotate(theta[3], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )

    sheep.insert("right front thigh", "right front calf", 
        new ModelData(
            translate(0, -1, 0),
            translate(0, -0.5, 0),
            rotate(theta[4], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )

    sheep.insert("body", "left back thigh", 
        new ModelData(
            translate(1.5, 0.5, 1.5),
            translate(0, -0.5, 0),
            rotate(theta[5], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )

    sheep.insert("left back thigh", "left back calf", 
        new ModelData(
            translate(0, -1, 0),
            translate(0, -0.5, 0),
            rotate(theta[6], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )

    sheep.insert("body", "right back thigh", 
        new ModelData(
            translate(1.5, 0.5, -1.5),
            translate(0, -0.5, 0),
            rotate(theta[7], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )

    sheep.insert("right back thigh", "right back calf", 
        new ModelData(
            translate(0, -1, 0),
            translate(0, -0.5, 0),
            rotate(theta[8], vec3(0, 0, 1)),
            [1, 2, 1]
            )
    )


    console.log(sheep)
    let _ = [...sheep.preOrderTraversal()]
    requestAnimationFrame(testRender);
}

