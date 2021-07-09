const EventEmitter = require('events');

class AuraBday extends EventEmitter {

	constructor(flux){
		super();
		this.flux = flux;

		this.abd_channel = flux.discord.channels.resolve(flux.__abd_channel);
		this.abd_user = flux.flux_members.filter(m => m.id == flux.__abd_user)[0];

		this.abd_content = [
			"https://i.redd.it/v9409t6wdk331.jpg",
			"Throwback to our first selfie. You cute piece o shit https://media.discordapp.net/attachments/598429975791796244/742240788175650856/IMG_20200731_111029.jpg",
			"https://i.redd.it/p9in03an9ew21.jpg",
			"A hokey boomerology resource has this to say of 29:\n\n> The Angels and Enlightened Masters are giving you the strength necessary to complete your task.\n\nAs well as some stuff about High Priestess(2) + Hermit(9) energy conspiring to manifest as Strength.(11)",
			"https://i.redd.it/wjqdl5s9n4r41.jpg",
			"Oh yeah happy birthday! I love you a bunch uwu\n\n",
			"https://i.redd.it/79w59tttpg441.jpg",
			"Holy shit dude you need to stop creepin' on me so I can farm content for this thing though",
			"https://i.redd.it/t42zks58mzg31.jpg",
			"I love seeing you pursue the shit you're into and resurfacing all glowy <3",
			"https://i.redd.it/79gzccg1oze41.jpg",
			"You've always got the right grounding knowledge + experience. Your heart and mind are top tier shinies",
			"https://i.redd.it/by6hr21pvr621.jpg",
			"u r a bean + i l u",
			"https://i.imgur.com/kCg7uBE.jpg",
			"beat me mommy :pleading:",
			"https://i.redd.it/lt87cpi95h751.jpg",
			"don't forget to update your age tag on Dreamers lmao",
			"https://i.redd.it/fog2h4oj5qi21.jpg",
			"throwback to summer afternoons in the park to take a break from sweating our balls off in your basement",
			"https://i.redd.it/r1jwrvmsnxb41.jpg",
			"u dabes",
			"https://i.redd.it/gxv07awgwd941.png",
			"https://cdn.ebaumsworld.com/2019/05/31/031255/85975466/best_happy_birthday_meme_6.jpg",
			"lmao I can't even imagine being as old as you rn",
			"you should try dabbing again it's never too late to get the hang of it\n\nhttps://media.tenor.co/videos/dfdd772f99a1382b7aa97131f78178c9/mp4",
			"I want you to know that when I wrote this spammer I added a feature so I can keep stuffing content into it on the fly + it'll get to all of it within your birthday, so if the memes are accelerating, that's why"
		];

		this.abd_index = 0;
		this.abd_interval = Math.floor(1000*60*60*24/this.abd_content.length);
		this.time_since_start = 0;

		let self = this;
		this.routine = setInterval(() => self.sendMessage(), this.abd_interval);
	}

	sendMessage(){

		//flux.log("test: "+content+"\n\n"+this.abd_user.m+"\n\n next test in "+this.abd_interval, true);

		let content = this.abd_content[this.abd_index];
		
		if (content.startsWith("http")){
			this.abd_channel.send(`${this.abd_user.m} ${this.abd_interval}`, {embed:{image:{url:content}}});
		} else {
			this.abd_channel.send(`${this.abd_user.m}\n\n${content}`);
		}

		this.time_since_start += this.abd_interval;
		this.abd_index++;
		if (this.abd_index > this.abd_content.length)
			clearInterval(this.routine);

	}

	addContent(content){
		this.abd_content.push(content);
		this.adjustInterval();
	}

	adjustInterval(){
		let timeRemaining = (1000*60*60*24) - this.flux.elapsed;
		let itemsRemaining = this.abd_content.length - this.abd_index;
		this.abd_interval = Math.floor(timeRemaining/itemsRemaining);

		clearInterval(this.routine);
		let self = this;
		this.routine = setInterval(() => self.sendMessage(), this.abd_interval);
	}















































}

module.exports = AuraBday;