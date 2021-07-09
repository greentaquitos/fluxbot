"use strict";

const config = require('./config');
const Discord = require('discord.js');
const EventEmitter = require('events');
const Community = require('./Community');
const TimeAgo = require('javascript-time-ago');
const en = require('javascript-time-ago/locale/en');
const chrono = require('chrono-node');
const { GoogleSpreadsheet } = require('google-spreadsheet');
//const sqlite3 = require('sqlite3');


/* 
	todo: 
	
	move config out of here, pass to constructor

*/


/* 
	The Bot

	(extends eventemitter for groovy object syntax)
	(on/off/once reserved) 
*/
class Waqbot extends EventEmitter {

	constructor(){
		super();

		// set up TimeAgo
		TimeAgo.addLocale(en);
		this.timeAgo = new TimeAgo('en-US');

		// set up chrono
		this.chrono = chrono;

		// start the clock
		this.start_time = new Date().getTime();
		this.log('Starting up...');

		// integrate general config into this instance
		Object.assign(this, config.waq);

		// log in to discord
		this.discordInit();
		
		// instantiate all communities
		this.communities = this.communities.map( c => {return new Community(this, c, config[c]);} );

		// collection of caught messages
		this.messages = new Map();

		// spreadsheet reader
		this.sheetsInit();

	}

	/*** PROPERTIES ***/

	// whether the discord client is useable

	set 
	discord_ready(a){
		this._discord_ready = a;
		if (a)
			this.readyUp('Discord', this.discord.user.username);
	}

	get 
	discord_ready(){ return this._discord_ready; }

	// whether ALL integrations of this and children are ready -- all of waqbot is useable

	get 
	ready(){ return this.discord_ready && this.communities.every( c =>{return c.ready} ); }

	// milliseconds since constructor called

	get 
	elapsed(){ return new Date().getTime() - this.start_time }

	// random version-looking-thing for this instance of waqbot

	get 
	version(){ 
		if (!this.hasOwnProperty('_version'))
			this._version = 'v0'+Math.floor(Math.random()*10)+'.'+Math.floor(Math.random()*1000);
		return this._version;
	}

	// all channels approved for general fun

	get
	whitelist(){
		if (!this.hasOwnProperty('_whitelist'))
			this._whitelist = this.communities.reduce( (w, c) => {w.push(...c.channels.whitelist); return w;}, [] );
		return this._whitelist;
	}

	// random color for embeds

	get
	color(){
		return Math.floor(Math.random()*16777216);
	}

	/*** UTILITIES ***/

	random_word(params){
		let defaults = {
			part_of_speech: this.rand(['noun','adjective','verb']),
			alliterative: null, easy_plural: false, singular: false, present: false, mno: undefined
		};

		var p = Object.assign(defaults, params);

		if ( 	(p.part_of_speech == 'noun' && Math.random() < 5/6) || 
				(p.part_of_speech == 'adjective' && Math.random() < 1/4) )
			var word_list = this.bunch_o_words;
		else
			var word_list = this[p.part_of_speech+'s'];

		let word = this.rand(word_list);
		let attempts = 0;
		while(	(p.alliterative && (
					word[0] != p.alliterative[0] || 
					(p.alliterative[1] == 'h' && word[1] != 'h')
				)) ||

				(p.easy_plural &&
					['y','s'].includes(word[word.length-1])
				) ||

				(p.singular &&
					word[word.length-1] == 's'
				) ||

				(p.present && (
					word[word.length-1] == 's' ||
					word.slice(word.length-3) == 'ing' ||
					word.slice(word.length-2) == 'ed'
				)) ||

				(p.part_of_speech == 'adverb' && word.slice(word.length-2) != 'ly')
			)
		{
			word = this.rand(word_list);
			attempts++;
			if (attempts > 3000){
				word = {
					noun: 'stuff',
					adjective: 'real',
					verb: 'do',
					adverb: 'indeed'
				}[p.part_of_speech];
				break;
			}
		}
		return word;
	}

	// format msg for logging

	msg(msg){
		return "WAQBOT "+this.version+" @ ["+this.elapsed+"]: \n "+msg;
	}

	// custom logging w/ elapsed time

	log(msg,ret){
		if(ret) return {payload: this.msg(msg)};
		console.log(this.msg(msg));
	}

	// custom error w/ elapsed time

	error(msg,ret){
		if(ret) return {payload: this.msg(msg)};
		console.error(this.msg(msg));
	}

	//get random element of Array arr

	rand(arr){
		return arr[Math.floor(Math.random() * arr.length)];
	}

	shuffle(a) {
	    var j, x, i;
	    for (i = a.length - 1; i > 0; i--) {
	        j = Math.floor(Math.random() * (i + 1));
	        x = a[i];
	        a[i] = a[j];
	        a[j] = x;
	    }
	    return a;
	}

