import Phaser from 'phaser';
import { StatusEffect } from '../../types/game';

export class StatusEffectsManager {
  private scene: Phaser.Scene;
  private statusEffects: StatusEffect[] = [];
  private visualEffects: Map<string, Phaser.GameObjects.GameObject[]> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public addStatusEffect(type: StatusEffect['type'], duration: number, intensity: number): void {
    // Remove existing effect of same type
    this.removeStatusEffect(type);
    
    const statusEffect: StatusEffect = {
      type,
      duration,
      intensity,
      lastTick: Date.now(),
    };
    
    this.statusEffects.push(statusEffect);
    this.createVisualEffect(statusEffect);
  }

  public removeStatusEffect(type: StatusEffect['type']): void {
    const index = this.statusEffects.findIndex(effect => effect.type === type);
    if (index !== -1) {
      this.statusEffects.splice(index, 1);
      this.removeVisualEffect(type);
    }
  }

  public updateEffects(time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite): {
    speedModifier: number;
    jumpModifier: number;
    damage: number;
  } {
    let speedModifier = 1;
    let jumpModifier = 1;
    let damage = 0;

    this.statusEffects = this.statusEffects.filter(effect => {
      effect.duration -= delta;
      
      if (effect.duration <= 0) {
        this.removeVisualEffect(effect.type);
        return false;
      }

      switch (effect.type) {
        case 'poisoned':
          // Tick every 2-3 seconds
          if (time - effect.lastTick >= 2500) {
            damage += effect.intensity;
            effect.lastTick = time;
            
            // Poison visual effect
            playerSprite.setTint(0x00ff00);
            this.scene.time.delayedCall(200, () => {
              playerSprite.clearTint();
            });
          }
          break;
          
        case 'burned':
          // Constant damage over time (every 200ms)
          if (time - effect.lastTick >= 200) {
            damage += effect.intensity * 0.3; // Lower damage but more frequent
            effect.lastTick = time;
            
            // Burn visual effect
            playerSprite.setTint(0xff4400);
            this.scene.time.delayedCall(100, () => {
              playerSprite.clearTint();
            });
          }
          break;
          
        case 'frozen':
          // Reduce speed and jump height
          speedModifier = 0.5;
          jumpModifier = 0.7;
          
          // Freeze visual effect (already handled in createVisualEffect)
          break;
      }
      
      return true;
    });

    return { speedModifier, jumpModifier, damage };
  }

  private createVisualEffect(effect: StatusEffect): void {
    const effects: Phaser.GameObjects.GameObject[] = [];
    
    switch (effect.type) {
      case 'poisoned':
        // Green bubbles around player
        const poisonParticles = this.scene.add.particles(0, 0, 'healthpack', {
          scale: { start: 0.1, end: 0 },
          speed: { min: 10, max: 30 },
          lifespan: 1000,
          frequency: 300,
          tint: 0x00ff00,
          alpha: 0.6,
        });
        effects.push(poisonParticles);
        break;
        
      case 'burned':
        // Fire particles
        const fireParticles = this.scene.add.particles(0, 0, 'healthpack', {
          scale: { start: 0.15, end: 0 },
          speed: { min: 20, max: 50 },
          lifespan: 800,
          frequency: 100,
          tint: 0xff4400,
          alpha: 0.8,
        });
        effects.push(fireParticles);
        break;
        
      case 'frozen':
        // Ice crystals effect
        const iceParticles = this.scene.add.particles(0, 0, 'healthpack', {
          scale: { start: 0.1, end: 0 },
          speed: { min: 5, max: 15 },
          lifespan: 1500,
          frequency: 500,
          tint: 0x88ffff,
          alpha: 0.7,
        });
        effects.push(iceParticles);
        break;
    }
    
    this.visualEffects.set(effect.type, effects);
  }

  private removeVisualEffect(type: StatusEffect['type']): void {
    const effects = this.visualEffects.get(type);
    if (effects) {
      effects.forEach(effect => {
        if (effect && effect.destroy) {
          effect.destroy();
        }
      });
      this.visualEffects.delete(type);
    }
  }

  public updateVisualEffectPositions(x: number, y: number): void {
    this.visualEffects.forEach(effects => {
      effects.forEach(effect => {
        if (effect instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
          effect.setPosition(x, y);
        }
      });
    });
  }

  public getActiveEffects(): StatusEffect[] {
    return [...this.statusEffects];
  }

  public hasEffect(type: StatusEffect['type']): boolean {
    return this.statusEffects.some(effect => effect.type === type);
  }

  public clearAllEffects(): void {
    this.statusEffects.forEach(effect => {
      this.removeVisualEffect(effect.type);
    });
    this.statusEffects = [];
    this.visualEffects.clear();
  }

  public destroy(): void {
    this.clearAllEffects();
  }
}