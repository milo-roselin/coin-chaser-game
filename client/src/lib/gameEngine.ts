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
  private coinClusters: { x: number; y: number; coinsCollected: number; totalCoins: number }[] = [];
  private clustersCompleted = 0;
  private level = 1;
  private score = 0;
  private coinsCollected = 0;
  private isPaused = false;

  constructor(
    private canvasWidth: number, 
    private canvasHeight: number,
    callbacks: GameCallbacks,
    level: number = 1
  ) {
    this.callbacks = callbacks;
    this.level = level;
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
      color: '#8B5CF6',
      type: 'goal'
    };

    this.generateLevel();
  }

  private generateLevel() {
    this.coins = [];
    this.obstacles = [];
    this.coinClusters = [];
    this.clustersCompleted = 0;
    this.score = 0;
    this.coinsCollected = 0;

    // Generate coins in clusters with better spacing
    const numClusters = 3 + this.level; // More clusters in higher levels
    const minDistance = 400; // Minimum distance between clusters
    const clusterPositions: Array<{x: number, y: number}> = [];
    
    for (let cluster = 0; cluster < numClusters; cluster++) {
      let clusterX, clusterY;
      let attempts = 0;
      
      // Find a position that's not too close to existing clusters
      do {
        clusterX = 300 + Math.random() * (this.levelWidth - 800);
        clusterY = 100 + Math.random() * (this.canvasHeight - 200);
        attempts++;
      } while (attempts < 50 && clusterPositions.some(pos => 
        Math.sqrt((pos.x - clusterX) ** 2 + (pos.y - clusterY) ** 2) < minDistance
      ));
      
      clusterPositions.push({x: clusterX, y: clusterY});
      
      // Track cluster info
      this.coinClusters.push({
        x: clusterX,
        y: clusterY,
        coinsCollected: 0,
        totalCoins: 3
      });
      
      // 3 coins per cluster with wider spread
      for (let i = 0; i < 3; i++) {
        this.coins.push({
          x: clusterX + (Math.random() - 0.5) * 160, // Wider spread
          y: clusterY + (Math.random() - 0.5) * 120, // Wider spread
          width: 20,
          height: 20,
          color: '#F59E0B',
          type: 'coin'
        });
      }
    }

    // Generate TNT bombs that patrol around coin clusters (more in higher levels)
    const tntPerCluster = 1 + Math.floor(this.level / 2); // More TNT per cluster in higher levels
    for (let i = 0; i < numClusters * tntPerCluster; i++) {
      // Choose a random coin cluster to patrol around
      const targetCluster = Math.floor(Math.random() * numClusters);
      const clusterX = this.coinClusters[targetCluster].x;
      const clusterY = this.coinClusters[targetCluster].y;
      
      // Create circular patrol around the cluster
      const patrolRadius = 80 + Math.random() * 60;
      const startAngle = Math.random() * Math.PI * 2;
      
      this.obstacles.push({
        x: clusterX + Math.cos(startAngle) * patrolRadius,
        y: clusterY + Math.sin(startAngle) * patrolRadius,
        width: 35,
        height: 35,
        color: '#8B4513',
        type: 'obstacle',
        vx: 1 + Math.random() * 1.5, // circular movement speed
        vy: 1 + Math.random() * 1.5,
        patrolStartX: clusterX, // center X of circular patrol
        patrolStartY: clusterY, // center Y of circular patrol
        patrolEndX: patrolRadius, // using this as radius
        patrolEndY: startAngle // using this as current angle
      });
    }

    // Add some linear patrolling TNT bombs between clusters (more in higher levels)
    const linearTnt = 2 + this.level;
    for (let i = 0; i < linearTnt; i++) {
      let x, y;
      let attempts = 0;
      
      // Find positions that are away from coin clusters
      do {
        x = 250 + Math.random() * (this.levelWidth - 500);
        y = 80 + Math.random() * (this.canvasHeight - 160);
        attempts++;
      } while (attempts < 20 && clusterPositions.some(pos => 
        Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < 200
      ));
      
      const patrolType = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      
      if (patrolType === 'horizontal') {
        const patrolRange = 150 + Math.random() * 200;
        const patrolStartX = Math.max(50, x - patrolRange / 2);
        const patrolEndX = Math.min(this.levelWidth - 50, x + patrolRange / 2);
        
        this.obstacles.push({
          x: patrolStartX,
          y,
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: (1.5 + Math.random() * 2) * (1 + this.level * 0.2), // Faster in higher levels
          vy: 0,
          patrolStartX,
          patrolEndX,
          patrolStartY: y,
          patrolEndY: y
        });
      } else {
        const patrolRange = 100 + Math.random() * 150;
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
          vy: (1.5 + Math.random() * 2) * (1 + this.level * 0.2), // Faster in higher levels
          patrolStartX: x,
          patrolEndX: x,
          patrolStartY,
          patrolEndY
        });
      }
    }

    // Ensure no obstacles are too close to player start or goal
    this.obstacles = this.obstacles.filter(obs => 
      obs.x > 200 && obs.x < this.levelWidth - 150 // Larger safe zone at start
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
    // Handle pause key
    if (key === 'Space' || key === 'Escape') {
      this.togglePause();
      return;
    }
    
    this.keys[key] = true;
  }

  public handleKeyUp(key: string) {
    this.keys[key] = false;
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
  }

  public update() {
    // Don't update game state if paused
    if (this.isPaused) {
      return;
    }
    
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
        // Check if this is a circular patrol (around coins)
        if (obstacle.patrolEndX !== undefined && obstacle.patrolEndY !== undefined && 
            obstacle.patrolStartX !== undefined && obstacle.patrolStartY !== undefined &&
            obstacle.patrolEndX < 200) { // radius is stored in patrolEndX for circular patrol
          
          // Circular movement around coin clusters
          const centerX = obstacle.patrolStartX;
          const centerY = obstacle.patrolStartY;
          const radius = obstacle.patrolEndX;
          let angle = obstacle.patrolEndY; // current angle stored in patrolEndY
          
          // Update angle for circular movement
          angle += 0.02 + Math.random() * 0.01; // variable speed
          obstacle.patrolEndY = angle;
          
          // Calculate new position
          obstacle.x = centerX + Math.cos(angle) * radius - obstacle.width / 2;
          obstacle.y = centerY + Math.sin(angle) * radius - obstacle.height / 2;
          
          // Update velocity for movement indicators
          obstacle.vx = Math.cos(angle + Math.PI / 2) * 2;
          obstacle.vy = Math.sin(angle + Math.PI / 2) * 2;
          
        } else {
          // Linear movement (existing code)
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
      }
    });

    // Update camera to follow player
    this.cameraX = Math.max(0, Math.min(
      this.levelWidth - this.canvasWidth,
      this.player.x - this.canvasWidth / 2
    ));

    // Notify callback of player movement
    this.callbacks.onPlayerMove(this.player.x, this.player.y);

    // Check coin collisions and track cluster completion
    this.coins = this.coins.filter(coin => {
      if (checkCollision(this.player, coin)) {
        // Find which cluster this coin belongs to
        for (let i = 0; i < this.coinClusters.length; i++) {
          const cluster = this.coinClusters[i];
          const distance = Math.sqrt(
            Math.pow(coin.x - cluster.x, 2) + Math.pow(coin.y - cluster.y, 2)
          );
          if (distance < 100) {
            cluster.coinsCollected++;
            if (cluster.coinsCollected === cluster.totalCoins) {
              this.clustersCompleted++;
            }
            break;
          }
        }
        
        this.score += 100;
        this.coinsCollected++;
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

    // Check goal collision (only if at least one cluster is completed)
    if (checkCollision(this.player, this.goal)) {
      if (this.clustersCompleted > 0) {
        this.callbacks.onLevelComplete();
        return;
      }
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
    
    // Draw pause overlay background if paused (UI will handle the rest)
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
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
    const x = this.player.x;
    const y = this.player.y;
    const w = this.player.width;
    const h = this.player.height;
    const centerX = x + w / 2;
    
    // Enable anti-aliasing for smoother curves
    ctx.imageSmoothingEnabled = true;
    
    // Draw top hat with rounded edges
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.roundRect(x + 6, y - 8, w - 12, 6, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 8, y - 16, w - 16, 8, 1);
    ctx.fill();
    
    // Draw head as circle
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(centerX, y + 8, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mustache with curves (white color)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX - 4, y + 12, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 4, y + 12, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes as circles
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 3, y + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 3, y + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw body (suit) with rounded corners
    ctx.fillStyle = '#2F4F4F';
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 18, w - 12, h - 20, 2);
    ctx.fill();
    
    // Draw vest
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 20, w - 16, h - 24, 1);
    ctx.fill();
    
    // Draw bow tie with curves
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.ellipse(centerX - 4, y + 18, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 4, y + 18, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(centerX - 1, y + 17, 2, 3);
    
    // Draw money bag (no symbol)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x + w - 6, y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add suit buttons
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX, y + 22, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, y + 26, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset text alignment
    ctx.textAlign = 'left';
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
    const centerX = this.goal.x + this.goal.width / 2;
    const centerY = this.goal.y + this.goal.height / 2;
    const time = Date.now() * 0.005; // for animation
    const canEnter = this.clustersCompleted > 0;
    
    // Draw outer portal ring (purple theme)
    ctx.strokeStyle = canEnter ? '#8B5CF6' : '#6B7280';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw inner swirling energy
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const radius = 15 + Math.sin(time * 2 + i) * 5;
      
      if (canEnter) {
        ctx.fillStyle = `hsl(${270 + i * 10}, 70%, ${50 + Math.sin(time + i) * 20}%)`;
      } else {
        ctx.fillStyle = `hsl(0, 0%, ${30 + Math.sin(time + i) * 10}%)`;
      }
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(angle) * radius, 
        centerY + Math.sin(angle) * radius, 
        3, 0, Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw central vortex
    ctx.fillStyle = canEnter ? '#5B21B6' : '#374151';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw portal particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.5;
      const radius = 35 + Math.sin(time * 3 + i) * 8;
      
      if (canEnter) {
        ctx.fillStyle = `rgba(139, 92, 246, ${0.3 + Math.sin(time * 2 + i) * 0.3})`;
      } else {
        ctx.fillStyle = `rgba(107, 114, 128, ${0.1 + Math.sin(time * 2 + i) * 0.1})`;
      }
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(angle) * radius, 
        centerY + Math.sin(angle) * radius, 
        2, 0, Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw portal text
    ctx.fillStyle = canEnter ? '#FFFFFF' : '#9CA3AF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    if (canEnter) {
      ctx.fillText('PORTAL', centerX, centerY - 50);
    } else {
      ctx.fillText('LOCKED', centerX, centerY - 50);
      ctx.font = 'bold 8px Arial';
      ctx.fillText('Complete a cluster', centerX, centerY + 55);
    }
  }

  private drawUI(ctx: CanvasRenderingContext2D) {
    // Draw UI elements like level, score, coins collected, etc.
    ctx.fillStyle = "#333";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    
    // Level display
    ctx.fillText(`Level: ${this.level}`, 20, 40);
    
    // Score
    ctx.fillText(`Score: ${this.score}`, 20, 70);
    
    // Coins collected vs total coins in level
    const totalCoins = this.coins.length + this.coinsCollected;
    ctx.fillText(`Coins: ${this.coinsCollected}/${totalCoins}`, 20, 100);
    
    // Progress indicator
    const progress = this.clustersCompleted / this.coinClusters.length;
    const progressBarWidth = 200;
    const progressBarHeight = 10;
    const progressBarX = 20;
    const progressBarY = 120;
    
    // Progress bar background
    ctx.fillStyle = "#ddd";
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // Progress bar fill
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
    
    // Progress text
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.fillText(`Clusters: ${this.clustersCompleted}/${this.coinClusters.length}`, progressBarX, progressBarY + 25);
    
    // Draw level progress bar  
    const levelProgress = Math.min(1, this.player.x / (this.levelWidth - 100));
    const barWidth = this.canvasWidth - 40;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(20, 160, barWidth, 10);
    
    ctx.fillStyle = '#8B5CF6';
    ctx.fillRect(20, 160, barWidth * levelProgress, 10);
    
    // Draw mini-map (centered at top)
    const miniMapWidth = 150;
    const miniMapHeight = 30;
    const miniMapX = (this.canvasWidth - miniMapWidth) / 2;
    const miniMapY = 20;
    
    // Dark background with border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);
    
    // Add border for better definition
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);
    
    // Player position on mini-map (bigger and more vibrant)
    const playerMiniX = miniMapX + (this.player.x / this.levelWidth) * miniMapWidth;
    ctx.fillStyle = '#3B82F6'; // Brighter blue
    ctx.fillRect(playerMiniX - 4, miniMapY + miniMapHeight / 2 - 4, 8, 8);
    
    // Add white outline for better visibility
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(playerMiniX - 4, miniMapY + miniMapHeight / 2 - 4, 8, 8);
    
    // Goal position on mini-map (bigger and more vibrant)
    const goalMiniX = miniMapX + (this.goal.x / this.levelWidth) * miniMapWidth;
    const canEnter = this.clustersCompleted > 0;
    ctx.fillStyle = canEnter ? '#A855F7' : '#9CA3AF'; // Brighter purple or gray
    ctx.fillRect(goalMiniX - 4, miniMapY + miniMapHeight / 2 - 4, 8, 8);
    
    // Add white outline for goal too
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(goalMiniX - 4, miniMapY + miniMapHeight / 2 - 4, 8, 8);
  }


}
