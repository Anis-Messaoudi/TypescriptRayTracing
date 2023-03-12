
export class LightLogic{
    static calculateColoursAbsoluteLightFlatSurface = function(normals: number[][][], lightDirection: number[], lightColour:number[], surfaceColour:number[]){
        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        function VectorDot(a: number[], b: number[]) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        }

        let lightVector = [lightDirection[0], lightDirection[1], lightDirection[2]];
        let normalVector = [normals[i][j][0], normals[i][j][1], normals[i][j][2]];

        if(!(normalVector[0] < 1000000000 && normalVector[0] > -1000000000)){
            return [1/0,1/0,1/0];
        }

        let lightVal = VectorDot(lightVector, normalVector);

        if(lightVal <= 0){
            return [1,1,1];
        }

        return [surfaceColour[0] * lightColour[0] * lightVal,
                surfaceColour[1] * lightColour[1] * lightVal,
                surfaceColour[2] * lightColour[2] * lightVal]
    }

    static calculateColoursAbsoluteLightVariableSurface = function(normals: number[][][], rays: number[][][], lightDirection: number[], lightColour:number[], surfaceColours:number[][][]){
        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        function VectorDot(a: number[], b: number[]) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        }

        let lightVector = [lightDirection[0], lightDirection[1], lightDirection[2]];
        let normalVector = [normals[i][j][0], normals[i][j][1], normals[i][j][2]];
        let ray = [rays[i][j][0], rays[i][j][1], rays[i][j][2]];

        if(!(normalVector[0] < 1000000000 && normalVector[0] > -1000000000)){
            return [1/0,1/0,1/0];
        }

        // checking which side of the surface we intersected
        let normalRayDot = VectorDot(ray, normalVector);

        let lightVal = VectorDot(lightVector, normalVector);

        if(normalRayDot > 0){
            lightVal = -lightVal;
        }

        if(lightVal <= 0){
            return [0,0,0];
        }

        let surfaceColour = [surfaceColours[i][j][0], surfaceColours[i][j][1], surfaceColours[i][j][2]];

        return [surfaceColour[0] * lightColour[0] * lightVal,
            surfaceColour[1] * lightColour[1] * lightVal,
            surfaceColour[2] * lightColour[2] * lightVal]
    }

}
