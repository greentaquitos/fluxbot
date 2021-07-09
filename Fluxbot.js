"use strict";

const config = require('./config');
const Discord = require('discord.js');
const EventEmitter = require('events');
const sqlite3 = require('sqlite3');
const FluxMessage = require('./FluxMessage');
const FluxChannel = require('./FluxChannel');
const FluxMember = require('./FluxMember');
const QTic = require('./QTic');
const AuraBday = require('./AuraBday');
const TaqLazy = require('./TaqLazy');


// FLUXBOT

// extends EventEmitter for groovy object syntax
// reserved: on/off/once

class Fluxbot extends EventEmitter {

	// INITIALIZATION

	constructor(){
		super();

		this.start_time = new Date().getTime();
		this.log('Starting up...')

		Object.assign(this, config.flux);

		this.initDiscord();
	}

	initDiscord(){
		this.discord = new Discord.Client();
		this.discord.once( 'ready', () => this.initData() );
		this.discord.login( this.__discord_token );
		this.flake = Discord.SnowflakeUtil;
	}

	async initData(){
		this.log('discord logged in as '+this.discord.user.username);

		this.guild = this.discord.guilds.resolve(this.__guild);
		this.flux_category = this.discord.channels.resolve(this.__flux_category);
		this.flux_channels = this.flux_category.children.map(c => new FluxChannel(this, c.id, c));
		this.log_channel = this.discord.channels.resolve(this.__log_channel);
		this.public_log_channel = this.discord.channels.resolve(this.__public_log_channel);
		this.sign_up_channel = this.discord.channels.resolve(this.__sign_up_channel);

		let m = await this.guild.members.fetch()
			.catch(e=>errorWith('get members'));
		this.flux_members = m.filter(m => !m.user.bot).map(m => new FluxMember(this, m));

		this.flux_messages = [];
		this.message_count = 0;
		this.QTics = [];

		// abd
		//this.AuraBday = new AuraBday(this);

		this.TaqLazy = new TaqLazy(this);
		
		/*
		this.QTic = new QTic(this, {sequence:0,elapsed:0});

		this.discord.on('message', m => this.onMessage(this, m));
		this.discord.on('messageReactionAdd', (mr, u) => this.onMessageReactionAdd(mr,u));
		this.discord.on('messageReactionRemove', (mr, u) => this.onMessageReactionRemove(mr,u));

		this.log('begun',true);
		*/
	}

	// PROPERTIES

	get
	channel_list_is_full(){
		return this.flux_channel_cap <= this.flux_channels.length;
	}

	get
	color(){
		return Math.floor(Math.random()*16777216);
	}

	get 
	elapsed(){ return new Date().getTime() - this.start_time }

	get 
	flux_channel_cap(){ return Math.floor(Math.sqrt(this.QTic.member_count))+1; }

	set
	HTics(x){
		if (x >= this.QTic.HTics){
			this._HTics = 0;
			this.beginQTic();
		} else 
			this._HTics = x;
	}

	get
	HTics(){
		if(!this.hasOwnProperty('_HTics'))
			this._HTics = 0;
		return this._HTics;
	}

	get 
	killable_channel(){
		let cooldown = new Date().getTime() - this.QTic.PTic;
		let channels = this.flux_channels.filter(c => !c.isNew && c.CP < 0);
		if (channels.length > 1)
			return channels.reduce((a,b) => a.CP<b.CP ? a:b)
		return false;
	}

	get
	PTic(){
		return this.QTic.PTic;
	}

	// UTILITY

	cleanChannelTitle(title){
		if (title.length < 2)
			return false;
		if (title.length > 100)
			return title.substring(0,98);
		return title;
	}

	async errorWith(p, e, m, chat){
		let t = "Error with "+p
		if (m) t += " ("+m.id+")";
		t += ":\n"+e;

		console.error(t);

		if (chat){
			if(m)
				m.giveFeedback(t);
			else
				this.log(t,true);
		}
	}

	async log(m, chat){
		console.log(m);
		if(chat){
			this.log_channel.send('',this.msg(m))
				.catch(e=>this.errorWith("log",e));
		}
	}

