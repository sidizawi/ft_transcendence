// AI move function that works directly with game structure
export const aiMove = (ball, aiPlayer, dimensions) => {
  const { width, height, paddleWidth, paddleHeight } = dimensions;
  
  // Only move if we have an AI player
  if (!aiPlayer) return;
  
  // Ball moving toward AI (if AI is on right)
  if (ball.speedX > 0 && aiPlayer.side === 'right') {
    // Calculate time for ball to reach paddle
    const distanceToTravel = width - paddleWidth - ball.x;
    const timeToReach = distanceToTravel / ball.speedX;
    
    // Predict where ball will be
    let predictedY = predictBallPosition(ball.y, ball.speedY, timeToReach, height);
    
    // Add imperfection
    const imperfection = (Math.random() - 0.5) * paddleHeight * 0.2;
    predictedY += imperfection;
    
    // Get paddle center
    const paddleCenter = aiPlayer.y + paddleHeight / 2;
    
    // Determine move direction
    const PADDLE_SPEED = 5; // Adjust as needed
    
    if (predictedY < paddleCenter && aiPlayer.y > 0) {
      // Move up
      aiPlayer.y = Math.max(0, aiPlayer.y - PADDLE_SPEED);
    } else if (predictedY > paddleCenter && aiPlayer.y + paddleHeight < height) {
      // Move down
      aiPlayer.y = Math.min(height - paddleHeight, aiPlayer.y + PADDLE_SPEED);
    }
  } 
  // Ball moving away - return to center
  else if (aiPlayer.side === 'right') {
    const centerY = height / 2 - paddleHeight / 2;
    const paddleCenter = aiPlayer.y + paddleHeight / 2;
    
    // Only move if paddle far from center
    if (Math.abs(paddleCenter - centerY) > paddleHeight) {
      const RETURN_SPEED = 3; // Slower when returning to center
      if (aiPlayer.y < centerY) {
        aiPlayer.y = Math.min(centerY, aiPlayer.y + RETURN_SPEED);
      } else {
        aiPlayer.y = Math.max(centerY, aiPlayer.y - RETURN_SPEED);
      }
    }
  }
};

// Keep the prediction function as-is
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