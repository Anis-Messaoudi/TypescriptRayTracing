import {RayLogic} from "./RayLogic";
import {Shape} from "./Shape";
import {
    ReflectVectorOnAxis,
    VectorAdd,
    VectorDot,
    VectorIsNull,
    VectorMultiply,
    VectorNormalize,
    VectorScale,
    VectorSub
} from "./VectorMath";

export class RenderLogic{
    widthResolution: number;
    heightResolution: number;
    rays: number[][][] = [];

    shapes: Shape[] = [];
    constructor(widthResolution: number, heightResolution: number, opts:{} = {}) {
        this.heightResolution = heightResolution;
        this.widthResolution = widthResolution;
    }
    init(){
    }

    initializeRays(){
        let userPos = [0, 0, -50];
        let screen = {
            position: [0, 0, 0],
            width: 30,
            height: 20
        }

        this.widthResolution = 750;
        this.heightResolution = 500;

        let widthStep = screen.width / this.widthResolution;
        let heightStep = screen.height / this.heightResolution;

        let widthStart = screen.position[0] - screen.width / 2;
        let heightStart = screen.position[1] - screen.height / 2;

        let start = performance.now();

        for (let i = 0; i < this.heightResolution; i++) {
            this.rays[i] = [];
        }

        let initializeRayLogic = function(userPos: number[], screenPos: number[],
                                      widthStart: number, widthStep: number,
                                      heightStart: number, heightStep: number,
                                      dimensions:number[]){
            let result:number[][][] = [];
            let widthResolution = dimensions[0];
            let heightResolution = dimensions[1];
            for (let i = 0; i < heightResolution; i++) {
                result[i] = [];
                for (let j = 0; j < widthResolution; j++) {

                    let screenX = widthStart + widthStep * j;
                    let screenY = heightStart + heightStep * i;
                    let rayEnd = [screenX + screenPos[0], screenY + screenPos[1], screenPos[2]];
                    let rayStart = [userPos[0], userPos[1], userPos[2]];

                    result[i][j] = VectorNormalize([rayEnd[0] - rayStart[0], rayEnd[1] - rayStart[1], rayEnd[2] - rayStart[2]]);

                }
            }
            return result;
        }
            //this.gpu.createKernel(RayLogic.createRays).setOutput([this.widthResolution, this.heightResolution]);
        this.rays = initializeRayLogic(userPos, screen.position, widthStart, widthStep, heightStart, heightStep, [this.widthResolution, this.heightResolution]) as number[][][];

    }

    calculateIntersections(rays: number[][][],
                           // the reason that this is a function and not a matrix, is sometimes the source is one point: screen origin
                           raySource:(x: number, y:number) => number[],
                           rayIntensities: number[][],
                           ){

        let uncombinedIntersections: number[][][] = [];
        let uncombinedIndexes: number[][][] = [];

        for (let shapeIndex = 0; shapeIndex < this.shapes.length; shapeIndex++) {
            let shape = this.shapes[shapeIndex];
            let intersections: number[][] = [];
            let indexes: number[][] = [];

            for (let y = 0; y < this.heightResolution; y++) {
                intersections[y] = [];
                indexes[y] = [];
                for (let x = 0; x < this.widthResolution; x++) {
                    if(rayIntensities[y][x] < 0.1){
                        intersections[y][x] = -1;
                        indexes[y][x] = -1;
                    }
                    else if(VectorIsNull(rays[y][x])){
                        intersections[y][x] = -1;
                        indexes[y][x] = -1;
                    }
                    else {
                        let source = raySource(x, y);
                        if (shape.intersectsRay(source, rays[y][x])) {
                            intersections[y][x] = shape.getRayIntersection(source, rays[y][x]);
                            indexes[y][x] = shapeIndex;

                        } else {
                            intersections[y][x] = -1;
                            indexes[y][x] = -1;
                        }
                    }
                }
            }

            uncombinedIntersections.push(intersections);
            uncombinedIndexes.push(indexes);

        }

        while (uncombinedIntersections.length > 1) {
            let newIntersections: number[][][] = [];
            let newIndexes: number[][][] = [];

            for (let ind = 0; ind + 1 < uncombinedIntersections.length; ind += 2) {
                let intersectionsA = uncombinedIntersections[ind];
                let intersectionsB = uncombinedIntersections[ind + 1];
                let indexesA = uncombinedIndexes[ind];
                let indexesB = uncombinedIndexes[ind + 1];

                let resultingIntersections: number[][] = [];
                let resultingIndexes: number[][] = [];

                for (let i = 0; i < intersectionsA.length; i++) {
                    resultingIntersections[i] = [];
                    resultingIndexes[i] = [];
                    for (let j = 0; j < intersectionsA[i].length; j++) {
                        let paramA = intersectionsA[i][j];
                        let paramB = intersectionsB[i][j];

                        let indexA = indexesA[i][j];
                        let indexB = indexesB[i][j];

                        let resultingParam: number;
                        let resultingIndex: number;
                        if (paramA < 0) {
                            if (paramB < 0) {
                                resultingParam = -1;
                                resultingIndex = -1;
                            } else {
                                resultingParam = paramB;
                                resultingIndex = indexB;
                            }
                        } else {
                            if (paramB < 0) {
                                resultingParam = paramA;
                                resultingIndex = indexA;
                            } else {

                                if (paramA < paramB) {
                                    resultingParam = paramA;
                                    resultingIndex = indexA;
                                } else {
                                    resultingParam = paramB;
                                    resultingIndex = indexB;
                                }

                            }
                        }

                        resultingIndexes[i][j] = resultingIndex;
                        resultingIntersections[i][j] = resultingParam;

                    }
                }

                newIndexes.push(resultingIndexes);
                newIntersections.push(resultingIntersections);

            }


            if(uncombinedIntersections.length % 2 == 1){
                let last = uncombinedIntersections.length - 1;
                newIntersections.push(uncombinedIntersections[last]);
                newIndexes.push(uncombinedIndexes[last]);
            }

            uncombinedIndexes = newIndexes;
            uncombinedIntersections = newIntersections;



        }

        let combinedIntersections: number[][] = uncombinedIntersections[0];
        let combinedIndexes: number[][] = uncombinedIndexes[0];

        return {
            intersections: combinedIntersections,
            indexes: combinedIndexes
        }

    }

