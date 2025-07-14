import { checkCollision, Rectangle } from "./collision";

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'player' | 'coin' | 'obstacle' | 'goal';
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

    // Generate obstacles
    for (let i = 0; i < 8; i++) {
      this.obstacles.push({
        x: 150 + Math.random() * (this.levelWidth - 300),
        y: 80 + Math.random() * (this.canvasHeight - 160),
        width: 40,
        height: 40,
        color: '#DC2626',
        type: 'obstacle'
      });
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
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    // Add spikes pattern
    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
    for (let i = 0; i < obstacle.width; i += 8) {
      ctx.lineTo(obstacle.x + i + 4, obstacle.y);
      ctx.lineTo(obstacle.x + i + 8, obstacle.y + obstacle.height);
    }
    ctx.fill();
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
