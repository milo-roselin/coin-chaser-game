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

export interface AvatarInfo {
  id: string;
  name: string;
  image?: string;
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
  private animationFrame = 0;
  private isMoving = false;
  private facingDirection = 1; // 1 for right, -1 for left
  private currentAvatar: AvatarInfo = { id: 'leprechaun', name: 'Leprechaun' };
  private avatarImages: { [key: string]: HTMLImageElement } = {};
  private portalImage: HTMLImageElement | null = null;
  private coinsNeededForPortal = 5; // Number of coins needed to activate portal
  private gameSpeed = 1; // Speed multiplier for the game
  private playerVelocity = { x: 0, y: 0 }; // Player velocity for smoother movement
  private isInitialized = false; // Flag to prevent rendering before proper initialization
  private renderFrameCount = 0; // Count frames to ensure stability before rendering

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

    // Check if on mobile device to adjust for control panel
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const controlPanelWidth = isMobile ? 128 : 0; // 128px control panel on mobile/iPad

    // Initialize goal (portal) - position it so it can be reached when player is at the right edge
    // The player can reach at most: levelWidth - controlPanelWidth - playerWidth
    // So the portal should be positioned where the player can actually reach it
    // The rightmost position where the player can be is when the camera is at maximum position
    // and the player is at the right edge of the visible area (minus control panel)
    const maxCameraX = this.levelWidth - canvasWidth + controlPanelWidth;
    const maxPlayerX = maxCameraX + canvasWidth - controlPanelWidth - 30; // 30 is player width
    const portalX = maxPlayerX - 150; // Position portal further left so it's fully visible and reachable
    
    this.goal = {
      x: portalX,
      y: canvasHeight / 2 - 60,
      width: 120,
      height: 120,
      color: '#8B5CF6',
      type: 'goal'
    };

    // Debug logging
    console.log(`Portal positioning: isMobile=${isMobile}, levelWidth=${this.levelWidth}, controlPanelWidth=${controlPanelWidth}, maxCameraX=${maxCameraX}, maxPlayerX=${maxPlayerX}, portalX=${portalX}`);

    // Portal image no longer needed - using custom rendering

    this.generateLevel();
    this.validateLevelReachability();
    
    // Initialize camera position to follow player from the start
    // This prevents any TNT flash issues at game startup
    this.updateCameraPosition();
    
