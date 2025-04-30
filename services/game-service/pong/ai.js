import { WINNING_SCORE } from './game.js';  

export const aiThink = (ball, aiPlayer, dimensions, scores) => {
  const { width, height, paddleWidth, paddleHeight } = dimensions;
  if (!aiPlayer) return;

  // 1) compute difficulty from score difference
  const rawDiff     = scores.left - scores.right;  

  const difficulty  = Math.max(-1, Math.min(1, rawDiff / WINNING_SCORE));

  if (ball.speedX > 0 && aiPlayer.side === 'right') {
    const distanceToTravel = width - paddleWidth - ball.x;
    const timeToReach      = distanceToTravel / ball.speedX;
    let   predictedY       = predictBallPosition(ball.y, ball.speedY, timeToReach, height);

    const baseImp       = paddleHeight * 0.5;
    const impScale      = 1 - 0.5 * difficulty; 
    const imperfection  = (Math.random() - 0.5) * baseImp * impScale;

    const baseLag       = 0.3;
    const lagChance     = baseLag * (1 - difficulty);

    if (Math.random() < 0.15)           predictedY = Math.random() * height;
    if (Math.random() < lagChance)      predictedY = ball.y;

    predictedY += imperfection;
    aiPlayer.targetY = Math.max(0, Math.min(height - paddleHeight, predictedY - paddleHeight/2));

    // 4) scale max move per tick (more when player winning)
    const baseMaxMove  = height * 0.2;
    const extraMove    = height * 0.1 * difficulty;
    const maxMove      = baseMaxMove + extraMove;
    const currentPos   = aiPlayer.y;
    if (Math.abs(aiPlayer.targetY - currentPos) > maxMove) {
      aiPlayer.targetY = currentPos + Math.sign(aiPlayer.targetY - currentPos) * maxMove;
    }
  }
  else if (aiPlayer.side === 'right') {
    // return to center
    aiPlayer.targetY = height/2 - paddleHeight/2;
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
