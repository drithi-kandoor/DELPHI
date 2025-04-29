let faceMesh;
let options = { maxFaces: 100, refineLandmarks: false, flipped: true };
let video;
let faces = [];
let prevFace = null;
let smoothedMotion = [];
// let importantIndices = [4, 13, 224, 386, 118];
let importantIndices = [300, 213, 416, 67, 176];

let offsetX = 0;
let offsetY = 0;

let zoom = 1; // Declare zoom globally

function preload() {
  faceMesh = ml5.faceMesh(options);
}

let lastFaceTime = 0;
let faceTimeout = 1000; // milliseconds to keep rendering after face disappears

function setup() {
    createCanvas(windowWidth, windowHeight);
  
    video = createCapture(VIDEO, {flipped:true});
    video.size(windowWidth, windowHeight);
    video.hide();
  
    faceMesh.detectStart(video, gotFaces);
  
    // Set initial trail colors
    let colorInputs = [
      select("#color1"),
      select("#color2"),
      select("#color3"),
      select("#color4"),
      select("#color5"),
    ];
    for (let i = 0; i < importantIndices.length; i++) {
      let col = colorInputs[i].value();
      trailColors[importantIndices[i]] = color(col);
    }
  
    // 🔀 RANDOMIZER BUTTON
    select("#randomizeBtn").mousePressed(() => {
      if (faces.length > 0 && faces[0].keypoints.length > 0) {
        // Get 5 random indices
        importantIndices = [];
        let used = new Set();
        while (importantIndices.length < 5) {
          let r = floor(random(faces[0].keypoints.length));
          if (!used.has(r)) {
            used.add(r);
            importantIndices.push(r);
          }
        }
      }
    });
  }
  
  
let trails = {}; // Declare globally
let trailColors = {}; // Store colors for each keypoint

function draw() {
    // Get and apply background color
    let bgColor = select("#bgColorPicker").value();
    background(bgColor);
  
    let colorInputs = [
      select("#color1"),
      select("#color2"),
      select("#color3"),
      select("#color4"),
      select("#color5"),
    ];
  
    let zoomSliderVal = select("#zoomSlider").value();
    zoom = map(zoomSliderVal, 10, 500, 1, 6);
  
    let alphaMax = select("#alphaSlider").value();
    let sizeStart = select("#sizeStartSlider").value();
  
    for (let i = 0; i < importantIndices.length; i++) {
      let col = colorInputs[i].value();
      trailColors[importantIndices[i]] = color(col);
    }
  
    // Use face if detected, otherwise keep previous
    let face = faces.length > 0 ? faces[0] : null;
  
    if (face) {
      prevFace = JSON.parse(JSON.stringify(face));
    }
  
    if (prevFace) {
      // Center the face
      let centerX = 0;
      let centerY = 0;
      for (let j = 0; j < prevFace.keypoints.length; j++) {
        centerX += prevFace.keypoints[j].x;
        centerY += prevFace.keypoints[j].y;
      }
      centerX /= prevFace.keypoints.length;
      centerY /= prevFace.keypoints.length;
  
      offsetX = width / 2 - centerX * zoom;
      offsetY = height / 2 - centerY * zoom;
  
      push();
      translate(offsetX, offsetY);
      scale(zoom);
  
      for (let idx of importantIndices) {
        const keypoint = prevFace.keypoints[idx];
        if (!trails[idx]) trails[idx] = [];
  
        const trail = trails[idx];
        const trailColor = trailColors[idx];
  
        // Only update trail position if face is currently tracked
        if (face) {
          let targetX = lerp(keypoint.x, mouseX / zoom - offsetX / zoom, 0.2);
          let targetY = lerp(keypoint.y, mouseY / zoom - offsetY / zoom, 0.2);
  
          let lastSmoothed = trail.length > 0 ? trail[trail.length - 1] : { x: keypoint.x, y: keypoint.y };
          let smoothedX = lerp(lastSmoothed.x, targetX, 0.1);
          let smoothedY = lerp(lastSmoothed.y, targetY, 0.1);
  
          trail.push({ x: smoothedX, y: smoothedY });
          if (trail.length > 70) trail.shift();
        }
  
        // Always render trail (even if face lost)
        for (let i = 0; i < trail.length; i++) {
          const pos = trail[i];
          const fadeOutFactor = face ? 1 : 0.97; // gradually fade out
          const alpha = map(i, 0, trail.length, 0, alphaMax * fadeOutFactor);
          const size = map(i, 0, trail.length, sizeStart, sizeStart / 2);
  
          noStroke();
          fill(red(trailColor), green(trailColor), blue(trailColor), alpha);
          ellipse(pos.x, pos.y, size, size);
        }
      }
  
      pop();
    }
  
    // Clear trails if they've faded out
    if (!face) {
      for (let idx of importantIndices) {
        if (trails[idx]) {
          trails[idx] = trails[idx].slice(1); // slowly trim
        }
      }
    }
  }
  

function gotFaces(results) {
  faces = results;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
