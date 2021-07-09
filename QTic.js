
const EventEmitter = require('events');

class QTic extends EventEmitter {

	constructor(flux, oldQTic){
		super();

		this.flux = flux;
		this.sequence = oldQTic.sequence + 1;
		this.PTic = oldQTic.elapsed;
		this.start_time = new Date().getTime();
		this.member_count = this.flux.flux_members.filter(m => m.in_flux).length

		this.decayQ();
		this.expired = this.flux.flux_members.filter(m => m.inactive);
		this.noobies = this.selectAdditions();
		this.resolveMembership();
		this.meltChannels();

		this.HTics = (this.expired.length+1) * this.member_count;
		this.flux.QTics.push(this);

		this.postReport();
		this.cleanup();
	}

	get
	elapsed(){
		return new Date().getTime() - this.start_time;
	}

	get
	add_amount(){
		let adds = ((this.expired.length+1)**2) + this.expired.length + 1 - this.member_count;
		adds = adds > 0 ? adds : 0;
		adds++;
		return adds;
	}

	decayQ(){
		this.flux.flux_members.forEach(m => m.Q--);
	}

	selectAdditions(){
		let noobies = [];
		let potentials = this.flux.flux_members.filter(m => m.in_q || m.inactive);

		this.shuffle(potentials);
		for (var i=0; i<this.add_amount && i <potentials.length; i++){
			let m = potentials[i];
			if (m.inactive)
				m.inactive = false;
			else
				noobies.push(m);
		}
		return noobies;
	}

	resolveMembership(){
		this.kicked = this.expired.filter(m => m.inactive);
		this.kicked.forEach(m => m.kick());
		this.noobies.forEach(m => m.recruit());
	}
	
	meltChannels(){
		this.meltable_channels = this.flux.flux_channels.filter(c => c.CP < -1*this.member_count/this.flux.flux_channels.length).sort((a,b) => a.CP - b.CP);
		if(this.meltable_channels.length == this.flux.flux_channels.length)
			this.meltable_channels.pop();
		this.meltable_channels.forEach(c => c.kill());
	}

	saveData(){
		
	}

	postReport(){

		let report = {
			'title': `DYNAMIC SEQUENCE ${this.sequence}`,
			'description': ``,
			'color': this.flux.color,
			'fields': [
				{
					'name': 'ENTROPY COEFFICIENT',
					'value': Math.round(100000000000/this.PTic)/100
				},
				{
					'name': 'AGITATION CAPACITY',
					'value': this.HTics
				},
				{
					'name': 'ACCRUEMENT RATING',
					'value': this.noobies.length+'/'+this.add_amount
				},
				{
					'name': 'FLUX FULFILLMENT',
					'value': this.member_count
				}
			]
		}

		let stuff = [this.expired, this.kicked, this.noobies, this.meltable_channels];
		stuff.forEach((v,i) => {
			let name = ['UNINSTRUMENTAL', 'EXFLUXUATED', 'INFLUXUATED', 'COALESCED'][i];
			let data = v.map(m => m.name).join(', ');

			if(!data)
				return;
			if(data.length > 1024){
				let desc = `**${name}**\n${data}`;
				report.description += desc;
			} else {
				report['fields'].push({name:name,value:data});
			}
		});

		this.flux.public_log_channel.send('',{embed:report});

		let p_report = `
			QTic ${this.sequence}:\n
			PTic @ ${Math.round(this.PTic/1000)}\n
			HTic @ ${this.HTics}\n
			adds @ ${this.noobies.length}/${this.add_amount}
			mems @ ${this.member_count}
			exps @ ${this.expired.length}
			kiks @ ${this.kicked.length}
			melt @ ${this.meltable_channels.length}
		`;

		this.flux.log(p_report, true);
	}

	shuffle(array) {
	    for (let i = array.length - 1; i > 0; i--) {
	        const j = Math.floor(Math.random() * (i + 1));
	        [array[i], array[j]] = [array[j], array[i]];
	    }
	}

	cleanup(){
		this.expired.forEach(e => e.inactive = false);
	}

}

module.exports = QTic;

