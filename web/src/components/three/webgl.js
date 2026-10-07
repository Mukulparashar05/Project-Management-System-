let webgl2Support;

/** three.js (r163+) needs WebGL 2. The probe context is released immediately afterwards. */
export function isWebGL2Available() {
  if (webgl2Support !== undefined) return webgl2Support;
  try {
    const canvas = document.createElement('canvas');
    const context = window.WebGL2RenderingContext ? canvas.getContext('webgl2') : null;
    webgl2Support = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl2Support = false;
  }
  return webgl2Support;
}
