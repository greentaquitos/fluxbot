const EventEmitter = require('events');

class TaqLazy extends EventEmitter {

	constructor(flux){
		super();
		this.flux = flux;

		this.taq = flux.flux_members.filter(m => m.id == flux.__taq)[0];

		this.taqStatus = 'busy';
		this.lastTaq = 0;

		let self = this;
		
		//flux.discord.on('presenceUpdate', (oldP,newP) => self.onPresenceUpdate(oldP, newP, self));
		//flux.discord.on('message', msg => self.onMessage(msg, self));

		flux.discord.on('presenceUpdate', (oldP,newP) => {
			if (
				newP.member.id == self.taq.id 
				&& newP.status != "offline"
				&& self.lastTaq < self.flux.elapsed - 10000
				&& (self.taqStatus == 'busy' || self.lastTaq < self.flux.elapsed - (1000*60*60*4))
			){
				newP.member.send("You fuckin off?");
				self.lastTaq = self.flux.elapsed;
				self.taqStatus = 'busy';
			}
		});

		flux.discord.on('message', msg => {
			if (msg.author.id == self.taq.id){
				if (msg.guild === null)
					self.taqStatus = 'cooldown';
				else if (
					self.lastTaq < self.flux.elapsed - 10000 &&
					(self.taqStatus == 'busy' || self.lastTaq < self.flux.elapsed - (1000*60*60*4))
				){
					self.taq.m.send("bruh");
					self.taqStatus = 'busy';
					self.lastTaq = self.flux.elapsed;
				}
			}
		});

	}

}

module.exports = TaqLazy;