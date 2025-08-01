import Phaser from 'phaser';

export interface TerrainChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  destroyed: boolean;
  health: number;
  maxHealth: number;
}

export class DestructibleTerrain extends Phaser.GameObjects.Container {
  private chunks: TerrainChunk[][];
  private chunkSize: number = 32;
  private graphics!: Phaser.GameObjects.Graphics;
  private collisionBodies: Phaser.Physics.Arcade.Body[] = [];
  
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    
    // Initialize terrain chunks
    this.chunks = [];
    const chunksX = Math.ceil(width / this.chunkSize);
    const chunksY = Math.ceil(height / this.chunkSize);
    
    for (let i = 0; i < chunksX; i++) {
      this.chunks[i] = [];
      for (let j = 0; j < chunksY; j++) {
        this.chunks[i][j] = {
          x: i * this.chunkSize,
          y: j * this.chunkSize,
          width: this.chunkSize,
          height: this.chunkSize,
          destroyed: false,
          health: 100,
          maxHealth: 100
        };
      }
    }
    
    this.redrawTerrain();
    scene.add.existing(this);
  }
  
  public destroyArea(centerX: number, centerY: number, radius: number, damage: number): void {
    const localX = centerX - this.x;
    const localY = centerY - this.y;
    
    const startChunkX = Math.max(0, Math.floor((localX - radius) / this.chunkSize));
    const endChunkX = Math.min(this.chunks.length - 1, Math.floor((localX + radius) / this.chunkSize));
    const startChunkY = Math.max(0, Math.floor((localY - radius) / this.chunkSize));
    const endChunkY = Math.min(this.chunks[0].length - 1, Math.floor((localY + radius) / this.chunkSize));
    
    let anyDestroyed = false;
    
    for (let i = startChunkX; i <= endChunkX; i++) {
      for (let j = startChunkY; j <= endChunkY; j++) {
        const chunk = this.chunks[i][j];
        if (!chunk.destroyed) {
          const chunkCenterX = chunk.x + chunk.width / 2;
          const chunkCenterY = chunk.y + chunk.height / 2;
          const distance = Phaser.Math.Distance.Between(localX, localY, chunkCenterX, chunkCenterY);
          
          if (distance <= radius) {
            const damageMultiplier = Math.max(0, 1 - distance / radius);
            chunk.health -= damage * damageMultiplier;
            
            if (chunk.health <= 0) {
              chunk.destroyed = true;
              anyDestroyed = true;
              
              // Create destruction particles
              this.createDestructionParticles(this.x + chunkCenterX, this.y + chunkCenterY);
            }
          }
        }
      }
    }
    
    if (anyDestroyed) {
      this.redrawTerrain();
      this.updateCollisionBodies();
    }
  }
  
  private redrawTerrain(): void {
    this.graphics.clear();
    
    for (let i = 0; i < this.chunks.length; i++) {
      for (let j = 0; j < this.chunks[i].length; j++) {
        const chunk = this.chunks[i][j];
        if (!chunk.destroyed) {
          const healthRatio = chunk.health / chunk.maxHealth;
          let color = 0x666666; // Default gray
          
          if (healthRatio < 0.3) {
            color = 0x444444; // Dark gray for heavily damaged
          } else if (healthRatio < 0.7) {
            color = 0x555555; // Medium gray for damaged
          }
          
          this.graphics.fillStyle(color);
          this.graphics.fillRect(chunk.x, chunk.y, chunk.width, chunk.height);
          
          // Add a lighter border
          this.graphics.lineStyle(1, 0x888888);
          this.graphics.strokeRect(chunk.x, chunk.y, chunk.width, chunk.height);
        }
      }
    }
  }
  
  private updateCollisionBodies(): void {
    // This would need to be implemented to update physics bodies
    // For now, we'll emit an event that the GameScene can listen to
    this.scene.events.emit('terrainDestroyed', this);
  }
  
  private createDestructionParticles(x: number, y: number): void {
    const particles = this.scene.add.particles(x, y, 'ground', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 1000,
      quantity: 8,
      angle: { min: 0, max: 360 },
      alpha: { start: 0.8, end: 0 }
    });
    
    // Auto-destroy particles after they finish
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }
  
  public getChunks(): TerrainChunk[][] {
    return this.chunks;
  }
  
  public isChunkDestroyed(x: number, y: number): boolean {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    
    if (chunkX >= 0 && chunkX < this.chunks.length && 
        chunkY >= 0 && chunkY < this.chunks[0].length) {
      return this.chunks[chunkX][chunkY].destroyed;
    }
    
    return false;
  }
}