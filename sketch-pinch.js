function sketchPinch(p) {
  let bodyPose, video, poses, handPose;
  let hands = [];
  let paragraph = "But when the work was finished, she walked outside to a small tree growing beside her mother's grave. There she whispered her wishes into the branches and waited as the wind moved through the leaves. Sometimes a bird would drop a gift into her hands, as if the world itself had heard her sorrow.";
  let smoothPinch = 40;
  const PINCH_SMOOTH = 0.09;
  const PINCH_CLOSED = 40;
  const PINCH_OPEN = 160;
  let smoothTextX, smoothTextY;
  const POS_SMOOTH = 0.1;
 
  const connections = [
    [0,1],[1,2],[2,3],[3,7],
    [0,4],[4,5],[5,6],[6,8],
    [9,10],
    [11,12],
    [11,13],[13,15],
    [12,14],[14,16],
    [15,17],[15,19],[17,19],
    [16,18],[16,20],[18,20],
    [11,23],[12,24],[23,24],
    [23,25],[25,27],[27,29],[29,31],[27,31],
    [24,26],[26,28],[28,30],[30,32],[28,32]
  ];
 
  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    video = p.createCapture(p.VIDEO, { flipped: true });
    video.size(p.windowWidth, p.windowHeight);
    video.hide();
 
    bodyPose = ml5.bodyPose("BlazePose", { flipped: true }, () => {
      console.log("BlazePose ready");
      bodyPose.detectStart(video, r => poses = r);
    });
 
    handPose = ml5.handPose({ flipped: true }, () => {
      handPose.detectStart(video, r => hands = r);
    });
 
    smoothTextX = p.width / 2;
    smoothTextY = p.height / 2;
  };
 
  p.draw = function () {
    p.background(224, 82, 255);
 
    // Draw skeleton
    if (poses && poses.length > 0) {
      let pose = poses[0];
      p.stroke(0, 20);
      p.strokeWeight(50);
      for (let [a, b] of connections) {
        let kpA = pose.keypoints[a];
        let kpB = pose.keypoints[b];
        if (kpA && kpB && kpA.confidence > 0.2 && kpB.confidence > 0.2) {
          p.line(kpA.x, kpA.y, kpB.x, kpB.y);
        }
      }
      for (let kp of pose.keypoints) {
        if (kp.confidence > 0.2) {
          p.noStroke();
          p.fill(0, 80);
          p.circle(kp.x, kp.y, 5);
        }
      }
    }
 
    if (hands.length > 0) {
      let hand = hands[0];
      let thumb = hand.keypoints[4];
      let index = hand.keypoints[8];
      let rawPinch = p.dist(thumb.x, thumb.y, index.x, index.y);
      smoothPinch = p.lerp(smoothPinch, rawPinch, PINCH_SMOOTH);
      smoothTextX = p.lerp(smoothTextX, index.x, POS_SMOOTH);
      smoothTextY = p.lerp(smoothTextY, index.y, POS_SMOOTH);
      p.stroke(0, 80);
      p.strokeWeight(1);
      p.line(thumb.x, thumb.y, index.x, index.y);
      p.fill(255, 0, 200);
      p.noStroke();
      p.circle(thumb.x, thumb.y, 10);
      p.circle(index.x, index.y, 10);
    }
 
    let baseFontSize = globalFontSize || 17;
    let fontSize = p.constrain(
      p.map(smoothPinch, PINCH_CLOSED, PINCH_OPEN, baseFontSize * 0.6, baseFontSize * 4),
      baseFontSize * 0.6,
      baseFontSize * 4
    );
    drawScaledText(fontSize, baseFontSize);
  };
 
  function drawScaledText(fontSize, baseFontSize) {
    let scaleFactor = fontSize / baseFontSize;
    let boxW = p.width * 0.7;
    p.push();
    p.translate(smoothTextX, smoothTextY);
    p.scale(scaleFactor);
    p.fill(0);
    p.noStroke();
    p.textFont('Palatino');
    p.textSize(baseFontSize);
    p.textLeading(baseFontSize * 1.4);
    p.textAlign(p.LEFT, p.BASELINE);
    p.text(paragraph, 0, 0, boxW / 2, p.height);
    p.pop();
  }
 
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    if (video) video.size(p.windowWidth, p.windowHeight);
  };
 
  // FIXED: added cleanup so camera stops when switching sketches
  p.remove = function() {
    if (video) {
      video.stop();
      video.remove();
    }
  };
}
