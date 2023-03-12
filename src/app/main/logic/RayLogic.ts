export class RayLogic{
    public static createRays = function (userPos: number[], screenPos: number[],
              widthStart: number, widthStep: number, heightStart: number, heightStep: number) {
        function VectorNormalize(a: number[]) {
            let norm = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
            if(norm == 0) return[0,0,0];
            return [a[0] / norm, a[1] / norm, a[2] / norm];
        }

        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;

        let screenX = widthStart + widthStep * j;
        let screenY = heightStart + heightStep * i;
        let rayEnd = [screenX + screenPos[0], screenY + screenPos[1], screenPos[2]];
        let rayStart = [userPos[0], userPos[1], userPos[2]];

        let ray: number[] = [rayEnd[0] - rayStart[0], rayEnd[1] - rayStart[1], rayEnd[2] - rayStart[2]];
        return VectorNormalize(ray);
    }

    public static mergeIntersectionsParams = function(intersectionsA: number[][], intersectionsB: number[][],
                                                      indexesA: number[][], indexesB: number[][]){
        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;
        let intersectionA = intersectionsA[i][j];
        let intersectionB = intersectionsB[i][j];

        let indexA = indexesA[i][j];
        let indexB = indexesB[i][j];

        if(!(intersectionA < 1000000000 && intersectionA> -1000000000)){

            if(!(intersectionB < 1000000000 && intersectionB > -1000000000)){
                return -1;
            }

            return indexB;
        }

        if(!(intersectionB < 1000000000 && intersectionB > -1000000000)){
            return indexA;
        }

        if(intersectionA < intersectionB){
            return indexA;
        }

        return indexB;

    }

    public static populateIndexArray = function(index: number){
        return index;
    }

    public static mergeIntersectionsPoints = function(intersectionsA: number[][][], intersectionsB: number[][][],
                                                      indexA: number, indexB: number,
                                                      userPos: number[]
    ){

        function VectorNorm(a: number[]) {
            return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
        }

        function VectorSub(a: number[], b: number[]) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        }

        //@ts-ignore
        let i = this.thread.y;
        //@ts-ignore
        let j = this.thread.x;
        let intersectionA = [intersectionsA[i][j][0], intersectionsA[i][j][1], intersectionsA[i][j][2]];
        let intersectionB = [intersectionsB[i][j][0], intersectionsB[i][j][1], intersectionsB[i][j][2]];

        if(!(intersectionA[0] < 1000000000 && intersectionA[0] > -1000000000)){
            return indexB;
        }

        if(!(intersectionB[0] < 1000000000 && intersectionB[0] > -1000000000)){
            return indexA;
        }
        let origin = [userPos[0], userPos[1], userPos[2]];

        let differenceA = VectorSub(intersectionA, origin);
        let distanceA = VectorNorm(differenceA);

        let differenceB = VectorSub(intersectionB, origin);
        let distanceB = VectorNorm(differenceB);

        if(differenceA < differenceB){
            return indexA;
        }

        return indexB;
    }

}
