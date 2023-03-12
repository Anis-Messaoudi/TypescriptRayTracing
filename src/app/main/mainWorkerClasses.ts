export type WorkerOptions = {
    imageDatas: WorkerImageData[],
}

export type WorkerImageData = {
    width: number,
    height: number,
    pixels: number[][][]
}

export type WorkerProgressResponse = {
    percentage: number;
    worstTimeLeft: number;
    averageTimeLeft: number;
    isDone: boolean;
    frames: number[][][][];
}
