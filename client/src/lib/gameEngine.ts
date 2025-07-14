import { checkCollision, Rectangle } from "./collision";

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'player' | 'coin' | 'obstacle' | 'goal';
  vx?: number; // velocity x
  vy?: number; // velocity y
  patrolStartX?: number; // patrol start position
  patrolEndX?: number; // patrol end position
  patrolStartY?: number; // patrol start position
  patrolEndY?: number; // patrol end position
}

export interface GameCallbacks {
  onCoinCollected: (score: number) => void;
  onObstacleHit: () => void;
  onLevelComplete: () => void;
  onPlayerMove: (x: number, y: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private player: GameObject;
  private coins: GameObject[] = [];
  private obstacles: GameObject[] = [];
  private goal: GameObject;
  private callbacks: GameCallbacks;
  private touchPosition: { x: number; y: number } | null = null;
  private isTouching = false;
  private levelWidth: number;
  private cameraX = 0;
  private keys: { [key: string]: boolean } = {};

  constructor(
    private canvasWidth: number, 
    private canvasHeight: number,
    callbacks: GameCallbacks
  ) {
    this.callbacks = callbacks;
    this.levelWidth = canvasWidth * 3; // Level is 3 screens wide

    // Initialize player
    this.player = {
      x: 50,
      y: canvasHeight / 2,
      width: 30,
      height: 30,
      color: '#4F46E5',
      type: 'player'
    };

    // Initialize goal
    this.goal = {
      x: this.levelWidth - 80,
      y: canvasHeight / 2 - 40,
      width: 60,
      height: 80,
      color: '#10B981',
      type: 'goal'
    };

    this.generateLevel();
  }

  private generateLevel() {
    this.coins = [];
    this.obstacles = [];

    // Generate coins
    for (let i = 0; i < 15; i++) {
      this.coins.push({
        x: 100 + Math.random() * (this.levelWidth - 200),
        y: 100 + Math.random() * (this.canvasHeight - 200),
        width: 20,
        height: 20,
        color: '#F59E0B',
        type: 'coin'
      });
    }

    // Generate moving TNT obstacles
    for (let i = 0; i < 10; i++) {
      const x = 150 + Math.random() * (this.levelWidth - 300);
      const y = 80 + Math.random() * (this.canvasHeight - 160);
      const patrolType = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      
      if (patrolType === 'horizontal') {
        const patrolRange = 100 + Math.random() * 150;
        const patrolStartX = Math.max(50, x - patrolRange / 2);
        const patrolEndX = Math.min(this.levelWidth - 50, x + patrolRange / 2);
        
        this.obstacles.push({
          x: patrolStartX,
          y,
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: 1 + Math.random() * 2, // random speed between 1-3
          vy: 0,
          patrolStartX,
          patrolEndX,
          patrolStartY: y,
          patrolEndY: y
        });
      } else {
        const patrolRange = 80 + Math.random() * 120;
        const patrolStartY = Math.max(50, y - patrolRange / 2);
        const patrolEndY = Math.min(this.canvasHeight - 50, y + patrolRange / 2);
        
        this.obstacles.push({
          x,
          y: patrolStartY,
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: 0,
          vy: 1 + Math.random() * 2, // random speed between 1-3
          patrolStartX: x,
          patrolEndX: x,
          patrolStartY,
          patrolEndY
        });
      }
    }

    // Ensure no obstacles are too close to player start or goal
    this.obstacles = this.obstacles.filter(obs => 
      obs.x > 120 && obs.x < this.levelWidth - 150
    );
  }

  public handleTouchStart(x: number, y: number) {
    this.isTouching = true;
    this.touchPosition = { x, y };
  }

  public handleTouchMove(x: number, y: number) {
    if (this.isTouching) {
      this.touchPosition = { x, y };
    }
  }

  public handleTouchEnd() {
    this.isTouching = false;
    this.touchPosition = null;
  }

  public handleKeyDown(key: string) {
    this.keys[key] = true;
  }

  public handleKeyUp(key: string) {
    this.keys[key] = false;
  }

  public update() {
    const speed = 5;
    
    // Handle keyboard input
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.player.y -= speed;
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.player.y += speed;
    }
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.x -= speed;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.x += speed;
    }
    
