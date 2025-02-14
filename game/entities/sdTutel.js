
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';


class sdTutel extends sdEntity
{
	static init_class()
	{
		sdTutel.img_tutel_anim = sdWorld.CreateImageFromFile( 'sdTutel' );
		
		sdTutel.frame_idle = 0;
		sdTutel.frame_jump = 1;
		sdTutel.frame_attack = 2;
		sdTutel.frame_death = 3;
		sdTutel.frame_death_frames = 4;
		
		sdTutel.death_duration = 21;
		sdTutel.post_death_ttl = 90;
		
		sdTutel.max_seek_range = 600;
		
		sdTutel.normal_max_health = 600;
		sdTutel.normal_max_health_max = sdTutel.normal_max_health * 4; 

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7.9 * this.hmax / sdTutel.normal_max_health; }
	get hitbox_x2() { return 7.9 * this.hmax / sdTutel.normal_max_health; }
	get hitbox_y1() { return ( ( this.death_anim === 0 ) ? -6 : 0 ) * this.hmax / sdTutel.normal_max_health; }
	get hitbox_y2() { return 8 * this.hmax / sdTutel.normal_max_health; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = sdTutel.normal_max_health;
		this._hea = this.hmax;
		
		this.death_anim = 0;
		
		this.attack_anim = 0;
		
		this.jump_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		this._last_grow = sdWorld.time;
		this._last_target_change = 0;
		
		this._next_alert_allowed = 0;
		
		this.side = 1;
		
		//this.hurt_timer = 0;
	}
	Grow( delta )
	{
		let old = this.hmax;
		
		this.hmax += delta;
		if ( this.hmax > sdTutel.normal_max_health_max )
		this.hmax = sdTutel.normal_max_health_max;
	
		// Forced hitbox update, needed because they can grow offscreen, which means they will fire many updates at once while hitbox updates rely on actual frames count increase
		this._hitbox_last_update = 0;
		this.UpdateHitbox();
		
		for ( var r = 0; r < 2; r++ )
		{
			var dist = 0;
			
			if ( r === 1 )
			dist = 2;
			
			if ( r === 1 )
			dist = 8;
		
			for ( var x = 0; x < 3; x++ )
			for ( var y = 0; y < 3; y++ )
			{
				var xx = ( ( x + 1 ) % 3 ) - 1;
				var yy = ( ( y + 1 ) % 3 ) - 1;
				
				if ( this.CanMoveWithoutOverlap( this.x + xx * dist, this.y + yy * dist, 0 ) )
				{
					this.x += xx * dist;
					this.y += yy * dist;
					
					this._hea = this._hea / old * this.hmax;

					return true;
				}
				
				if ( r === 0 )
				{
					x = 10;
					y = 10;
					break;
				}
			}
		}
	
		/*if ( this.CanMoveWithoutOverlap( this.x, this.y, 0 ) )
		{
			this._hea = this._hea / old * this.hmax;

			return true;
		}
		else*/
		{
			this.hmax = old;
			return false;
		}
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( character.hea > 0 )
		if ( this._last_target_change < sdWorld.time - 2000 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdTutel.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;
				
				this._last_target_change = sdWorld.time;


				if ( sdWorld.time > this._next_alert_allowed )
				{
					this._next_alert_allowed = sdWorld.time + 30 * 1000;
					sdSound.PlaySound({ name:'quickie_alert', x:this.x, y:this.y, volume: 0.5, pitch: 0.2 });
				}
			}
		}
	}
	GetBleedEffect()
	{
		if ( this.death_anim > 0 )
		return sdEffect.TYPE_BLOOD;
		else
		return sdEffect.TYPE_WALL_HIT;
	}
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			// If not broken into pieces
			//if ( this._hea >= -this.hmax / 80 * 100 )
			//sdSound.PlaySound({ name:'virus_damage2', x:this.x, y:this.y, volume: 1.25, pitch: 1 * sdTutel.normal_max_health / this.hmax });
			
			
			sdSound.PlaySound({ name:'overlord_welcomeB', x:this.x, y:this.y, volume:0.75, pitch: 1.5 });
				
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:6 });

			if ( initiator )
			{
				if ( typeof initiator._score !== 'undefined' )
				initiator._score += ~~( 3 * this.hmax / sdTutel.normal_max_health );
			}
	
		}
		else
		{
			if ( initiator )
			{
				this._current_target = initiator;
			}
			/*
			if ( this._hea > 0 )
			if ( this.hurt_timer === 0 )
			if ( Math.floor( ( this._hea ) / this._hmax * 5 ) !== Math.floor( ( this._hea + dmg ) / this._hmax * 5 ) )
			{
				sdSound.PlaySound({ name:'virus_damage2', x:this.x, y:this.y, volume: 1, pitch: 1.5 * sdTutel.normal_max_health / this.hmax });
				this.hurt_timer = 1;
			}*/
		}
		
		if ( this._hea < -this.hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 150 * this.hmax / sdTutel.normal_max_health; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	Impact( vel ) // fall damage basically
	{
		if ( vel > 8 ) // less fall damage
		{
			this.DamageWithEffect( ( vel - 3 ) * 15 );
		}
	}
	isWaterDamageResistant()
	{
		return true;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		sdWorld.last_hit_entity = null;
		
		let in_water = sdWorld.CheckWallExistsBox( this.x + this._hitbox_x1, this.y + this._hitbox_y1, this.x + this._hitbox_x2, this.y + this._hitbox_y2, null, null, sdWater.water_class_array );
		//let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdTutel.death_duration + sdTutel.post_death_ttl )
			this.death_anim += GSPEED * sdTutel.normal_max_health / this.hmax;
			else
			this.remove();
		}
		else
		{
			//if ( this.hurt_timer > 0 )
			//this.hurt_timer = Math.max( 0, this.hurt_timer - GSPEED * 0.045 );

			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdTutel.max_seek_range + 32 )
				this._current_target = null;
				else
				{
					this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
					//if ( this.hurt_timer <= 0.5 )
					if ( this._last_jump < sdWorld.time - 200 * this.hmax / sdTutel.normal_max_health )
					//if ( this._last_stand_on )
					if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
					{
						this._last_jump = sdWorld.time;
					
						let dx = ( this._current_target.x - this.x ) * 0.1;
						let dy = ( this._current_target.y - this.y ) * 0.1;
					
						dy -= Math.abs( dx ) * 0.85;
					
						let di = sdWorld.Dist2D_Vector( dx, dy );
						if ( di > 4 )
						{
							dx /= di;
							dy /= di;
							
							dx *= 4;
							dy *= 4;
						}
						
						this.sx = dx;
						this.sy = dy;
						
						this.jump_anim = 5;

					
						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			/*	
			let water_ent = sdWorld.last_hit_entity;
		
			if ( this.death_anim === 0 ) // Alive
			if ( water_ent )
			if ( sdWorld.time > this._last_grow + 500 )
			{
				this._last_grow = sdWorld.time;
				
				if ( this.Grow( 15 ) )
				{
					water_ent.AwakeSelfAndNear();
					water_ent.remove();
				}
			}*/
		}
		//else
		//{
			this.sy += sdWorld.gravity * GSPEED;
		//}
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this.attack_anim > 0 )
		this.attack_anim -= GSPEED;
	
		if ( this.jump_anim > 0 )
		this.jump_anim -= GSPEED;
		
		if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 800 )
		{
			this._last_bite = sdWorld.time;
					
			//let nears = sdWorld.GetAnythingNear( this.x, this.y, 8 * this.hmax / sdTutel.normal_max_health ).slice();
			let from_entity;
			
			//if ( sdWorld.inDist2D_Boolean( this._current_target.x, this._current_target.y, )
			//nears.push( this._current_target );
			
			let nears = ( 
					
					this.x + this._hitbox_x2 > this._current_target.x + this._current_target._hitbox_x1 - 8 &&
					this.x + this._hitbox_x1 < this._current_target.x + this._current_target._hitbox_x2 + 8 &&
					this.y + this._hitbox_y2 > this._current_target.y + this._current_target._hitbox_y1 - 8 &&
					this.y + this._hitbox_y1 < this._current_target.y + this._current_target._hitbox_y2 + 8
					
					) ? [ this._current_target ] : [];
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;
				
				if ( from_entity.IsPlayerClass() || from_entity === this._current_target )
				if ( from_entity.IsTargetable() )
				if ( sdWorld.CheckLineOfSight( this.x, this.y, from_entity.x, from_entity.y, null, null, sdCom.com_creature_attack_unignored_classes ) )
				{
					from_entity.DamageWithEffect( 40 * this.hmax / sdTutel.normal_max_health, this );
					
					this.Grow( 15 );
					
					this._hea = Math.min( this.hmax, this._hea + 15 * this.hmax / sdTutel.normal_max_health );

					from_entity.PlayDamageEffect( xx, yy );
					//sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					this.attack_anim = 10;
					
					sdSound.PlaySound({ name:'overlord_hurtC', x:this.x, y:this.y, volume:0.75, pitch: 0.5 });
					
					break;
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Tutel" );
	}
	Draw( ctx, attached )
	{
		ctx.scale( -this.side * this.hmax / sdTutel.normal_max_health, 1 * this.hmax / sdTutel.normal_max_health );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdTutel.death_duration + sdTutel.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdTutel.frame_death_frames - 1, ~~( ( this.death_anim / sdTutel.death_duration ) * sdTutel.frame_death_frames ) );
			
			ctx.drawImageFilterCache( sdTutel.img_tutel_anim, ( sdTutel.frame_death + frame )*32,0,32,32, - 16, - 16, 32,32 );
		}
		else
		if ( this.attack_anim > 0 )
		ctx.drawImageFilterCache( sdTutel.img_tutel_anim, ( sdTutel.frame_attack )*32,0,32,32, - 16, - 16, 32,32 );
		else
		//if ( this.hurt_timer > 0 )
		//ctx.drawImageFilterCache( sdTutel.img_tutel_anim, ( sdTutel.frame_death + 0 )*32,0,32,32, - 16, - 16, 32,32 );
		//else
		//ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdTutel.img_virus : sdTutel.img_virus_walk, - 16, - 16, 32,32 );
		if ( this.jump_anim > 0 ) //Math.abs( this.sx ) < 1 )
		ctx.drawImageFilterCache( sdTutel.img_tutel_anim, ( sdTutel.frame_idle )*32,0,32,32, - 16, - 16, 32,32 );
		else
		ctx.drawImageFilterCache( sdTutel.img_tutel_anim, ( sdTutel.frame_jump )*32,0,32,32, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdTutel.death_duration + sdTutel.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
				//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter() });
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdTutel.init_class();

export default sdTutel;
