import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
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
import {WorkerImageData, WorkerOptions, WorkerProgressResponse} from "./mainWorkerClasses"
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

    fpsCount: number = 0;

    @ViewChild("canvasElement") canvasElementRef: ElementRef | undefined;
    @ViewChild("framesCanvasElement") framesCanvasElementRef: ElementRef | undefined;
    context: CanvasRenderingContext2D = null;
    framesContext: CanvasRenderingContext2D = null;
    imgDatas: ImageData[] = [];

    animationRunning = false;
    progress: number = 0;
    vidUrl: SafeUrl = null;

    currentFrame = 0;
    frameCount = 0;


    constructor(private sanitizer: DomSanitizer) {

    }


    public async ngOnInit() {

        await delay(100);


        let width = 750;
        let height = 500;

        this.getCanvasContext(width, height);

        const worker = new Worker(new URL('./main.worker', import.meta.url));
        worker.onmessage = ({ data }) => {
            let response = JSON.parse(data) as WorkerProgressResponse;
            if(response.isDone){
                this.animationRunning = true;
                let frames = response.frames;
                console.log('received frames! ');
                console.log(frames);
                let imgDatas: ImageData[] = [];
                for (const frame of frames) {

                    imgDatas.push(this.renderRGBCanvas(width, height, frame));
                }
                this.imgDatas = imgDatas;
                this.frameCount = imgDatas.length;
                this.currentFrame = 1;
                this.renderPreviousFrame();
                //this.convertImagesToVid(imgDatas, width, height, {fps:30});
                this.animationLoop(imgDatas, {fps:30});
                this.progress = response.percentage;
            }
            else {
                this.progress = response.percentage;
                console.log('progress: ' + response.percentage.toFixed(2) + '%, estimated time left: '
                    + response.averageTimeLeft.toFixed(0) + ', worst time left: ' + response.worstTimeLeft.toFixed(0));
            }
        }

        let offset = 0;
        window.onkeyup = async (event)=>{
            if(event.key.toLowerCase() == 'arrowup'){
                if(this.imgDatas.length == 0) return;
                let link = document.createElement('a');
                link.download = (offset + this.currentFrame) + '.png';
                link.href = this.framesCanvasElementRef.nativeElement.toDataURL()
                link.click();
            }
            if(event.key.toLowerCase() == 'arrowleft'){
                this.renderPreviousFrame();
            }
            if(event.key.toLowerCase() == 'arrowright'){
                this.renderNextFrame();
            }
            if(event.key.toLowerCase() == 'arrowdown'){
                if(this.imgDatas.length == 0) return;
                for(let i=0; i<this.imgDatas.length; i++){
                    let link = document.createElement('a');
                    link.download = (offset + this.currentFrame) + '.png';
                    link.href = this.framesCanvasElementRef.nativeElement.toDataURL()
                    link.click();
                    this.renderNextFrame();
                    await delay(300);
                }
            }
        }


        let metalImage = new Image();
        let earthImage = new Image();

        let metalCanvas = document.createElement('canvas');
        let metalContext = metalCanvas.getContext("2d", { willReadFrequently: true });

        let earthCanvas = document.createElement('canvas');
        let earthContext = earthCanvas.getContext('2d', { willReadFrequently: true });

        metalImage.onload = () => {
            metalCanvas.width = metalImage.width;
            metalCanvas.height = metalImage.height;
            metalContext.drawImage(metalImage,0,0);
        }

        earthImage.onload = () => {
            earthCanvas.width = earthImage.width;
            earthCanvas.height = earthImage.height;
            earthContext.drawImage(earthImage,0,0);
        }

        //img.src = 'assets/Blue_Marble_2002.png';
        metalImage.src = 'assets/titanium-texture.jpg';

        let angle = 0;

        await delay(1000);

        let metalImgData = metalContext.getImageData(0,0, metalCanvas.width, metalCanvas.height).data;
        let metalPixels: number[][][] = [];
        console.log('copying pixels...');

        for (let y = 0; y < metalCanvas.height; y++) {
            metalPixels[y] = [];
        }

        for (let i = 0; i + 3 < metalImgData.length; i+=4) {
            let pos = i/4;
            let y = Math.floor(pos / metalCanvas.width);
            let x = pos % metalCanvas.width;
            metalPixels[y][x] = [metalImgData[i],metalImgData[i + 1],metalImgData[i + 2]];
        }
        console.log('metal pixels copied!');


        earthImage.src = 'assets/Blue_Marble_2002.png';

        await delay(1000);

        let earthImgData = earthContext.getImageData(0,0,earthCanvas.width, earthCanvas.height).data;
        let earthPixels: number[][][] = [];

        for (let y = 0; y < earthCanvas.height; y++) {
            earthPixels[y] = [];
        }

        for (let i = 0; i + 3 < earthImgData.length; i+=4) {
            let pos = i/4;
            let y = Math.floor(pos / earthCanvas.width);
            let x = pos % earthCanvas.width;
            earthPixels[y][x] = [earthImgData[i],earthImgData[i + 1],earthImgData[i + 2]];
        }

        console.log('earth pixels copied!');

        let metalImageData: WorkerImageData = {
            height: metalImage.height,
            width: metalImage.width,
            pixels: metalPixels,
        }

        let earthImageData: WorkerImageData = {
            height: earthImage.height,
            width: earthImage.width,
            pixels: earthPixels
        }

        let workerOptions: WorkerOptions = {
            imageDatas: [
                metalImageData,
                earthImageData,
            ]
        }
        console.log('sending message to worker...');
        worker.postMessage(JSON.stringify(workerOptions));

    }

    renderPreviousFrame(){
        this.currentFrame = (this.currentFrame - 1 + this.frameCount) % (this.frameCount);
        this.renderFrameInContext(this.imgDatas[this.currentFrame], this.framesContext);
    }

    renderNextFrame(){
        this.currentFrame = (this.currentFrame + 1) % (this.frameCount);
        this.renderFrameInContext(this.imgDatas[this.currentFrame], this.framesContext);
    }

    getRotatingColorfulSphereExample1(angle: number){
        let xPos = 7 * Math.cos(angle);
        let zPos = 7 * Math.sin(angle);

        return [
            new Sphere(4, [xPos, 0, 10+zPos], {colorFunction: () => ([0.95, 0.8, 0.6]), reflectiveness: 0.9}),
            new Sphere(2, [0, zPos/2, 10+xPos/2], {colorFunction: () => [0.8, 0.6, 0.95], reflectiveness: 0.9}),
            new Sphere(2, [0, -zPos/2, 10-xPos/2], {colorFunction: () => [0.95, 0.6, 0.95], reflectiveness: 0.9}),
            new Sphere(4, [-xPos, 0, 10-zPos], {colorFunction: ()=>([0.6,0.8,0.95]), reflectiveness: 0.9}),
            new Sphere(30, [-42, 0, 10], {colorFunction: ()=>([0.95,0.95,0.95]), reflectiveness: 0.9}),
            new Sphere(30, [42, 0, 10], {colorFunction: ()=>([0.95,0.95,0.95]), reflectiveness: 0.9}),
        ]
    }

    async renderCubeExample(){
        //
        // await delay(1000);
        // let gpu = new GPU();
        // console.log(gpu);
        //
        // let rays: number[][][] = [];
        //
        // let userPos = [0, 0, 0];
        // let screen = {
        //     position: [0, 0, 5],
        //     width: 15,
        //     height: 10
        // }
        //
        // let width = 5;
        // let baseZ = 7 + width;
        // let p0 = [width, width, baseZ + width];
        // let p1 = [-width, width, baseZ + width];
        // let p2 = [-width, -width, baseZ + width];
        // let p3 = [width, -width, baseZ + width];
        //
        // let p4 = [width, width, baseZ - width];
        // let p5 = [-width, width, baseZ - width];
        // let p6 = [-width, -width, baseZ - width];
        // let p7 = [width, -width, baseZ - width];
        //
        // let imgDatas: ImageData[] = [];
        // let pi = Math.PI;
        // let sqrt2 = Math.SQRT2;
        // let frameCount = 144;
        // console.log("beginning rendering frames");
        //
        //
        // let widthResolution = 750;
        // let heightResolution = 500;
        //
        // let widthStep = screen.width / widthResolution;
        // let heightStep = screen.height / heightResolution;
        //
        // let widthStart = screen.position[0] - screen.width / 2;
        // let heightStart = screen.position[1] - screen.height / 2;
        //
        // let start = performance.now();
        //
        // for (let i = 0; i < heightResolution; i++) {
        //     rays[i] = [];
        // }
        //
        // let initializeRays = gpu.createKernel(RayLogic.createRays).setOutput([widthResolution, heightResolution]);
        // rays = initializeRays(userPos, screen.position, widthStart, widthStep, heightStart, heightStep) as number[][][];
        // console.log("rays");
        // console.log(rays);
        //
        //
        // for (let i = 0; i < frameCount; i++) {
        //
        //     let baseAngle = i * 2.5 * pi / 180;
        //     let corner1Angle = (baseAngle + pi/4) % (2*pi);
        //     let corner2Angle = (baseAngle + 3*pi/4) % (2*pi);
        //     let corner3Angle = (baseAngle + 5*pi/4) % (2*pi);
        //     let corner4Angle = (baseAngle + 7*pi/4) % (2*pi);
        //
        //     let corner1X = sqrt2 * width * Math.cos(corner1Angle);
        //     let corner1Z = sqrt2 * width * Math.sin(corner1Angle);
        //
        //     let corner2X = sqrt2 * width * Math.cos(corner2Angle);
        //     let corner2Z = sqrt2 * width * Math.sin(corner2Angle);
        //
        //     let corner3X = sqrt2 * width * Math.cos(corner3Angle);
        //     let corner3Z = sqrt2 * width * Math.sin(corner3Angle);
        //
        //     let corner4X = sqrt2 * width * Math.cos(corner4Angle);
        //     let corner4Z = sqrt2 * width * Math.sin(corner4Angle);
        //     // console.log("base angle: " + baseAngle);
        //     // console.log("corner 1 angle: " + corner1Angle);
        //     // console.log("corner 3 angle: " + corner3Angle);
        //     // console.log("x: " + corner3X + ", z:" + corner3Z);
        //
        //     p0 = [corner1X, width, baseZ + corner1Z];
        //     p1 = [corner2X, width, baseZ + corner2Z];
        //     p2 = [corner2X, -width, baseZ + corner2Z];
        //     p3 = [corner1X, -width, baseZ + corner1Z];
        //
        //     p4 = [corner4X, width, baseZ + corner4Z];
        //     p5 = [corner3X, width, baseZ + corner3Z];
        //     p6 = [corner3X, -width, baseZ + corner3Z];
        //     p7 = [corner4X, -width, baseZ + corner4Z];
        //
        //     let triangles: Triangle[] = [
        //         new Triangle(p0, p1, p2, [1, 0.7, 0.7]),
        //         new Triangle(p0, p3, p2, [0.7, 1, 0.7]),
        //         new Triangle(p0, p4, p7, [0.7, 0.7, 1]),
        //         new Triangle(p0, p3, p7, [0.85, 0.85, 0.5]),
        //         new Triangle(p0, p1, p5, [0.85, 0.5, 0.85]),
        //         new Triangle(p0, p4, p5, [0.5, 0.85, 0.85]),
        //         new Triangle(p1, p2, p6, [1, 0.8, 0.5]),
        //         new Triangle(p1, p5, p6, [0.5, 1, 0.8]),
        //         new Triangle(p3, p7, p6, [0.8, 0.5, 1]),
        //         new Triangle(p3, p2, p6, [1, 0.5, 0.8]),
        //         new Triangle(p4, p5, p6, [1, 0, 0]),
        //         new Triangle(p4, p7, p6, [0, 1, 0])
        //     ]
        //
        //     let mesh = new Mesh(triangles);
        //     mesh.calculateNormals();
        //
        //
        //
        //     let dimensions = [widthResolution, heightResolution];
        //     let calculateRayIntersections = gpu.createKernel(MeshLogic.getIntersectionPoints,).setOutput(dimensions);
        //     let calculateIntersectionNormals = gpu.createKernel(MeshLogic.getSurfaceNormal).setOutput(dimensions);
        //     let calculateFlatSurfaceColours = gpu.createKernel(LightLogic.calculateColoursAbsoluteLightFlatSurface).setOutput(dimensions);
        //     let calculateVariableSurfaceColours = gpu.createKernel(LightLogic.calculateColoursAbsoluteLightVariableSurface).setOutput(dimensions);
        //     let triangleIntersections: number[][][] = [];
        //     for (let i = 0; i < mesh.triangles.length; i++) {
        //         let triangle = mesh.triangles[i];
        //
        //         let intersections = calculateRayIntersections(rays, userPos, triangle.points) as number[][];
        //         //console.log("intersections");
        //         //console.log(intersections);
        //         triangleIntersections.push(intersections);
        //         // let normals = calculateIntersectionNormals(intersections, triangle.getNormal()) as number[][][];
        //         // console.log("normals");
        //         // console.log(normals);
        //
        //     }
        //
        //     let populateMeshIndexes = gpu.createKernel(MeshLogic.populateMeshIndexArray).setOutput(dimensions);
        //     let triangleIndexes: number[][][] = [];
        //     for (let i = 0; i < triangleIntersections.length; i++) {
        //         let indexArray = populateMeshIndexes(i) as number[][];
        //         triangleIndexes.push(indexArray);
        //     }
        //
        //     while (triangleIndexes.length > 1) {
        //         let newTriangleIndexes: number[][][] = [];
        //         let newTriangleIntersections: number[][][] = [];
        //
        //         for (let i = 0; i + 1 < triangleIntersections.length; i += 2) {
        //             //console.log("merging " + i + " and " + (i + 1) + " out of " + triangleIntersections.length);
        //             let intersectionsA = triangleIntersections[i];
        //             let intersectionsB = triangleIntersections[i + 1];
        //
        //             let indexesA = triangleIndexes[i];
        //             let indexesB = triangleIndexes[i + 1];
        //
        //             let intersectionsResult: number[][] = [];
        //             let indexesResult: number[][] = [];
        //
        //             for (let k = 0; k < intersectionsA.length; k++) {
        //                 intersectionsResult[k] = [];
        //                 indexesResult[k] = [];
        //             }
        //
        //             for (let y = 0; y < intersectionsA.length; y++) {
        //                 for (let x = 0; x < intersectionsA[0].length; x++) {
        //                     let interA = intersectionsA[y][x];
        //                     let interB = intersectionsB[y][x];
        //                     if ((interA) < 0) {
        //                         if ((interB) < 0) {
        //                             intersectionsResult[y][x] = -1;
        //                             indexesResult[y][x] = -1;
        //                         } else {
        //                             intersectionsResult[y][x] = interB;
        //                             indexesResult[y][x] = indexesB[y][x];
        //                         }
        //                     } else {
        //                         if ((interB) < 0) {
        //                             intersectionsResult[y][x] = interA;
        //                             indexesResult[y][x] = indexesA[y][x];
        //                         } else {
        //
        //                             if (interA < interB) {
        //                                 intersectionsResult[y][x] = interA;
        //                                 indexesResult[y][x] = indexesA[y][x];
        //                             } else {
        //                                 intersectionsResult[y][x] = interB;
        //                                 indexesResult[y][x] = indexesB[y][x];
        //                             }
        //
        //                         }
        //                     }
        //                 }
        //             }
        //
        //             newTriangleIndexes.push(indexesResult);
        //             newTriangleIntersections.push(intersectionsResult);
        //         }
        //
        //         if (triangleIntersections.length % 2 == 1) {
        //             let len = triangleIntersections.length;
        //             newTriangleIntersections.push(triangleIntersections[len - 1]);
        //             newTriangleIndexes.push(triangleIndexes[len - 1]);
        //         }
        //
        //         triangleIntersections = newTriangleIntersections;
        //         triangleIndexes = newTriangleIndexes;
        //
        //     }
        //
        //     let indexes = triangleIndexes[0];
        //     let normals: number[][][] = [];
        //     let intersectionColors: number[][][] = [];
        //
        //     for (let i = 0; i < indexes.length; i++) {
        //         normals[i] = [];
        //         intersectionColors[i] = [];
        //         for (let j = 0; j < indexes[0].length; j++) {
        //             let index = indexes[i][j];
        //             if (index > 0) {
        //                 normals[i][j] = mesh.normals[index];
        //                 intersectionColors[i][j] = mesh.triangles[index].color;
        //             } else {
        //                 normals[i][j] = [1 / 0, 1 / 0, 1 / 0];
        //                 intersectionColors[i][j] = [1 / 0, 1 / 0, 1 / 0];
        //             }
        //         }
        //     }
        //
        //     // console.log("indexes");
        //     // console.log(triangleIndexes);
        //     // console.log("intersections");
        //     // console.log(triangleIntersections);
        //
        //     let lightVector = [-1, 1, -1];
        //     lightVector = VectorNormalize(lightVector);
        //     let lightColour = [1, 1, 1];
        //
        //     let colours = calculateVariableSurfaceColours(normals, rays, lightVector, lightColour, intersectionColors) as number[][][];
        //     let img = this.renderRGBCanvas(widthResolution, heightResolution, colours);
        //     imgDatas.push(img);
        //     console.log("frame " + (i + 1) + "out of" + frameCount + " rendered!");
        //     // console.log(colours);
        //     // console.log("imgdata");
        //     // console.log(img);
        // }

    }

    async renderSphereExample(){
        //
        // let gpu = new GPU();
        // console.log(gpu);
        //
        // let sphere = {
        //     position: [5, 0, 10],
        //     radius: 5,
        //     color: [1,0.2,0.2]
        // };
        //
        // let userPos = [0, 0, 0];
        // let screen = {
        //     position: [0, 0, 5],
        //     width: 15,
        //     height: 10
        // }
        //
        // let rays: number[][][] = [];
        //
        // let widthResolution = 750;
        // let heightResolution = 500;
        //
        // let widthStep = screen.width / widthResolution;
        // let heightStep = screen.height / heightResolution;
        //
        // let widthStart = screen.position[0] - screen.width / 2;
        // let heightStart = screen.position[1] - screen.height / 2;
        //
        // let start = performance.now();
        //
        // for (let i = 0; i < heightResolution; i++) {
        //     rays[i] = [];
        // }
        //
        // let initializeRays = gpu.createKernel(RayLogic.createRays).setOutput([widthResolution, heightResolution]);
        //
        // rays = initializeRays(userPos, screen.position, widthStart, widthStep, heightStart, heightStep) as number[][][];
        // console.log(rays);
        //
        // let initializeDone = performance.now();
        //
        // let dimensions = [widthResolution, heightResolution];
        // let calculateRayIntersections = gpu.createKernel(SphereLogic.getIntersectionPoints).setOutput(dimensions);
        // let calculateIntersectionNormals = gpu.createKernel(SphereLogic.getSurfaceNormal).setOutput(dimensions);
        // let calculateSurfaceColours = gpu.createKernel(LightLogic.calculateColoursAbsoluteLightFlatSurface).setOutput(dimensions);
        // let intersectionsDone = performance.now();
        //
        // let iter = 0;
        // let startStamp = performance.now();
        // let fpsCounter = 0;
        // fpsCounter++;
        // if (performance.now() - startStamp > 1000) {
        //     this.fpsCount = fpsCounter;
        //     fpsCounter = 0;
        //     startStamp = performance.now();
        // }
        //
        // let intersections = calculateRayIntersections(rays, userPos, sphere.position, sphere.radius) as number[][][];
        // console.log("intersections");
        // console.log(intersections);
        // let normals = calculateIntersectionNormals(intersections, sphere.position) as number[][][];
        //
        // let imgDatas: ImageData[] = [];
        // let pi = Math.PI;
        // let frameCount = 144;
        // console.log("beginning rendering frames");
        // for (let i = 0; i < frameCount; i++) {
        //     let angle = i * 2.5 * pi / 180;
        //     let lightVector = [-1, Math.cos(angle), Math.sin(angle)];
        //     lightVector = VectorNormalize(lightVector);
        //     let lightColour = [1, 1, 1];
        //
        //     let colours = calculateSurfaceColours(normals, lightVector, lightColour, sphere.color) as number[][][];
        //     let img = this.renderRGBCanvas(widthResolution, heightResolution, colours);
        //     imgDatas.push(img);
        //     console.log("frame " + (i+1) + "out of" + frameCount + " rendered!");
        //     console.log(colours);
        //     console.log("imgdata");
        //     console.log(img);
        // }
        //
        // let end = performance.now();
        // console.log("calculated " + frameCount + " frames in " + (end-start).toFixed(2)+"ms");
        // console.log("finished rendering frames");
        // this.animationRunning = true;
        // await this.animationLoop(imgDatas);
        //
        // iter++;
        // await delay(30);
    }

    async animationLoop(imgDatas: ImageData[], options:{fps?: number} = {}){
        let index = 0;

        if(options.fps){
            this.fpsCount = options.fps;
        }
        else{
            this.fpsCount = 33;
        }

        let frameDelay = 1000 / this.fpsCount;

        while(this.animationRunning){
            index++;
            index %= imgDatas.length;

            let img = imgDatas[index];

            this.renderFrameInContext(img);
            await delay(frameDelay);
        }
    }

    getCanvasContext(width: number, height: number){
        let canvas = this.canvasElementRef?.nativeElement as HTMLCanvasElement;
        canvas.width = width;
        canvas.height = height;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
        let framesCanvas = this.framesCanvasElementRef.nativeElement as HTMLCanvasElement;
        framesCanvas.width = width;
        framesCanvas.height = height;
        this.framesContext = framesCanvas.getContext('2d') as CanvasRenderingContext2D;
    }


    renderFrameInContext(imgData: ImageData, ctx:CanvasRenderingContext2D = null){
        if(ctx == null) ctx = this.context;
        if(ctx != null) {
            ctx.putImageData(imgData, 0, 0);
            return;
        }
        console.log("Error! canvas context was null");
    }

    renderRGBCanvas(widthResolution: number, heightResolution: number, values: number[][][]){
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d') as CanvasRenderingContext2D;
        //@ts-ignore
        let imgData = context.createImageData(widthResolution, heightResolution);
        canvas.height = heightResolution;
        canvas.width = widthResolution;
        let buffer = new Uint8ClampedArray(widthResolution * heightResolution * 4);

        let firstTime = true;
        let pos = 0;
        for (let x = 0; x < widthResolution; x++) {
            firstTime = true;
            for (let y = 0; y < heightResolution; y++) {

                let pos = (y * widthResolution + x) * 4;
                let color = values[y][x];
                // if (firstTime) {
                //     console.log("x = " + x + ", y = " + y + ", pos = " + pos);
                //     console.log("color = " + color[0].toFixed(2) + ", " + color[1].toFixed(2) + ", " + color[2].toFixed(2));
                // }

                if (!(color[0] < 1000000000 && color[0] > -1000000000)) {

                    buffer[pos] = 50;           // some R value [0, 255]
                    buffer[pos + 1] = 50;           // some G value
                    buffer[pos + 2] = 50;           // some B value
                    buffer[pos + 3] = 255;

                } else {

                    let red = color[0] * 255;
                    let green = color[1] * 255;
                    let blue = color[2] * 255;
                    buffer[pos] = red;           // some R value [0, 255]
                    buffer[pos + 1] = green;           // some G value
                    buffer[pos + 2] = blue;           // some B value
                    buffer[pos + 3] = 255;

                }
                firstTime = false;

            }
            firstTime = false;
        }
        imgData.data.set(buffer);
        return imgData;
    }

    private async convertImagesToVid(imgDatas: ImageData[], width: number, height: number, opts: { fps?: number } = {}) {
        let imgUrls: string[] = [];
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext('2d');

        let fps = opts.fps ? opts.fps : 30;

        let stream = canvas.captureStream(fps);
        let recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});


        let download = () => {
            const blob = new Blob(recordedChunks, {
                type: "video/webm"
            });
            console.log('recorded ' + recordedChunks.length + ' into the WEBM video!');
            const url = URL.createObjectURL(blob);
            this.vidUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        }
        let recordedChunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log('received frame!');
                download();
            }
        }

        let frameTime = Math.floor(1000 / fps);

        let start = 0, end = 0;

        recorder.start();
        for (let i = 0; i < 3; i++) {
            start = performance.now();
            context.putImageData(imgDatas[0], 0, 0);
            end = performance.now();
            await delay(frameTime - (end - start));
        }

        for (const imgData of imgDatas) {
            start = performance.now();
            context.putImageData(imgData, 0, 0);
            end = performance.now();
            await delay(frameTime - (end - start));
        }
        recorder.stop();

    }
}

if (typeof Worker !== 'undefined') {
  // Create a new
  const worker = new Worker(new URL('./main.worker', import.meta.url));
  worker.onmessage = ({ data }) => {
    console.log(`page got message: ${data}`);
  };
  //worker.postMessage(JSON.stringify({xd:'xd LOL'}));
} else {
  // Web Workers are not supported in this environment.
  // You should add a fallback so that your program still executes correctly.
}
