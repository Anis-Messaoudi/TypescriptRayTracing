/**
 * abstract Shape superclass. The renderer uses the functions of this class to attempt to render instances of it.
 */
export abstract class Shape{

    /**
     * How reflective the surface of the shape is, 0.9 is the hard maximum
     */
    abstract reflectiveness: number;

    /**
     * How transparent the shape is (currently unusued)
     */
    abstract transparency: number;

    /**
     * Refractive index of the shape, how much light bends when going through its transparent medium, minimum 0.
     */
    abstract refractiveIndex: number;

    /**
     * Returns the surface normal at a given point on the shape. Allows for shapes to have dynamic normals and normal-maps.
     */
    abstract normalAt: (point: number[]) =>(number[]);

    /**
     * Returns the surface colour at a given point on the shape. Allows for texture mapping and dynamic, animated colours.
     */
    abstract colorFunction: (point: number[]) =>(number[]);

    /**
     * Quick check to see if a ray intersects the shape without calculating the intersection coordinates.
     * @param source: source of the ray (or even a point on the ray line)
     * @param direction: direction of the ray
     * @return true if the ray will intersect the shape (in the positive direction, not backwards).
     */
    abstract intersectsRay(source: number[], direction: number[]): boolean;

    /**
     * Calculates the intersection of the shape and a ray of light
     * @param source: source of the ray (or even a point on the ray line)
     * @param direction: direction of the ray
     * @return The intersection parameter of the intersection t, where t > 0.
     */
    abstract getRayIntersection(source: number[], direction: number[]): number;
    abstract type: string;
}
