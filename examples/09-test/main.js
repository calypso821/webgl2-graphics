document.addEventListener('DOMContentLoaded', function () {
    const webglCanvas = document.getElementById('webgl-canvas');
    const context2D = document.getElementById('2d-canvas').getContext('2d');
    const gl = webglCanvas.getContext('webgl2');

    // Ensure canvas dimensions are set
    webglCanvas.width = window.innerWidth;
    webglCanvas.height = window.innerHeight;
    context2D.canvas.width = window.innerWidth;
    context2D.canvas.height = window.innerHeight;

    console.log('Canvas Dimensions:', webglCanvas.width, webglCanvas.height, context2D.canvas.width, context2D.canvas.height);

    // Your WebGL initialization code goes here

    function render3D() {
        // Your WebGL rendering code goes here
        // Example: Clearing the WebGL canvas with a background color
        gl.clearColor(0.7, 0.7, 0.7, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Perform your 3D rendering
    }

    function render2D() {
        // Your 2D rendering code goes here
        // Example: Drawing text on the 2D canvas
        context2D.clearRect(0, 0, context2D.canvas.width, context2D.canvas.height);
        context2D.font = '30px Arial';
        context2D.fillStyle = 'blue';
        context2D.fillText('Hello, 2D on Top of 3D!', 50, 50);

        // Perform your 2D rendering
    }

    function animate() {
        console.log('Animating');
        render3D(); // Render 3D content
        render2D(); // Render 2D content on top of 3D

        requestAnimationFrame(animate);
    }

    animate();
});
