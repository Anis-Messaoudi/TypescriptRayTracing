import {
    VectorAdd,
    VectorCross,
    VectorDot,
    VectorNeg,
    VectorNorm,
    VectorNormalize,
    VectorScale,
    VectorSub
} from "./VectorMath";
import {Shape} from "./Shape";

export class SphereLogic {
    static getIntersectionPoints = function(rays: number[][][], userPos: number[],
             spherePos: number[], sphereRadius: number) {
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

        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        let ray = [rays[i][j][0], rays[i][j][1], rays[i][j][2]];
        let userSphereDifference = [spherePos[0] - userPos[0], spherePos[1] - userPos[1], spherePos[2] - userPos[2]];

        let dist: number = VectorNorm(VectorCross(userSphereDifference, ray)) / VectorNorm(ray);

        if (dist > sphereRadius) return -1;

        let oMc = VectorNeg(userSphereDifference);
        let xd = VectorNorm(oMc);
        let oMcNorm = VectorNorm(oMc);
        let u = VectorNormalize(ray);
        let delta2 = VectorNorm(oMc) * VectorNorm(oMc) - sphereRadius * sphereRadius;
        let delta = VectorDot(u, oMc) * VectorDot(u, oMc) - delta2;
        let deltaSqrt = Math.sqrt(delta);
        let d1 = -VectorDot(u, oMc) + deltaSqrt;
        let d2 = -VectorDot(u, oMc) - deltaSqrt;

        let t = 1;
        if (d2 < d1) {
            if (d2 > 0) {
                t = d2;
            }
            else if (d1 > 0) {
                t = d1;
            }
        } else {
            if (d1 > 0) {
                t = d1;
            }
            else if (d2 > 2) {
                t = d2;
            }
        }

        //return [d1,d2,0];

        return t;
        // let p = VectorAdd(userPos, VectorScale(t, u));

        // let normal = VectorSub(p, spherePos);
        // normal = VectorNormalize(normal);
        //
        // let lightVecFix = [lightVector[0], lightVector[1], lightVector[2]];
        // let lightIntensity = VectorDot(normal, VectorNeg(lightVecFix));

        // return p;
    }

    static getSurfaceNormal = function(points:number[][][], spherePos: number[]){
        function VectorSub(a: number[], b: number[]) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        }

        function VectorNormalize(a: number[]) {
            let norm = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
            if(norm == 0) return[0,0,0];
            return [a[0] / norm, a[1] / norm, a[2] / norm];
        }

        function VectorNorm(a: number[]) {
            return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
        }

        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        let point = [points[i][j][0], points[i][j][1], points[i][j][2]];
        if(!(point[0] < 1000000000 && point[0] > -1000000000)){
            return [1/0,1/0,1/0];
        }
        let normal:number[] = VectorSub(point, [spherePos[0], spherePos[1], spherePos[2]]);
        normal = VectorNormalize(normal);
        return normal;
    }

}

export class Sphere extends Shape{
    radius: number;
    position: number[];
    colorFunction: (pos: number[])=> (number[]);
    readonly reflectiveness: number;
    transparency: number;
    refractiveIndex: number;
    readonly type = 'sphere';
    constructor(radius: number, position: number[],
                properties: {
                    colorFunction?: (pos: number[])=> (number[]),
                    reflectiveness?: number,
                    normalAt?: (point: number[]) => (number[]),
                    tranparency?: number,
                    refractiveIndex?: number,
    } = {}) {
        super();
        this.radius = radius;
        this.position = position;

        if(properties.colorFunction != null){
            this.colorFunction = properties.colorFunction;
        }
        else {
            this.colorFunction = (pos: number[]) => [0.5,0.5,0.5];
        }

        if(properties.reflectiveness != null){
            this.reflectiveness = properties.reflectiveness;
            if(this.reflectiveness > 0.9){
                this.reflectiveness = 0.9;
            }
            else if(this.reflectiveness < 0){
                this.reflectiveness = 0;
            }
        }
        else {
            this.reflectiveness = 0.9;
        }


        if(properties.normalAt != null){
            this.normalAt = properties.normalAt;
        }
        else {
        }

        if(properties.tranparency != null){
            this.transparency = properties.tranparency;
        }
        else {
            this.transparency = 0;

            if(this.transparency > 0.9){
                this.transparency = 0.9;
            }
            else if(this.transparency < 0){
                this.transparency = 0;
            }
        }

        if(properties.refractiveIndex != null){
            this.refractiveIndex = properties.refractiveIndex;
        }
        else {
            this.refractiveIndex = 0;

            if(this.refractiveIndex < 0){
                this.refractiveIndex = 0;
            }
        }
    }