    calculateIntersectionPointCoordinates(rays: number[][][],
                                          intersections: number[][],
                                          // the reason that this is a function and not a matrix, is sometimes the source is one point: screen origin
                                          raySource:(x: number, y:number) => number[]){
        let intersectionPointCoordinates: number[][][] = [];
        let firstIntersection = true;
        for (let y = 0; y < intersections.length; y++) {
            intersectionPointCoordinates[y] = [];
            for (let x = 0; x < intersections[y].length; x++) {
                let t = intersections[y][x];
                if (t < 0) {
                    intersectionPointCoordinates[y][x] = [Infinity, Infinity, Infinity];
                    continue;
                }


                intersectionPointCoordinates[y][x] = VectorAdd(raySource(x,y), VectorScale(t, VectorNormalize(rays[y][x])));
            }
        }

        return intersectionPointCoordinates;
    }

    calculateNormals(intersectionPointCoordinates: number[][][], shapeIndexes: number[][]){
        let normals: number[][][] = [];


        for (let i = 0; i < intersectionPointCoordinates.length; i++) {
            normals[i] = [];
            for (let j = 0; j < intersectionPointCoordinates[i].length; j++) {
                let shapeIndex = shapeIndexes[i][j];
                if (shapeIndex < 0) {
                    normals[i][j] = [0, 0, 0];
                    continue;
                }
                let shape = this.shapes[shapeIndex];
                let intersectionPoint = intersectionPointCoordinates[i][j];
                if (!(intersectionPoint[0] < 1000000000 && intersectionPoint[0] > -1000000000)) {
                    normals[i][j] = [0, 0, 0];
                    continue;
                }
                normals[i][j] = shape.normalAt(intersectionPoint);
            }
        }

        return normals;
    }

