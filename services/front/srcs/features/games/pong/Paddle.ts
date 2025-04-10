export default class Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;

    constructor(x: number, y: number, width: number, height: number, speed: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
    }

    moveUp(): void {
        this.y -= this.speed;
    }

    moveDown(): void {
        this.y += this.speed;
    }

    ToJSON(): Record<string, number> {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            speed: this.speed
        };
    }
}
