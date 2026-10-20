// Imperative threepipe scene for the login page: a laptop and phone on a
// desk that open/tilt on hover and focus on click. Adapted from the
// threepipe "device mockup" demo (MIT, github.com/repalash/threepipe-device-mockup-codrops):
// the debug panel, drag-and-drop texture upload and snapshot/transform-control
// plugins were removed, and the screens render CSAS Connect UI instead.
//
// This module touches `window`/WebGL at import time, so it is only ever loaded
// via dynamic import() from DeviceScene.tsx, inside an effect.

import {
  CameraViewPlugin,
  CanvasTexture,
  ContactShadowGroundPlugin,
  type IObject3D,
  type PhysicalMaterial,
  PickingPlugin,
  PopmotionPlugin,
  SRGBColorSpace,
  ThreeViewer,
  TransformAnimationPlugin,
} from "threepipe";
import { drawLaptopScreen, drawPhoneScreen, loadCrest } from "./screen-textures";

export type DeviceName = "macbook" | "iphone";
export type DeviceFocus = DeviceName | null;

export type DeviceSceneOptions = {
  canvas: HTMLCanvasElement;
  modelUrl: string;
  /** Lower render resolution and texture size for phones/tablets. */
  lowPower: boolean;
  /** Skip all transitions (prefers-reduced-motion). */
  reducedMotion: boolean;
  signal: AbortSignal;
  onFocusChange?: (focus: DeviceFocus) => void;
};

export type DeviceSceneHandle = {
  setFocus: (focus: DeviceFocus) => void;
  dispose: () => void;
};

