import {VectorCross, VectorNormalize, VectorSub} from "./VectorMath";

/**
 * Unusued as of now, will be reused in the future to calculate Meshes.
 */
export class MeshLogic{

    public static getIntersectionPoints = function(rays: number[][][], userPos:number[], triangle: number[][]) {
        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        function VectorAdd(a: number[], b: number[]) {
            return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
        }

        function VectorNeg(a: number[]) {
            return [-a[0], -a[1], -a[2]];
        }

        function VectorSub(a: number[], b: number[]) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        }

        function VectorDot(a: number[], b: number[]) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        }

        function VectorCross(a: number[], b: number[]) {
            return [
                a[1] * b[2] - a[2] * b[1],
                a[2] * b[0] - a[0] * b[2],
                a[0] * b[1] - a[1] * b[0],
            ]
        }

        function VectorScale(s: number, a: number[]) {
            return [s * a[0], s * a[1], s * a[2]];
        }

        function VectorNorm(a: number[]) {
            return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
        }

        function VectorNormalize(a: number[]) {
            let norm = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
            if(norm == 0) return[0,0,0];
            return [a[0] / norm, a[1] / norm, a[2] / norm];
        }

        let iab = [rays[i][j][0], rays[i][j][1], rays[i][j][2]];

        let p0 = [triangle[0][0], triangle[0][1], triangle[0][2]];
        let p1 = [triangle[1][0], triangle[1][1], triangle[1][2]];
        let p2 = [triangle[2][0], triangle[2][1], triangle[2][2]];

        let ia = [userPos[0], userPos[1], userPos[2]];

        let p01 = VectorSub(p1, p0);
        let p02 = VectorSub(p2, p0);

        let p01xp02 = VectorCross(p01, p02);
        let ia_p0 = VectorSub(ia, p0);
        let denom = -VectorDot(iab, p01xp02);
        if(denom == 0){
            return -1;
        }
        let denomInverse = 1/denom;

        if(denomInverse == 0){
            denomInverse = 1 / (denom + 0.0001);
        }

        let t = VectorDot(p01xp02, ia_p0) * denomInverse;
        let u = VectorDot(VectorCross(p02, VectorNeg(iab)), ia_p0) * denomInverse;
        let v = VectorDot(VectorCross(VectorNeg(iab), p01), ia_p0) * denomInverse;

        //return[denom, denomInverse, u];

        if(t < 0){
            return -1;
        }

        if(u < 0 || u > 1){
            return -1;
        }

        if(v < 0 || v > 1){
            return -1;
        }

        if((u+v) > 1){
            return -1;
        }

        return t;
        //return VectorAdd(ia, VectorScale(t, iab));
    }

    public static getSurfaceNormal = function(points:number[][][], triangleNormal: number[]){
        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        let point = [points[i][j][0], points[i][j][1], points[i][j][2]];
        if(!(point[0] < 1000000000 && point[0] > -1000000000)){
            return [1/0,1/0,1/0];
        }

        return [triangleNormal[0], triangleNormal[1], triangleNormal[2]];
    }

    public static getCloserMesh = function(paramsA: number[][], paramsB: number[][], indexesA: number[][], indexesB: number[][]){
        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        let paramA = paramsA[i][j];
        let paramB = paramsB[i][j];

        let indexA = indexesA[i][j];
        let indexB = indexesB[i][j];

        if(!(paramA < 1000000000 && paramA > -1000000000)){
            return -1;
        }

        if(!(paramB < 1000000000 && paramB > -1000000000)){
            return -1;
        }

        if(paramA < paramB){
            return indexA;
        }

        return indexB;
    }


    public static populateMeshIndexArray = function(index: number){
        return index;
    }

    public static mergeMeshTriangleIntersectionsRecursively(intersections: number[][][], indexes: number[][][],
                                                                        meshMergeFunction: (a: number[][], b: number[][],
                                                                                            aInd: number[][], bInd: number[][])
                                                                            => number[][] ,
                                                                        start = 0, end = intersections.length - 1){

    };

}

export class Mesh{
    public triangles: Triangle[];
    normals:number[][] = [];
    constructor(triangles: Triangle[] = []) {
        this.triangles = triangles;
        this.calculateNormals();
    }

    calculateNormals(){
        this.normals = [];
        for (let i = 0; i < this.triangles.length; i++) {
            this.normals.push(this.triangles[i].getNormal());
        }
    }

}

export class Triangle{
    points: number[][];
    color: number[];

    get pointA(){
        return this.points[0];
    }
    get pointB(){
        return this.points[1];
    }
    get pointC(){
        return this.points[2];
    }

    constructor(pointA: number[], pointB: number[], pointC: number[], color = [0,0,0]) {
        this.points = [pointA, pointB, pointC];
        this.color = color;
    }

    public getNormal(){
        let v1 = VectorSub(this.pointB, this.pointA);
        let v2 = VectorSub(this.pointC, this.pointA);
        return VectorNormalize(VectorCross(v1,v2));
    }
}
