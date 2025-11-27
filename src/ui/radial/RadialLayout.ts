export interface PolarPoint {
  x: number;
  y: number;
}

export class RadialLayout {
  static polarToCartesian(center: PolarPoint, radius: number, angleDegrees: number): PolarPoint {
    const radians = (angleDegrees - 90) * (Math.PI / 180);
    return {
      x: center.x + radius * Math.cos(radians),
      y: center.y + radius * Math.sin(radians)
    };
  }
}
