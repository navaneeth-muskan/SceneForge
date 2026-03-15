/**
 * Generated AnimatedLayer component source for Remotion.
 * Handles all 37 animation presets (excluding "none").
 */
export const ANIMATED_LAYER_SOURCE = `
function AnimatedLayer({ startFrame, endFrame, enterPreset, enterDuration, enterDelay, exitPreset, exitDuration, exitDelay, baseStyle, children }) {
  const frame = useCurrentFrame();
  const absFrame = startFrame + frame;
  let opacity = 1, translateX = 0, translateY = 0, scale = 1, scaleX = 1, scaleY = 1;
  let rotateX = 0, rotateY = 0, rotateZ = 0, skewX = 0, skewY = 0;
  let filter = "none", clipPath = "none";

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function bounce(t) {
    if (t < 1/2.75) return 7.5625*t*t;
    if (t < 2/2.75) return 7.5625*(t-=1.5/2.75)*t + .75;
    if (t < 2.5/2.75) return 7.5625*(t-=2.25/2.75)*t + .9375;
    return 7.5625*(t-=2.625/2.75)*t + .984375;
  }
  function elastic(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10*t) * Math.sin((t*10-0.75) * (2*Math.PI)/3) + 1;
  }

  function applyPreset(preset, v) {
    const e = easeOut(v);
    const b = bounce(v);
    const el = Math.min(1, Math.max(0, elastic(v)));
    if (preset === "fade") return { opacity: v };
    if (preset === "scale") return { scale: v };
    if (preset === "bounce") return { scale: b };
    if (preset === "flip") return { opacity: v, rotateX: 90 * (1 - v) };
    if (preset === "zoom") return { scale: 0.8 + 0.2 * v, opacity: v };
    if (preset === "slide") return { translateY: 40 * (1 - v) };
    if (preset === "snap") return { translateY: 50 * (1 - easeIn(v)) };
    if (preset === "glitch") return { translateX: (Math.sin(v*20)*4) * (1-v), opacity: v };
    if (preset === "swipe") return { clipPath: "inset(0 " + (100 - v*100) + "% 0 0)" };
    if (preset === "float") return { translateY: 30 * (1 - e) + Math.sin(v*Math.PI) * -5 };
    if (preset === "spin") return { rotateZ: 360 * (1 - v), opacity: v };
    if (preset === "slideD") return { translateY: -40 * (1 - v) };
    if (preset === "slideL") return { translateX: 40 * (1 - v) };
    if (preset === "diagonal") return { translateX: 30 * (1 - v), translateY: 30 * (1 - v) };
    if (preset === "wobble") return { rotateZ: Math.sin(v*Math.PI*3) * 15 * (1-v), opacity: v };
    if (preset === "flipY") return { opacity: v, rotateY: 90 * (1 - v) };
    if (preset === "pulse") return { scale: 0.8 + 0.4 * (0.5 + 0.5*Math.sin(v*Math.PI)), opacity: v };
    if (preset === "drop") return { translateY: -80 * (1 - b), opacity: v };
    if (preset === "squeeze") return { scaleX: v, scaleY: 0.5 + 0.5*v };
    if (preset === "roll") return { rotateZ: 360 * (1 - v), opacity: v };
    if (preset === "swing") return { rotateZ: 30 * Math.sin(v*Math.PI) };
    if (preset === "expand") return { scale: v };
    if (preset === "twist") return { rotateZ: 180 * (1 - v), scale: v };
    if (preset === "blur") return { filter: "blur(" + (10 * (1 - v)) + "px)", opacity: v };
    if (preset === "spiral") return { rotateZ: 360 * (1 - v), scale: v, translateY: 20 * (1 - v) };
    if (preset === "shake") return { translateX: Math.sin(v*30) * 8 * (1-v), opacity: v };
    if (preset === "curtain") return { clipPath: "inset(" + (100 - v*100) + "% 0 0 0)" };
    if (preset === "fold") return { rotateX: 90 * (1 - v), opacity: v };
    if (preset === "zigzag") return { translateX: (Math.floor(v*4) % 2 === 0 ? 1 : -1) * 15 * (1-v), translateY: 40 * (1 - v) };
    if (preset === "elastic") return { scale: el };
    if (preset === "slingshot") return { translateY: 60 * (1 - b) };
    if (preset === "rotate") return { rotateZ: 180 * (1 - v), opacity: v };
    if (preset === "skew") return { skewX: -25 * (1 - v), opacity: v };
    if (preset === "peek") return { clipPath: "inset(0 0 " + (100 - v*100) + "% 0)" };
    if (preset === "vortex") return { rotateZ: 360 * (1 - v), scale: 0.3 + 0.7 * v };
    if (preset === "typing") return { clipPath: "inset(0 0 " + (100 - v*100) + "% 0)" };
    return {};
  }

  if (enterPreset !== "none") {
    const animStart = startFrame + enterDelay;
    const animEnd = animStart + enterDuration;
    if (absFrame < animStart) {
      const res = applyPreset(enterPreset, 0);
      if (res.opacity !== undefined) opacity = res.opacity;
      if (res.translateX !== undefined) translateX = res.translateX;
      if (res.translateY !== undefined) translateY = res.translateY;
      if (res.scale !== undefined) scale = res.scale;
      if (res.scaleX !== undefined) scaleX = res.scaleX;
      if (res.scaleY !== undefined) scaleY = res.scaleY;
      if (res.rotateX !== undefined) rotateX = res.rotateX;
      if (res.rotateY !== undefined) rotateY = res.rotateY;
      if (res.rotateZ !== undefined) rotateZ = res.rotateZ;
      if (res.skewX !== undefined) skewX = res.skewX;
      if (res.skewY !== undefined) skewY = res.skewY;
      if (res.filter !== undefined) filter = res.filter;
      if (res.clipPath !== undefined) clipPath = res.clipPath;
    } else if (absFrame < animEnd) {
      const raw = (absFrame - animStart) / enterDuration;
      const t = easeOut(raw);
      const res = applyPreset(enterPreset, t);
      if (res.opacity !== undefined) opacity = res.opacity;
      if (res.translateX !== undefined) translateX = res.translateX;
      if (res.translateY !== undefined) translateY = res.translateY;
      if (res.scale !== undefined) scale = res.scale;
      if (res.scaleX !== undefined) scaleX = res.scaleX;
      if (res.scaleY !== undefined) scaleY = res.scaleY;
      if (res.rotateX !== undefined) rotateX = res.rotateX;
      if (res.rotateY !== undefined) rotateY = res.rotateY;
      if (res.rotateZ !== undefined) rotateZ = res.rotateZ;
      if (res.skewX !== undefined) skewX = res.skewX;
      if (res.skewY !== undefined) skewY = res.skewY;
      if (res.filter !== undefined) filter = res.filter;
      if (res.clipPath !== undefined) clipPath = res.clipPath;
    }
  }

  if (exitPreset !== "none") {
    const animEnd = endFrame - exitDelay;
    const animStart = animEnd - exitDuration;
    if (absFrame >= animEnd) {
      const res = applyPreset(exitPreset, 0);
      if (res.opacity !== undefined) opacity = res.opacity;
      if (res.translateX !== undefined) translateX = res.translateX;
      if (res.translateY !== undefined) translateY = res.translateY;
      if (res.scale !== undefined) scale = res.scale;
      if (res.scaleX !== undefined) scaleX = res.scaleX;
      if (res.scaleY !== undefined) scaleY = res.scaleY;
      if (res.rotateX !== undefined) rotateX = res.rotateX;
      if (res.rotateY !== undefined) rotateY = res.rotateY;
      if (res.rotateZ !== undefined) rotateZ = res.rotateZ;
      if (res.skewX !== undefined) skewX = res.skewX;
      if (res.skewY !== undefined) skewY = res.skewY;
      if (res.filter !== undefined) filter = res.filter;
      if (res.clipPath !== undefined) clipPath = res.clipPath;
    } else if (absFrame >= animStart) {
      const raw = (absFrame - animStart) / exitDuration;
      const t = 1 - easeOut(raw);
      const res = applyPreset(exitPreset, t);
      if (res.opacity !== undefined) opacity = res.opacity;
      if (res.translateX !== undefined) translateX = res.translateX;
      if (res.translateY !== undefined) translateY = res.translateY;
      if (res.scale !== undefined) scale = res.scale;
      if (res.scaleX !== undefined) scaleX = res.scaleX;
      if (res.scaleY !== undefined) scaleY = res.scaleY;
      if (res.rotateX !== undefined) rotateX = res.rotateX;
      if (res.rotateY !== undefined) rotateY = res.rotateY;
      if (res.rotateZ !== undefined) rotateZ = res.rotateZ;
      if (res.skewX !== undefined) skewX = res.skewX;
      if (res.skewY !== undefined) skewY = res.skewY;
      if (res.filter !== undefined) filter = res.filter;
      if (res.clipPath !== undefined) clipPath = res.clipPath;
    }
  }

  const transforms = [];
  if (translateX !== 0 || translateY !== 0) transforms.push("translate(" + translateX + "px, " + translateY + "px)");
  if (scale !== 1 || scaleX !== 1 || scaleY !== 1) {
    transforms.push("scale(" + (scale * scaleX) + ", " + (scale * scaleY) + ")");
  }
  if (rotateX !== 0 || rotateY !== 0 || rotateZ !== 0) {
    transforms.push("rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) rotate(" + rotateZ + "deg)");
  }
  if (skewX !== 0 || skewY !== 0) transforms.push("skew(" + skewX + "deg, " + skewY + "deg)");
  const animTransform = transforms.length ? transforms.join(" ") : "none";
  const innerStyle = {
    width: "100%", height: "100%",
    opacity, transform: animTransform, filter,
    clipPath: clipPath !== "none" ? clipPath : undefined
  };
  return (
    <AbsoluteFill style={baseStyle}>
      <div style={innerStyle}>{children}</div>
    </AbsoluteFill>
  );
}
`;