	/*** REAL SHIT ***/

	// log in to discord

	discordInit(){
		this.discord = new Discord.Client();
		this.discord.once( 'ready', () => {this.discord_ready = true;} );
		this.discord.login( this.discord_token );
		this.flake = Discord.SnowflakeUtil;
	}

	// set up spreadsheets

	async sheetInit(name, id){
		let sheet = new GoogleSpreadsheet(id);

		await sheet.useServiceAccountAuth(require('./resources/spreadcreds.json'));
		await sheet.loadInfo();

		this[name+'_gs'] = sheet;
		this[name+'_ready'] = true;
	}

	sheetsInit(){
		this.sheetInit('flairs', '1mpY_W13F1DO00tcZb5ZvOAWd6fFlm2OeiOA1yn3WzmU');
		this.sheetInit('users', '1mThY_GJYZTXk2yvSOykf1K11i0WXNTZpfkdp7KlaScY');
	}

	async getThemes(){
		// make forbidden list -- later

		let sheet = this.flairs_gs.sheetsByIndex[0];
		await sheet.loadCells();

		let cols = [];
		for (var c=0; c<sheet.columnCount; c++){
			let col = {cells: []};
			for(var r=0; r<sheet.rowCount; r++){
				let cell = sheet.getCell(r,c);
				if(cell.value){
					if (r == 0)
						col.name = cell.value;
					if (r == 1)
						col.weight = cell.value;
					if (r > 1)
						col.cells.push(cell.value);
				} else
					break;
			}
			if (col.cells.length > 99)
				cols.push(col);
		}

		this.themes = cols;
	}

	async getUsers(id){
		let guild = id == 0 ? '162069104658874369' : '421976116698415104';
		let sheet = this.users_gs.sheetsByIndex[id];
		let rows = await sheet.getRows();

		let users = rows.map(row => {
			return {
				slot: row['reddit slot'], 
				reddit: row.reddit, 
				discord: row.discord,
				old_roles: row['roles when last alive'],
				status: row['alive?'] == 'Yes' ? 'member' : 'ded',
				guild: guild
			}
		});

		this.users_from_gs = users;

		return users;
	}

	pickTheme(){
		// build theme list using weights
		// pick one
	}

	// a (c)omponent is ready, see if they all are

	readyUp(c, name){
		this.log(c + ' ready' + (name ? ' as ' + name : '') + '!');
		if (this.ready) 
			this.begin();
	}

	// start waqbot

	begin(){
		this.log('All systems go!');
		this.emit('begin');
	}

	// send out necessary cloneable discord message bits

	processMessage(m){
		for (var key of this.messages.keys())
			if (this.messages.size > 100)
				this.messages.delete(key);

		this.messages.set(m.id, m);

		var guild_id = m.channel.type == 'text' ? m.guild.id : m.channel.type;
		var attachment = m.attachments.size > 0 ? m.attachments.first() : null;
		attachment = attachment && attachment.width ? attachment.url : null;

		return {id:m.id, content:m.content, channel_id:m.channel.id, bot:m.author.bot, guild_id:guild_id, author_id:m.author.id, attachment:attachment};
	}

	makePicPost(file, author, anon, display_id, caption){
		var extension = file.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)[1];
		var embed = {
	        image: { url: "attachment://file."+extension },
	        author: { name: '#'+display_id, icon_url: 'https://cdn.discordapp.com/emojis/555620424571027476.png?v=1' },
	        color: this.color,
	        files: [{
	            attachment: file,
	            name: 'file.'+extension
	        }]
	    };
	    if (author){
	        embed.author.icon_url = author.avatarURL;
	        embed.description = '> posted by '+author;
	    } else if (anon) {
	        embed.description = '> posted anonymously'
	    }
	    if (caption)
	        embed.footer = { text: caption };

	    return embed;
	}

	// accepts natural language string
		// 'now' for most recent noon utc
		// otherwise noon UTC on specified date
	bookingDate(d){

		if (d == 'now'){
			d = new Date();
			if (d.getUTCHours() < 12)
				d.setUTCDate(d.getUTCDate()-1);

		} else {
			if (typeof(d) == 'string')
				d = this.chrono.parseDate(d,new Date(),{forwardDate:true});
			if ( d == null )
				return d;
		}

		d.setUTCHours(12,0,0,0);
		return d;

	}

	durationCounter(duration,start){
		var hour = 1000*60*60;
		var day = hour*24;
		var now = new Date().valueOf();
		var counter = '[';
		for (var pointer=start+duration; pointer > start; pointer -= hour){
			if(pointer > now)
				counter += ':';
			else
				counter += '.';
			if ((pointer-start)%day==0 && pointer < start+duration)
				counter += '|';
		}
		counter += ']';
		return counter;
	}

}

module.exports = Waqbot;
