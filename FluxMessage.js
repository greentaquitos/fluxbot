const EventEmitter = require('events');

class FluxMessage extends EventEmitter {

	constructor(flux, message){
		super();

		this.m = message;
		this.flux = flux;
		this.id = this.m.id;

		this.process();
	}

	// PROPERTIES

	get 
	command(){
		if (!this.hasOwnProperty('_command'))
			this._command = {name:'createChannel', params:this.m.content.substring(7)};
		return this._command;
	}

	get
	flux_channel(){
		if (!this.hasOwnProperty('_flux_channel'))
			this._flux_channel = this.flux.flux_channels.find(c => c.id === this.m.channel.id);
		return this._flux_channel;
	}

	get
	in_bot_channel(){
		if (!this.hasOwnProperty('_in_bot_channel'))
			this._in_bot_channel = this.m.channel.id == flux.__bot_channel;
		return this._in_bot_channel;
	}

	get
	is_cold_message(){
		if (!this.hasOwnProperty('_is_cold_message')) {
			this._is_cold_message = !this.flux.flux_messages.some(msg => 
				msg.author_id === this.m.author.id && 
				msg.timestamp > this.m.createdTimestamp - this.flux.PTic &&
				msg.channel_id === this.m.channel.id &&
				msg.cold
			);
		}
		return this._is_cold_message;
	}

	get
	is_command(){
		if (!this.hasOwnProperty('_is_command'))
			this._is_command = this.m.content.startsWith('create ');
		return this._is_command;
	}

	get
	is_hot_message(){
		if (!this.hasOwnProperty('_is_hot_message')) {
			this.flux.log('PTic: '+this.flux.PTic);
			this._is_hot_message = !this.flux.flux_messages.some(msg => 
				msg.author_id === this.m.author.id && 
				msg.timestamp > this.m.createdTimestamp - this.flux.PTic &&
				msg.hot
			);
		}
		return this._is_hot_message;
	}

	set
	loading(x){
		if (x)
			this.m.react('764647043582525440');
		else
			this.m.reactions.removeAll();
	}

	// METHODS

	async process(){
		await this.flux.log('processing message '+this.m.id);

		if (this.in_bot_channel && this.is_command)
			await this.doCommand()
				.catch(e=>this.flux.errorWith('FM:doCommand',e,this,true));

		if (this.flux_channel)
			this.checkProcs();

		await this.flux.log('processed  message '+this.m.id);
	}

	async doCommand(){
		this.loading = true;

		let command = this.command;
		await this.flux[command.name](this, command.params);

		this.loading = false;
	}

	checkProcs(){
		if (this.is_cold_message){
			this.m.react('❄️');
			this.flux_channel.CP += 1;
		}

		if (this.is_hot_message){
			this.m.react('🔥');
			this.flux.flux_members.find(m => m.id == this.m.author.id).Q += 1;
			this.flux.beginHTic(false, this);
		}

		if (this.is_hot_message || this.is_cold_message)
			this.record();
	}

	record(){
		this.flux.flux_messages.push({
			author_id: this.m.author.id,
			timestamp: this.m.createdTimestamp,
			hot: this.is_hot_message,
			cold: this.is_cold_message,
			channel_id: this.m.channel.id
		});
	}

	giveFeedback(content){
		this.m.channel.send('',this.flux.msg(content));
	}

}

module.exports = FluxMessage;