    // Add a small delay before marking as initialized to ensure proper setup
    setTimeout(() => {
      this.isInitialized = true;
    }, 150); // Increased to 150ms delay to ensure canvas is ready
  }



  private generateLevel() {
    this.coins = [];
    this.obstacles = [];
    this.coinClusters = [];
    this.clustersCompleted = 0;
    this.score = 0;
    this.coinsCollected = 0;

    // Generate coins in clusters with better spacing
    const numClusters = 3 + Math.floor(this.level / 2); // More clusters every 2 levels
    const minDistance = 400; // Minimum distance between clusters
    const clusterPositions: Array<{x: number, y: number}> = [];
    
    for (let cluster = 0; cluster < numClusters; cluster++) {
      let clusterX, clusterY;
      let attempts = 0;
      
      // Find a position that's not too close to existing clusters and respects control panel
      const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const controlPanelWidth = isMobile ? 128 : 0;
      const maxClusterX = this.levelWidth - 400; // Keep clusters away from right edge
      
      do {
        clusterX = 300 + Math.random() * (maxClusterX - 300);
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
      
      // 3 coins per cluster with wider spread, ensuring they're within bounds
      for (let i = 0; i < 3; i++) {
        let coinX, coinY;
        let coinAttempts = 0;
        
        // Ensure coins are placed in valid positions and respect control panel
        const isMobileForCoins = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const controlPanelWidthForCoins = isMobileForCoins ? 128 : 0;
        const maxCoinX = this.levelWidth - 200; // Keep coins away from control panel area
        
        do {
          coinX = clusterX + (Math.random() - 0.5) * 160;
          coinY = clusterY + (Math.random() - 0.5) * 120;
          coinAttempts++;
        } while (coinAttempts < 20 && (
          coinX < 50 || coinX > maxCoinX || // Keep away from edges and control panel
          coinY < 50 || coinY > this.canvasHeight - 50
        ));
        
        // Fallback to safe position if no valid position found
        if (coinAttempts >= 20) {
          coinX = clusterX + (i - 1) * 40; // Spread coins linearly as fallback
          coinY = clusterY;
        }
        
        // Ensure coin is within playable area and doesn't overlap control panel
        coinX = Math.max(50, Math.min(maxCoinX, coinX));
        coinY = Math.max(50, Math.min(this.canvasHeight - 50, coinY));
        
        this.coins.push({
          x: coinX,
          y: coinY,
          width: 20,
          height: 20,
          color: '#F59E0B',
          type: 'coin'
        });
      }
    }

    // Generate TNT bombs that patrol around coin clusters (distributed evenly)
    const tntPerCluster = 1; // Keep it simple - one TNT per cluster to avoid clumping
    for (let clusterIndex = 0; clusterIndex < numClusters; clusterIndex++) {
      const clusterX = this.coinClusters[clusterIndex].x;
      const clusterY = this.coinClusters[clusterIndex].y;
      
      // Create circular patrol around the cluster with better spacing
      const patrolRadius = 90 + (clusterIndex % 3) * 20; // Vary radius to prevent overlap
      const startAngle = (clusterIndex * Math.PI * 2 / numClusters) + Math.random() * 0.5; // Space them out evenly
      
      // Ensure TNT starts far enough from the player start position (x=50)
      const tntStartX = clusterX + Math.cos(startAngle) * patrolRadius;
      const tntStartY = clusterY + Math.sin(startAngle) * patrolRadius;
      
      // Allow TNT anywhere in the level, removing safe zone
      if (true) { // TNT can spawn anywhere now
        this.obstacles.push({
          x: tntStartX,
          y: tntStartY,
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: (8 + Math.random() * 4) * (1 + this.level * 0.08), // Speed scales with level
          vy: (8 + Math.random() * 4) * (1 + this.level * 0.08), // Speed scales with level
          patrolStartX: clusterX, // center X of circular patrol
          patrolStartY: clusterY, // center Y of circular patrol
          patrolEndX: patrolRadius, // using this as radius
          patrolEndY: startAngle // using this as current angle
        });
      }
    }
    
    // Add progressive difficulty scaling for additional TNT
    if (this.level > 1) {
      // Progressive increase: more TNT every 2 levels, with scaling multiplier
      const levelMultiplier = Math.min(1 + (this.level - 1) * 0.2, 4); // Cap at 4x
      const additionalTnt = Math.floor(this.level * levelMultiplier / 2);
      for (let i = 0; i < additionalTnt; i++) {
        const clusterIndex = i % numClusters; // Cycle through clusters
        const clusterX = this.coinClusters[clusterIndex].x;
        const clusterY = this.coinClusters[clusterIndex].y;
        
        // Create a second TNT with different radius and offset angle
        const patrolRadius = 60 + Math.random() * 40;
        const startAngle = (Math.PI + i * Math.PI / 2) % (Math.PI * 2); // Different starting positions
        
        const tntX = clusterX + Math.cos(startAngle) * patrolRadius;
        
        // Allow TNT anywhere in the level, removing safe zone
        const minStartXForAdditional = 50; // Allow TNT anywhere
        
        if (tntX > minStartXForAdditional) {
          this.obstacles.push({
            x: tntX,
            y: clusterY + Math.sin(startAngle) * patrolRadius,
            width: 35,
            height: 35,
            color: '#8B4513',
            type: 'obstacle',
            vx: (8 + Math.random() * 4) * (1 + this.level * 0.1), // Speed increases with level
            vy: (8 + Math.random() * 4) * (1 + this.level * 0.1), // Speed increases with level
            patrolStartX: clusterX,
            patrolStartY: clusterY,
            patrolEndX: patrolRadius,
            patrolEndY: startAngle
          });
        }
      }
    }

    // Add some linear patrolling TNT bombs between clusters (reduced to prevent overcrowding)
    const linearTnt = Math.min(2, this.level); // Cap linear TNT to prevent overcrowding
    for (let i = 0; i < linearTnt; i++) {
      let x, y;
      let attempts = 0;
      
      // Find positions that are away from coin clusters and control panel
      const isMobileForLinear = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const controlPanelWidthForLinear = isMobileForLinear ? 128 : 0;
      const maxLinearX = this.levelWidth - 300 - controlPanelWidthForLinear; // Keep away from right edge and control panel
      
      // iPad-specific: Allow TNT closer to start for better distribution
      const isIPadForLinear = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const minLinearStartX = isIPadForLinear ? 200 : 500; // Allow TNT closer to start on iPad
      
      do {
        x = minLinearStartX + Math.random() * (maxLinearX - minLinearStartX);
        y = 80 + Math.random() * (this.canvasHeight - 160);
        attempts++;
      } while (attempts < 20 && clusterPositions.some(pos => 
        Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < 250 // Increase minimum distance from clusters
      ));
      
      const patrolType = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      
      if (patrolType === 'horizontal') {
        const patrolRange = 120 + Math.random() * 150; // Smaller patrol ranges
        const patrolStartX = Math.max(50, x - patrolRange / 2);
        const patrolEndX = Math.min(maxLinearX, x + patrolRange / 2);
        
        this.obstacles.push({
          x: patrolStartX,
          y,
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: (8 + Math.random() * 4) * (1 + this.level * 0.1), // Much faster movement
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
          vy: (8 + Math.random() * 4) * (1 + this.level * 0.1), // Much faster movement
          patrolStartX: x,
          patrolEndX: x,
          patrolStartY,
          patrolEndY
        });
      }
    }

    // Add TNT patrols along all outside walls - progressive scaling
    const wallPatrols = 2 + Math.floor(this.level * (1 + this.level * 0.1) / 3); // Exponential growth
    
    // Removed wall patrols - now handled by barrier patrols

    // Add multiple rows of TNT barrier patrols to prevent edge-hugging strategies
    // But keep them away from the portal area (right side)
    const levelDifficultyMultiplier = Math.min(1 + (this.level - 1) * 0.15, 3); // Progressive scaling
    const numBarriers = Math.floor((18 + Math.floor(this.level / 2)) * levelDifficultyMultiplier); // Scaled barriers
    const barrierRows = 2; // Multiple rows of barriers (back to 2)
    // Calculate safe zone based on control panel width - make sure it accounts for the new portal position
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const controlPanelWidth = isMobile ? 128 : 0; // 128px control panel on mobile/iPad
    const portalSafeZone = 250 + controlPanelWidth; // Keep TNT away from portal area and control panel (increased for new portal position)
    
    // Top edge barrier patrols (multiple rows moving horizontally, but not near portal)
    for (let row = 0; row < barrierRows; row++) {
      for (let i = 0; i < numBarriers; i++) {
        const x = 80 + (i * (this.levelWidth - portalSafeZone - 80) / numBarriers); // Start from the left edge
        // Only add if not in portal area
        if (x < this.levelWidth - portalSafeZone) {
          this.obstacles.push({
            x: x,
            y: 20 + (row * 40), // Multiple rows
            width: 35,
            height: 35,
            color: '#8B4513',
            type: 'obstacle',
            vx: (1.0 + Math.random() * 1.0) * (row % 2 === 0 ? 1 : -1) * (1 + this.level * 0.05), // Speed scales with level
            vy: 0,
            patrolStartX: 50, // Start patrol from the left edge
            patrolEndX: this.levelWidth - portalSafeZone,
            patrolStartY: 20 + (row * 40),
            patrolEndY: 20 + (row * 40)
          });
        }
      }
    }
    
    // Bottom edge barrier patrols (multiple rows moving horizontally, but not near portal)
    for (let row = 0; row < barrierRows; row++) {
      for (let i = 0; i < numBarriers; i++) {
        const x = 80 + (i * (this.levelWidth - portalSafeZone - 160) / numBarriers);
        // Only add if not in portal area
        if (x < this.levelWidth - portalSafeZone) {
          this.obstacles.push({
            x: x,
            y: this.canvasHeight - 55 - (row * 40), // Multiple rows from bottom
            width: 35,
            height: 35,
            color: '#8B4513',
            type: 'obstacle',
            vx: (1.0 + Math.random() * 1.0) * (row % 2 === 0 ? -1 : 1), // Alternate directions
            vy: 0,
            patrolStartX: 50,
            patrolEndX: this.levelWidth - portalSafeZone,
            patrolStartY: this.canvasHeight - 55 - (row * 40),
            patrolEndY: this.canvasHeight - 55 - (row * 40)
          });
        }
      }
    }
    
    // Left edge barrier patrols (multiple columns moving vertically)
    const sideBarriers = Math.ceil(numBarriers / 2);
    for (let col = 0; col < barrierRows; col++) {
      for (let i = 0; i < sideBarriers; i++) {
        this.obstacles.push({
          x: 20 + (col * 40), // Multiple columns
          y: 120 + (i * (this.canvasHeight - 240) / sideBarriers),
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: 0,
          vy: (1.0 + Math.random() * 1.0) * (col % 2 === 0 ? 1 : -1), // Alternate directions
          patrolStartX: 20 + (col * 40),
          patrolEndX: 20 + (col * 40),
          patrolStartY: 100,
          patrolEndY: this.canvasHeight - 100
        });
      }
    }
    
    // Right edge barrier patrols removed to keep portal area clear

    // Add additional dense TNT guards on top and bottom edges for increased difficulty
    const additionalTopBottomGuards = 10 + Math.floor(this.level / 3); // More guards in higher levels (increased from 6)
    
    // Additional top edge guards (closer spacing, different patrol patterns)
    for (let i = 0; i < additionalTopBottomGuards; i++) {
      const x = 120 + (i * (this.levelWidth - portalSafeZone - 240) / additionalTopBottomGuards);
      if (x < this.levelWidth - portalSafeZone) {
        this.obstacles.push({
          x: x,
          y: 60, // Between the existing rows
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: (1.2 + Math.random() * 0.8) * (i % 2 === 0 ? 1 : -1), // Varied speed
          vy: 0,
          patrolStartX: 60,
          patrolEndX: this.levelWidth - portalSafeZone,
          patrolStartY: 60,
          patrolEndY: 60
        });
      }
    }
    
    // Additional bottom edge guards (closer spacing, different patrol patterns)
    for (let i = 0; i < additionalTopBottomGuards; i++) {
      const x = 120 + (i * (this.levelWidth - portalSafeZone - 240) / additionalTopBottomGuards);
      if (x < this.levelWidth - portalSafeZone) {
        this.obstacles.push({
          x: x,
          y: this.canvasHeight - 95, // Between the existing rows
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: (1.2 + Math.random() * 0.8) * (i % 2 === 0 ? -1 : 1), // Varied speed, opposite direction
          vy: 0,
          patrolStartX: 60,
          patrolEndX: this.levelWidth - portalSafeZone,
          patrolStartY: this.canvasHeight - 95,
          patrolEndY: this.canvasHeight - 95
        });
      }
    }

    // Add staggered TNT guards on top and bottom for varied movement patterns
    const staggeredGuards = 8 + Math.floor(this.level / 4); // More staggered guards in higher levels (increased from 4)
    
    // Staggered top guards with different Y positions
    for (let i = 0; i < staggeredGuards; i++) {
      const x = 200 + (i * (this.levelWidth - portalSafeZone - 400) / staggeredGuards);
      const yOffset = (i % 2) * 25; // Alternate between two Y positions
      if (x < this.levelWidth - portalSafeZone) {
        this.obstacles.push({
          x: x,
          y: 35 + yOffset, // Staggered Y positions
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: (0.8 + Math.random() * 0.6) * (i % 3 === 0 ? 1 : -1), // Slower, varied direction
          vy: 0,
          patrolStartX: 80,
          patrolEndX: this.levelWidth - portalSafeZone,
          patrolStartY: 35 + yOffset,
          patrolEndY: 35 + yOffset
        });
      }
    }
    
    // Staggered bottom guards with different Y positions
    for (let i = 0; i < staggeredGuards; i++) {
      const x = 200 + (i * (this.levelWidth - portalSafeZone - 400) / staggeredGuards);
      const yOffset = (i % 2) * 25; // Alternate between two Y positions
      if (x < this.levelWidth - portalSafeZone) {
        this.obstacles.push({
          x: x,
          y: this.canvasHeight - 70 - yOffset, // Staggered Y positions from bottom
          width: 35,
          height: 35,
          color: '#8B4513',
          type: 'obstacle',
          vx: (0.8 + Math.random() * 0.6) * (i % 3 === 0 ? -1 : 1), // Slower, varied direction
          vy: 0,
          patrolStartX: 80,
          patrolEndX: this.levelWidth - portalSafeZone,
          patrolStartY: this.canvasHeight - 70 - yOffset,
          patrolEndY: this.canvasHeight - 70 - yOffset
        });
      }
    }

    // Only ensure obstacles don't overlap with portal area
    this.obstacles = this.obstacles.filter(obs => 
      obs.x <= 60 || // Allow left wall patrols and barriers
      obs.y <= 60 || // Allow top wall patrols and barriers
      obs.y >= this.canvasHeight - 60 || // Allow bottom wall patrols and barriers
      obs.x < this.levelWidth - 200 // Only filter out obstacles too close to portal
    );
    
    // Validate coin accessibility - ensure no coins are completely surrounded by obstacles
    this.coins = this.coins.filter(coin => {
      // Check if coin has at least one path (basic accessibility check)
      const nearbyObstacles = this.obstacles.filter(obs => {
        const dx = Math.abs(obs.x + obs.width/2 - coin.x - coin.width/2);
        const dy = Math.abs(obs.y + obs.height/2 - coin.y - coin.height/2);
        return dx < 60 && dy < 60; // Within close proximity
      });
      
      // Check if coin is too close to patrol paths
      const tooCloseToPatrol = this.obstacles.some(obs => {
        if (obs.patrolStartX !== undefined && obs.patrolEndX !== undefined) {
          // For horizontal patrol
          if (obs.patrolStartY === obs.patrolEndY) {
            const patrolY = obs.patrolStartY;
            const patrolStartX = Math.min(obs.patrolStartX, obs.patrolEndX);
            const patrolEndX = Math.max(obs.patrolStartX, obs.patrolEndX);
            
            return coin.y > patrolY - 40 && coin.y < patrolY + 40 &&
                   coin.x > patrolStartX - 40 && coin.x < patrolEndX + 40;
          }
          // For vertical patrol
          if (obs.patrolStartX === obs.patrolEndX) {
            const patrolX = obs.patrolStartX;
            const patrolStartY = Math.min(obs.patrolStartY!, obs.patrolEndY!);
            const patrolEndY = Math.max(obs.patrolStartY!, obs.patrolEndY!);
            
            return coin.x > patrolX - 40 && coin.x < patrolX + 40 &&
                   coin.y > patrolStartY - 40 && coin.y < patrolEndY + 40;
          }
        }
        return false;
      });
      
      // If there are too many obstacles very close to the coin, or it's in a patrol path, it might be unreachable
      return nearbyObstacles.length < 4 && !tooCloseToPatrol; // Allow some challenge but not complete blockade
    });
    
    // Ensure we have at least some coins left after filtering
    if (this.coins.length < 3) {
      // Add safe coins if too many were filtered out
      const safeCoinCount = 3 - this.coins.length;
      for (let i = 0; i < safeCoinCount; i++) {
        this.coins.push({
          x: 150 + i * 100, // Safe positions near start
          y: this.canvasHeight / 2 + (i - 1) * 40,
          width: 20,
          height: 20,
          color: '#F59E0B',
          type: 'coin'
        });
      }
    }
    
    // Validate that portal is reachable after generation
    this.validateLevelReachability();
  }

  private validateLevelReachability(): boolean {
    // Since obstacles are moving, we only need to check if there are any permanent barriers
    // For moving obstacles, the player can time their movement to pass through
    const gridSize = 30; // Larger grid for more generous pathfinding
    const gridWidth = Math.ceil(this.levelWidth / gridSize);
    const gridHeight = Math.ceil(this.canvasHeight / gridSize);
    
    // Create a grid where true = passable, false = permanently blocked
    const grid: boolean[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(true));
    
    // Only mark areas as blocked if they have high obstacle density
    // This prevents marking single moving obstacles as permanent barriers
    const obstacleInfluence: number[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    
    // Calculate obstacle influence rather than hard blocking
    this.obstacles.forEach(obstacle => {
      const centerX = Math.floor((obstacle.x + obstacle.width / 2) / gridSize);
      const centerY = Math.floor((obstacle.y + obstacle.height / 2) / gridSize);
      
      // Add influence around obstacle center (since they move, they don't permanently block)
      for (let y = Math.max(0, centerY - 1); y < Math.min(gridHeight, centerY + 2); y++) {
        for (let x = Math.max(0, centerX - 1); x < Math.min(gridWidth, centerX + 2); x++) {
          obstacleInfluence[y][x] += 1;
        }
      }
    });
    
    // Only block areas with very high obstacle density (3+ obstacles in same area)
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (obstacleInfluence[y][x] >= 3) {
          grid[y][x] = false;
        }
      }
    }
    
    // Simple BFS pathfinding from player to goal
    const playerGridX = Math.floor(this.player.x / gridSize);
    const playerGridY = Math.floor(this.player.y / gridSize);
    const goalGridX = Math.floor(this.goal.x / gridSize);
    const goalGridY = Math.floor(this.goal.y / gridSize);
    
    const queue = [[playerGridX, playerGridY]];
    const visited = new Set<string>();
    visited.add(`${playerGridX},${playerGridY}`);
    
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]; // Include diagonal movement
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      
      // Check if we reached the goal area (more generous)
      if (Math.abs(x - goalGridX) <= 3 && Math.abs(y - goalGridY) <= 3) {
        console.log(`Level ${this.level}: Portal is reachable! (Moving obstacles allow passage)`);
        return true;
      }
      
      // Explore neighbors
      for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;
        const key = `${newX},${newY}`;
        
        if (newX >= 0 && newX < gridWidth && 
            newY >= 0 && newY < gridHeight && 
            grid[newY][newX] && 
            !visited.has(key)) {
          visited.add(key);
          queue.push([newX, newY]);
        }
      }
    }
    
    // If we get here, check if it's due to too many obstacles clustered together
    const totalObstacles = this.obstacles.length;
    const levelArea = (this.levelWidth * this.canvasHeight) / (gridSize * gridSize);
    const obstacleDensity = totalObstacles / levelArea;
    
    if (obstacleDensity > 0.3) { // If obstacle density is too high
      console.warn(`Level ${this.level}: Too many obstacles clustered, regenerating...`);
      this.generateLevel();
      return this.validateLevelReachability();
    }
    
    // Otherwise, assume it's reachable since obstacles are moving
    console.log(`Level ${this.level}: Portal assumed reachable (obstacles are moving)`);
    return true;
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
    
    // Handle speed adjustment keys
    if (key === 'Equal' || key === 'NumpadAdd') { // Plus key (= key without shift, or numpad +)
      this.gameSpeed = Math.min(this.gameSpeed + 0.25, 3); // Max speed of 3x
      console.log(`Game speed increased to ${this.gameSpeed}x`);
    } else if (key === 'Minus' || key === 'NumpadSubtract') { // Minus key (- key or numpad -)
      this.gameSpeed = Math.max(this.gameSpeed - 0.25, 0.25); // Min speed of 0.25x
      console.log(`Game speed decreased to ${this.gameSpeed}x`);
    }
    
    this.keys[key] = true;
  }

  public handleKeyUp(key: string) {
    this.keys[key] = false;
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
  }

  public setAvatar(avatar: AvatarInfo) {
    this.currentAvatar = avatar;
    
    // Load avatar image if it has one
    if (avatar.image && !this.avatarImages[avatar.id]) {
      const img = new Image();
      img.src = avatar.image;
      img.onload = () => {
        this.avatarImages[avatar.id] = img;
      };
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public update() {
    // Don't update game state if not initialized or paused
    if (!this.isInitialized || this.isPaused) {
      return;
    }
    
    const baseSpeed = 5;
    const acceleration = 0.8; // How quickly player accelerates
    const deceleration = 0.85; // How quickly player decelerates (higher = faster stop)
    
    // Target velocity based on input
    let targetVelX = 0;
    let targetVelY = 0;
    
    // Handle keyboard input
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      targetVelY = -baseSpeed * this.gameSpeed;
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      targetVelY = baseSpeed * this.gameSpeed;
    }
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      targetVelX = -baseSpeed * this.gameSpeed;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      targetVelX = baseSpeed * this.gameSpeed;
    }
    
    // Handle touch input (if no keyboard input)
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
        const touchSpeed = 3 * this.gameSpeed;
        targetVelX = (dx / distance) * touchSpeed;
        targetVelY = (dy / distance) * touchSpeed;
      }
    }
    
    // Smoother velocity interpolation for better movement feel
    this.playerVelocity.x = this.lerp(this.playerVelocity.x, targetVelX, 
                                      targetVelX === 0 ? 0.9 : 0.85); // Improved smoothness
    this.playerVelocity.y = this.lerp(this.playerVelocity.y, targetVelY, 
                                      targetVelY === 0 ? 0.9 : 0.85); // Improved smoothness
    
    // Apply velocity to player position
    this.player.x += this.playerVelocity.x;
    this.player.y += this.playerVelocity.y;
    
    // Track movement for animation
    const moveX = this.playerVelocity.x;
    const moveY = this.playerVelocity.y;
    
    // Check if player is moving and update animation
    const movementThreshold = 0.1; // Small threshold to prevent jittery animation
    this.isMoving = Math.abs(moveX) > movementThreshold || Math.abs(moveY) > movementThreshold;
    if (this.isMoving) {
      this.animationFrame += 0.5 * this.gameSpeed; // Smoother animation speed
      // Update facing direction based on horizontal movement
      if (moveX > 0) {
        this.facingDirection = 1; // Moving right
      } else if (moveX < 0) {
        this.facingDirection = -1; // Moving left
      }
    }

    // Update camera position
    this.updateCameraPosition();

    // Keep player in bounds - account for control panel on mobile
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const controlPanelWidth = isMobile ? 128 : 0; // 128px control panel on mobile/iPad
    
    // The player should be able to move through the level but stop when they would go under the control panel
    // This means the rightmost position should be relative to the current camera position + canvas width - control panel width
    const rightBoundary = this.cameraX + this.canvasWidth - controlPanelWidth;
    const maxPlayerX = Math.min(this.levelWidth - this.player.width, rightBoundary - this.player.width);
    
    // Debug logging for player boundaries
    if (this.player.x > maxPlayerX - 100) { // Only log when near the boundary
      console.log(`Player boundary: cameraX=${this.cameraX}, canvasWidth=${this.canvasWidth}, controlPanelWidth=${controlPanelWidth}, rightBoundary=${rightBoundary}, maxPlayerX=${maxPlayerX}, playerX=${this.player.x}`);
    }
    
    this.player.x = Math.max(0, Math.min(maxPlayerX, this.player.x));
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
          
          // iPad-specific: Use more stable circular movement
          const isIPadForMovement = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          
          // Apply level-based speed scaling to circular TNT movement
          const levelSpeedMultiplier = 1 + (this.level - 1) * 0.08; // 8% increase per level
          
          if (isIPadForMovement) {
            // Faster, more stable movement for iPad with level scaling
            angle += 0.04 * levelSpeedMultiplier;
          } else {
            // Faster complex movement for other devices with level scaling
            angle += (0.035 + (Math.sin(Date.now() * 0.001 + radius) * 0.01)) * levelSpeedMultiplier;
          }
          obstacle.patrolEndY = angle;
          
          // Calculate new position
          obstacle.x = centerX + Math.cos(angle) * radius - obstacle.width / 2;
          obstacle.y = centerY + Math.sin(angle) * radius - obstacle.height / 2;
          
          // iPad-specific: Don't constrain circular TNT movement as aggressively
          const isIPadForCircular = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          
          // Allow circular TNT to move freely - no constraints
          
          // Update velocity for movement indicators
          obstacle.vx = Math.cos(angle + Math.PI / 2) * 2;
          obstacle.vy = Math.sin(angle + Math.PI / 2) * 2;
          
        } else {
          // Linear movement (existing code) without speed multiplier
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
          
          // iPad-specific: Don't restrict linear TNT to tight patrol bounds on iPad
          const isIPadForPatrolBounds = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          
          // Allow obstacles to move freely within the level bounds
          obstacle.x = Math.max(0, Math.min(this.levelWidth - obstacle.width, obstacle.x));
          obstacle.y = Math.max(0, Math.min(this.canvasHeight - obstacle.height, obstacle.y));
          
          // iPad-specific: Don't constrain linear TNT movement as aggressively
          const isIPadForLinearObstacles = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          
          // Allow linear obstacles to move freely - no control panel constraints
        }
      }
    });

    // Camera position already updated above

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

    // Check goal collision (only if 5 coins are collected)
    if (checkCollision(this.player, this.goal)) {
      if (this.coinsCollected >= this.coinsNeededForPortal) {
        this.callbacks.onLevelComplete();
        return;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Only prevent rendering during the initial startup period
    if (!this.isInitialized || this.renderFrameCount < 5) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.renderFrameCount++;
      return;
    }
    
    // Clear canvas with black background first
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw control panel area on mobile BEFORE anything else to prevent green overflow
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      this.drawControlPanelBackground(ctx);
    }

    // Save context for camera transform
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Draw background pattern only in the game area (limit to game area, not control panel)
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
    // Calculate the actual game area (exclude control panel on mobile)
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const controlPanelWidth = isMobile ? 128 : 0;
    const gameAreaWidth = this.canvasWidth - controlPanelWidth;
    
    // Only draw background within the visible game area and up to level width
    const backgroundWidth = Math.min(this.levelWidth, gameAreaWidth + this.cameraX);
    
    // Draw grass background only in the playable area
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(0, 0, backgroundWidth, this.canvasHeight);

    // Draw grid pattern only in the playable area
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 1;
    for (let x = 0; x < backgroundWidth; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(backgroundWidth, y);
      ctx.stroke();
    }
  }

  private drawControlPanelBackground(ctx: CanvasRenderingContext2D) {
    // Draw control panel background area
    const controlPanelWidth = 128;
    const panelX = this.canvasWidth - controlPanelWidth;
    
    // Draw panel background with slight transparency
    ctx.fillStyle = 'rgba(45, 45, 45, 0.95)';
    ctx.fillRect(panelX, 0, controlPanelWidth, this.canvasHeight);
    
    // Draw panel border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(panelX, 0);
    ctx.lineTo(panelX, this.canvasHeight);
    ctx.stroke();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const x = this.player.x;
    const y = this.player.y;
    const w = this.player.width;
    const h = this.player.height;
    const centerX = x + w / 2;
    
    // Enable anti-aliasing for smoother curves
    ctx.imageSmoothingEnabled = true;
    
    // Save the current transformation matrix
    ctx.save();
    
    // Apply horizontal flip if facing left
    if (this.facingDirection === -1) {
      ctx.translate(centerX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-centerX, 0);
    }

    // Check which avatar to draw
    if (this.currentAvatar.id === 'count-olaf') {
      this.drawCountOlafAvatar(ctx, x, y, w, h, centerX);
    } else if (this.currentAvatar.id === 'tom-nook') {
      this.drawTomNookAvatar(ctx, x, y, w, h, centerX);
    } else if (this.currentAvatar.id === 'ebenezer-scrooge') {
      this.drawEbenezerScroogeAvatar(ctx, x, y, w, h, centerX);
    } else if (this.currentAvatar.id === 'wario') {
      this.drawWarioAvatar(ctx, x, y, w, h, centerX);
    } else {
      // Draw default leprechaun avatar
      this.drawLeprechaunAvatar(ctx, x, y, w, h, centerX);
    }
    
    // Restore the transformation matrix
    ctx.restore();
    
    // Reset text alignment
    ctx.textAlign = 'left';
  }

  private drawTomNookAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, centerX: number) {
    // Draw Tom Nook's head (brown tanuki)
    ctx.fillStyle = '#8B4513'; // Brown fur
    ctx.beginPath();
    ctx.ellipse(centerX, y + 10, 11, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw lighter brown muzzle
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(centerX, y + 12, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw black nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, y + 10, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw ears
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(centerX - 8, y + 2, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8, y + 2, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw inner ears
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(centerX - 8, y + 2, 2, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8, y + 2, 2, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 4, y + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 4, y + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw apron/shirt
    ctx.fillStyle = '#4169E1'; // Blue apron
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 22, w - 10, h - 25, 3);
    ctx.fill();
    
    // Draw apron straps
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 18, 3, 8, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w - 11, y + 18, 3, 8, 1);
    ctx.fill();
    
    // Draw arms
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 30, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 2, y + 30, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw legs
    ctx.fillStyle = '#8B4513';
    if (this.isMoving) {
      const legCycle = Math.sin(Date.now() * 0.015) * 3; // Smoother leg movement
      const forwardOffset = 2.5; // Slightly more pronounced movement
      
      const leftLegX = centerX - 5 + (legCycle > 0 ? forwardOffset : -forwardOffset);
      const leftLegY = y + h - 4 + Math.abs(legCycle) * 0.15; // Smoother vertical bounce
      ctx.fillRect(leftLegX, leftLegY, 4, 8);
      
      const rightLegX = centerX + 1 + (legCycle < 0 ? forwardOffset : -forwardOffset);
      const rightLegY = y + h - 4 + Math.abs(legCycle) * 0.15; // Smoother vertical bounce
      ctx.fillRect(rightLegX, rightLegY, 4, 8);
    } else {
      ctx.fillRect(centerX - 5, y + h - 4, 4, 8);
      ctx.fillRect(centerX + 1, y + h - 4, 4, 8);
    }
  }

  private drawEbenezerScroogeAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, centerX: number) {
    // Enable smooth rendering for clean, flat appearance like thumbnail
    ctx.imageSmoothingEnabled = true;
    
    // Draw black top hat - very flat rectangular like thumbnail
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 3, y - 25, w - 6, 18); // Completely flat rectangle
    
    // Draw hat brim - completely flat
    ctx.fillRect(x + 1, y - 8, w - 2, 3);
    
    // Draw white hair as perfect rectangles on sides
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 1, y - 2, 4, 12); // Left sideburn - perfectly flat
    ctx.fillRect(x + w - 5, y - 2, 4, 12); // Right sideburn - perfectly flat
    
    // Draw perfectly rectangular face like thumbnail
    ctx.fillStyle = '#D2B48C'; // Tan skin tone matching thumbnail
    ctx.fillRect(x + 5, y - 2, w - 10, 14); // Perfectly flat face
    
    // Draw gray eyebrows - perfect rectangles
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(x + 7, y + 1, 3, 2); // Left eyebrow - completely flat
    ctx.fillRect(x + w - 10, y + 1, 3, 2); // Right eyebrow - completely flat
    
    // Draw small black circular eyes - perfectly round
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + 8, y + 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 8, y + 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw simple nose - just a tiny line
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(centerX - 0.5, y + 6, 1, 3);
    
    // Draw white beard - simplified teardrop like thumbnail
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX, y + 15, 5, 6, 0, 0, Math.PI * 2); // Simple oval beard
    ctx.fill();
    
    // Add subtle beard detail - smaller oval
    ctx.fillStyle = '#F8F8F8';
    ctx.beginPath();
    ctx.ellipse(centerX, y + 15, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw dark navy coat - perfectly rectangular like thumbnail
    ctx.fillStyle = '#1a1a2e'; // Dark navy matching thumbnail
    ctx.fillRect(x + 2, y + 18, w - 4, h - 20); // Perfectly flat coat
    
    // Draw white V-neck collar - sharp geometric shape
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 18); // Top left
    ctx.lineTo(x + w - 4, y + 18); // Top right
    ctx.lineTo(x + w - 6, y + 24); // Right point
    ctx.lineTo(centerX + 2, y + 28); // Bottom right of V
    ctx.lineTo(centerX - 2, y + 28); // Bottom left of V
    ctx.lineTo(x + 6, y + 24); // Left point
    ctx.closePath();
    ctx.fill();
    
    // Draw two black buttons - perfectly circular
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, y + 32, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, y + 38, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw tan hands/arms - perfect rectangles
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(x - 1, y + 24, 3, 8); // Left arm - completely flat
    ctx.fillRect(x + w - 2, y + 24, 3, 8); // Right arm - completely flat
    
    // Draw gray rectangular pants - perfectly flat like thumbnail
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 6, y + 42, w - 12, h - 44); // Perfectly flat pants
    
    // Draw black rectangular shoes - completely flat
    ctx.fillStyle = '#000000';
    if (this.isMoving) {
      // Smoother movement for Scrooge
      const legCycle = Math.sin(Date.now() * 0.012) * 2; // Slightly faster but still dignified
      const forwardOffset = 2; // More noticeable movement
      
      const leftShoeX = centerX - 6 + (legCycle > 0 ? forwardOffset : -forwardOffset);
      const leftShoeY = y + h - 3 + Math.abs(legCycle) * 0.08; // Smoother vertical movement
      ctx.fillRect(leftShoeX, leftShoeY, 6, 4); // Completely flat shoe
      
      const rightShoeX = centerX + 1 + (legCycle < 0 ? forwardOffset : -forwardOffset);
      const rightShoeY = y + h - 3 + Math.abs(legCycle) * 0.08; // Smoother vertical movement
      ctx.fillRect(rightShoeX, rightShoeY, 6, 4); // Completely flat shoe
    } else {
      ctx.fillRect(centerX - 6, y + h - 3, 6, 4); // Completely flat shoe
      ctx.fillRect(centerX + 1, y + h - 3, 6, 4); // Completely flat shoe
    }
  }

  private drawWarioAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, centerX: number) {
    // Draw Wario's cap
    ctx.fillStyle = '#FFD700'; // Gold/yellow cap
    ctx.beginPath();
    ctx.ellipse(centerX, y + 2, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw W emblem on cap
    ctx.fillStyle = '#800080'; // Purple W
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('W', centerX, y + 5);
    
    // Draw face (round and chubby)
    ctx.fillStyle = '#FFDBAC'; // Peach skin
    ctx.beginPath();
    ctx.ellipse(centerX, y + 12, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw large nose
    ctx.fillStyle = '#FFB6C1'; // Light pink
    ctx.beginPath();
    ctx.ellipse(centerX, y + 12, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 4, y + 9, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 4, y + 9, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw handlebar mustache
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(centerX - 4, y + 15, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 4, y + 15, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw static satisfied smirk (smallest smile form)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, y + 17, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Draw yellow shirt
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 21, w - 8, h - 23, 2);
    ctx.fill();
    
    // Draw purple overalls
    ctx.fillStyle = '#800080';
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 25, w - 12, h - 27, 2);
    ctx.fill();
    
    // Draw overalls straps
    ctx.fillStyle = '#800080';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 21, 2, 6, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w - 10, y + 21, 2, 6, 1);
    ctx.fill();
    
    // Draw chunky legs with reduced movement range that syncs with game speed
    ctx.fillStyle = '#800080';
    if (this.isMoving) {
      const speedMultiplier = this.gameSpeed || 1; // Use current game speed
      const legCycle = Math.sin(Date.now() * 0.016 * speedMultiplier) * 1.5; // Animation speed matches game speed
      const forwardOffset = 1.2; // Reduced from 2.5 to 1.2 - less extreme movement
      
      const leftLegX = centerX - 6 + (legCycle > 0 ? forwardOffset : -forwardOffset);
      const leftLegY = y + h - 4 + Math.abs(legCycle) * 0.1; // Reduced bounce from 0.15 to 0.1
      ctx.fillRect(leftLegX, leftLegY, 5, 8);
      
      const rightLegX = centerX + 1 + (legCycle < 0 ? forwardOffset : -forwardOffset);
      const rightLegY = y + h - 4 + Math.abs(legCycle) * 0.1; // Reduced bounce from 0.15 to 0.1
      ctx.fillRect(rightLegX, rightLegY, 5, 8);
    } else {
      ctx.fillRect(centerX - 6, y + h - 4, 5, 8);
      ctx.fillRect(centerX + 1, y + h - 4, 5, 8);
    }
  }

  private drawCountOlafAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, centerX: number) {
    // No hat - removed completely
    
    // Draw pale, angular head (more like thumbnail)
    ctx.fillStyle = '#F5F5DC'; // Pale beige skin like thumbnail
    ctx.beginPath();
    ctx.ellipse(centerX, y + 12, 9, 11, 0, 0, Math.PI * 2); // More oval, taller head
    ctx.fill();
    
    // Draw thick dark unibrow (like thumbnail)
    ctx.fillStyle = '#2F2F2F';
    ctx.beginPath();
    ctx.roundRect(centerX - 7, y + 7, 14, 3, 1);
    ctx.fill();
    
    // Draw beady eyes (like thumbnail)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 3, y + 11, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 3, y + 11, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw thin mustache (like thumbnail)
    ctx.fillStyle = '#2F2F2F';
    ctx.beginPath();
    ctx.ellipse(centerX - 3, y + 15, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 3, y + 15, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sinister thin smile (like thumbnail)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, y + 17, 2.5, 0.3, Math.PI - 0.3);
    ctx.stroke();
    
    // Draw black tailcoat (more coat-like shape)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    // Main coat body - wider at top, narrower at bottom
    ctx.moveTo(x + 3, y + 21);
    ctx.lineTo(x + w - 3, y + 21);
    ctx.lineTo(x + w - 4, y + 28);
    ctx.lineTo(x + w - 6, y + 35);
    ctx.lineTo(x + 6, y + 35);
    ctx.lineTo(x + 4, y + 28);
    ctx.closePath();
    ctx.fill();
    
    // Draw coat tails
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 35);
    ctx.lineTo(x + 4, y + 42);
    ctx.lineTo(x + 8, y + 42);
    ctx.lineTo(x + 10, y + 35);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 35);
    ctx.lineTo(x + w - 10, y + 35);
    ctx.lineTo(x + w - 8, y + 42);
    ctx.lineTo(x + w - 4, y + 42);
    ctx.closePath();
    ctx.fill();
    
    // Draw arms extending from coat
    ctx.fillStyle = '#000000';
    if (this.isMoving) {
      const armCycle = Math.sin(Date.now() * 0.012) * 1.8;
      
      // Left arm
      const leftArmX = x - 1 + armCycle;
      const leftArmY = y + 25;
      ctx.fillRect(leftArmX, leftArmY, 3, 14);
      
      // Right arm  
      const rightArmX = x + w - 2 - armCycle;
      const rightArmY = y + 25;
      ctx.fillRect(rightArmX, rightArmY, 3, 14);
      
      // Draw hands
      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath();
      ctx.arc(leftArmX + 1.5, leftArmY + 14, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightArmX + 1.5, rightArmY + 14, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Static arms
      ctx.fillRect(x - 1, y + 25, 3, 14); // Left arm
      ctx.fillRect(x + w - 2, y + 25, 3, 14); // Right arm
      
      // Draw static hands
      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath();
      ctx.arc(x + 0.5, y + 39, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w - 0.5, y + 39, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw friendly legs (like Mr. MoneyBags movement)
    ctx.fillStyle = '#000000';
    if (this.isMoving) {
      const legCycle = Math.sin(Date.now() * 0.014) * 2; // Gentle movement like Mr. MoneyBags
      const forwardOffset = 1.5; // Moderate movement
      
      const leftLegX = centerX - 5 + (legCycle > 0 ? forwardOffset : -forwardOffset);
      const leftLegY = y + h - 2 + Math.abs(legCycle) * 0.08; // Significantly longer legs
      ctx.fillRect(leftLegX, leftLegY, 3, 18); // Slightly shorter than before (18 instead of 20)
      
      const rightLegX = centerX + 2 + (legCycle < 0 ? forwardOffset : -forwardOffset);
      const rightLegY = y + h - 2 + Math.abs(legCycle) * 0.08; // Significantly longer legs  
      ctx.fillRect(rightLegX, rightLegY, 3, 18); // Slightly shorter than before (18 instead of 20)
      
      // Draw shoes at the bottom of longer legs
      ctx.fillStyle = '#654321'; // Brown shoes
      ctx.beginPath();
      ctx.ellipse(leftLegX + 1.5, leftLegY + 18, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightLegX + 1.5, rightLegY + 18, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(centerX - 5, y + h - 2, 3, 18); // Slightly shorter than before (18 instead of 20)
      ctx.fillRect(centerX + 2, y + h - 2, 3, 18); // Slightly shorter than before (18 instead of 20)
      
      // Draw static shoes at the bottom of longer legs
      ctx.fillStyle = '#654321'; // Brown shoes
      ctx.beginPath();
      ctx.ellipse(centerX - 3.5, y + h + 16, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX + 3.5, y + h + 16, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLeprechaunAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, centerX: number) {
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
    
    // Add suit buttons
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX, y + 22, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, y + 26, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw animated legs with directional movement
    ctx.fillStyle = '#2F4F4F'; // Same color as suit
    
    if (this.isMoving) {
      // Create running animation with leg alternation
      const legCycle = Math.sin(this.animationFrame) * 4; // Increased movement range
      const forwardOffset = Math.sin(this.animationFrame + Math.PI / 2) * 2; // Forward/back movement
      
      // Left leg - alternating with enhanced movement
      const leftLegX = centerX - 6 + (legCycle > 0 ? forwardOffset : -forwardOffset);
      const leftLegY = y + h - 4 + Math.abs(legCycle) * 0.2; // Slight vertical bounce
      ctx.fillRect(leftLegX, leftLegY, 4, 8);
      
      // Right leg - opposite phase
      const rightLegX = centerX + 2 + (legCycle < 0 ? forwardOffset : -forwardOffset);
      const rightLegY = y + h - 4 + Math.abs(legCycle) * 0.2; // Slight vertical bounce
      ctx.fillRect(rightLegX, rightLegY, 4, 8);
      
      // Draw animated black shoes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(leftLegX - 2, leftLegY + 7, 8, 3, 1); // Left shoe
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(rightLegX - 2, rightLegY + 7, 8, 3, 1); // Right shoe
      ctx.fill();
    } else {
      // Static legs when not moving
      ctx.fillRect(centerX - 6, y + h - 4, 4, 8); // Left leg
      ctx.fillRect(centerX + 2, y + h - 4, 4, 8); // Right leg
      
      // Draw static black shoes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(centerX - 8, y + h + 3, 8, 3, 1); // Left shoe
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(centerX + 0, y + h + 3, 8, 3, 1); // Right shoe
      ctx.fill();
    }
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
    // iPad-specific fix: Skip the startup area rendering restriction on iPad
    const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Render all TNT obstacles everywhere - no safe zone restrictions
    
    // iPad debugging: Check if TNT is going off-screen
    if (isIPad) {
      const screenX = obstacle.x - this.cameraX;
      const screenY = obstacle.y;
      
      // If TNT is way off screen, log for debugging
      if (screenX < -200 || screenX > this.canvasWidth + 200 || screenY < -200 || screenY > this.canvasHeight + 200) {
        // TNT is off-screen, but still render it in case it comes back
      }
    }
    
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
    const canEnter = this.coinsCollected >= this.coinsNeededForPortal;
    const time = Date.now() * 0.003; // for animation
    
    // Always draw the gray outer ring (portal machine housing)
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 10, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Only draw the colorful portal circles if 5 coins have been collected
    if (this.coinsCollected >= this.coinsNeededForPortal) {
      // Draw concentric colorful circles (rainbow portal effect)
      const colors = [
        '#4B0082', // Indigo (outermost)
        '#8A2BE2', // Blue Violet
        '#00CED1', // Dark Turquoise
        '#32CD32', // Lime Green
        '#FFD700', // Gold
        '#FF4500', // Orange Red
        '#FF1493'  // Deep Pink (innermost)
      ];
      
      for (let i = 0; i < colors.length; i++) {
        const radius = 45 - (i * 6);
        const animationOffset = Math.sin(time * 1.5 + i * 0.8) * 3; // Smoother, more fluid animation
        
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10, radius + animationOffset, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw central light blue core with smoother pulsing
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 10, 8 + Math.sin(time * 3) * 3, 0, Math.PI * 2); // Faster, smoother pulse
      ctx.fill();
    } else {
      // Draw inactive portal center (dark gray)
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 10, 40, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Always draw coin collection panel below the portal
    const panelY = centerY + 35;
    const panelWidth = 80;
    const panelHeight = 25;
    
    // Draw panel background
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(centerX - panelWidth/2, panelY, panelWidth, panelHeight);
    
    // Draw panel border
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - panelWidth/2, panelY, panelWidth, panelHeight);
    
    // Draw "COINS COLLECTED" text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COINS COLLECTED', centerX, panelY + 8);
    
    // Draw coin collection indicators (5 circles)
    const indicatorY = panelY + 18;
    const indicatorSpacing = 12;
    const startX = centerX - (4 * indicatorSpacing) / 2;
    
    for (let i = 0; i < 5; i++) {
      const x = startX + (i * indicatorSpacing);
      
      // Draw circle background
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, indicatorY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Fill with gold if coin is collected
      if (i < this.coinsCollected) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, indicatorY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw circle border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, indicatorY, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw activation indicator bar
    const barX = centerX + 35;
    const barY = panelY + 10;
    const barWidth = 8;
    const barHeight = 12;
    
    ctx.fillStyle = canEnter ? '#00FF00' : '#FF0000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Always draw "PORTAL MACHINE" text below the machine
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PORTAL MACHINE', centerX, panelY + 35);
    
    // Draw status text above portal
    ctx.fillStyle = canEnter ? '#00FF00' : '#FF6B6B';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    if (canEnter) {
      ctx.fillText('PORTAL ACTIVE', centerX, this.goal.y - 10);
    } else {
      ctx.fillText(`COLLECT ${this.coinsNeededForPortal - this.coinsCollected} MORE COINS`, centerX, this.goal.y - 10);
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
    
    // Game speed indicator
    ctx.fillText(`Speed: ${this.gameSpeed}x`, 20, 130);
    
    // Progress indicator removed - clusters monitor not needed
    
    // Progress text removed - clusters monitor not needed
    
    // Draw level progress bar  
    const levelProgress = Math.min(1, this.player.x / (this.levelWidth - 100));
    const barWidth = this.canvasWidth - 40;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(20, 140, barWidth, 10);
    
    ctx.fillStyle = '#8B5CF6';
    ctx.fillRect(20, 140, barWidth * levelProgress, 10);
    
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
    
    // Speed controls hint removed - moved to main instructions
  }
  
  // Linear interpolation helper for smooth movement
  private lerp(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }

  private updateCameraPosition() {
    // Calculate target camera position to follow player
    const isMobileForCamera = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const controlPanelWidthForCamera = isMobileForCamera ? 128 : 0; // 128px control panel on mobile/iPad
    const effectiveCanvasWidthForCamera = this.canvasWidth - controlPanelWidthForCamera;
    const maxCameraX = this.levelWidth - this.canvasWidth + controlPanelWidthForCamera;
    
    const targetCameraX = Math.max(0, Math.min(
      maxCameraX,
      this.player.x - effectiveCanvasWidthForCamera / 2
    ));
    
    // Smooth camera interpolation for fluid following
    this.cameraX = this.lerp(this.cameraX, targetCameraX, 0.88); // Smooth camera following
  }


}