    // Move player towards touch position (if no keyboard input)
    const hasKeyboardInput = this.keys['ArrowUp'] || this.keys['ArrowDown'] || 
                           this.keys['ArrowLeft'] || this.keys['ArrowRight'] ||
                           this.keys['KeyW'] || this.keys['KeyA'] || 
                           this.keys['KeyS'] || this.keys['KeyD'];
    
    if (!hasKeyboardInput && this.isTouching && this.touchPosition) {
      const worldTouchX = this.touchPosition.x + this.cameraX;
      const worldTouchY = this.touchPosition.y;
      
      const dx = worldTouchX - (this.player.x + this.player.width / 2);
      const dy = worldTouchY - (this.player.y + this.player.height / 2);
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        const touchSpeed = 3;
        this.player.x += (dx / distance) * touchSpeed;
        this.player.y += (dy / distance) * touchSpeed;
      }
    }

    // Keep player in bounds
    this.player.x = Math.max(0, Math.min(this.levelWidth - this.player.width, this.player.x));
    this.player.y = Math.max(0, Math.min(this.canvasHeight - this.player.height, this.player.y));

    // Update moving obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.vx !== undefined && obstacle.vy !== undefined) {
        // Move obstacle
        obstacle.x += obstacle.vx;
        obstacle.y += obstacle.vy;
        
        // Check boundaries and reverse direction if needed
        if (obstacle.patrolStartX !== undefined && obstacle.patrolEndX !== undefined) {
          if (obstacle.x <= obstacle.patrolStartX || obstacle.x + obstacle.width >= obstacle.patrolEndX) {
            obstacle.vx = -obstacle.vx;
          }
        }
        
        if (obstacle.patrolStartY !== undefined && obstacle.patrolEndY !== undefined) {
          if (obstacle.y <= obstacle.patrolStartY || obstacle.y + obstacle.height >= obstacle.patrolEndY) {
            obstacle.vy = -obstacle.vy;
          }
        }
        
        // Ensure obstacles stay within their patrol bounds
        if (obstacle.patrolStartX !== undefined && obstacle.patrolEndX !== undefined) {
          obstacle.x = Math.max(obstacle.patrolStartX, Math.min(obstacle.patrolEndX - obstacle.width, obstacle.x));
        }
        if (obstacle.patrolStartY !== undefined && obstacle.patrolEndY !== undefined) {
          obstacle.y = Math.max(obstacle.patrolStartY, Math.min(obstacle.patrolEndY - obstacle.height, obstacle.y));
        }
      }
    });

    // Update camera to follow player
    this.cameraX = Math.max(0, Math.min(
      this.levelWidth - this.canvasWidth,
      this.player.x - this.canvasWidth / 2
    ));

    // Notify callback of player movement
    this.callbacks.onPlayerMove(this.player.x, this.player.y);

    // Check coin collisions
    this.coins = this.coins.filter(coin => {
      if (checkCollision(this.player, coin)) {
        this.callbacks.onCoinCollected(100);
        return false;
      }
      return true;
    });

    // Check obstacle collisions
    for (const obstacle of this.obstacles) {
      if (checkCollision(this.player, obstacle)) {
        this.callbacks.onObstacleHit();
        return;
      }
    }

    // Check goal collision
    if (checkCollision(this.player, this.goal)) {
      this.callbacks.onLevelComplete();
      return;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Clear canvas
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Save context for camera transform
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Draw background pattern
    this.drawBackground(ctx);

    // Draw goal
    this.drawGoal(ctx);

    // Draw coins
    this.coins.forEach(coin => this.drawCoin(ctx, coin));

    // Draw obstacles
    this.obstacles.forEach(obstacle => this.drawObstacle(ctx, obstacle));

    // Draw player
    this.drawPlayer(ctx);

    // Restore context
    ctx.restore();

    // Draw UI elements (not affected by camera)
    this.drawUI(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    // Draw grass background
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(0, 0, this.levelWidth, this.canvasHeight);

    // Draw path
    ctx.fillStyle = '#92A3B7';
    ctx.fillRect(0, this.canvasHeight / 2 - 30, this.levelWidth, 60);

    // Draw grid pattern
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.levelWidth; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.levelWidth, y);
      ctx.stroke();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.player.color;
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Add simple face
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(this.player.x + 8, this.player.y + 8, 4, 4);
    ctx.fillRect(this.player.x + 18, this.player.y + 8, 4, 4);
    ctx.fillRect(this.player.x + 10, this.player.y + 18, 10, 2);
  }

  private drawCoin(ctx: CanvasRenderingContext2D, coin: GameObject) {
    ctx.fillStyle = coin.color;
    ctx.beginPath();
    ctx.arc(
      coin.x + coin.width / 2, 
      coin.y + coin.height / 2, 
      coin.width / 2, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    // Add coin details
    ctx.fillStyle = '#FCD34D';
    ctx.beginPath();
    ctx.arc(
      coin.x + coin.width / 2, 
      coin.y + coin.height / 2, 
      coin.width / 3, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
  }

  private drawObstacle(ctx: CanvasRenderingContext2D, obstacle: GameObject) {
    // Draw TNT barrel body
    ctx.fillStyle = obstacle.color; // Brown color
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    // Add TNT bands
    ctx.fillStyle = '#654321';
    ctx.fillRect(obstacle.x, obstacle.y + 8, obstacle.width, 4);
    ctx.fillRect(obstacle.x, obstacle.y + 16, obstacle.width, 4);
    ctx.fillRect(obstacle.x, obstacle.y + 24, obstacle.width, 4);
    
    // Add TNT text
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TNT', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 + 3);
    
    // Add fuse (small line on top)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width / 2 - 3, obstacle.y - 8);
    ctx.stroke();
    
    // Add spark at fuse tip
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(obstacle.x + obstacle.width / 2 - 3, obstacle.y - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add movement indicator (arrow showing direction)
    if (obstacle.vx !== undefined && obstacle.vy !== undefined) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      
      if (obstacle.vx > 0) {
        ctx.fillText('→', obstacle.x + obstacle.width / 2, obstacle.y - 2);
      } else if (obstacle.vx < 0) {
        ctx.fillText('←', obstacle.x + obstacle.width / 2, obstacle.y - 2);
      } else if (obstacle.vy > 0) {
        ctx.fillText('↓', obstacle.x + obstacle.width / 2, obstacle.y - 2);
      } else if (obstacle.vy < 0) {
        ctx.fillText('↑', obstacle.x + obstacle.width / 2, obstacle.y - 2);
      }
    }
  }

  private drawGoal(ctx: CanvasRenderingContext2D) {
    // Draw flag pole
    ctx.fillStyle = '#8B5D3B';
    ctx.fillRect(this.goal.x + 5, this.goal.y, 5, this.goal.height);
    
    // Draw flag
    ctx.fillStyle = this.goal.color;
    ctx.fillRect(this.goal.x + 10, this.goal.y, this.goal.width - 15, 30);
    
    // Add flag pattern
    ctx.fillStyle = '#059669';
    ctx.fillRect(this.goal.x + 10, this.goal.y + 10, this.goal.width - 15, 10);
  }

  private drawUI(ctx: CanvasRenderingContext2D) {
    // Draw progress bar
    const progress = Math.min(1, this.player.x / (this.levelWidth - 100));
    const barWidth = this.canvasWidth - 40;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(20, 20, barWidth, 10);
    
    ctx.fillStyle = '#10B981';
    ctx.fillRect(20, 20, barWidth * progress, 10);
    
    // Draw mini-map
    const miniMapWidth = 150;
    const miniMapHeight = 30;
    const miniMapX = this.canvasWidth - miniMapWidth - 20;
    const miniMapY = 40;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);
    
    // Player position on mini-map
    const playerMiniX = miniMapX + (this.player.x / this.levelWidth) * miniMapWidth;
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(playerMiniX - 2, miniMapY + miniMapHeight / 2 - 2, 4, 4);
    
    // Goal position on mini-map
    const goalMiniX = miniMapX + (this.goal.x / this.levelWidth) * miniMapWidth;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(goalMiniX - 2, miniMapY + miniMapHeight / 2 - 2, 4, 4);
  }
}
