export let VectorAdd = (a: number[], b: number[]) =>{
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

export let VectorNeg = (a: number[]) =>{
  return [-a[0],-a[1],-a[2]];
}

export let VectorSub = (a: number[], b:number[]) =>{
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

export let VectorDot = (a: number[], b:number[]) =>{
  return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}

export let VectorMultiply = (a: number[], b:number[]) =>{
    return [a[0]*b[0], a[1]*b[1], a[2]*b[2]];
}

export let VectorCross = (a:number[], b:number[]) =>{
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0],
  ]
}

export let VectorScale = (s:number, a:number[]) =>{
  return [s*a[0], s*a[1], s*a[2]];
}

export let VectorNorm = (a: number[]) => {
  return Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
}

export let VectorIsNull = (a:number[]) => {
    return (a[0] == 0 && a[1] == 0 && a[2] == 0);
}

export let VectorNormalize = (a: number[])=> {
    let norm = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    if (norm == 0) return [0, 0, 0];
    return [a[0] / norm, a[1] / norm, a[2] / norm];
}

export let ReflectVectorOnAxis = (vector: number[], axisPoint: number[], axisDirection: number[]) => {
    let dot = VectorDot(vector, axisDirection);

    // reflecting the ray
    return VectorNormalize(VectorSub(vector, VectorScale(2 * dot, axisDirection)));
}
