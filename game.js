// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Constants
const CELL_SIZE = 30;
const GHOST_COUNT = 2; // 2 ghosts
const POWER_UP_COUNT = 5; // 5 power-ups
const POWER_UP_DURATION = 5000; // 5 seconds

// Maze grid (1 = wall, 0 = path, 3 = power-up)
let maze = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Set canvas size based on maze dimensions
canvas.width = maze[0].length * CELL_SIZE;
canvas.height = maze.length * CELL_SIZE;

// Assets
const footImg = new Image();
footImg.src = "feet.png";
const powerUpImg = new Image();
powerUpImg.src = "powerup.png";
const wallImg = new Image();
wallImg.src = "wall.png";
const pacmanImg = new Image();
pacmanImg.src = "pacman.png";
const ghostImg = new Image();
ghostImg.src = "ghost.png";

// Game state
let pacman = { 
    x: CELL_SIZE * 1, 
    y: CELL_SIZE * 1, 
    dx: 0, 
    dy: 0, 
    speed: 2, 
    poweredUp: false 
};

// Get a random valid position for ghosts
function getRandomValidPosition() {
  let row, col;
  do {
    row = Math.floor(Math.random() * maze.length);
    col = Math.floor(Math.random() * maze[0].length);
  } while (maze[row][col] !== 0 && maze[row][col] !== 3); // Ensure the cell is a path or power-up

  return { x: col * CELL_SIZE, y: row * CELL_SIZE };
}

// Ghost initialization with proper starting positions
function initializeGhosts() {
  return Array(GHOST_COUNT).fill().map((_, index) => {
    const pos = getRandomValidPosition();
    return {
      x: pos.x,
      y: pos.y,
      direction: 'right',
      speed: 1.5,
      personality: index,
      mode: 'scatter',
      modeTimer: Date.now() + 7000
    };
  });
}

let ghosts = initializeGhosts();
let score = 0;
let totalFruits = maze.flat().filter((cell) => cell === 0).length;
let powerUpEndTime = 0;
let dirtyCells = [];

// Add 5 power-ups to the maze
function addPowerUps() {
  let powerUpsAdded = 0;
  while (powerUpsAdded < POWER_UP_COUNT) {
    const row = Math.floor(Math.random() * maze.length);
    const col = Math.floor(Math.random() * maze[0].length);
    if (maze[row][col] === 0) {
      maze[row][col] = 3; // 3 represents a power-up
      powerUpsAdded++;
    }
  }
}

addPowerUps(); // Add power-ups to the maze

// Draw the maze
function drawMaze() {
  dirtyCells.forEach(({ x, y }) => {
    ctx.clearRect(x, y, CELL_SIZE, CELL_SIZE);
  });
  dirtyCells = [];

  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[row].length; col++) {
      const cell = maze[row][col];
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;

      if (cell === 1) {
        ctx.drawImage(wallImg, x, y, CELL_SIZE, CELL_SIZE);
      } else if (cell === 0) {
        ctx.drawImage(footImg, x, y, CELL_SIZE, CELL_SIZE);
      } else if (cell === 3) {
        ctx.drawImage(powerUpImg, x, y, CELL_SIZE, CELL_SIZE);
      }

      if (cell === 0 || cell === 3) {
        dirtyCells.push({ x, y });
      }
    }
  }
}

// Move Pac-Man
function movePacman() {
    const newX = pacman.x + pacman.dx * pacman.speed;
    const newY = pacman.y + pacman.dy * pacman.speed;

    const padding = 5;
    let checkPoints;
    
    if (pacman.dx > 0) {
        checkPoints = [
            { x: newX + CELL_SIZE - padding, y: newY + padding },
            { x: newX + CELL_SIZE - padding, y: newY + CELL_SIZE - padding }
        ];
    } else if (pacman.dx < 0) {
        checkPoints = [
            { x: newX + padding, y: newY + padding },
            { x: newX + padding, y: newY + CELL_SIZE - padding }
        ];
    } else if (pacman.dy > 0) {
        checkPoints = [
            { x: newX + padding, y: newY + CELL_SIZE - padding },
            { x: newX + CELL_SIZE - padding, y: newY + CELL_SIZE - padding }
        ];
    } else if (pacman.dy < 0) {
        checkPoints = [
            { x: newX + padding, y: newY + padding },
            { x: newX + CELL_SIZE - padding, y: newY + padding }
        ];
    } else {
        checkPoints = [];
    }

    const canMove = !checkPoints.some(point => {
        const col = Math.floor(point.x / CELL_SIZE);
        const row = Math.floor(point.y / CELL_SIZE);
        return maze[row] && maze[row][col] === 1;
    });

    if (canMove) {
        pacman.x = newX;
        pacman.y = newY;

        const centerX = Math.floor((pacman.x + CELL_SIZE / 2) / CELL_SIZE);
        const centerY = Math.floor((pacman.y + CELL_SIZE / 2) / CELL_SIZE);

        if (maze[centerY] && maze[centerY][centerX] === 0) {
            maze[centerY][centerX] = 2;
            score++;
            dirtyCells.push({ x: centerX * CELL_SIZE, y: centerY * CELL_SIZE });
        }

        if (maze[centerY] && maze[centerY][centerX] === 3) {
            maze[centerY][centerX] = 2;
            pacman.poweredUp = true;
            powerUpEndTime = Date.now() + POWER_UP_DURATION;
            dirtyCells.push({ x: centerX * CELL_SIZE, y: centerY * CELL_SIZE });
        }
    }
}


