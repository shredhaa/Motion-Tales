function sketchDraw(p) {

  let bodyPose, video, poses, handPose;
  let hands = [];
  let path = [];
  let spacing = 10;
  let paragraph = "A fairy godmother transformed pumpkins and mice into a shining carriage.";
  let smoothX, smoothY;
  const SMOOTHEN = 0.07;

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    video = p.createCapture(p.VIDEO);
    video.size(p.windowWidth, p.windowHeight);
    video.hide();

    bodyPose = ml5.bodyPose("BlazePose", { flipped: true }, () => {
      bodyPose.detectStart(video, r => poses = r);
    });

    handPose = ml5.handPose({ flipped: true }, () => {
      handPose.detectStart(video, r => hands = r);
    });
  };

  p.draw = function () {
    p.background(255, 102, 0);

    // Silhouette blobs
    if (poses && poses.length > 0) {
      let pose = poses[0];

      p.push();
      p.blendMode(p.MULTIPLY);
      p.noStroke();

      // Blob size per keypoint index
      const blobSizes = {
        0:90, 1:70, 2:70, 3:70, 4:70, 5:70, 6:70, 7:70, 8:70, 9:70, 10:70, // head/face
        11:110, 12:110,       // shoulders
        13:90,  14:90,        // elbows
        15:80,  16:80,        // wrists
        17:60,  18:60, 19:60, 20:60, 21:60, 22:60, // hands
        23:120, 24:120,       // hips
        25:100, 26:100,       // knees
        27:85,  28:85,        // ankles
        29:60,  30:60, 31:60, 32:60  // feet
      };

      for (let i = 0; i < pose.keypoints.length; i++) {
        let kp = pose.keypoints[i];
        if (kp && kp.confidence > 0.15) {
          let r = blobSizes[i] || 80;
          p.fill(180, 60, 0, 55);
          p.circle(kp.x, kp.y, r * 2);
        }
      }

      p.pop();
    }

    // Hand tracking + path drawing
    if (hands.length > 0) {
      let index = hands[0].keypoints[8];
      if (smoothX === undefined) {
        smoothX = index.x; smoothY = index.y;
      } else {
        smoothX = p.lerp(smoothX, index.x, SMOOTHEN);
        smoothY = p.lerp(smoothY, index.y, SMOOTHEN);
      }
      p.fill(255, 0, 255);
      p.noStroke();
      p.circle(smoothX, smoothY, 16);
      addPathPoint(smoothX, smoothY);
      drawParagraphOnPath();
    }
  };

  function addPathPoint(x, y) {
    if (path.length === 0 ||
        p.dist(x, y, path[path.length-1].x, path[path.length-1].y) > spacing) {
      path.push({ x, y });
      if (path.length > 500) path.shift();
    }
  }

  function drawParagraphOnPath() {
    if (path.length < 2) return;
    let cumDist = [0];
    for (let i = 1; i < path.length; i++) {
      cumDist.push(cumDist[i-1] + p.dist(path[i].x, path[i].y, path[i-1].x, path[i-1].y));
    }
    let totalLen = cumDist[cumDist.length-1];
    let fs = globalFontSize || 20;
    p.textFont('Palatino Linotype');
    p.textSize(fs);
    p.textAlign(p.CENTER, p.CENTER);
    let charSpacing = fs * 0.65;
    let numChars = p.floor(totalLen / charSpacing);
    for (let i = 0; i < numChars; i++) {
      let targetDist = i * charSpacing;
      if (targetDist > totalLen) break;
      let seg = findSegment(cumDist, targetDist);
      if (seg >= path.length - 1) break;
      let segLen = cumDist[seg+1] - cumDist[seg];
      let t = segLen === 0 ? 0 : (targetDist - cumDist[seg]) / segLen;
      let x = p.lerp(path[seg].x, path[seg+1].x, t);
      let y = p.lerp(path[seg].y, path[seg+1].y, t);
      let angle = p.atan2(path[seg+1].y - path[seg].y, path[seg+1].x - path[seg].x);
      let fade = p.map(i, 0, numChars, 60, 255);
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.fill(0, fade);
      p.noStroke();
      p.text(paragraph[i % paragraph.length], 0, 0);
      p.pop();
    }
  }

  function findSegment(cumDist, target) {
    let lo = 0, hi = cumDist.length - 2;
    while (lo < hi) {
      let mid = p.floor((lo + hi + 1) / 2);
      if (cumDist[mid] <= target) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    if (video) video.size(p.windowWidth, p.windowHeight);
  };

  p.remove = function () {
    if (video) video.remove();
  };
}