	async public_log(m){
		console.log(m);
		this.public_log_channel.send('',this.msg(m))
			.catch(e=>this.errorWith('public log',e));
	}

	msg(msg){
		return { embed: {
			'description': msg,
			'color': this.color
		} };
	}

	// EVENTS

	async onMessage(self, m){
		if (m.author.bot)
			return;
		self.message_count++;
		m = new FluxMessage(self, m);
	}

	// todo: this shit
	async onMessageReactionAdd(reaction, user){

	}

	async onMessageReactionRemove(reaction, user){

	}

	ensureRoleReact(){

	}

	async beginHTic(forced, msg){

		// ensure no overlap between tics
		if (this.HTicking && !forced){
			this.pendingHTics++;
			return;
		}
		this.HTicking = true;

		// do functional tic stuff
		this.decayC();
		await this.sortChannels()
			.catch(e=>this.errorWith("sort channels",e));
		this.HTics++;

		// report
		let report = {
			'description': `sequence update ${this.QTic.sequence}.${this.HTics}`,
			'fields': [
				{
					'name': 'groove potential',
					'value': `${this.flux_channel_cap - this.flux_channels.length}/${this.flux_channels.filter(c=>c.CP<0&&!c.isNew).length}`
				}
			]
		}
		this.public_log_channel.send('',{embed:report});

		// more speedproofing
		if (this.pendingHTics > 0){
			this.pendingHTics--;
			this.beginHTic(true, msg);
		} else {
			this.HTicking = false;	
		}
	}

	beginQTic(){
		this.QTic = new QTic(this, this.QTic);
	}

	decayC(){
		this.flux_channels.forEach(c => c.CP -= 1);
	}

	async sortChannels(){
		let order = this.flux_channels.sort((a,b) => {
			if (a.isNew && !b.isNew)
				return -1;
			if (!a.isNew && b.isNew)
				return 1;
			return b.CP - a.CP;
		});

		order = order.map((v, i) => ({channel:v.id, position:i}))

		await this.guild.setChannelPositions(order)
			.catch(e=>this.errorWith("set channel positions",e));

	}

	// COMMANDS

	async createChannel(m, title){
		await this.log('processing createChannel : '+title, true);

		if (this.channel_list_is_full)
			if(this.killable_channel)
				await this.killable_channel.kill(m)
					.catch(e=>this.errorWith("FC:kill",e,m,true));
			else {
				m.giveFeedback("channel list is full");
				return false;
			}

		title = this.cleanChannelTitle(title)

		if (!title){
			m.giveFeedback("invalid channel title");
			return false;
		}
		
		this.flux_channels.push(new FluxChannel(this,title,false,m));
	}

}
//todo: fix error handling

module.exports = Fluxbot;


/*

MEMBERS
status - q/flux/none (prescriptive -- update to none on leave)
qcount - 0 (set to qtics.last.sequence on flux membership, increment per hot message, subtract qtics.last_resolved.sequence to calculate Q)
discord_id


QTICS (insert per Q-tic)
duration - 0ms (most recent resolved is P-tic)
members - 0
sequence - 0 (1 + previous)
resolved - false (so we resolve them in order + increment the latest unresolved w/ htics to spare)
time_started
time_ended
time_resolved - 00:00:00 00/00/0000
htics_left - (start at kicks*members, decrement per H-tic)


ACTIONS
type - hot msg/cold msg/Q-tic/channel created/channel destroyed
time_resolved - 00:00:00 00/00/0000
member - id
channel - id
message - discord id


QTIC-MEMBERS-ADDED
joins qtics + members

QTIC-MEMBERS-REMOVED
joins qtics + members

QTIC-CHANNELS-REMOVED
joins qtics + channels

// -channels-added ? 
// -survived ? 


MESSAGES
qtic_id
member_id
channel_id
message_id
hot
cold


CHANNELS
cp - 0 (+1 per cold message)
created_by - member id
name - sdfsdf
description - sadfsdf
category - null
active - true/false


*/


