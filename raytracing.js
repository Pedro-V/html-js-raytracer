// ======================================================================
//  Low-level canvas access.
// ======================================================================

var canvas = document.getElementById("canvas");
var canvas_context = canvas.getContext("2d");
var canvas_buffer = canvas_context.getImageData(0, 0, canvas.width, canvas.height);
var canvas_pitch = canvas_buffer.width * 4;


// The PutPixel() function.
var PutPixel = function(x, y, color) {
  x = canvas.width/2 + x;
  y = canvas.height/2 - y - 1;
  
  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
      return;
  }

  var offset = 4*x + canvas_pitch*y;
  canvas_buffer.data[offset++] = color[0];
  canvas_buffer.data[offset++] = color[1];
  canvas_buffer.data[offset++] = color[2];
  canvas_buffer.data[offset++] = 255;
}


// Displays the contents of the offscreen buffer into the canvas.
var UpdateCanvas = function() {
  canvas_context.putImageData(canvas_buffer, 0, 0);
}


// ======================================================================
//  Linear algebra and helpers.
// ======================================================================

// Dot product of two 3D vectors.
var DotProduct = function(v1, v2) {
  return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}


// Computes v1 - v2.
var Subtract = function(v1, v2) {
  return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}


// ======================================================================
//  A very basic raytracer.
// ======================================================================

// A Sphere.
var Sphere = function(center, radius, color) {
  this.center = center;
  this.radius = radius;
  this.color = color;
}

// Scene setup.
var viewport_size = 1;
var projection_plane_z = 1;
var camera_position = [0, 0, -3];
var background_color = [255, 255, 255];
var spheres = [
    new Sphere([0, -1, 3], 1, [255, 0, 0]),     // red
    new Sphere([2, 0, 4], 1, [0, 0, 255]),      // blue
    new Sphere([-2, 0, 4], 1, [0, 255, 0])];    // green


// Converts 2D canvas coordinates to 3D viewport coordinates.
var CanvasToViewport = function(p2d) {
  return [
      p2d[0] * viewport_size / canvas.width,
      p2d[1] * viewport_size / canvas.height,
      projection_plane_z];
}


var IntersectRaySphere = function(origin, direction, sphere) {
    // solves the quadratic equation
    var r = sphere.radius;
    var co = Subtract(origin, sphere.center);

    var a = DotProduct(direction, direction);
    var b = 2 * DotProduct(co, direction);
    var c = DotProduct(co, co) - (r ** 2);

    var discriminant = (b ** 2) - 4*a*c;
    if (discriminant < 0) {
        return [Infinity, Infinity];
    }
    var t1 = (-b + Math.sqrt(discriminant)) / (2*a);
    var t2 = (-b - Math.sqrt(discriminant)) / (2*a);
    return [t1, t2];
}

var TraceRay = function(origin, direction, t_min, t_max) {
    var closest_t = Infinity;
    var closest_sphere = null;

    for (var i = 0; i < spheres.length; i++) {
        var ts = IntersectRaySphere(origin, direction, spheres[i]);
        if (ts[0] < closest_t && t_min < ts[0] && ts[0] < t_max) {
            closest_t = ts[0];
            closest_sphere = spheres[i];
        }
        if (ts[1] < closest_t && t_min < ts[1] && ts[1] < t_max) {
            closest_t = ts[1];
            closest_sphere = spheres[i];
        }
    }
    return closest_sphere == null ? background_color : closest_sphere.color;
}

// ==================================================
// main loop
// ==================================================

for (var x = -canvas.width/2; x < canvas.width/2; x++) {
    for (var y = -canvas.height/2; y < canvas.height/2; y++) {
        var direction = CanvasToViewport([x, y]);
        var color = TraceRay(camera_position, direction, 1, Infinity)
        PutPixel(x, y, color);
    }
}

UpdateCanvas();