    normalAt = (point: number[]) => {
        let normal:number[] = VectorSub(point, this.position);
        normal = VectorNormalize(normal);
        return normal;
    }

    intersectsRay(source: number[], direction: number[]){
        let sourceSphereDifference = VectorSub(this.position, source);

        let dist: number = VectorNorm(VectorCross(sourceSphereDifference, direction)) / VectorNorm(direction);
        // ray distance from sphere bigger than radius => never intersects
        if(dist > this.radius){
            return false;
        }

        // source is inside sphere, will intersect
        if(VectorNorm(sourceSphereDifference) < this.radius * 0.99){
            return true;
        }

        // if the sphere is behind the ray source, we'll never intersect. Otherwise, we will
        return VectorDot(sourceSphereDifference, direction) >= 0;
    }
    firstTime = true;
    getRayIntersection(source: number[], direction: number[]){

        if(!this.intersectsRay(source, direction)) return -1;
        let userSphereDifference = VectorSub(this.position, source);



        let oMc = VectorNeg(userSphereDifference);
        let xd = VectorNorm(oMc);
        let oMcNorm = VectorNorm(oMc);
        let u = VectorNormalize(direction);
        let delta2 = VectorNorm(oMc) * VectorNorm(oMc) - this.radius * this.radius;
        let delta = VectorDot(u, oMc) * VectorDot(u, oMc) - delta2;
        let deltaSqrt = Math.sqrt(delta);
        let d1 = -VectorDot(u, oMc) + deltaSqrt;
        let d2 = -VectorDot(u, oMc) - deltaSqrt;



        let t = 1;
        if (d2 < d1) {
            if (d2 > 0.1) {
                t = d2;
            }
            else if (d1 > 0.1) {
                t = d1;
            }
        } else {
            if (d1 > 0.1) {
                t = d1;
            }
            else if (d2 > 0.1) {
                t = d2;
            }
        }

        //return [d1,d2,0];
        return t;
    }

    static getProjectedImageColourFunction(imgPixels: number[][][], imgWidth: number, imgHeight: number,
                                           opts: {
                                                xOffset?:number,
                                                tint?: number[]
                                            } = {}
    ){

        let xOffset = opts.xOffset? opts.xOffset: 0;
        let tint = opts.tint? opts.tint: [1,1,1];

        return  function(this: Sphere, point:number[]){
            let radius: number = this.radius;
            let center: number[] = this.position;
            let pointOnOrigin = VectorSub(point, center);
            pointOnOrigin = VectorNormalize(pointOnOrigin);
            let x = pointOnOrigin[0];
            let y = pointOnOrigin[1];
            let z = pointOnOrigin[2];
            let pi = Math.PI;
            let yAngle = Math.acos(y);
            let Y = imgHeight - Math.floor(yAngle / (pi) * imgHeight);
            if(Y < 0) Y = 0;
            if(Y >= imgHeight) Y = imgHeight - 1;
            if(imgPixels[Y] == undefined){
                console.log(imgHeight);
                console.log(imgWidth);
                console.log(y);
            }
            let xAngle = (Math.atan2(z,x) + pi + xOffset) % (2*pi);
            let X = Math.floor((xAngle / (2*pi)) * imgWidth);

            if(X < 0) X = 0;
            if(X >= imgWidth) X = imgWidth-1;
            let rgb = imgPixels[Y][X];
            // console.log("x: " + yX + ", y: " + yR + " = " + rgb[0] + ", " + rgb[1] + ", " + rgb[2]);
            let r = rgb[0]/255;
            let g = rgb[1]/255;
            let b = rgb[2]/255;
            r*=tint[0];
            g*=tint[1];
            b*=tint[2];
            return[r,g,b];
        };
    }

}