export async function createDeviceScene(opts: DeviceSceneOptions): Promise<DeviceSceneHandle | null> {
  const { canvas, modelUrl, lowPower, reducedMotion, signal, onFocusChange } = opts;
  // React strict mode mounts, unmounts and re-mounts effects immediately; don't
  // build (and then tear down) a viewer for the discarded first mount.
  if (signal.aborted) return null;

  const viewer = new ThreeViewer({
    canvas,
    msaa: !lowPower,
    renderScale: lowPower ? 1 : "auto",
    plugins: [PickingPlugin, PopmotionPlugin, CameraViewPlugin, TransformAnimationPlugin, ContactShadowGroundPlugin],
  });

  let disposed = false;
  const state = { focused: "" as DeviceFocus | "", hover: "" as DeviceFocus | "", animating: false };
  const nextState = { focused: "" as DeviceFocus | "", hover: "" as DeviceFocus | "" };
  const textures: CanvasTexture[] = [];
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    document.removeEventListener("keydown", onKeyDown);
    textures.forEach((t) => t.dispose());
    viewer.dispose(true);
  };
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape" && state.focused) void setState({ hover: "", focused: "" });
  };

  let macbook: IObject3D | undefined;
  let iphone: IObject3D | undefined;
  let macbookScreen: IObject3D | undefined;
  let transformAnim: TransformAnimationPlugin;
  let cameraView: CameraViewPlugin;
  const ms = (n: number) => (reducedMotion ? 0 : n);
  // The GLB ships separate camera views ("start2", "macbook2", ...) framed for
  // portrait containers; use them only when the canvas is actually taller than wide.
  const viewName = (key: string) => (canvas.clientWidth / Math.max(canvas.clientHeight, 1) < 0.9 ? `${key}2` : key);

  function deviceFromHit(object: IObject3D): DeviceFocus | "" {
    let device: DeviceFocus | "" = "";
    object.traverseAncestors((o) => {
      if (o === macbook) device = "macbook";
      if (o === iphone) device = "iphone";
    });
    return device;
  }

  async function updateState() {
    if (state.animating || disposed) return;
    if (nextState.focused === state.focused && nextState.hover === state.hover) return;
    state.animating = true;
    const wasFocused = state.focused;
    Object.assign(state, nextState);
    onFocusChange?.(state.focused || null);
    try {
      if (state.focused) {
        await Promise.all([
          transformAnim.animateTransform(macbookScreen!, state.focused === "macbook" ? "open" : "closed", ms(500))?.promise,
          transformAnim.animateTransform(iphone!, state.focused === "iphone" ? "floating" : "facedown", ms(500))?.promise,
          cameraView.animateToView(viewName(state.focused), ms(500)),
        ]);
      } else if (state.hover) {
        await Promise.all([
          transformAnim.animateTransform(macbookScreen!, state.hover === "macbook" ? "hover" : "closed", ms(250))?.promise,
          transformAnim.animateTransform(iphone!, state.hover === "iphone" ? "tilted" : "facedown", ms(250))?.promise,
        ]);
      } else {
        const duration = ms(wasFocused ? 500 : 250);
        await Promise.all([
          transformAnim.animateTransform(macbookScreen!, "closed", duration)?.promise,
          transformAnim.animateTransform(iphone!, "facedown", duration)?.promise,
          wasFocused ? cameraView.animateToView(viewName("front"), duration) : null,
        ]);
      }
    } finally {
      state.animating = false;
    }
  }

  async function setState(next: Partial<typeof nextState>) {
    Object.assign(nextState, next);
    while (state.animating && !disposed) await new Promise((r) => setTimeout(r, 50));
    await updateState();
  }

  try {
    const devices = await viewer.load<IObject3D>(modelUrl);
    if (signal.aborted) {
      dispose();
      return null;
    }
    // viewer.load() resolves undefined (rather than throwing) when the model can't be fetched/parsed.
    if (!devices) throw new Error("Device model failed to load");

    // Transparent canvas: the page's indigo gradient is the backdrop. The HDR
    // from the model is still used for reflections on the devices.
    viewer.scene.background = null;
    viewer.scene.backgroundColor = null;

    macbook = devices.getObjectByName("macbook");
    iphone = devices.getObjectByName("iphone");
    macbookScreen = macbook?.getObjectByName("Bevels_2");
    if (!macbook || !iphone || !macbookScreen) throw new Error("Device model is missing expected nodes");

    // Screen content: canvas-drawn CSAS Connect UI used as the emissive map.
    const crest = await loadCrest();
    if (signal.aborted) {
      dispose();
      return null;
    }
    const scale = lowPower ? 1 : 2;
    const laptopCanvas = Object.assign(document.createElement("canvas"), { width: 720 * scale, height: 450 * scale });
    const phoneCanvas = Object.assign(document.createElement("canvas"), { width: 360 * scale, height: 780 * scale });
    drawLaptopScreen(laptopCanvas, crest);
    drawPhoneScreen(phoneCanvas, crest);
    const laptopTex = new CanvasTexture(laptopCanvas);
    const phoneTex = new CanvasTexture(phoneCanvas);
    for (const t of [laptopTex, phoneTex]) {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      textures.push(t);
    }
    const mbpScreen = viewer.scene.getObjectByName("Object_7")?.material as PhysicalMaterial | undefined;
    const iPhoneScreen = viewer.scene.getObjectByName("xXDHkMplTIDAXLN")?.material as PhysicalMaterial | undefined;
    if (mbpScreen) {
      mbpScreen.color.set(0, 0, 0);
      mbpScreen.emissive.set(1, 1, 1);
      mbpScreen.roughness = 0.2;
      mbpScreen.metalness = 0.8;
      mbpScreen.map = null;
      mbpScreen.emissiveMap = laptopTex;
      mbpScreen.setDirty();
    }
    if (iPhoneScreen) {
      iPhoneScreen.emissiveMap = phoneTex;
      iPhoneScreen.setDirty();
    }

    transformAnim = viewer.getPlugin(TransformAnimationPlugin)!;
    cameraView = viewer.getPlugin(CameraViewPlugin)!;
    const picking = viewer.getPlugin(PickingPlugin)!;
    picking.widgetEnabled = false;
    picking.hoverEnabled = !reducedMotion;

    await transformAnim.animateTransform(macbookScreen, "closed", 0)?.promise;
    await transformAnim.animateTransform(iphone, "facedown", 0)?.promise;
    await cameraView.animateToView(viewName("start"), 0);
    if (signal.aborted) {
      dispose();
      return null;
    }

    // Initial reveal: ease the camera from the start view to the resting "front" view.
    void cameraView.animateToView(viewName("front"), ms(1200));

    return start();

    function start(): DeviceSceneHandle {
      document.addEventListener("keydown", onKeyDown);

      picking.addEventListener("hoverObjectChanged", async (e) => {
        const object = e.object as IObject3D | null;
        if (!object) {
          if (state.hover && !state.focused) await setState({ hover: "", focused: "" });
          return;
        }
        if (state.focused) return;
        await setState({ hover: deviceFromHit(object), focused: "" });
      });

      picking.addEventListener("hitObject", async (e) => {
        const object = e.intersects.selectedObject as IObject3D | undefined;
        if (!object) {
          if (state.focused) await setState({ hover: "", focused: "" });
          return;
        }
        const device = deviceFromHit(object);
        e.intersects.selectedObject = device === "macbook" ? macbook! : iphone!;
        await setState({ focused: device, hover: "" });
      });

      return {
        setFocus: (focus) => void setState({ hover: "", focused: focus ?? "" }),
        dispose,
      };
    }
  } catch (err) {
    dispose();
    throw err;
  }
}
