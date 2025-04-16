export default class Ball {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;

    constructor(x: number, y: number, size: number, speedX: number, speedY: number) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
    }

    move(): void {
        this.x += this.speedX;
        this.y += this.speedY;
    }

    ToJSON(): Record<string, number> {
        return {
            x: this.x,
            y: this.y,
            size: this.size,
            speedX: this.speedX,
            speedY: this.speedY
        };
    }
}