// Improved wall collision detection for ghosts
function isValidMove(x, y) {
  // Convert pixel position to grid coordinates
  const leftCell = Math.floor(x / CELL_SIZE);
  const rightCell = Math.floor((x + CELL_SIZE - 1) / CELL_SIZE);
  const topCell = Math.floor(y / CELL_SIZE);
  const bottomCell = Math.floor((y + CELL_SIZE - 1) / CELL_SIZE);

  // Check if any corner would intersect with a wall
  return !(
    maze[topCell]?.[leftCell] === 1 ||
    maze[topCell]?.[rightCell] === 1 ||
    maze[bottomCell]?.[leftCell] === 1 ||
    maze[bottomCell]?.[rightCell] === 1
  );
}

// Get available directions at current position
function getAvailableDirections(x, y) {
  const directions = [];
  const gridX = Math.floor(x / CELL_SIZE);
  const gridY = Math.floor(y / CELL_SIZE);

  // Check each direction
  if (maze[gridY - 1]?.[gridX] !== 1) directions.push('up');
  if (maze[gridY + 1]?.[gridX] !== 1) directions.push('down');
  if (maze[gridY]?.[gridX - 1] !== 1) directions.push('left');
  if (maze[gridY]?.[gridX + 1] !== 1) directions.push('right');

  return directions;
}

// Convert direction to velocity
function directionToVelocity(direction) {
  switch (direction) {
    case 'up': return { dx: 0, dy: -1 };
    case 'down': return { dx: 0, dy: 1 };
    case 'left': return { dx: -1, dy: 0 };
    case 'right': return { dx: 1, dy: 0 };
    default: return { dx: 0, dy: 0 };
  }
}

// Get opposite direction
function getOppositeDirection(direction) {
  const opposites = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left'
  };
  return opposites[direction];
}

// Calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Get target position based on ghost personality and mode
function getTargetPosition(ghost, pacman) {
  if (ghost.mode === 'scatter') {
    // Scatter mode - target corners
    switch(ghost.personality % 4) {
      case 0: return { x: maze[0].length - 2, y: 1 };
      case 1: return { x: 1, y: 1 };
      case 2: return { x: maze[0].length - 2, y: maze.length - 2 };
      case 3: return { x: 1, y: maze.length - 2 };
    }
  } else {
    // Chase mode - different behaviors
    const pacGridX = Math.floor(pacman.x / CELL_SIZE);
    const pacGridY = Math.floor(pacman.y / CELL_SIZE);
    
    switch(ghost.personality % 4) {
      case 0: // Direct chase
        return { x: pacGridX, y: pacGridY };
      case 1: // Predict ahead
        return {
          x: pacGridX + (pacman.dx * 4),
          y: pacGridY + (pacman.dy * 4)
        };
      case 2: // Flank
        return {
          x: pacGridX - (pacman.dx * 2),
          y: pacGridY - (pacman.dy * 2)
        };
      case 3: // Semi-random
        if (!ghost.randomTarget || Math.random() < 0.1) {
          const pos = getRandomValidPosition();
          ghost.randomTarget = {
            x: Math.floor(pos.x / CELL_SIZE),
            y: Math.floor(pos.y / CELL_SIZE)
          };
        }
        return ghost.randomTarget;
    }
  }
}

