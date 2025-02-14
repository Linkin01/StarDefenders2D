/*
 
 
 
 
	Test specific event on server (will break any other event):

		sdWorld.entity_classes.sdWeather.only_instance._time_until_event = 0
		sdWorld.server_config.GetAllowedWorldEvents = ()=>[ 17 ];
		sdWorld.server_config.GetDisallowedWorldEvents = ()=>[];
		sdWorld.entity_classes.sdWeather.only_instance._daily_events = sdWorld.server_config.GetAllowedWorldEvents();


	Stop all events:

		sdWorld.server_config.GetAllowedWorldEvents = ()=>[];
		sdWorld.entity_classes.sdWeather.only_instance._daily_events = [];

*/
/*

	// Not sure if method above works anymore, use this:
	sdWorld.entity_classes.sdWeather.only_instance.ExecuteEvent( 26 ); // Swap 26 for number you want to test inside
 
*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdAsteroid from './sdAsteroid.js';

import sdCube from './sdCube.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdAsp from './sdAsp.js';
import sdGrass from './sdGrass.js';
import sdCom from './sdCom.js';
import sdVirus from './sdVirus.js';
import sdBG from './sdBG.js';
import sdEnemyMech from './sdEnemyMech.js';
import sdBadDog from './sdBadDog.js';
import sdRift from './sdRift.js';
import sdCrystal from './sdCrystal.js';
import sdDrone from './sdDrone.js';
import sdSpider from './sdSpider.js';
import sdAmphid from './sdAmphid.js';
import sdObelisk from './sdObelisk.js';
import sdWater from './sdWater.js';
import sdJunk from './sdJunk.js';
import sdOverlord from './sdOverlord.js';
import sdSetrDestroyer from './sdSetrDestroyer.js';
import sdBiter from './sdBiter.js';

import sdTask from './sdTask.js';


import sdRenderer from '../client/sdRenderer.js';

class sdWeather extends sdEntity
{
	static init_class()
	{
		sdWeather.img_rain = sdWorld.CreateImageFromFile( 'rain' );
		sdWeather.img_rain_water = sdWorld.CreateImageFromFile( 'rain_water' );
		sdWeather.img_snow = sdWorld.CreateImageFromFile( 'snow' );
		sdWeather.img_crystal_shard = sdWorld.CreateImageFromFile( 'crystal_shard' );
		sdWeather.img_scary_mode = sdWorld.CreateImageFromFile( 'scary_mode' );
		
		sdWeather.only_instance = null;
		
		let event_counter = 0;
		sdWeather.EVENT_ACID_RAIN =				event_counter++; // 0
		sdWeather.EVENT_ASTEROIDS =				event_counter++; // 1
		sdWeather.EVENT_CUBES =					event_counter++; // 2
		sdWeather.EVENT_FALKOKS =				event_counter++; // 3
		sdWeather.EVENT_ASPS =					event_counter++; // 4
		sdWeather.EVENT_FALKOKS_INVASION =			event_counter++; // 5
		sdWeather.EVENT_BIG_VIRUS =				event_counter++; // 6
		sdWeather.EVENT_FLYING_MECH =				event_counter++; // 7
		sdWeather.EVENT_QUAKE =					event_counter++; // 8
		sdWeather.EVENT_BAD_DOGS =				event_counter++; // 9
		sdWeather.EVENT_RIFT_PORTAL =				event_counter++; // 10
		sdWeather.EVENT_ERTHALS =				event_counter++; // 11
		sdWeather.EVENT_OBELISK =				event_counter++; // 12
		sdWeather.EVENT_CORRUPTION =				event_counter++; // 13
		sdWeather.EVENT_WATER_RAIN =				event_counter++; // 14
		sdWeather.EVENT_SNOW =					event_counter++; // 15
		sdWeather.EVENT_LARGE_ANTICRYSTAL =			event_counter++; // 16
		sdWeather.EVENT_SARRORNIANS =				event_counter++; // 17
		sdWeather.EVENT_COUNCIL_BOMB =				event_counter++; // 18
		sdWeather.EVENT_MATTER_RAIN =				event_counter++; // 19
		sdWeather.EVENT_OVERLORD =				event_counter++; // 20
		sdWeather.EVENT_ERTHAL_BEACON =				event_counter++; // 21
		sdWeather.EVENT_VELOX =					event_counter++; // 22
		sdWeather.EVENT_CRYSTAL_BLOCKS =			event_counter++; // 23
		sdWeather.EVENT_SD_EXTRACTION =				event_counter++; // 24
		sdWeather.EVENT_SETR =					event_counter++; // 25
		sdWeather.EVENT_SETR_DESTROYER =			event_counter++; // 26
		sdWeather.EVENT_CRYSTALS_MATTER =			event_counter++; // 27
		sdWeather.EVENT_DIRTY_AIR =					event_counter++; // 28
		sdWeather.EVENT_AMPHIDS =				event_counter++; // 29
		sdWeather.EVENT_BITERS =				event_counter++; // 30
		
		sdWeather.supported_events = [];
		for ( let i = 0; i < event_counter; i++ )
		sdWeather.supported_events.push( i );
		
		sdWeather.last_crystal_near_quake = null; // Used to damage left over crystals. Could be used to damage anything really
		
		sdWeather.pattern = [];
		for ( var i = 0; i < 300; i++ )
		sdWeather.pattern.push({ x:Math.random(), y:Math.random(), last_vis:false, last_y:0, last_x:0 });
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	IsGlobalEntity() // Should never change
	{ return true; }
	
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return false; }
	
	constructor( params )
	{
		super( params );
		
		this.x = 0;
		this.y = 0;
		
		this._next_grass_seed = 0;
		
		if ( sdWeather.only_instance )
		sdWeather.only_instance.remove();
	
		sdWeather.only_instance = this;
		
		this._rain_amount = 0;
		this.raining_intensity = 0;
		this.acid_rain = 0; // 0 or 1
		this.snow = 0; // 0 or 1
		this.matter_rain = 0; // 0,1 or 2 ( 1 = crystal shard rain, 2 = anti-crystal shard rain )
		
		this._asteroid_spam_amount = 0;
		
		this._invasion = false;
		this._invasion_timer = 0; // invasion length timer
		this._invasion_spawn_timer = 0; // invasion spawn timer
		this._invasion_spawns_con = 0; // invasion spawn conditions, needs to be 0 or invasion can't end. Counter for falkoks left to spawn
		
		this._quake_scheduled_amount = 0;
		this.quake_intensity = 0;
		
		this._time_until_event = 30 * 30; // 30 seconds since world reset
		//this._daily_events = [ 8 ];
		this._daily_events = []; // Let's start with some silence. Also we need check to make sure server modification allows earthquakes
		
		this._asteroid_timer = 0; // 60 * 1000 / ( ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 800 )
		this._asteroid_timer_scale_next = 0;
		
		this.day_time = 30 * 60 * 24 / 3;
		this._event_rotation_time = ( 30 * 60 * 14 ) + ( 30 * 45 ); // Time until potential events rotate, set to 14 minutes and 45 seconds so it can roll new events when fresh game starts instead of having earthquakes only for 15 minutes
		
		this.air = 1; // Can happen to be 0, which means planet has no breathable air
		this._no_air_duration = 0; // Usually no-air times will be limited
		this._dustiness = 0; // Client-side variable that is used to apply visual dust effects
		
		// World bounds, but slow
		this.x1 = 0;
		this.y1 = 0;
		this.x2 = 0;
		this.y2 = 0;
		
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
	}
	GetSunIntensity()
	{
		return -Math.cos( this.day_time / ( 30 * 60 * 24 ) * Math.PI * 2 ) * 0.5 + 0.5;
	}
	GetDailyEvents() // Basically this function selects 4 random allowed events + earthquakes
	{
		let allowed_event_ids = ( sdWorld.server_config.GetAllowedWorldEvents ? sdWorld.server_config.GetAllowedWorldEvents() : undefined ) || sdWeather.supported_events;
				
		if ( allowed_event_ids.indexOf( 8 ) !== -1 ) // Only if allowed
		this._daily_events = [ 8 ]; // Always enable earthquakes so ground can regenerate
				
		let disallowed_ones = ( sdWorld.server_config.GetDisallowedWorldEvents ? sdWorld.server_config.GetDisallowedWorldEvents() : [] );
				
		//allowed_event_ids = [ 8 ]; // Hack
				
		for ( let d = 0; d < allowed_event_ids.length; d++ )
		if ( disallowed_ones.indexOf( allowed_event_ids[ d ] ) !== -1 )
		{
			allowed_event_ids.splice( d, 1 );
			d--;
			continue;
		}
				
		if ( allowed_event_ids.length > 0 )
		{
			let n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
			let old_n = n;
			let daily_event_count = Math.min( allowed_event_ids.length, 6 );
			let time = 1000;
			while ( daily_event_count > 0 && time > 0 )
			{
				old_n = n;
				n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
				if ( old_n !== n )
				{
					this._daily_events.push( n );
					daily_event_count--;
				}
				time--;
			}
		}
		//console.log( this._daily_events );
	}
	TraceDamagePossibleHere( x,y, steps_max=Infinity, sun_light_tracer=false )
	{
		for ( var yy = y; yy > sdWorld.world_bounds.y1 && steps_max > 0; yy -= 8, steps_max-- )
		{
			if ( sdWorld.CheckWallExists( x, yy, null, null, [ 'sdBlock', 'sdDoor', 'sdWater' ] ) )
			{
				if ( sun_light_tracer )
				{
					if ( sdWorld.last_hit_entity )
					if ( sdWorld.last_hit_entity.is( sdBlock ) )
					{
						if ( sdWorld.last_hit_entity.IsPartiallyTransparent() )
						continue;
					}
				}
				return false;
			}
		}

		return true;
	}
	ExecuteEvent( r = -1 ) // Used to be under OnThink ( GSPEED ) but swapped for this so any event can be executed at any time, from any entity
	{
		//console.log( r );
		if ( r === 0 || r === 14 || r === 15 || r === 19 )
		{
			this._rain_amount = 30 * 15 * ( 1 + Math.random() * 2 ); // start rain for ~15 seconds
		}

		if ( r === 1 )
		this._asteroid_spam_amount = 30 * 15 * ( 1 + Math.random() * 2 );

		if ( r === 2 )
		{
			//for ( let t = Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) + 1; t > 0; t-- )
			for ( let t = Math.ceil( Math.random() * 2 ) + 1; t > 0; t-- )
			//if ( sdCube.alive_cube_counter < sdCube.GetMaxAllowedCubesOfKind( 0 ) ) // 20
			{
				let cube = new sdCube({ 
					x:sdWorld.world_bounds.x1 + 32 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 64 ), 
					y:sdWorld.world_bounds.y1 + 32,
					kind:   ( Math.random() < 0.1 ) ? 1 : 
							( Math.random() < 0.04 ) ? 2 : 
							( Math.random() < 0.14 ) ? 3 : 
							0 // _kind = 1 -> is_huge = true , _kind = 2 -> is_white = true , _kind = 3 -> is_pink = true
					/*kind:   ( sdCube.alive_huge_cube_counter < sdCube.GetMaxAllowedCubesOfKind( 1 ) && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.1 ) ) ? 1 : 
							( sdCube.alive_white_cube_counter < sdCube.GetMaxAllowedCubesOfKind( 2 ) && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.04 ) ) ? 2 : 
							( sdCube.alive_pink_cube_counter < sdCube.GetMaxAllowedCubesOfKind( 3 ) && ( sdCube.alive_cube_counter >= 1 && Math.random() < 0.14 ) ) ? 3 : 
							0 // _kind = 1 -> is_huge = true , _kind = 2 -> is_white = true , _kind = 3 -> is_pink = true*/
				});
				cube.sy += 10;
				sdEntity.entities.push( cube );

				if ( !cube.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
				{
					cube.remove();
					cube._broken = false;
				}
				else
				sdWorld.UpdateHashPosition( cube, false ); // Prevent inersection with other ones
			}
		}

		if ( r === 3 )
		{
			let ais = 0;

			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			if ( sdCharacter.characters[ i ].hea > 0 )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			{
				ais++;
			}

			let instances = 0;
			let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

			let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && ais < 8 )
			{

				let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

				sdEntity.entities.push( character_entity );

				{
					let x,y;
					let tr = 1000;
					do
					{
						if ( left_side )
						x = sdWorld.world_bounds.x1 + 16 + 16 * instances;
						else
						x = sdWorld.world_bounds.x2 - 16 - 16 * instances;

						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
						{
							character_entity.x = x;
							character_entity.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							if ( Math.random() < 0.07 )
							{
								if ( Math.random() < 0.2 )
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }) );
									character_entity._ai_gun_slot = 4;
								}
								else
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN }) );
									character_entity._ai_gun_slot = 3;
								}
							}
							else
							{ 
								if ( Math.random() < 0.1 )
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }) );
									character_entity._ai_gun_slot = 2;
								}
								else
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );
									character_entity._ai_gun_slot = 2;
								}
							}
							let falkok_settings;
							if ( character_entity._ai_gun_slot === 2 )
							falkok_settings = {"hero_name":"Falkok","color_bright":"#6b0000","color_dark":"#420000","color_bright3":"#6b0000","color_dark3":"#420000","color_visor":"#5577b9","color_suit":"#240000","color_suit2":"#2e0000","color_dark2":"#560101","color_shoes":"#000000","color_skin":"#240000","helmet1":false,"helmet2":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":true};
							if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If Falkok spawns with Raygun or PSI-Cutter, change their looks Phoenix Falkok
							falkok_settings = {"hero_name":"Phoenix Falkok","color_bright":"#ffc800","color_dark":"#a37000","color_bright3":"#ffc800","color_dark3":"#a37000","color_visor":"#000000","color_suit":"#ffc800","color_suit2":"#ffc800","color_dark2":"#000000","color_shoes":"#a37000","color_skin":"#a37000","helmet1":false,"helmet12":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":true};

							character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( falkok_settings );
							character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( falkok_settings );
							character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( falkok_settings );
							character_entity.title = falkok_settings.hero_name;
							if ( character_entity._ai_gun_slot === 2 ) // If a regular falkok spawns
							{
								character_entity.matter = 75;
								character_entity.matter_max = 75;

								character_entity.hea = 115; // 105 so railgun requires at least headshot to kill and body shot won't cause bleeding
								character_entity.hmax = 115;

								character_entity._damage_mult = 1 / 2.5; // 1 / 4 was too weak
							}

							if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If a Phoenix Falkok spawns
							{
								character_entity.matter = 100;
								character_entity.matter_max = 100;

								character_entity.hea = 250; // It is a stronger falkok after all, although revert changes if you want
								character_entity.hmax = 250;

								character_entity._damage_mult = 1 / 1.5; // Rarer enemy therefore more of a threat?
							}	
							character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
							//character_entity._ai_enabled = sdCharacter.AI_MODEL_FALKOK;
										
							character_entity._ai_level = Math.floor( Math.random() * 2 ); // Either 0 or 1
										
							character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
							character_entity._jetpack_allowed = true; // Jetpack
							character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ) ; // Small recoil reduction based on AI level
							character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
							character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
							character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players

							break;
						}


						tr--;
						if ( tr < 0 )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
					} while( true );
				}

				instances++;
				ais++;
			}
		}

		if ( r === 4 )
		{
			for ( let t = Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) + 1; t > 0; t-- )
			if ( sdAsp.asps_tot < 25 )
			{
				let asp = new sdAsp({ 
					x:sdWorld.world_bounds.x1 + 32 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 64 ), 
					y:sdWorld.world_bounds.y1 + 32
				});
				//asp.sy += 10;
				sdEntity.entities.push( asp );

				if ( !asp.CanMoveWithoutOverlap( asp.x, asp.y, 0 ) )
				{
					asp.remove();
					asp._broken = false;
				}
				else
				sdWorld.UpdateHashPosition( asp, false ); // Prevent inersection with other ones
			}
		}
					
		if ( r === 5 ) // Falkok invasion event
		{
			if ( this._invasion === false ) // Prevent invasion resetting
			{
				this._invasion = true;
				this._invasion_timer = 120 ; // 2 minutes; using GSPEED for measurement (feel free to change that, I'm not sure how it should work)
				this._invasion_spawn_timer = 0;
				this._invasion_spawns_con = 30; // At least 30 Falkoks must spawn otherwise invasion will not end
				//console.log('Invasion incoming!');
				{ // Spawn some drones as invasion starts
					let instances = 0;
					let instances_tot = Math.min( 6 ,Math.ceil( ( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) ) );

					let left_side = ( Math.random() < 0.5 );

					while ( instances < instances_tot && sdDrone.drones_tot < 20 )
					{

						let drone = new sdDrone({ x:0, y:0 , _ai_team: 1});
						//drone.type = ( Math.random() < 0.15 ) ? 3 : 1;

						sdEntity.entities.push( drone );

						{
							let x,y;
							let tr = 1000;
							do
							{
								if ( left_side )
								x = sdWorld.world_bounds.x1 + 64 + 64 * instances;
								else
								x = sdWorld.world_bounds.x2 - 64 - 64 * instances;

								y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

								if ( drone.CanMoveWithoutOverlap( x, y, 0 ) )
								//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
								//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
								{
									drone.x = x;
									drone.y = y;

									//sdWorld.UpdateHashPosition( ent, false );
									//console.log('Drone spawned!');
									break;
								}


								tr--;
								if ( tr < 0 )
								{
									drone.remove();
									drone._broken = false;
									break;
								}
							} while( true );
						}
						instances++;
					}
				}
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 1; // if the event is already active, quickly initiate something else
						
		}

		if ( r === 6 ) // Big virus event
		{
			let instances = 0;
			let instances_tot = 1 + Math.ceil( Math.random() * 3 );

			let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && sdVirus.viruses_tot < 40  && sdVirus.big_viruses < 4 )
			{

				let virus_entity = new sdVirus({ x:0, y:0 });
				virus_entity._is_big = true;
				sdEntity.entities.push( virus_entity );
				sdVirus.big_viruses++;
				{
					let x,y;
					let tr = 1000;
					do
					{
						if ( left_side )
						x = sdWorld.world_bounds.x1 + 32 + 64 * instances;
						else
						x = sdWorld.world_bounds.x2 - 32 - 64 * instances;

						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( virus_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x + 32, y, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x - 32, y, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x, y - 32, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x + 32, y - 32, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x - 32, y - 32, 0 ) )
						if ( !virus_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
						{
							virus_entity.x = x;
							virus_entity.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							//console.log('Big virus spawned!');
							//console.log(sdVirus.big_viruses);
							break;
						}


						tr--;
						if ( tr < 0 )
						{
							virus_entity.remove();
							virus_entity._broken = false;
							break;
						}
					} while( true );
				}

				instances++;
			}
		}
					
		if ( r === 7 ) // Flying Mech event
		{
			let instances = 0;
			let instances_tot = Math.ceil( ( Math.random() * sdWorld.GetPlayingPlayersCount() ) / 3 );

			let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && sdEnemyMech.mechs_counter < 3 )
			{

				let mech_entity = new sdEnemyMech({ x:0, y:0 });

				sdEntity.entities.push( mech_entity );

				{
					let x,y;
					let tr = 1000;
					do
					{
						if ( left_side )
						x = sdWorld.world_bounds.x1 + 64 + 64 * instances;
						else
						x = sdWorld.world_bounds.x2 - 64 - 64 * instances;

						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( mech_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
						{
							mech_entity.x = x;
							mech_entity.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							//console.log('Flying mech spawned!');
							break;
						}


						tr--;
						if ( tr < 0 )
						{
							mech_entity.remove();
							mech_entity._broken = false;
							break;
						}
					} while( true );
				}

				instances++;
			}
		}
					
		if ( r === 8 ) // Earth quake, idea by LazyRain, implementation by Eric Gurt
		{
			this._quake_scheduled_amount = 30 * ( 10 + Math.random() * 30 );
		}
					
		if ( r === 9 ) // Spawn few sdBadDog-s somewhere on ground where players don't see them
		{
			//let instances = Math.floor( 3 + Math.random() * 6 );
			let instances = Math.floor( 1 + Math.random() * 2 );
			//while ( instances > 0 && sdBadDog.dogs_counter < 16 )
			while ( instances > 0 )
			{

				let dog = new sdBadDog({ x:0, y:0 });

				sdEntity.entities.push( dog );

				{
					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( dog.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !dog.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + dog._hitbox_x1 - 16, 
								y + dog._hitbox_y1 - 16, 
								x + dog._hitbox_x2 + 16, 
								y + dog._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
										
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
											
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
										
							if ( di_allowed )
							{
								dog.x = x;
								dog.y = y;

								break;
							}
						}
									


						tr--;
						if ( tr < 0 )
						{
							dog.remove();
							dog._broken = false;
							break;
						}
					} while( true );
				}

				instances--;
			}
		}

		if ( r === 10 ) // Portal event
		{
			if ( Math.random() < 0.7 ) // 70% chance for rift portal to spawn
			{
				let instances = 1;
				while ( instances > 0 && sdRift.portals < 2 )
				{

					let portal = new sdRift({ x:0, y:0 });

					sdEntity.entities.push( portal );

					{
						let x,y,i;
						let tr = 1000;
						do
						{
							x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							let chance = Math.random();
							if ( chance < 0.25 ) // 25% chance it's a "Cube" spawning portal ( 0 - 0.25 )
							portal.type = 2;
							else
							if ( chance < 0.5 ) // 20% chance it's a "Asteroid" spawning portal ( 0.25 - 0.5 )
							portal.type = 3;
							else
							if ( chance < 0.6 ) // 10% chance it's a "Black hole" portal ( 0.5 - 0.6 )
							portal.type = 4;
							else
							portal.type = 1;

							if ( portal.CanMoveWithoutOverlap( x, y, 0 ) )
							if ( !portal.CanMoveWithoutOverlap( x, y + 24, 0 ) )
							if ( sdWorld.last_hit_entity )
							if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
							if ( !sdWorld.CheckWallExistsBox( 
									x + portal._hitbox_x1 - 8, 
									y + portal._hitbox_y1 - 8, 
									x + portal._hitbox_x2 + 8, 
									y + portal._hitbox_y2 + 8, null, null, [ 'sdWater' ], null ) )
							{
								portal.x = x;
								portal.y = y;

								break;
							}
									


							tr--;
							if ( tr < 0 )
							{
								portal.remove();
								portal._broken = false;
								break;
							}
						} while( true );
					}

				instances--;
				}
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
					
		if ( r === 11 ) // Spawn 3-6 sdSpiders, drones somewhere on ground where players don't see them and Erthal humanoids
		{
			let instances = Math.floor( 1 + Math.random() * 1 );
			//while ( instances > 0 && sdSpider.spider_counter < Math.min( 32, sdWorld.GetPlayingPlayersCount() * 10 ) )
			while ( instances > 0 )
			{

				let ent = new sdSpider({ x:0, y:0 });
				sdEntity.entities.push( ent );
				ent.type = ( Math.random() < 0.05 ) ? 1 : 0;

				//if ( sdDrone.drones_tot < 20 ) // Not sure if this is needed to be honest, it also causes error because "let" can't be behind an "if" directly - Booraz149
				let ent_drone = new sdDrone({ x:0, y:0, _ai_team: 2, type: 2 }); 
				sdEntity.entities.push( ent_drone );


				{
					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( ent.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !ent.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( ent_drone.CanMoveWithoutOverlap( x, y - 48, 0 ) ) // Check if drones have enough space to be placed above Erthal spider bots.
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + ent._hitbox_x1 - 16, 
								y + ent._hitbox_y1 - 116, 
								x + ent._hitbox_x2 + 16, 
								y + ent._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
										
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
											
								if ( di < 700 )
								{
									di_allowed = false;
									break;
								}
							}
										
							if ( di_allowed )
							{
								ent.x = x;
								ent.y = y;

								ent_drone.x = x;
								ent_drone.y = y - 48;

								break;
							}
						}
									


						tr--;
						if ( tr < 0 )
						{
							ent.remove();
							ent._broken = false;

							ent_drone.remove();
							ent_drone._broken = false;
							break;
						}
					} while( true );
				}

				instances--;
			}
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai_team === 2 )
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 0 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( percent / sdWorld.GetPlayingPlayersCount() ) ) // Spawn chance depends on RNG, chances increase if more players ( or all ) have at least one built tool / shop upgrade
			{
				let robots = 0;
				let robots_tot = 1 + ( ~~( Math.random() * 2 ) );

				let left_side = ( Math.random() < 0.5 );

				while ( robots < robots_tot && ais < 8 )
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

					sdEntity.entities.push( character_entity );

					{
						let x,y;
						let tr = 1000;
						do
						{
							if ( left_side )
							x = sdWorld.world_bounds.x1 + 16 + 16 * robots;
							else
							x = sdWorld.world_bounds.x2 - 16 - 16 * robots;

							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
							if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
							if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
							{
								character_entity.x = x;
								character_entity.y = y;

								//sdWorld.UpdateHashPosition( ent, false );
								if ( Math.random() < 0.3 )
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_BURST_RIFLE }) );
									character_entity._ai_gun_slot = 2;
								}
								else
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_PLASMA_PISTOL }) );
									character_entity._ai_gun_slot = 1;
								}
								let robot_settings;
								//if ( character_entity._ai_gun_slot === 2 )
								robot_settings = {"hero_name":"Erthal","color_bright":"#37a2ff","color_dark":"#000000","color_bright3":"#464646","color_dark3":"#000000","color_visor":"#1664a8","color_suit":"#464646","color_suit2":"#000000","color_dark2":"#464646","color_shoes":"#000000","color_skin":"#1665a8","color_extra1":"#464646","helmet1":false,"helmet4":true,"body3":true,"legs3":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":false,"voice7":true};

								character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( robot_settings );
								character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( robot_settings );
								character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( robot_settings );
								character_entity.title = robot_settings.hero_name;
								character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( robot_settings );
								character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( robot_settings );
								if ( character_entity._ai_gun_slot === 2 || character_entity._ai_gun_slot === 1 )
								{
									character_entity.matter = 150;
									character_entity.matter_max = 150;

									character_entity.hea = 250;
									character_entity.hmax = 250;

									character_entity.armor = 500;
									character_entity.armor_max = 500;
									character_entity._armor_absorb_perc = 0.75; // 75% damage absorption, since armor will run out before health, they effectively have 750 health

									character_entity._damage_mult = 1; // Supposed to put up a challenge
								}

								/*if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // Nothing here so far
								{
									character_entity.matter = 100;
									character_entity.matter_max = 100;

									character_entity.hea = 250;
									character_entity.hmax = 250;

									character_entity._damage_mult = 1 / 1.5; // Rarer enemy therefore more of a threat?
								}*/	
								character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
								//character_entity._ai_enabled = sdCharacter.AI_MODEL_FALKOK;
										
								character_entity._ai_level = 4;
										
								character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
								character_entity._jetpack_allowed = true; // Jetpack
								character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ) ; // Small recoil reduction based on AI level
								character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
								character_entity._ai_team = 2; // AI team 2 is for Erthal
								character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players

							break;
						}


						tr--;
						if ( tr < 0 )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
					} while( true );
				}

				robots++;
				ais++;
				//console.log('Erthal spawned!');
				}
			}
		}
		if ( r === 12 ) // Spawn an obelisk near ground where players don't see them
		{
			let instances = 1;
			while ( instances > 0 && sdObelisk.obelisks_counter < 5 )
			{

				let obelisk = new sdObelisk({ x:0, y:0 });
				obelisk.type = Math.round( 1 + Math.random() * 5 );

				sdEntity.entities.push( obelisk );

				{
					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( obelisk.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !obelisk.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + obelisk._hitbox_x1 - 16, 
								y + obelisk._hitbox_y1 - 16, 
								x + obelisk._hitbox_x2 + 16, 
								y + obelisk._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
										
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
											
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
										
							if ( di_allowed )
							{
								obelisk.x = x;
								obelisk.y = y;

								break;
							}
						}
									


						tr--;
						if ( tr < 0 )
							{
							obelisk.remove();
							obelisk._broken = false;
							break;
						}
					} while( true );
				}

				instances--;
			}
		}
		
		if ( r === 13 ) // Ground corruption start from random block
		{
			for ( let tr = 0; tr < 100; tr++ )
			{
				let i = Math.floor( Math.random() * sdEntity.entities.length );
				
				if ( i < sdEntity.entities.length )
				{
					let ent = sdEntity.entities[ i ];
					
					if ( ent.is( sdBlock ) )
					if ( ent._natural )
					{
						ent.Corrupt();
						break;
					}
				}
				else
				{
					break;
				}
			}
		}

		if ( r === 0 || 
			 r === 14 || 
			 r === 15 ||
			 r === 19 )
		if ( this.raining_intensity <= 0 )
		{
			if ( r === 0 )
			{
				this.acid_rain = 1;
				this.snow = 0;
				this.matter_rain = 0;
			}
		
			if ( r === 14 )
			{
				this.acid_rain = 0;
				this.snow = 0;
				this.matter_rain = 0;
			}

			if ( r === 15 )
			{
				this.snow = 1;
				this.acid_rain = 0;
				this.matter_rain = 0;
			}

			if ( r === 19 )
			{
				if ( Math.random() < 0.8 )
				{
					this.matter_rain = 1;
					this.snow = 0;
					this.acid_rain = 0;
				}
				else
				{
					this.matter_rain = 2;
					this.snow = 0;
					this.acid_rain = 0;
				}
			}
		}

		if ( r === 16 ) // Spawn a Large Anti-Crystal anywhere on the map outside player views which drains active players' matter if they're close enough
		{
			if ( Math.random() < 0.2 ) // 20% chance for the Large Anti-Crystal to spawn
			{
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdJunk.anti_crystals < 1 )
				{
					let anticrystal = new sdJunk({ x:0, y:0, type: 3 });

					sdEntity.entities.push( anticrystal );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( anticrystal.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( anticrystal.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !anticrystal.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + anticrystal._hitbox_x1 - 16, 
								y + anticrystal._hitbox_y1 - 16, 
								x + anticrystal._hitbox_x2 + 16, 
								y + anticrystal._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
									
							if ( di_allowed )
							{
								anticrystal.x = x;
								anticrystal.y = y;

								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							anticrystal.remove();
							anticrystal._broken = false;
							break;
						}
					} while( true );

					instances++;
				}

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === 17 ) // Sarrornian faction event, although only drones exist for now.
		{
			{ 
				let instances = 0;
				let instances_tot = Math.min( 6 ,Math.ceil( ( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) ) );

				let left_side = ( Math.random() < 0.5 );

				while ( instances < instances_tot && sdDrone.drones_tot < 20 )
				{

					let drone = new sdDrone({ x:0, y:0 , _ai_team: 4, type: ( Math.random() < 0.15 ) ? 4 : 3});
					//drone.type = ( Math.random() < 0.15 ) ? 4 : 3; // This was causing drones to spawn as proper types but not proper HP.

					sdEntity.entities.push( drone );

					{
						let x,y;
						let tr = 1000;
						do
						{
							if ( left_side )
							x = sdWorld.world_bounds.x1 + 64 + 64 * instances;
							else
							x = sdWorld.world_bounds.x2 - 64 - 64 * instances;

							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							if ( drone.CanMoveWithoutOverlap( x, y, 0 ) )
							//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
							//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
							{
								drone.x = x;
								drone.y = y;

								//sdWorld.UpdateHashPosition( ent, false );
								//console.log('Drone spawned!');
								break;
							}


							tr--;
							if ( tr < 0 )
							{
								drone.remove();
								drone._broken = false;
								break;
							}
						} while( true );
					}
					instances++;
				}
			}
		}
		if ( r === 18 ) // Spawn a Council Bomb anywhere on the map outside player views which detonates in 10 minutes
		{
			let chance = 0;
			let req_char = 0;
			let char = 0;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character !== null )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					char++;
					if ( sdWorld.sockets[ i ].character.build_tool_level >= 15 )
					req_char++;
				}
			}
			chance = ( req_char / char ) * 0.4; // Chance to execute this event depends on how many players reached 15+ , max 40% chance

			if ( Math.random() < chance )
			{
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdJunk.council_bombs < 1 )
				{
					let council_bomb = new sdJunk({ x:0, y:0, type: 4 });

					sdEntity.entities.push( council_bomb );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( council_bomb.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( council_bomb.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !council_bomb.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + council_bomb._hitbox_x1 - 16, 
								y + council_bomb._hitbox_y1 - 16, 
								x + council_bomb._hitbox_x2 + 16, 
								y + council_bomb._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
									
							if ( di_allowed )
							{
								council_bomb.x = x;
								council_bomb.y = y;

								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							council_bomb.remove();
							council_bomb._broken = false;
							break;
						}
					} while( true );

					instances++;
				}

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		
		if ( r === sdWeather.EVENT_OVERLORD )
		{
			let instances = 0;
			let instances_tot = 1;

			let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot )
			{
				let ent = new sdOverlord({ x:0, y:0 });

				sdEntity.entities.push( ent );

				{
					let x,y;
					let tr = 1000;
					do
					{
						if ( left_side )
						x = sdWorld.world_bounds.x1 + 64;
						else
						x = sdWorld.world_bounds.x2 - 64;

						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( ent.CanMoveWithoutOverlap( x, y, 0 ) )
						//if ( !ent.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
						{
							ent.x = x;
							ent.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							//console.log('Flying mech spawned!');
							break;
						}


						tr--;
						if ( tr < 0 )
						{
							ent.remove();
							ent._broken = false;
							break;
						}
					} while( true );
				}

				instances++;
			}
		}
		if ( r === sdWeather.EVENT_ERTHAL_BEACON ) // Spawn an Erthal anywhere on the map outside player views which summons Erthals until destroyed
		{
			let chance = 0;
			let req_char = 0;
			let char = 0;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character !== null )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					char++;
					if ( sdWorld.sockets[ i ].character.build_tool_level >= 5 )
					req_char++;
				}
			}
			chance = ( req_char / char ) * 0.4; // Chance to execute this event depends on how many players reached 5+ , max 40% chance

			if ( Math.random() < chance )
			{
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdJunk.erthal_beacons < 1 )
				{
					let erthal_beacon = new sdJunk({ x:0, y:0, type: 5 });

					sdEntity.entities.push( erthal_beacon );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( erthal_beacon.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( erthal_beacon.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !erthal_beacon.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + erthal_beacon._hitbox_x1 - 16, 
								y + erthal_beacon._hitbox_y1 - 16, 
								x + erthal_beacon._hitbox_x2 + 16, 
								y + erthal_beacon._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
									
							if ( di_allowed )
							{
								erthal_beacon.x = x;
								erthal_beacon.y = y;

								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							erthal_beacon.remove();
							erthal_beacon._broken = false;
							break;
						}
					} while( true );

					instances++;
				}

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_VELOX ) // Velox faction spawn. TO DO: Support healing drones
		{
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai_team === 2 )
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 5 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( percent / sdWorld.GetPlayingPlayersCount() ) ) // Spawn chance depends on RNG, chances increase if more players ( or all ) have at least 5 levels
			{
				let instances = 0;
				let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

				let left_side = ( Math.random() < 0.5 );

				while ( instances < instances_tot && ais < 8 ) // max AI value up to 8, as other events I think. - Booraz149
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

					sdEntity.entities.push( character_entity );

					{
						let x,y;
						let tr = 1000;
						do
						{
							if ( left_side )
							x = sdWorld.world_bounds.x1 + 16 + 16 * instances;
							else
							x = sdWorld.world_bounds.x2 - 16 - 16 * instances;

							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
							//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
							//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
							{
								character_entity.x = x;
								character_entity.y = y;

								//sdWorld.UpdateHashPosition( ent, false );
								if ( Math.random() < 0.35 )
								{
									if ( Math.random() < 0.25 )
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAIL_CANNON }) );
										character_entity._ai_gun_slot = 4;
									}
									else
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_COMBAT_RIFLE }) );
										character_entity._ai_gun_slot = 2;
									}
								}
								else
								{ 
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_PISTOL }) );
										character_entity._ai_gun_slot = 1;
									}
								}
								let velox_settings;
								if ( character_entity._ai_gun_slot === 1 )
								velox_settings = {"hero_name":"Velox Soldier","color_bright":"#c0c0c0","color_dark":"#a0a0a0","color_bright3":"#00ffff","color_dark3":"#202020","color_visor":"#00ffff","color_suit":"#c0c0c0","color_suit2":"#080808","color_dark2":"#000000","color_shoes":"#000000","color_skin":"#000000","helmet1":false,"helmet86":true,"voice1":false,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice7":true,"body59":true, "legs59":true};
								if ( character_entity._ai_gun_slot === 2 )
								velox_settings = {"hero_name":"Velox Soldier","color_bright":"#c0c0c0","color_dark":"#a0a0a0","color_bright3":"#00ff44","color_dark3":"#202020","color_visor":"#00ff44","color_suit":"#c0c0c0","color_suit2":"#080808","color_dark2":"#000000","color_shoes":"#000000","color_skin":"#000000","helmet1":false,"helmet86":true,"voice1":false,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice7":true,"body59":true, "legs59":true};

								if ( character_entity._ai_gun_slot === 4 )
								velox_settings = {"hero_name":"Velox Assassin","color_bright":"#c0c0c0","color_dark":"#a0a0a0","color_bright3":"#ff0000","color_dark3":"#202020","color_visor":"#ff0000","color_suit":"#c0c0c0","color_suit2":"#080808","color_dark2":"#000000","color_shoes":"#000000","color_skin":"#000000","helmet1":false,"helmet86":true,"voice1":false,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice7":true,"body59":true, "legs59":true};

								character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( velox_settings );
								character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( velox_settings );
								character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( velox_settings );
								character_entity.title = velox_settings.hero_name;
								character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( velox_settings );
								character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( velox_settings );
								if ( character_entity._ai_gun_slot === 1 ) // If a regular Velox soldier
								{
									character_entity.matter = 150;
									character_entity.matter_max = 150;

									character_entity.hea = 250;
									character_entity.hmax = 250;

									character_entity.armor = 500;
									character_entity.armor_max = 500;
									character_entity._armor_absorb_perc = 0.75; // 75% damage absorption, since armor will run out before health, they effectively have 750 health

									character_entity._damage_mult = 0.8;
								}

								if ( character_entity._ai_gun_slot === 2 ) // Combat rifle Velox
								{
									character_entity.matter = 150;
									character_entity.matter_max = 150;

									character_entity.hea = 250;
									character_entity.hmax = 250;

									character_entity.armor = 1000;
									character_entity.armor_max = 1000;
									character_entity._armor_absorb_perc = 0.93; // 93% damage absorption, since armor will run out before health, they effectively have 1250 health

									character_entity._damage_mult = 1;
								}

								if ( character_entity._ai_gun_slot === 4 ) // Rail cannon Velox, harder to kill
								{
									character_entity.matter = 250;
									character_entity.matter_max = 250;

									character_entity.hea = 250;
									character_entity.hmax = 250;

									character_entity.armor = 1750;
									character_entity.armor_max = 1750;
									character_entity._armor_absorb_perc = 0.97; // 97% damage absorption, since armor will run out before health, they effectively have 2000 health

									character_entity._damage_mult = 1 + ( 1 / 3 );
								}
								character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
								//character_entity._ai_enabled = sdCharacter.AI_MODEL_AGGRESSIVE;
								character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

								character_entity._matter_regeneration = 5; // At least some ammo regen
								character_entity._jetpack_allowed = true; // Jetpack
								character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ); // Small recoil reduction based on AI level
								character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
								character_entity._ai_team = 5; // AI team 5 is for Velox faction
								character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players

								break;
							}

							tr--;
							if ( tr < 0 )
							{
								character_entity.death_anim = sdCharacter.disowned_body_ttl + 1;
								character_entity.remove();
								break;
							}
						} while( true );
					}

					instances++;
					ais++;
				}
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_CRYSTAL_BLOCKS ) // Put crystal shards in a 30 blocks
		{
			for ( let j = 0; j < 30; j++ )
			{
				for ( let tr = 0; tr < 100; tr++ )
				{
					let i = Math.floor( Math.random() * sdEntity.entities.length );
					
					if ( i < sdEntity.entities.length )
					{
						let ent = sdEntity.entities[ i ];
						
						if ( ent.is( sdBlock ) )
						if ( ent._natural )
						{
							ent.Crystalize();
							break;
						}
					}
					else
					{
						break;
					}
				}
			}
		}
		if ( r === sdWeather.EVENT_SD_EXTRACTION ) // Summon 1 Star Defender AI which appears to need to be escorted/rescued, or arrested, depending on RNG.
		{
			let ais = 0;
			let hostile = ( Math.random() < 0.5 );

			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			if ( sdCharacter.characters[ i ].hea > 0 )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			{
				ais++;
			}

			let instances = 0;
			let instances_tot = 1;

			let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && ais < 8 )
			{
				let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled: hostile ? sdCharacter.AI_MODEL_FALKOK : sdCharacter.AI_MODEL_TEAMMATE });

				sdEntity.entities.push( character_entity );

				{
					let x,y;
					let tr = 1000;
					do
					{
						if ( left_side )
						x = sdWorld.world_bounds.x1 + 16 + 16 * instances;
						else
						x = sdWorld.world_bounds.x2 - 16 - 16 * instances;

						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( character_entity.CanMoveWithoutOverlap( x, y - 64, 0 ) ) // Make them spawn on surface more often when possible
						if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
						{
							character_entity.x = x;
							character_entity.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							if ( Math.random() < 0.5 ) // Random gun given to Star Defender
							{
								if ( Math.random() < 0.2 )
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
									character_entity._ai_gun_slot = 4;
								}
								else
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
									character_entity._ai_gun_slot = 3;
								}
							}
							else
							{ 
								if ( Math.random() < 0.1 )
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
									character_entity._ai_gun_slot = 2;
								}
								else
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
									character_entity._ai_gun_slot = 2;
								}
							}
							let sd_settings;
							if ( hostile )
							sd_settings = {"hero_name":"Criminal Star Defender","color_bright":"#c0c0c0","color_dark":"#808080","color_bright3":"#c0c0c0","color_dark3":"#808080","color_visor":"#ff0000","color_suit":"#800000","color_suit2":"#800000","color_dark2":"#808080","color_shoes":"#000000","color_skin":"#808000","helmet1":true,"helmet2":false,"voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice6":false};
							else
							sd_settings = {"hero_name":"Star Defender","color_bright":"#c0c0c0","color_dark":"#808080","color_bright3":"#c0c0c0","color_dark3":"#808080","color_visor":"#ff0000","color_suit":"#008000","color_suit2":"#008000","color_dark2":"#808080","color_shoes":"#000000","color_skin":"#808000","helmet1":true,"helmet2":false,"voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice6":false};
							character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( sd_settings );
							character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( sd_settings );
							character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( sd_settings );
							character_entity.title = sd_settings.hero_name;

							character_entity.matter = 185;
							character_entity.matter_max = 185;

							character_entity.hea = 250; // It is a star defender after all
							character_entity.hmax = 250;

							character_entity.armor = 500;
							character_entity.armor_max = 500;
							character_entity._armor_absorb_perc = 0.6; // 60% damage reduction
							character_entity.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor

							character_entity._damage_mult = 2;	
							character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
										
							character_entity._ai_level = 5;
										
							character_entity._matter_regeneration = 5; // At least some ammo regen
							character_entity._jetpack_allowed = true; // Jetpack
							character_entity._recoil_mult = 1 - ( 0.0055 * 5 ) ; // Recoil reduction
							character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
							character_entity._ai_team = hostile ? 6 : 0; // AI team 6 is for Hostile Star Defenders, 0 is for normal Star Defenders
							character_entity._allow_despawn = false;
							character_entity._matter_regeneration_multiplier = 4; // Their matter regenerates 4 times faster than normal, unupgraded players
							//character_entity._ai.next_action = 1;
							break;
						}


						tr--;
						if ( tr < 0 )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
					} while( true );
				}

				instances++;
				ais++;
				if ( hostile )
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be arrested ( don't destroy the body )
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'EXTRACT-'+character_entity._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: character_entity,
						extract_target: 1, // This let's the game know that it needs to draw arrow towards target. Use only when actual entity, and not class ( Like in CC tasks) needs to be LRTP extracted.
						mission: sdTask.MISSION_LRTP_EXTRACTION,
						difficulty: 0.14,
						lrtp_ents_needed: 1,
						title: 'Arrest Star Defender',
						description: 'It seems that one of criminals is nearby and needs to answer for their crimes. Arrest them and bring them to the mothership, even if it means bringing the dead body!'
					});
				}
				else
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be rescued, although they can be teleported when dead, but not destroyed body.
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'EXTRACT-'+character_entity._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: character_entity,
						extract_target: 1, // This let's the game know that it needs to draw arrow towards target. Use only when actual entity, and not class ( Like in CC tasks) needs to be LRTP extracted.
						mission: sdTask.MISSION_LRTP_EXTRACTION,
						difficulty: 0.14,
						lrtp_ents_needed: 1,
						title: 'Rescue Star Defender',
						description: 'It seems that one of our soldiers is nearby and needs help. You should rescue the soldier and extract him to the mothership!'
					});
				}
			}
		}
		if ( r === sdWeather.EVENT_SETR ) // Setr faction spawn. Spawns humanoids and drones.
		{
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai_team === 7 )
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 5 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( percent / sdWorld.GetPlayingPlayersCount() ) ) // Spawn chance depends on RNG, chances increase if more players ( or all ) have at least 5 levels
			{
				let instances = 0;
				let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

				let left_side = ( Math.random() < 0.5 );

				while ( instances < instances_tot && ais < 8 ) // max AI value up to 8, as other events I think. - Booraz149
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

					sdEntity.entities.push( character_entity );

					{
						let x,y;
						let tr = 1000;
						do
						{
							if ( left_side )
							x = sdWorld.world_bounds.x1 + 16 + 16 * instances;
							else
							x = sdWorld.world_bounds.x2 - 16 - 16 * instances;

							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
							//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
							//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
							{
								character_entity.x = x;
								character_entity.y = y;

								//sdWorld.UpdateHashPosition( ent, false );
								{ 
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_PLASMA_SHOTGUN }) );
									character_entity._ai_gun_slot = 3;
								}
								let setr_settings;

								if ( character_entity._ai_gun_slot === 3 )
								setr_settings = {"hero_name":"Setr Soldier","color_bright":"#0000c0","color_dark":"#404040","color_bright3":"#404040","color_dark3":"#202020","color_visor":"#c8c800","color_suit":"#000080","color_suit2":"#000080","color_dark2":"#404040","color_shoes":"#000000","color_skin":"#000000","helmet1":false,"helmet3":true,"voice1":false,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice9":true,"body18":true, "legs22":true};

								character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( setr_settings );
								character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( setr_settings );
								character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( setr_settings );
								character_entity.title = setr_settings.hero_name;
								character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( setr_settings );
								character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( setr_settings );
								if ( character_entity._ai_gun_slot === 3 ) // If a regular Setr soldier
								{
									character_entity.matter = 150;
									character_entity.matter_max = 150;

									character_entity.hea = 210;
									character_entity.hmax = 210;

									character_entity.armor = 350;
									character_entity.armor_max = 350;
									character_entity._armor_absorb_perc = 0.7; // 70% damage absorption

									character_entity._damage_mult = 1;
								}

								character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
								//character_entity._ai_enabled = sdCharacter.AI_MODEL_AGGRESSIVE;
								character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

								character_entity._matter_regeneration = 5; // At least some ammo regen
								character_entity._jetpack_allowed = true; // Jetpack
								character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ); // Small recoil reduction based on AI level
								character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
								character_entity._ai_team = 7; // AI team 7 is for Setr faction
								character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players

								break;
							}

							tr--;
							if ( tr < 0 )
							{
								character_entity.death_anim = sdCharacter.disowned_body_ttl + 1;
								character_entity.remove();
								break;
							}
						} while( true );
					}

					instances++;
					ais++;
				}

				let drones = 0;
				let drones_tot = Math.min( 6 ,Math.ceil( ( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) ) );


				while ( drones < drones_tot && sdDrone.drones_tot < 20 )
				{

					let drone = new sdDrone({ x:0, y:0 , _ai_team: 7, type: 7});

					sdEntity.entities.push( drone );

					{
						let x,y;
						let tr = 1000;
						do
						{
							if ( left_side )
							x = sdWorld.world_bounds.x1 + 64 + 64 * instances;
							else
							x = sdWorld.world_bounds.x2 - 64 - 64 * instances;

							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							if ( drone.CanMoveWithoutOverlap( x, y, 0 ) )
							//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
							//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
							{
								drone.x = x;
								drone.y = y;

								//sdWorld.UpdateHashPosition( ent, false );
								//console.log('Drone spawned!');
								break;
							}


							tr--;
							if ( tr < 0 )
							{
								drone.remove();
								drone._broken = false;
								break;
							}
						} while( true );
					}
					drones++;
				}
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_SETR_DESTROYER ) // Setr Destroyer, basically alternate "flying mech"
		{
			let instances = 0;
			let instances_tot = 1;

			let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && sdSetrDestroyer.destroyer_counter < 3 )
			{

				let destroyer_entity = new sdSetrDestroyer({ x:0, y:0 });

				sdEntity.entities.push( destroyer_entity );

				{
					let x,y;
					let tr = 1000;
					do
					{
						if ( left_side )
						x = sdWorld.world_bounds.x1 + 64 + 64 * instances;
						else
						x = sdWorld.world_bounds.x2 - 64 - 64 * instances;

						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( destroyer_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						//if ( !destroyer_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
						{
							destroyer_entity.x = x;
							destroyer_entity.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							//console.log('Setr Destroyer spawned!');
							break;
						}


						tr--;
						if ( tr < 0 )
						{
							destroyer_entity.remove();
							destroyer_entity._broken = false;
							break;
						}
					} while( true );
				}

				instances++;
			}
		}
		if ( r === sdWeather.EVENT_CRYSTALS_MATTER ) // Task which tells players to deliver "X" amount of max matter worth of crystals.
		{
			let player_count = sdWorld.GetPlayingPlayersCount();
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Create the tasks
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'EXTRACT-'+this._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: 'sdCrystal',
						mission: sdTask.MISSION_LRTP_EXTRACTION,
						difficulty: 0.4,
						lrtp_ents_needed: 10240 + ( 2560 * player_count ), // 12300 matter requirement for 1 player, although progress counts for all players I think
						title: 'Teleport crystals',
						time_left: 30 * 60 * 30,
						extra: -99, // This lets the game know to take max matter as progress instead of crystal count.
						description: 'We need you to teleport a large amount of crystals. This is to help us keep the Mothership supplied with matter so our matter reserves do not deplete. With other Star Defenders on this planet, it should not be too hard.',
						type: 1 // Task remains active even if player disconnects, so it doesn't exist after the event expires
					});
				}
		}
		if ( r === sdWeather.EVENT_DIRTY_AIR )
		{
			this.air = 0;
			this._no_air_duration = 30 * 60 * 5;
		}
		if ( r === sdWeather.EVENT_AMPHIDS )
		{
			let instances = Math.floor( 2 + Math.random() * 5 );
			while ( instances > 0 )
			{

				let amphid = new sdAmphid({ x:0, y:0 });

				sdEntity.entities.push( amphid );

				{
					var ax,ay;
					let x,y,i;
					let tr = 1000;
					do
					{
						if ( ax )
						{
							x = ax + Math.random() * 320 - 160;
							y = ay + Math.random() * 320 - 160;
						}
						else
						{
							x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );
						}
						
						if ( this.TraceDamagePossibleHere( x, y, 20 ) )
						if ( !amphid.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( ax || sdWorld.CheckWallExistsBox( 
							x + amphid._hitbox_x1 - 16, 
							y + amphid._hitbox_y1 - 16, 
							x + amphid._hitbox_x2 + 16, 
							y + amphid._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
							
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
								
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
							
							if ( di_allowed )
							{
								amphid.x = x;
								amphid.y = y;
								ax = x;
								ay = y;
								
								break;
							}
						}

						tr--;
						if ( tr < 0 )
						{
							amphid.remove();
							amphid._broken = false;
							break;
						}
					} while( true );
				}

				instances--;
			}
		}
		if ( r === sdWeather.EVENT_BITERS )
		{
			for ( let t = Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) + 1; t > 0; t-- )
			if ( sdBiter.biters_counter < 35 )
			{
				let biter = new sdBiter({ 
					x:sdWorld.world_bounds.x1 + 32 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 64 ), 
					y:sdWorld.world_bounds.y1 + 32
				});
				//asp.sy += 10;
				sdEntity.entities.push( biter );

				if ( !biter.CanMoveWithoutOverlap( biter.x, biter.y, 0 ) )
				{
					biter.remove();
					biter._broken = false;
				}
				else
				sdWorld.UpdateHashPosition( biter, false ); // Prevent inersection with other ones
			}
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			this.x1 = sdWorld.world_bounds.x1;
			this.y1 = sdWorld.world_bounds.y1;
			this.x2 = sdWorld.world_bounds.x2;
			this.y2 = sdWorld.world_bounds.y2;
			
			//return; // Hack

			this.day_time += GSPEED;
			this._event_rotation_time += GSPEED;
			//if ( this.day_time > 30 * 60 * 24 ) // While in sandbox mode and not that many events - might seem too boring. Also It does not change when nobody is online which can effectively make it rotate on weekly basis
			if ( this.day_time > 30 * 60 * 24 ) // This is the day time cycle, 24 minutes
			{
				this.day_time = 0;
			}
			if ( this._event_rotation_time > 30 * 60 * 15 ) // Event rotation cycle
			{
				this._event_rotation_time = 0;

				this.GetDailyEvents();
			}
			
			if ( this._invasion ) // Invasion event
			{
				this._invasion_timer -= 1 / 30  * GSPEED;
				this._invasion_spawn_timer -= 1 / 30 * GSPEED;
				if ( this._invasion_timer <= 0 && this._invasion_spawns_con <= 0 )
				{
					this._invasion = false;
					//console.log('Invasion clearing up!');
				}
				if ( this._invasion_spawn_timer <= 0 )
				{
					this._invasion_spawn_timer = 6 + ( Math.random() * 4 ) ;// Every 6+ to 10 seconds it will respawn enemies
					let ais = 0;

					for ( var i = 0; i < sdCharacter.characters.length; i++ )
					if ( sdCharacter.characters[ i ].hea > 0 )
					if ( !sdCharacter.characters[ i ]._is_being_removed )
					if ( sdCharacter.characters[ i ]._ai )
					{
						ais++;
					}

					let instances = 0;
					let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

					let left_side = ( Math.random() < 0.5 );

					while ( instances < instances_tot && ais < 16 ) // max AI value up to 16 during invasion, but should be reduced if laggy for server
					{

						let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

						sdEntity.entities.push( character_entity );

						{
							let x,y;
							let tr = 1000;
							do
							{
								if ( left_side )
								x = sdWorld.world_bounds.x1 + 16 + 16 * instances;
								else
								x = sdWorld.world_bounds.x2 - 16 - 16 * instances;

								y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

								if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
								//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
								//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
								{
									character_entity.x = x;
									character_entity.y = y;

									//sdWorld.UpdateHashPosition( ent, false );
									if ( Math.random() < 0.07 )
									{
										if ( Math.random() < 0.2 )
										{
											sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }) );
											character_entity._ai_gun_slot = 4;
										}
										else
										{
											sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN }) );
											character_entity._ai_gun_slot = 3;
										}
									}
									else
									{ 
										if ( Math.random() < 0.1 )
										{
											sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }) );
											character_entity._ai_gun_slot = 2;
										}
										else
										if ( Math.random() < 0.0025 ) // even at 1% it's still to common given the fact regular Falkoks die from anything
										{
											sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_HEAVY_RIFLE }) );
											character_entity._ai_gun_slot = 2;
										}
										else
										{
											sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );
											character_entity._ai_gun_slot = 2;
										}
									}
									let falkok_settings;
									if ( character_entity._ai_gun_slot === 2 )
									falkok_settings = {"hero_name":"Falkok","color_bright":"#6b0000","color_dark":"#420000","color_bright3":"#6b0000","color_dark3":"#420000","color_visor":"#5577b9","color_suit":"#240000","color_suit2":"#2e0000","color_dark2":"#560101","color_shoes":"#000000","color_skin":"#240000","helmet1":false,"helmet2":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":true};
									if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If Falkok spawns with Raygun or PSI-Cutter, change their looks Phoenix Falkok
									falkok_settings = {"hero_name":"Phoenix Falkok","color_bright":"#ffc800","color_dark":"#a37000","color_bright3":"#ffc800","color_dark3":"#a37000","color_visor":"#000000","color_suit":"#ffc800","color_suit2":"#ffc800","color_dark2":"#000000","color_shoes":"#a37000","color_skin":"#a37000","helmet1":false,"helmet12":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":true};

									character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( falkok_settings );
									character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( falkok_settings );
									character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( falkok_settings );
									character_entity.title = falkok_settings.hero_name;
									if ( character_entity._ai_gun_slot === 2 ) // If a regular falkok spawns
									{
										character_entity.matter = 75;
										character_entity.matter_max = 75;

										character_entity.hea = 115; // 105 so railgun requires at least headshot to kill and body shot won't cause bleeding
										character_entity.hmax = 115;

										character_entity._damage_mult = 1 / 2.5; // 1 / 4 was too weak
									}

									if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If a Phoenix Falkok spawns
									{
										character_entity.matter = 100;
										character_entity.matter_max = 100;

										character_entity.hea = 250; // It is a stronger falkok after all, although revert changes if you want
										character_entity.hmax = 250;

										character_entity._damage_mult = 1 / 1.5; // Rarer enemy therefore more of a threat?
									}	
									character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
									//character_entity._ai_enabled = sdCharacter.AI_MODEL_FALKOK;
									character_entity._ai_level = Math.floor( 1 + Math.random() * 3 ); // AI Levels from 1 to 3

									character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
									character_entity._jetpack_allowed = true; // Jetpack
									character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ); // Small recoil reduction based on AI level
									character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
									character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
									character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
									//this._invasion_spawns_con -= 1;

									break;
								}

								tr--;
								if ( tr < 0 )
								{
									character_entity.death_anim = sdCharacter.disowned_body_ttl + 1;
									character_entity.remove();
									break;
								}
							} while( true );
						}

						instances++;
						ais++;
						this._invasion_spawns_con -= 1;
					}
				}
			}
			this._asteroid_timer += GSPEED;
			if ( this._asteroid_timer > 60 * 30 / ( ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 800 ) )
			{
				let ent = new sdAsteroid({ 
					x:sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ), 
					y:sdWorld.world_bounds.y1 + 1
				});
				sdEntity.entities.push( ent );

				this._asteroid_timer = 0;
				this._asteroid_timer_scale_next = Math.random();
			}
			
			if ( this._asteroid_spam_amount > 0 )
			{
				this._asteroid_spam_amount -= GSPEED * 1;
				this._asteroid_timer += GSPEED * 40;
			}
			
			if ( this._rain_amount > 0 )
			{
				this.raining_intensity = Math.min( 100, this.raining_intensity + GSPEED * 0.1 );
				
				this._rain_amount -= this.raining_intensity / 100;
			}
			else
			{
				this.raining_intensity = Math.max( 0, this.raining_intensity - GSPEED * 0.1 );
			}
			
			if ( this._quake_scheduled_amount > 0 )
			{
				this._quake_scheduled_amount -= GSPEED;
				
				this.quake_intensity = Math.min( 100, this.quake_intensity + GSPEED * 0.3 );
			}
			else
			{
				this.quake_intensity = Math.max( 0, this.quake_intensity - GSPEED * 0.3 );
			}
			
			if ( this.raining_intensity > 50 )
			//if ( sdWorld.is_server ) Done before
			{
				sdWorld.last_hit_entity = null;
				
				//for ( var i = 0; i < 40; i++ )
				//if ( Math.random() < 100 / ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) )
				if ( sdWorld.time > this._next_grass_seed )
				{
					this._next_grass_seed = sdWorld.time + 100;
					
					let xx = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );

					if ( !sdWorld.CheckLineOfSight( xx, sdWorld.world_bounds.y1 + 4, xx, sdWorld.world_bounds.y2, null, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.is( sdBlock ) )
						{
							if ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND )
							{
								if ( sdWorld.last_hit_entity._plants === null )
								{
									let grass = new sdGrass({ x:sdWorld.last_hit_entity.x, y:sdWorld.last_hit_entity.y - 16, hue:sdWorld.last_hit_entity.hue, br:sdWorld.last_hit_entity.br, filter: sdWorld.last_hit_entity.filter, block:sdWorld.last_hit_entity  });
									sdEntity.entities.push( grass );
									
									//grass.snowed = this.snow;
									grass.SetSnowed( this.snow );

									sdWorld.last_hit_entity._plants = [ grass._net_id ];
								}
								else
								{
									for ( let i = 0; i < sdWorld.last_hit_entity._plants.length; i++ )
									{
										//let ent = sdEntity.entities_by_net_id_cache[ sdWorld.last_hit_entity._plants[ i ] ];
										let ent = sdEntity.entities_by_net_id_cache_map.get( sdWorld.last_hit_entity._plants[ i ] );

										if ( ent )
										{
											if ( ent.is( sdGrass ) )
											{
												// Old version problem fix:
												if ( ent._block !== sdWorld.last_hit_entity )
												ent._block = sdWorld.last_hit_entity;

												ent.SetSnowed( this.snow );
												//ent.snowed = this.snow;
													
												if ( ent.variation < sdWorld.GetFinalGrassHeight( ent.x ) )
												{
													ent.Grow();
													break; // Skip rest plants on this block
												}
											}
										}
										else
										{
											// Old version problem fix:
											sdWorld.last_hit_entity._plants.splice( i, 1 );
											i--;
											continue;
										}
									}
								}
							}
							
							if ( !this.snow && !this.matter_rain )
							if ( Math.random() < 0.01 )
							{
								let water = new sdWater({ x:Math.floor(sdWorld.last_hit_entity.x/16)*16, y:Math.floor(sdWorld.last_hit_entity.y/16)*16 - 16, type: this.acid_rain ? sdWater.TYPE_ACID : sdWater.TYPE_WATER });
								sdEntity.entities.push( water );
							}
						}
					}
				}

				if ( this.matter_rain )
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					if ( sdWorld.sockets[ i ].character.driver_of === null )
					if ( this.TraceDamagePossibleHere( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y ) )
					{
						//if ( sdWorld.sockets[ i ].character.pain_anim <= 0 && sdWorld.sockets[ i ].character.hea > 0 )
						//sdWorld.SendEffect({ x:sdWorld.sockets[ i ].character.x, y:sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character._hitbox_y1, type:sdWorld.sockets[ i ].character.GetBleedEffect(), filter:sdWorld.sockets[ i ].character.GetBleedEffectFilter() });

						if ( this.matter_rain === 1 )
						sdWorld.sockets[ i ].character.matter = Math.min( sdWorld.sockets[ i ].character.matter + ( GSPEED * this.raining_intensity / 120 ), sdWorld.sockets[ i ].character.matter_max );
						if ( this.matter_rain === 2 )
						sdWorld.sockets[ i ].character.matter = Math.max( sdWorld.sockets[ i ].character.matter - ( GSPEED * this.raining_intensity / 60 ), 0 );
					}
				}
				
				if ( this.acid_rain )
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					if ( sdWorld.sockets[ i ].character.driver_of === null )
					if ( this.TraceDamagePossibleHere( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y ) )
					{
						if ( sdWorld.sockets[ i ].character.pain_anim <= 0 && sdWorld.sockets[ i ].character.hea > 0 )
						{
							sdWorld.sockets[ i ].character.PlayDamageEffect( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character._hitbox_y1 );
							//sdWorld.SendEffect({ x:sdWorld.sockets[ i ].character.x, y:sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character._hitbox_y1, type:sdWorld.sockets[ i ].character.GetBleedEffect(), filter:sdWorld.sockets[ i ].character.GetBleedEffectFilter() });
						}

						sdWorld.sockets[ i ].character.DamageWithEffect( GSPEED * this.raining_intensity / 240 );
					}
				}
			}
			
			if ( this.quake_intensity >= 100 )
			//for ( let i = 0; i < 100; i++ ) // Hack
			{
				let ent = new sdBlock({ x:0, y:0, width:16, height:16 });
				
				//sdEntity.entities.push( ent );
				
				{
					let x,y;
					
					//let tr = 1000;
					
					let tr = 35;
					
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );
						/*
						if ( sdWorld.sockets[ 0 ] && sdWorld.sockets[ 0 ].character )
						{
							x = sdWorld.sockets[ 0 ].character.look_x;
							y = sdWorld.sockets[ 0 ].character.look_y;
						}*/
						
						x = Math.floor( x / 16 ) * 16;
						y = Math.floor( y / 16 ) * 16;
						
						sdWeather.last_crystal_near_quake = null;
						
						if ( ent.CanMoveWithoutOverlap( x, y, 0.0001, sdWeather.CrystalRemovalByEearthquakeFilter ) )
						{
							//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
							//if ( !sdWorld.CheckWallExistsBox( x, y, x+16, y+16, null, null, [ 'sdBlock', 'sdWater' ] ) ) // Extra check for spike blocks and water/lava
							if ( !sdWorld.CheckWallExistsBox( x + 0.0001, y + 0.0001, x+16 - 0.0001, y+16 - 0.0001, null, null, [ 'sdBlock', 'sdWater' ] ) ) // Extra check for spike blocks and water/lava
							{
								let ent_above = null;
								let ent_above_exists = false;

								let ent_below = null;
								let ent_below_exists = false;

								sdWorld.last_hit_entity = null;
								if ( !ent.CanMoveWithoutOverlap( x, y + 16, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural ) ) )
								{
									ent_below = sdWorld.last_hit_entity;
									ent_below_exists = true;
								}

								sdWorld.last_hit_entity = null;
								if ( !ent.CanMoveWithoutOverlap( x, y - 16, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural ) ) )
								{
									ent_above = sdWorld.last_hit_entity;
									ent_above_exists = true;
								}

								// Left and right entity will be threaten as above becase they do not require ant extra logic like plant clearence
								if ( !ent_above_exists )
								{
									sdWorld.last_hit_entity = null;
									if ( !ent.CanMoveWithoutOverlap( x - 16, y, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural ) ) )
									{
										ent_above = sdWorld.last_hit_entity;
										ent_above_exists = true;
									}
									sdWorld.last_hit_entity = null;
									if ( !ent.CanMoveWithoutOverlap( x + 16, y, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural ) ) )
									{
										ent_above = sdWorld.last_hit_entity;
										ent_above_exists = true;
									}
								}

								if ( ent_above_exists || ent_below_exists )
								{
									let bg_nature = true; // Or nothing or world border
									let bg_nature_ent = null;

									sdWorld.last_hit_entity = null;
									if ( sdWorld.CheckWallExistsBox( x+1, y+1, x + 16-1, y + 16-1, null, null, [ 'sdBG' ], null ) )
									if ( sdWorld.last_hit_entity )
									{
										if ( sdWorld.last_hit_entity.material !== sdBG.MATERIAL_GROUND )
										{
											bg_nature = false;
										}
										else
										{
											bg_nature_ent = sdWorld.last_hit_entity;
										}
									}

									if ( bg_nature )
									{
										function ClearPlants()
										{
											if ( bg_nature_ent )
											bg_nature_ent.remove();

											if ( ent_below_exists )
											if ( ent_below )
											if ( ent_below._plants )
											{
												for ( let i = 0; i < ent_below._plants.length; i++ )
												{
													//let plant = sdEntity.entities_by_net_id_cache[ ent_below._plants[ i ] ];
													let plant = sdEntity.entities_by_net_id_cache_map.get( ent_below._plants[ i ] );
													if ( plant )
													plant.remove();
												}
												ent_below._plants = null;
											}
										}

										let xx = Math.floor( x / 16 );
										let from_y = sdWorld.GetGroundElevation( xx );

										if ( y >= from_y )
										{
											let r = sdWorld.FillGroundQuad( x, y, from_y, false, true );

											if ( r )
											ClearPlants();

											// Delete temp block on success
											//ent.remove();
											break;
										}
										else
										if ( y === from_y - 8 )
										{
											y += 8;
											let r = sdWorld.FillGroundQuad( x, y, from_y, true, true );

											if ( r )
											ClearPlants();

											// Delete temp block on success
											//ent.remove();
											break;
										}
										else
										{
											//debugger;
										}


									}
								}


							}
						}
						else
						if ( sdWeather.last_crystal_near_quake )
						{
							sdWorld.last_hit_entity = null;
							if ( sdWorld.CheckWallExistsBox( x - 4, y + 4, x+16 + 4, y+16 + 4, null, null, [ 'sdBlock' ] ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural ) )  )
							{
								//sdWeather.last_crystal_near_quake.DamageWithEffect( 15 );
								if ( sdWeather.last_crystal_near_quake.IsTargetable( this ) )
								sdWeather.last_crystal_near_quake.DamageWithEffect( 20 );
							}
						}

						tr--;
						if ( tr < 0 )
						{
							//ent.remove();
							break;
						}
					} while( true );
				}
				
				//ent.onRemove = ent.onRemoveAsFakeEntity; // Disable any removal logic
				ent.SetMethod( 'onRemove', ent.onRemoveAsFakeEntity ); // Disable any removal logic BUT without making .onRemove method appearing in network snapshot
				ent.remove();
				ent._remove();
			}
			
			if ( !this.air )
			{
				this._no_air_duration -= GSPEED;
				
				if ( this._no_air_duration <= 0 )
				this.air = 1;
				
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Create the tasks
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'DIRTY_AIR', 
						executer: sdWorld.sockets[ i ].character,
						mission: sdTask.MISSION_TIMED_NOTIFICATION,
						difficulty: 0.1,
						title: 'Low oxygen concentration in air',
						time_left: this._no_air_duration,
						description: 'Oxygen concentraion in atmosphere is getting low - we advice you to stay near oxygen sources, base shielding units or inside vehicles.',
					});
				}
			}
			
			//this._time_until_event = 0; // Hack
			
			this._time_until_event -= GSPEED;
			if ( this._time_until_event < 0 )
			{
				//this._time_until_event = Math.random() * 30 * 60 * 8; // once in an ~4 minutes (was 8 but more event kinds = less events sort of)
				//this._time_until_event = Math.random() * 30 * 60 * 3; // Changed after sdWeather logic was being called twice, which caused events to happen twice as frequently
				this._time_until_event = Math.random() * 30 * 60 * 3 * ( 3 / 2 ); // Changed after introducing "daily events" since there is only up to 7 events that can happen to prevent them overflowing the map for new players
				/*let allowed_event_ids = ( sdWorld.server_config.GetAllowedWorldEvents ? sdWorld.server_config.GetAllowedWorldEvents() : undefined ) || [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
				
				let disallowed_ones = ( sdWorld.server_config.GetDisallowedWorldEvents ? sdWorld.server_config.GetDisallowedWorldEvents() : [] );
				
				//allowed_event_ids = [ 8 ]; // Hack
				
				for ( let d = 0; d < allowed_event_ids.length; d++ )
				if ( disallowed_ones.indexOf( allowed_event_ids[ d ] ) !== -1 )
				{
					allowed_event_ids.splice( d, 1 );
					d--;
					continue;
				}*/

				let allowed_event_ids = this._daily_events;
				if ( allowed_event_ids.length > 0 )
				{
					let r = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
					this.ExecuteEvent( r );
				}
			}
		}
		else
		{
			//this._rain_offset = ( this._rain_offset + GSPEED ) % 32;
			
			sdWorld.world_bounds.x1 = this.x1;
			sdWorld.world_bounds.y1 = this.y1;
			sdWorld.world_bounds.x2 = this.x2;
			sdWorld.world_bounds.y2 = this.y2;
			
			//if ( this.air )
			if ( !sdWorld.my_entity || sdWorld.my_entity._can_breathe )
			this._dustiness = Math.max( 0, this._dustiness - GSPEED * 0.01 );
			else
			this._dustiness = Math.min( 1, this._dustiness + GSPEED * 0.01 );
		}
	}
	static CrystalRemovalByEearthquakeFilter( ent )
	{
		if ( ent )
		//if ( ent.is( sdCrystal ) )
		if ( !ent._natural )
		if ( ent.IsTargetable() )
		{
			sdWeather.last_crystal_near_quake = ent;
			//return false;
		}
		
		return true;
	}
	Draw( ctx, attached )
	{
		ctx.translate( -this.x, -this.y ); // sdWeather does move now just so it is kept inisde of world bounds and not gets removed with old areas
		//
		//ctx.translate( Math.floor(( sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale )/32)*32, 
		//               Math.floor(( sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale )/32)*32 );
		
		/*
		for ( var x = 0; x < sdRenderer.screen_width; x += 32 )
		for ( var y = 0; y < sdRenderer.screen_height; y += 32 )
		{
		    ctx.drawImage( sdWeather.img_rain, 
		        x - 16 + ( ( y % 32 < 16 ) ? 16 : 0 ), 
		        y - 16 + ( sdWorld.time % 32 ), 
		        32,32 );
	    }*/
		
		if ( this.raining_intensity > 0 )
		{
			ctx.globalAlpha = Math.pow( this.raining_intensity / 50, 1 );
			if ( this.matter_rain === 1 || this.matter_rain === 2 ) // Is it raining crystal shards?
			{
				ctx.globalAlpha = 1;
				if ( this.matter_rain === 2 )
				ctx.filter = sdWorld.GetCrystalHue( sdCrystal.anticrystal_value );
			}
			for ( var i = 0; i < sdWeather.pattern.length * this.raining_intensity / 100; i++ )
			{
				var p = sdWeather.pattern[ i ];
				
				var xx;
				var yy;

				if ( this.snow )
				{
					xx = sdWorld.mod( p.x * sdRenderer.screen_width + Math.sin( ( sdWorld.time * 0.001 + i ) )  * 5 - sdWorld.camera.x, sdRenderer.screen_width ) + sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale;
				    yy = sdWorld.mod( p.y * sdRenderer.screen_height + ( sdWorld.time * 0.01 ) - sdWorld.camera.y, sdRenderer.screen_height ) + sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale;
				}
				else
				{
					xx = sdWorld.mod( p.x * sdRenderer.screen_width - sdWorld.camera.x, sdRenderer.screen_width ) + sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale;
				    yy = sdWorld.mod( p.y * sdRenderer.screen_height + ( sdWorld.time * 0.3 ) - sdWorld.camera.y, sdRenderer.screen_height ) + sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale;
				}
				
				var just_one_step_check = ( Math.random() > 0.1 && p.last_y < yy && Math.abs( p.last_x - xx ) < 100 );

				p.last_x = xx;
				p.last_y = yy;

				if ( just_one_step_check )
				{
					if ( p.last_vis )
					{
						p.last_vis = this.TraceDamagePossibleHere( xx, yy, 2 );
						if ( !this.snow )
						if ( !this.matter_rain )
						if ( this.raining_intensity >= 30 )
						if ( !p.last_vis )
						{
						    let e;
							
					        if ( this.acid_rain )
						    e = new sdEffect({ x:xx, y:yy, type:sdEffect.TYPE_BLOOD_GREEN, filter:'opacity('+(~~((ctx.globalAlpha * 0.5)*10))/10+')' });
						    else
						    e = new sdEffect({ x:xx, y:yy, type:sdEffect.TYPE_BLOOD_GREEN, filter:'hue-rotate(90deg) opacity('+(~~((ctx.globalAlpha * 0.5)*10))/10+')' });
						
						    sdEntity.entities.push( e );
						}
					}
				}
				else
				p.last_vis = this.TraceDamagePossibleHere( xx, yy, Infinity );

				var vis = p.last_vis;

				if ( vis )
				{
					if ( this.snow )
					{
						ctx.drawImageFilterCache( sdWeather.img_snow, 
						xx - 16, 
						yy - 16, 
						32,32 );
					}
					else
					if ( this.acid_rain )
					ctx.drawImageFilterCache( sdWeather.img_rain, 
						xx - 16, 
						yy - 16, 
						32,32 );
					else
					if ( this.matter_rain === 1 || this.matter_rain === 2 )
					ctx.drawImageFilterCache( sdWeather.img_crystal_shard, 
						xx - 16, 
						yy - 16, 
						32,32 );
					else
					ctx.drawImageFilterCache( sdWeather.img_rain_water, 
						xx - 16, 
						yy - 16, 
						32,32 );
				}
			}
			ctx.globalAlpha = 1;
			ctx.filter = 'none';
		}
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( sdWeather.only_instance === this )
		sdWeather.only_instance = null;
	}
}
//sdWeather.init_class();

export default sdWeather;
