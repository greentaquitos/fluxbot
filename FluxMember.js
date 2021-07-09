const EventEmitter = require('events');

class FluxMember extends EventEmitter {

	constructor(flux, member) {
		super();

		this.flux = flux;
		this.m = member;
		this.inactive = false;
		this.id = this.m.id;
		this.name = this.m.user.username;

	}

	set
	Q(x){
		if(x < 0){
			x = 0;
			this.inactive = true;
			this.flux.log('Marked '+this.m.user.username+' as inactive');
		}
		this._Q = x;
	}

	get
	Q(){
		if (!this.hasOwnProperty('_Q'))
			this._Q = 1;
		return this._Q;
	}

	get
	in_flux(){
		return this.m.roles.cache.has(this.flux.__flux_role);
	}

	get
	in_q(){
		return this.m.roles.cache.has(this.flux.__q_role);
	}

	kick(){
		this.m.roles.remove(this.flux.__flux_role);
	}

	recruit(){
		this.m.roles.add(this.flux.__flux_role);
		this.m.roles.remove(this.flux.__q_role);
	}

}

module.exports = FluxMember;
