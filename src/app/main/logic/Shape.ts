export abstract class Shape{

    // how reflective is the surface of the shape, 0.9 is the hard maximum
    abstract reflectiveness: number;

    // how transparent is the shape, between 0 (opaque) and 1 (transparent)
    abstract transparency: number;

    // refractive index of the shape, how much light bends when going through its transparent medium, minimum 0.
    abstract refractiveIndex: number;

    // returns the surface normal at a given point on the shape
    abstract normalAt: (point: number[]) =>(number[]);

    // returns the surface colour at a given point on the shape
    abstract colorFunction: (point: number[]) =>(number[]);

    // quick check if ray intersects shape
    abstract intersectsRay(source: number[], direction: number[]): boolean;

    // calculates the intersection of the shape and a ray of light
    abstract getRayIntersection(source: number[], direction: number[]): number;
    abstract type: string;
}
