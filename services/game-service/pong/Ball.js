export default class Ball {
	constructor(x, y, size, speedX, speedY) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.speedX = speedX;
		this.speedY = speedY;
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fillStyle = "white";
		ctx.fill();
		ctx.closePath();
	}

	move() {
		this.x += this.speedX;
		this.y += this.speedY;
	}
}