// Choose best direction towards target
function chooseBestDirection(ghost, target, availableDirections) {
  let bestDirection = ghost.direction;
  let shortestDistance = Infinity;

  const ghostGridX = Math.floor(ghost.x / CELL_SIZE);
  const ghostGridY = Math.floor(ghost.y / CELL_SIZE);
  
  // Filter out opposite direction unless it's the only option
  const filteredDirections = availableDirections.filter(dir => 
    dir !== getOppositeDirection(ghost.direction) || availableDirections.length === 1
  );

  filteredDirections.forEach(direction => {
    const velocity = directionToVelocity(direction);
    const nextX = ghostGridX + velocity.dx;
    const nextY = ghostGridY + velocity.dy;
    
    const distance = calculateDistance(nextX, nextY, target.x, target.y);
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      bestDirection = direction;
    }
  });

  return bestDirection;
}

// Main ghost movement function
function moveGhosts() {
  ghosts.forEach(ghost => {
    // Check for mode switch
    if (Date.now() > ghost.modeTimer) {
      ghost.mode = ghost.mode === 'scatter' ? 'chase' : 'scatter';
      ghost.modeTimer = Date.now() + (ghost.mode === 'scatter' ? 7000 : 20000);
      ghost.direction = getOppositeDirection(ghost.direction);
    }

    // Check if ghost is centered in a cell (decision point)
    const isCentered = 
      ghost.x % CELL_SIZE === 0 && 
      ghost.y % CELL_SIZE === 0;

    if (isCentered) {
      const availableDirections = getAvailableDirections(ghost.x, ghost.y);
      const target = getTargetPosition(ghost, pacman);
      ghost.direction = chooseBestDirection(ghost, target, availableDirections);
    }

    // Move ghost
    const velocity = directionToVelocity(ghost.direction);
    const newX = ghost.x + velocity.dx * ghost.speed;
    const newY = ghost.y + velocity.dy * ghost.speed;

    // Check if new position is valid
    const gridX = Math.floor(newX / CELL_SIZE);
    const gridY = Math.floor(newY / CELL_SIZE);

    if (maze[gridY]?.[gridX] !== 1) {
      ghost.x = newX;
      ghost.y = newY;
    } else {
      // If we hit a wall, center in current cell and get new direction
      ghost.x = Math.round(ghost.x / CELL_SIZE) * CELL_SIZE;
      ghost.y = Math.round(ghost.y / CELL_SIZE) * CELL_SIZE;
      const availableDirections = getAvailableDirections(ghost.x, ghost.y);
      const target = getTargetPosition(ghost, pacman);
      ghost.direction = chooseBestDirection(ghost, target, availableDirections);
    }

    // Handle collision with Pac-Man
    if (checkCollision(pacman, ghost)) {
      if (pacman.poweredUp) {
        const pos = getRandomValidPosition();
        ghost.x = pos.x;
        ghost.y = pos.y;
        score += 10;
      } else {
        document.getElementById('message').textContent = 'Game Over! Restarting...';
        document.getElementById('message').style.display = 'block';
        setTimeout(() => {
          document.location.reload();
        }, 2000);
      }
    }
  });
}
// Check collision between Pac-Man and a ghost
function checkCollision(pacman, ghost) {
  const dx = pacman.x + CELL_SIZE / 2 - (ghost.x + CELL_SIZE / 2);
  const dy = pacman.y + CELL_SIZE / 2 - (ghost.y + CELL_SIZE / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < CELL_SIZE;
}

// Draw the score
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, canvas.height - 10);
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMaze();
  movePacman();
  moveGhosts();

  const remainingFruits = maze.flat().filter(cell => cell === 0).length;
  if (remainingFruits === 0) {
    document.getElementById('message').textContent = 'NOW GO JOIN THE DEGEN ROOM AND GAMBLE';
    document.getElementById('message').style.display = 'block';
    setTimeout(() => {
      window.location.href = 'https://degensplay.com/';
    }, 3000);
    return;
  }

  ctx.drawImage(pacmanImg, pacman.x, pacman.y, CELL_SIZE, CELL_SIZE);

  ghosts.forEach((ghost) => {
    ctx.drawImage(ghostImg, ghost.x, ghost.y, CELL_SIZE, CELL_SIZE);
  });

  if (pacman.poweredUp && Date.now() > powerUpEndTime) {
    pacman.poweredUp = false;
  }

  drawScore();
  requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    pacman.dx = 0;
    pacman.dy = -1;
  }
  if (e.key === "ArrowDown") {
    pacman.dx = 0;
    pacman.dy = 1;
  }
  if (e.key === "ArrowLeft") {
    pacman.dx = -1;
    pacman.dy = 0;
  }
  if (e.key === "ArrowRight") {
    pacman.dx = 1;
    pacman.dy = 0;
  }
});

// Start the game
gameLoop();