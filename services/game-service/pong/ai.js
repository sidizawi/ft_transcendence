export const aiMove = (state) => {
    const { gameStarted, rightPlayer, canvas, ball, aiKeys } = state;
    if (!gameStarted) return;

    if (ball.speedX > 0) {
        const distanceToTravel = rightPlayer.x - ball.size - ball.x;
        const timeToReach = distanceToTravel / ball.speedX;
        
        let predictedY = predictBallPosition(ball.y, ball.speedY, timeToReach, canvas.height);
        
        const imperfection = (Math.random() - 0.5) * rightPlayer.height * 0.2;
        predictedY += imperfection;
        
        const paddleCenter = rightPlayer.y + rightPlayer.height / 2;
        if (predictedY < paddleCenter && rightPlayer.y > 0) {
            aiKeys.up = true;
            aiKeys.down = false;
        } else if (predictedY > paddleCenter && rightPlayer.y + rightPlayer.height < canvas.height) {
            aiKeys.up = false;
            aiKeys.down = true;
        } else {
            aiKeys.up = false;
            aiKeys.down = false;
        }
    } else {
        const centerY = canvas.height / 2;
        const paddleCenter = rightPlayer.y + rightPlayer.height / 2;
        
        if (paddleCenter < centerY - 100) {
            aiKeys.up = false;
            aiKeys.down = true;
        } else if (paddleCenter > centerY + 100) {
            aiKeys.up = true;
            aiKeys.down = false;
        } else {
            aiKeys.up = false;
            aiKeys.down = false;
        }
    }
};

function predictBallPosition(initialY, speedY, time, canvasHeight) {
    let futureY = initialY + speedY * time;
    
    const fullCycle = canvasHeight * 2;
    const normalizedPosition = Math.abs(futureY % fullCycle);
    
    if (normalizedPosition <= canvasHeight) {
        return normalizedPosition;
    } else {
        return fullCycle - normalizedPosition;
    }
}