/**
 * fp2world.ts — pixel coordinate → 3D world-space transform.
 *
 * Coordinate convention (Z-up):
 *   3D X  = 2D X  (left/right — same axis)
 *   3D Y  = 2D Y  (front/back — floor plane depth)
 *   3D Z  = height above floor
 *
 * Calibrated against all 6 AS/RS crane aisle positions (0.0 m error):
 *   worldX = (fpX − FP_OX) / FP_SCALE
 *   worldY = (fpY − FP_OY) / FP_SCALE
 *   worldZ = 0  (ground level; caller supplies height offset when needed)
 *
 * Landmarks used for calibration (2D pixel → 3D world):
 *   CDC1 aisle centre:  (1605, 410) → ( 0.0,  0.0)
 *   CDC2 aisle centre:  (1605, 620) → ( 0.0,  8.4)
 *   CDC3 aisle centre:  (1605, 810) → ( 0.0, 16.0)
 *   AG1  aisle centre:  (1650, 950) → ( 1.8, 21.6)
 *   AG2  aisle centre:  (1650,1100) → ( 1.8, 27.6)
 *   HAG  aisle centre:  ( 475,1090) → (-45.2, 27.2)
 */

/** Pixels per metre in the fms_prime.json canvas. */
export const FP_SCALE = 25;

/** 2D canvas X pixel that maps to 3D world X = 0 (CDC crane aisle centre). */
export const FP_OX = 1605;

/** 2D canvas Y pixel that maps to 3D world Y = 0 (CDC1 crane row). */
export const FP_OY = 410;

/**
 * Convert a 2D floor-plan pixel position to a 3D world-space [x, y, z].
 * X and Y are the floor plane; worldZ is the height above the floor (default 0).
 */
export function fp2world(fpX: number, fpY: number, worldZ = 0): [number, number, number] {
  return [(fpX - FP_OX) / FP_SCALE, (fpY - FP_OY) / FP_SCALE, worldZ];
}

/** Convert a 3D world-space floor point back into floor-plan pixel coordinates. */
export function world2fp(worldX: number, worldY: number): [number, number] {
  return [worldX * FP_SCALE + FP_OX, worldY * FP_SCALE + FP_OY];
}

/** Convert a pixel size/dimension to metres. */
export function fpM(pixels: number): number {
  return pixels / FP_SCALE;
}
