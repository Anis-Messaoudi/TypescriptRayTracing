/// <reference lib="webworker" />

import {
    VectorAdd,
    VectorDot,
    VectorIsNull,
    VectorMultiply,
    VectorNorm,
    VectorNormalize,
    VectorScale, VectorSub, VectorNeg
} from "./logic/VectorMath";
import {Sphere, SphereLogic} from "./logic/SphereLogic";
import {LightLogic} from "./logic/LightLogic";
import {RayLogic} from "./logic/RayLogic";
import {Mesh, MeshLogic, Triangle} from "./logic/MeshLogic";
import {RenderLogic} from "./logic/RenderLogic";
import {WorkerOptions, WorkerProgressResponse} from "./mainWorkerClasses";
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

addEventListener('message', async ({ data }) => {

    console.log('worker received message! starting!');

  let parameters = JSON.parse(data) as WorkerOptions;
  let imgData = parameters.imageDatas;


    let angle = 0;

    await delay(1000);


    let userPos = [0, 0, -50];
    let screen = {
        position: [0, 0, 0],
        width: 30,
        height: 20
    }

    let width = 5;
    let baseZ = 7 + width;



    let rays: number[][][] = [];

    let widthResolution = 750;
    let heightResolution = 500;

    let widthStep = screen.width / widthResolution;
    let heightStep = screen.height / heightResolution;

    let widthStart = screen.position[0] - screen.width / 2;
    let heightStart = screen.position[1] - screen.height / 2;

    let start = performance.now();

    for (let i = 0; i < heightResolution; i++) {
        rays[i] = [];
    }

        // gpu.createKernel(RayLogic.createRays).setOutput([widthResolution, heightResolution]);
    let dimensions = [widthResolution, heightResolution];

    let populateMatrixWithIndex = (index: number)=>{
        let res:number[][]= [];
        for (let i = 0; i < heightResolution; i++) {
            res[i] = []
            for (let j = 0; j < widthResolution; j++) {
                res[i][j] = index;
            }
        }
        return res;
    };

    let render = new RenderLogic(widthResolution, heightResolution);
    render.init();
    render.initializeRays();

    // rays = initializeRays(userPos, screen.position, widthStart, widthStep, heightStart, heightStep) as number[][][];
    rays = render.rays;

    console.log("rays");
    console.log(rays);

    let frames:number[][][][] = [];
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    let frameCount = 1;
    let currentFrame = 0;

    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>
    // ===============================>

    let pi = Math.PI;
    let cos = Math.cos;
    let sin = Math.sin;

    let roughNormalAt= function(this: Sphere, point:number[]){
        let radius: number = this.radius;
        let center: number[] = this.position;
        let pointOnOrigin = VectorSub(point, center);
        pointOnOrigin = VectorScale(1/radius, pointOnOrigin);
        let x = pointOnOrigin[0];
        let y = pointOnOrigin[1];
        let z = pointOnOrigin[2];
        let theta = Math.acos(y);
        let phi = (Math.atan2(z,x)) % (2*pi);
        //
        theta = Math.round(theta*5)/5;
        phi = Math.round(phi*5)/5;

        x = Math.sin(theta) * Math.cos(phi);
        z = Math.sin(theta) * Math.sin(phi);
        y = Math.cos(theta);

        return VectorNormalize([x,y,z]);
    }

    let inverseNormalAt = function(this: Sphere, point: number[]){
        let radius: number = this.radius;
        let center: number[] = this.position;
        let pointOnOrigin = VectorSub(point, center);
        pointOnOrigin = VectorScale(1/radius, pointOnOrigin);
        let x = pointOnOrigin[0];
        let y = pointOnOrigin[1];
        let z = pointOnOrigin[2];

        return[-x,-y,-z];
    }

    function hsv2rgb(h: number,s: number,v: number)
    {
        let f= (n: number,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);
        return [f(5),f(3),f(1)];
    }



    let metalData = imgData[0]


    let metalWidth = metalData.width;
    let metalHeight = metalData.height;
    let metalPixels = metalData.pixels;

    let earthData = imgData[1];

    let earthWidth = earthData.width;
    let earthHeight = earthData.height;
    let earthPixels = earthData.pixels;

    let startTime = performance.now();
    let longestFrameTime = 0;


    console.log('metal data');
    console.log(metalData);

    console.log('earth data');
    console.log(earthData);


    let normalMetalBallColour = Sphere.getProjectedImageColourFunction(metalPixels, metalWidth, metalHeight);
    let redMetalBallColour = Sphere.getProjectedImageColourFunction(metalPixels, metalWidth, metalHeight, {tint: [1,0.3,0.3]});
    let yellowMetalBallColour = Sphere.getProjectedImageColourFunction(metalPixels, metalWidth, metalHeight, {tint: [1,1,0.3]});
    let cyanMetalBallColour = Sphere.getProjectedImageColourFunction(metalPixels, metalWidth, metalHeight, {tint: [0.2,0.8,1]});


    do {
        let frameStartTime = performance.now();
        angle = (currentFrame) / (frameCount) * 2 * pi;
        let xPos = cos(angle);
        let zPos = sin(angle);

        let phi = angle;
        let theta = (currentFrame * 2 / frameCount * 2 * pi) % (2 * pi);

        let smallX = 12 * cos(-phi);
        let smallZ = 12 * sin(-phi);

        currentFrame++;
        console.log("frame " + currentFrame + " out of " + frameCount + " started");

        let earthBallColour = Sphere.getProjectedImageColourFunction(earthPixels, earthWidth, earthHeight, {xOffset: 2*pi-angle});
        let hsvColourAt = function (this: Sphere, point: number[]) {
            let radius: number = this.radius;
            let center: number[] = this.position;
            let pointOnOrigin = VectorSub(point, center);
            pointOnOrigin = VectorScale(1 / radius, pointOnOrigin);
            let x = pointOnOrigin[0];
            let y = pointOnOrigin[1];
            let z = pointOnOrigin[2];
            let theta = Math.acos(y);
            let phi = (Math.atan2(z, x) + angle + pi) % (2 * pi);
            return hsv2rgb(phi / pi * 360, theta / pi, 1);

        }

        let hsvColourWhirlyAt = function (this: Sphere, point: number[]) {
            let radius: number = this.radius;
            let center: number[] = this.position;
            let pointOnOrigin = VectorSub(point, center);
            pointOnOrigin = VectorScale(1 / radius, pointOnOrigin);
            let x = pointOnOrigin[0];
            let y = pointOnOrigin[1];
            let z = pointOnOrigin[2];
            let theta = Math.acos(y);
            let phi = (Math.atan2(z, x) + angle + pi) % (2 * pi);

            return hsv2rgb((phi*theta*2*((currentFrame+frameCount)/frameCount)) / pi * 360, theta / pi, 1);

        }

        let roughNormalCount = 4 + Math.floor((currentFrame)/5);

        let roughNormalVerticalAt = function(this: Sphere, point:number[]){
            let radius: number = this.radius;
            let center: number[] = this.position;
            let pointOnOrigin = VectorSub(point, center);
            pointOnOrigin = VectorScale(1/radius, pointOnOrigin);
            let x = pointOnOrigin[0];
            let y = pointOnOrigin[1];
            let z = pointOnOrigin[2];
            let theta = Math.acos(y);
            let phi = (Math.atan2(z,x)) % (2*pi);
            //
            theta = Math.round(theta*roughNormalCount)/roughNormalCount;
            //phi = Math.round(phi*roughNormalCount)/roughNormalCount;

            x = Math.sin(theta) * Math.cos(phi);
            z = Math.sin(theta) * Math.sin(phi);
            y = Math.cos(theta);

            return VectorNormalize([x,y,z]);
        }

        let roughNormalHorizontalAt = function(this: Sphere, point:number[]){
            let radius: number = this.radius;
            let center: number[] = this.position;
            let pointOnOrigin = VectorSub(point, center);
            pointOnOrigin = VectorScale(1/radius, pointOnOrigin);
            let x = pointOnOrigin[0];
            let y = pointOnOrigin[1];
            let z = pointOnOrigin[2];
            let theta = Math.acos(y);
            let phi = (Math.atan2(z,x)) % (2*pi);
            //
            //theta = Math.round(theta*roughNormalCount)/roughNormalCount;
            phi = Math.round(phi*roughNormalCount)/roughNormalCount;

            x = Math.sin(theta) * Math.cos(phi);
            z = Math.sin(theta) * Math.sin(phi);
            y = Math.cos(theta);

            return VectorNormalize([x,y,z]);
        }


        let ratio = cos(angle);
        let radius1 = 7 - ratio * 2;
        let radius2 = 4 + ratio * 3;
        let spheres: Sphere[] = [
            new Sphere(5, [0,0,2], {colorFunction: normalMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(angle/8),8*sin(angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(pi/4+angle/8),8*sin(pi/4+angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(2*pi/4+angle/8),8*sin(2*pi/4+angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(3*pi/4+angle/8),8*sin(3*pi/4+angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(4*pi/4+angle/8),8*sin(4*pi/4+angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(5*pi/4+angle/8),8*sin(5*pi/4+angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(6*pi/4+angle/8),8*sin(6*pi/4+angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [8*cos(7*pi/4+angle/8),8*sin(7*pi/4+angle/8),2], {colorFunction: redMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(angle/12),0,12*sin(angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(pi/6+angle/12),0,12*sin(pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(2*pi/6+angle/12),0,12*sin(2*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(3*pi/6+angle/12),0,12*sin(3*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(4*pi/6+angle/12),0,12*sin(4*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(5*pi/6+angle/12),0,12*sin(5*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(6*pi/6+angle/12),0,12*sin(6*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(7*pi/6+angle/12),0,12*sin(7*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(8*pi/6+angle/12),0,12*sin(8*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(9*pi/6+angle/12),0,12*sin(9*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(10*pi/6+angle/12),0,12*sin(10*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            new Sphere(2, [12*cos(11*pi/6+angle/12),0,12*sin(11*pi/6+angle/12)+2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
          //  new Sphere(5, [xPos*10,0,2+zPos*10], {colorFunction: normalMetalBallColour, reflectiveness: 1}),
            // new Sphere(4, [xPos, 0, 10+zPos], {colorFunction: () => ([0.95, 0.8, 0.6]), reflectiveness: 0.9}),
            // new Sphere(2, [0, zPos/2, 10+xPos/2], {colorFunction: () => [0.8, 0.6, 0.95], reflectiveness: 0.9}),
            // new Sphere(2, [0, -zPos/2, 10-xPos/2], {colorFunction: () => [0.95, 0.6, 0.95], reflectiveness: 0.9}),
            // new Sphere(4, [-xPos, 0, 10-zPos], {colorFunction: ()=>([0.6,0.8,0.95]), reflectiveness: 0.9}),
            // new Sphere(30, [-42, 0, 10], {colorFunction: ()=>([0.95,0.95,0.95]), reflectiveness: 0.9}),
            // new Sphere(30, [42, 0, 10], {colorFunction: ()=>([0.95,0.95,0.95]), reflectiveness: 0.9})

            //
            // new Sphere(6, [-10*zPos, -7, 10*xPos], {colorFunction: hsvColourAt, reflectiveness: 1}),
            // new Sphere(4, [-12, 4, 2], {colorFunction: normalMetalBallColour, reflectiveness: 1}),
            // new Sphere(6, [0, 0, 2], {colorFunction: earthBallColour, reflectiveness: 0}),
            // new Sphere(100, [0, 109, 2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            //  new Sphere(10, [15, -5, 2], {colorFunction: ()=>[1,0.6,0.6], reflectiveness: 0.75}),
            // new Sphere(2, [-12, 4-4*zPos, 2], {colorFunction: yellowMetalBallColour, reflectiveness: 1}),
            //  new Sphere(90, [0, 98, 2], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
            //  new Sphere(200, [0, -210, -210], {colorFunction: cyanMetalBallColour, reflectiveness: 1}),
        ];

        render.shapes = spheres;

        let reflectionFound = true;

        let calculatedColours: number[][][][] = [];
        let calculatedUnshadedColours: number[][][][] = [];
        let calculatedIntensities: number[][][] = [];
        let totalRayIntensities = populateMatrixWithIndex(1) as number[][];

        let currentRays = rays;
        let currentRaySource = (x: number,y: number)=>userPos
        let bounceCount = 0;
        let maxReflectionIntensity = 1;
        do{
            let intersectionResults = render.calculateIntersections(currentRays, currentRaySource, totalRayIntensities);

            let intersections: number[][] = intersectionResults.intersections;
            let indexes: number[][] = intersectionResults.indexes;
            let intersectionPointCoordinates: number[][][] = render.calculateIntersectionPointCoordinates(currentRays, intersections, currentRaySource);

            // console.log("intersectionPointCoordinates");
            // console.log(intersectionPointCoordinates);

            let normals = render.calculateNormals(intersectionPointCoordinates, indexes);
            let reflectionResult = render.calculateReflectedRays(intersectionPointCoordinates, currentRays, indexes, normals, totalRayIntensities);

            let reflectedRayDirections: number[][][] = reflectionResult.reflectedRayDirections;
            let reflectedRaySources: number[][][] = reflectionResult.reflectedRaySources;
            let reflectedRayIntensities: number[][] = reflectionResult.reflectedRayIntensities;
            maxReflectionIntensity = reflectionResult.maxReflectionIntensity;
            bounceCount++;
            // console.log("normals");
            // console.log(normals);

            let lightColor: number[] = [1, 1, 1];
            let lightDirection: number[] = VectorNormalize([1, -1, -1]);


            let colorResults = render.calculateSurfaceColours(currentRays, normals, indexes, intersectionPointCoordinates,
                ()=>lightDirection, ()=>lightColor
            );

            let surfaceColours: number[][][] = colorResults.surfaceColours;
            let unshadedColours: number[][][] = colorResults.unshadedSurfaceColours;

            calculatedColours.push(surfaceColours);
            calculatedUnshadedColours.push(unshadedColours);
            calculatedIntensities.push(reflectedRayIntensities);

            currentRaySource = (x: number, y: number)=>(reflectedRaySources[y][x]);
            currentRays = reflectedRayDirections;

        }while(maxReflectionIntensity > 0.1);


        let finalColours:number[][][] = [];

        let backgroundColour: number[] = [0.2,0.2,0.2];

        for (let y = 0; y < heightResolution; y++) {
            finalColours[y] = [];
            for (let x = 0; x < widthResolution; x++) {
                let firstIndex = -1;
                for (let i = calculatedIntensities.length - 1; i >= 0; i--) {
                    let col = calculatedColours[i][y][x];
                    if(col[0] == -1) continue;
                    firstIndex = i;
                    break;
                }

                if(firstIndex == -1){
                    finalColours[y][x] = backgroundColour;
                    continue;
                }

                if(firstIndex == 0){
                    finalColours[y][x] = calculatedColours[firstIndex][y][x];
                    continue;
                }

                let previousColour = calculatedColours[firstIndex][y][x];

                for (let i = firstIndex - 1; i >=0 ; i--) {

                    let newColour = calculatedColours[i][y][x];
                    let coeff = calculatedIntensities[i][y][x];
                    let unshadedColour = calculatedUnshadedColours[i][y][x];

                    let previousCombinedColour = VectorMultiply(unshadedColour, previousColour);

                    let resultingColour  = VectorAdd(VectorScale(1 - coeff, newColour), VectorScale(coeff, previousCombinedColour));
                    previousColour = resultingColour;

                }

                finalColours[y][x] = previousColour;

            }
        }

        let frameEndTime = performance.now();
        let timeTakenFrame = frameEndTime - frameStartTime;
        console.log('frame ' + currentFrame + ' out of ' + frameCount + ' finished in ' + timeTakenFrame.toFixed(0) + 'ms');
        let totalTimeToNow = performance.now() - startTime;
        let estimatedTotalTimeLeft = (totalTimeToNow/currentFrame) * frameCount - totalTimeToNow;
        if(timeTakenFrame > longestFrameTime) longestFrameTime = timeTakenFrame;
        let worstEstimatedTotalTimeLeft = (frameCount - currentFrame) * longestFrameTime;
        console.log("estimated time left: " + estimatedTotalTimeLeft.toFixed(0) + 'ms');
        console.log("for frame " + currentFrame + " calculated " + bounceCount + " bounces");

        let progressResponse: WorkerProgressResponse = {
            percentage: (currentFrame/frameCount) * 100,
            isDone: false,
            worstTimeLeft: worstEstimatedTotalTimeLeft,
            averageTimeLeft: estimatedTotalTimeLeft,
            frames: []
        }

        postMessage(JSON.stringify(progressResponse));
        frames.push(finalColours);
    }while(currentFrame < frameCount)

    let finalResponse: WorkerProgressResponse = {
        percentage: 100,
        isDone: true,
        worstTimeLeft: 0,
        averageTimeLeft: 0,
        frames: frames
    }

    postMessage(JSON.stringify(finalResponse));

});