    calculateReflectedRays(intersectionPointCoordinates: number[][][],
                           rays: number[][][],
                           shapeIndexes: number[][],
                           normals: number[][][],
                           totalRayIntensities: number[][],
                           ){

        let reflectedRayDirections: number[][][] = [];
        let reflectedRaySources: number[][][] = [];
        let reflectedRayIntensities: number[][] = [];

        let reflectionFound = false;
        let maxReflectionIntensity = 0;

        for (let i = 0; i < intersectionPointCoordinates.length; i++) {
            reflectedRayDirections[i] = [];
            reflectedRaySources[i] = [];
            reflectedRayIntensities[i]= [];
            for (let j = 0; j < intersectionPointCoordinates[i].length; j++) {
                let shapeIndex = shapeIndexes[i][j];
                if (shapeIndex < 0) {
                    reflectedRayDirections[i][j] = [0, 0, 0];
                    reflectedRaySources[i][j] = [Infinity, Infinity, Infinity];
                    reflectedRayIntensities[i][j] = 0;
                    totalRayIntensities[i][j] = 0;
                    continue;
                }
                let shape = this.shapes[shapeIndex];
                let intersectionPoint = intersectionPointCoordinates[i][j];
                if (!(intersectionPoint[0] < 1000000000 && intersectionPoint[0] > -1000000000)) {
                    reflectedRayDirections[i][j] = [0, 0, 0];
                    reflectedRaySources[i][j] = [Infinity, Infinity, Infinity];
                    reflectedRayIntensities[i][j] = 0;
                    totalRayIntensities[i][j] = 0;
                    continue;
                }
                reflectedRaySources[i][j] = intersectionPoint;
                reflectionFound = true;

                let ray = rays[i][j];
                let dot = VectorDot(ray, normals[i][j]);

                // reflecting the ray
                reflectedRayDirections[i][j] = VectorNormalize(VectorSub(ray, VectorScale(2 * dot, normals[i][j])));
                reflectedRayIntensities[i][j] = shape.reflectiveness;
                totalRayIntensities[i][j] *= shape.reflectiveness;
                if(totalRayIntensities[i][j] > maxReflectionIntensity){
                    maxReflectionIntensity = totalRayIntensities[i][j];
                }

            }
        }

        return {
            reflectedRayDirections,
            reflectedRaySources,
            reflectedRayIntensities,
            reflectionFound,
            maxReflectionIntensity
        }
    }

    calculateSurfaceColours(rays: number[][][],
                            normals: number[][][],
                            shapeIndexes: number[][],
                            intersectionPointCoordinates: number[][][],
                            lightDirectionFunc: (pos:number[]) => number[],
                            lightColorFunc: (pos:number[]) => number[],
                            ){
        let surfaceColours: number[][][] = [];
        let unshadedSurfaceColours: number[][][] = [];
        let lightColor: number[] = lightColorFunc([0,0,0]);
        let lightDirection: number[] = lightDirectionFunc([0, 0, 0]);

        for (let i = 0; i < normals.length; i++) {
            surfaceColours[i] = [];
            unshadedSurfaceColours[i] = [];
            for (let j = 0; j < normals[i].length; j++) {
                let normal = normals[i][j];
                if (VectorIsNull(normal)) {
                    surfaceColours[i][j] = [-1, -1, -1];
                    unshadedSurfaceColours[i][j] = [-1,-1,-1];

                } else {
                    let lightDot =  VectorDot(lightDirection, normal)
                    let lightVal = 1 - (1 - lightDot) * (1 - lightDot);

                    if(lightVal < 0.1){
                        lightVal = 0.1;
                    }

                    let intersectionPoint = intersectionPointCoordinates[i][j];

                    let ray = rays[i][j];
                    let reflectedRay = ReflectVectorOnAxis(ray, intersectionPoint, normal);
                    let reflectLightDot = VectorDot(reflectedRay, lightDirection);
                    let shapeIndex = shapeIndexes[i][j];
                    let shape = this.shapes[shapeIndex];
                    let glossFactor = (reflectLightDot - 0.9) * 10;
                    if (glossFactor < 0) glossFactor = 0;
                    glossFactor = glossFactor * glossFactor;

                    glossFactor *= shape.reflectiveness;

                    let applyGloss = true;

                    let source = intersectionPoint;
                    if (!VectorIsNull(lightDirection)) {
                        // if the resulting lightray will intersect another shape, don't apply gloss
                        let ind = 0;
                        for (let otherShape of this.shapes) {
                            ind++;
                            if (otherShape == shape) {
                                continue;
                            }
                            if (otherShape.intersectsRay(source, lightDirection)) {
                                applyGloss = false;
                                lightVal = 0.1;
                                break;
                            }
                        }
                    }
                    if (!applyGloss) {
                        glossFactor = 0;
                    }


                    let shapeColour = shape.colorFunction(intersectionPoint);
                    let baseColour = VectorAdd(VectorScale(1 - glossFactor, shapeColour), VectorScale(glossFactor, lightColor));
                    if (glossFactor == 0)
                        surfaceColours[i][j] = VectorScale(lightVal, VectorMultiply(lightColor, shapeColour));
                    else surfaceColours[i][j] = VectorScale(lightVal, VectorMultiply(lightColor, baseColour));

                    unshadedSurfaceColours[i][j] = shapeColour;

                }
            }
        }

        return {
            surfaceColours,
            unshadedSurfaceColours
        };
    }

}
