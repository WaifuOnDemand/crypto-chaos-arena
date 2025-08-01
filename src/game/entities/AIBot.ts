import Phaser from 'phaser';
import { Player } from './Player';
import { GameControls, PlayerState } from '../../types/game';

export class AIBot extends Player {
  private aiState: 'idle' | 'seeking' | 'attacking' | 'fleeing' = 'idle';
  private target: { x: number; y: number } | null = null;
  private lastDecisionTime: number = 0;
  private decisionInterval: number = 1000; // Make decisions every second
  private viewRange: number = 400;
  private attackRange: number = 300;
  private fleeHealthThreshold: number = 30;
  
  constructor(scene: Phaser.Scene, x: number, y: number, playerId: string) {
    super(scene, x, y, playerId);
    
    // Give bot a random starting weapon
    const weapons = ['pistol', 'shotgun', 'rocket'];
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
    this.addWeapon(randomWeapon);
    
    // Set bot appearance (different color)
    this.setTint(0xff6666); // Reddish tint for bots
  }
  
  public update(time: number, delta: number): void {
    super.update(time, delta);
    
    // Make AI decisions
    if (time - this.lastDecisionTime >= this.decisionInterval) {
      this.makeDecision(time);
      this.lastDecisionTime = time;
    }
    
    // Execute current AI behavior
    this.executeBehavior(time, delta);
  }
  
  private makeDecision(time: number): void {
    const currentHealth = this.playerState.health;
    const healthRatio = currentHealth / this.playerState.maxHealth;
    
    // Flee if health is low
    if (healthRatio < this.fleeHealthThreshold / 100) {
      this.aiState = 'fleeing';
      return;
    }
    
    // Look for nearby targets (in a real multiplayer game, this would be other players)
    this.target = this.findNearestTarget();
    
    if (this.target) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.target.x, this.target.y
      );
      
      if (distance <= this.attackRange) {
        this.aiState = 'attacking';
      } else if (distance <= this.viewRange) {
        this.aiState = 'seeking';
      } else {
        this.aiState = 'idle';
      }
    } else {
      this.aiState = 'idle';
    }
  }
  
  private findNearestTarget(): { x: number; y: number } | null {
    // In a full multiplayer implementation, this would search for other players
    // For now, we'll just return null since we're focusing on basic AI movement
    return null;
  }
  
  private executeBehavior(time: number, delta: number): void {
    const controls: Partial<GameControls> = {
      left: false,
      right: false,
      jump: false,
      dash: false,
      fire: false,
      switchWeapon: false,
      aim: { x: this.x + (this.playerState.facing === 'right' ? 50 : -50), y: this.y }
    };
    
    switch (this.aiState) {
      case 'idle':
        this.executeIdleBehavior(controls, time);
        break;
      case 'seeking':
        this.executeSeekingBehavior(controls, time);
        break;
      case 'attacking':
        this.executeAttackingBehavior(controls, time);
        break;
      case 'fleeing':
        this.executeFleeingBehavior(controls, time);
        break;
    }
    
    this.updateControls(controls);
  }
  
  private executeIdleBehavior(controls: Partial<GameControls>, time: number): void {
    // Random movement occasionally
    if (Math.random() < 0.01) {
      controls.left = Math.random() < 0.5;
      controls.right = !controls.left;
    }
    
    // Random jumping
    if (Math.random() < 0.005 && this.playerState.canJump) {
      controls.jump = true;
    }
  }
  
  private executeSeekingBehavior(controls: Partial<GameControls>, time: number): void {
    if (!this.target) return;
    
    // Move towards target
    if (this.target.x > this.x + 20) {
      controls.right = true;
      this.playerState.facing = 'right';
    } else if (this.target.x < this.x - 20) {
      controls.left = true;
      this.playerState.facing = 'left';
    }
    
    // Jump if target is higher
    if (this.target.y < this.y - 30 && this.playerState.canJump) {
      controls.jump = true;
    }
    
    // Use dash to get closer faster
    if (Math.random() < 0.02 && this.dashCooldownTimer <= 0) {
      controls.dash = true;
    }
  }
  
  private executeAttackingBehavior(controls: Partial<GameControls>, time: number): void {
    if (!this.target) return;
    
    // Aim at target
    controls.aim = { x: this.target.x, y: this.target.y };
    
    // Face target
    this.playerState.facing = this.target.x > this.x ? 'right' : 'left';
    
    // Fire at target
    if (Math.random() < 0.1) { // 10% chance per frame to fire
      controls.fire = true;
    }
    
    // Strafe around target
    if (Math.random() < 0.3) {
      controls.left = Math.random() < 0.5;
      controls.right = !controls.left;
    }
    
    // Jump randomly during combat
    if (Math.random() < 0.02 && this.playerState.canJump) {
      controls.jump = true;
    }
  }
  
  private executeFleeingBehavior(controls: Partial<GameControls>, time: number): void {
    // Move away from threats
    if (this.target) {
      if (this.target.x > this.x) {
        controls.left = true;
        this.playerState.facing = 'left';
      } else {
        controls.right = true;
        this.playerState.facing = 'right';
      }
    } else {
      // Just move randomly when fleeing
      controls.right = Math.random() < 0.5;
      controls.left = !controls.right;
    }
    
    // Use dash to escape faster
    if (this.dashCooldownTimer <= 0) {
      controls.dash = true;
    }
    
    // Jump to escape
    if (Math.random() < 0.05 && this.playerState.canJump) {
      controls.jump = true;
    }
  }
  
  public getAIState(): string {
    return this.aiState;
  }
  
  public setTarget(target: { x: number; y: number } | null): void {
    this.target = target;
  }
}