/**
 * Adds two 3-vectors A and B.
 * @param a: Vector A
 * @param b: Vector B
 * @return A + B, 3-vector
 */
export let VectorAdd = (a: number[], b: number[]) =>{
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}
/**
 * Flips the sign of a 3-vector A.
 * @param a: Vector A
 * @returns -a, 3-vector
 */
export let VectorNeg = (a: number[]) =>{
  return [-a[0],-a[1],-a[2]];
}
/**
 * Subtracts two 3-vectors A and B (A-B).
 * @param a: Vector A
 * @param b: Vector B
 * @returns a-b, 3-vector
 */
export let VectorSub = (a: number[], b:number[]) =>{
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}
/**
 * Returns the Dot-product two 3-vectors A and B.
 * @param a: Vector A
 * @param b: Vector B
 * @returns a*b: number
 */
export let VectorDot = (a: number[], b:number[]) =>{
  return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}
/**
 * Multiplies two 3-vectors A and B. This is mainly for multiplying color vectors
 * @param a: Vector A
 * @param b: Vector B
 * @returns r: r = a * b, r.x = a.x * b.x, r.y = a.y * b.y, and r.z = a.z * b.z
 */
export let VectorMultiply = (a: number[], b:number[]) =>{
    return [a[0]*b[0], a[1]*b[1], a[2]*b[2]];
}
/**
 * Returns the cross product of two 3-vectors A and B.
 * @param a: Vector A
 * @param b: Vector B
 * @returns a ^ b: 3-vector
 */
export let VectorCross = (a:number[], b:number[]) =>{
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0],
  ]
}
/**
 * Scale 3-Vector A by number s.
 * @param s: number to scale the vector by
 * @param a: Vector A
 * @returns s*a: 3-vector
 */
export let VectorScale = (s:number, a:number[]) =>{
  return [s*a[0], s*a[1], s*a[2]];
}
/**
 * Returns the Norm of a 3-Vector A.
 * @param a: Vector A
 * @returns ||a||: number
 */
export let VectorNorm = (a: number[]) => {
  return Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
}
/**
 * Returns true if the vector is the null vector.
 * @param a: Vector A
 * @returns a == 0
 */
export let VectorIsNull = (a:number[]) => {
    return (a[0] == 0 && a[1] == 0 && a[2] == 0);
}
/**
 * Returns the Direction of a 3-Vector A, which is the vector of norm 1 that is colinear to A.
 * @param a: Vector A
 * @returns a * 1/||a||: 3-vector
 */
export let VectorNormalize = (a: number[])=> {
    let norm = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    if (norm == 0) return [0, 0, 0];
    return [a[0] / norm, a[1] / norm, a[2] / norm];
}
/**
 * Reflects a 3-vector A off the point of a surface given a normal to the surface.
 * @param vector: The vector to reflect
 * @param axisPoint: The point of reflection
 * @param axisDirection: The normal to the surface
 * @returns r: 3-vector
 */
export let ReflectVectorOnAxis = (vector: number[], axisPoint: number[], axisDirection: number[]) => {
    let dot = VectorDot(vector, axisDirection);

    // reflecting the ray
    return VectorNormalize(VectorSub(vector, VectorScale(2 * dot, axisDirection)));
}
