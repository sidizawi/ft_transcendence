// AI move function that works directly with game structure
export const aiThink = (ball, aiPlayer, dimensions) => {
  const { width, height, paddleWidth, paddleHeight } = dimensions;
  
  // Only think if we have an AI player
  if (!aiPlayer) return;
  
  // Ball moving toward AI (if AI is on right)
  if (ball.speedX > 0 && aiPlayer.side === 'right') {
    // Calculate time for ball to reach paddle
    const distanceToTravel = width - paddleWidth - ball.x;
    const timeToReach = distanceToTravel / ball.speedX;
    
    // Predict where ball will be
    let predictedY = predictBallPosition(ball.y, ball.speedY, timeToReach, height);
    
    // Add much larger imperfection (50% of paddle height)
    const imperfection = (Math.random() - 0.5) * paddleHeight * 0.5;
    
    // Occasionally miscalculate completely (15% chance)
    if (Math.random() < 0.15) {
      predictedY = Math.random() * height;
    }
    
    // Add artificial lag - sometimes use old ball position
    if (Math.random() < 0.3) {
      predictedY = ball.y;
    }
    
    predictedY += imperfection;
    
    // Set target position instead of directly moving
    aiPlayer.targetY = predictedY - paddleHeight / 2;
    
    // Keep target in bounds
    aiPlayer.targetY = Math.max(0, Math.min(height - paddleHeight, aiPlayer.targetY));
    
    // CHANGE 4: Limit how far the AI can move at once (30% of screen height)
    const maxMove = height * 0.3;
    const currentPos = aiPlayer.y;
    if (Math.abs(aiPlayer.targetY - currentPos) > maxMove) {
      if (aiPlayer.targetY > currentPos) {
        aiPlayer.targetY = currentPos + maxMove;
      } else {
        aiPlayer.targetY = currentPos - maxMove;
      }
    }
  } 
  else if (aiPlayer.side === 'right') {
    // Return to center when ball moving away
    const centerY = height / 2 - paddleHeight / 2;
    aiPlayer.targetY = centerY;
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

export const aiMove = (aiPlayer, paddleSpeed) => {
  if (!aiPlayer || aiPlayer.targetY === undefined) return;

  if (Math.abs(aiPlayer.y - aiPlayer.targetY) < paddleSpeed) {
    aiPlayer.y = aiPlayer.targetY;
  } else if (aiPlayer.y < aiPlayer.targetY) {
    aiPlayer.y += paddleSpeed;
  } else if (aiPlayer.y > aiPlayer.targetY) {
    aiPlayer.y -= paddleSpeed;
  }
};
