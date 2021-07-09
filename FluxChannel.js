
const EventEmitter = require('events');

class FluxChannel extends EventEmitter {

	constructor(flux, id, channel, message){
		super();

		this.flux = flux;
		this.CP = 1;

		if (channel === false)
			this.create(id, message);
		else {
			this.id = id;
			this.c = channel;
			this.name = this.c.name;
		}
	}

	get 
	isNew(){
		return this.c.createdTimestamp > new Date().getTime() - this.flux.PTic;
	}

	async create(title,m){
		await this.flux.log('creating channel: '+title, true);

		this.c = await this.flux.flux_channels[0].c.clone({name:title})
			.catch(e=>this.errorWith('createChannel',e,m,true));

		this.id = this.c.id;
		this.name = title;

		m.giveFeedback(`created channel: ${this.c}`);
		this.flux.public_log(`new channel: ${this.c}`);

		await this.flux.log('done creating channel: '+title, true);
	}
	//wrapp: create new in this.flux.flux_category instead of cloning

	async kill(m){
		let trace = m ? m.id : 'manual/scheduled';
		await this.flux.log(`killing channel ${this.name} (${trace})`,true);

		await this.c.delete()
			.catch(e => this.flux.errorWith('delete channel',e,m,true));
		this.flux.flux_channels.splice(this.flux.flux_channels.indexOf(this),1);

		if(m)
			this.flux.public_log(`killed channel: ${this.name}`);

		await this.flux.log(`killed channel ${this.name} (${trace})`,true);
	}

}

module.exports = FluxChannel;

