const bind = (func, thisArg) => thisArg ? func.bind(thisArg) : func;

Set.prototype.map = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	const set = new Set();
	for(let i of this) {
		set.add(callback(i, this));
	}
	return set;
};

Set.prototype.filter = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	const set = new Set();
	for(let i of this) {
		if(callback(i, this)) set.add(i);
	}
	return set;
};

Set.prototype.find = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	for(let i of this) {
		if(callback(i, this)) return i;
	}
};

Set.prototype.every = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	for(let i of this) {
		if(!callback(i, this)) return false;
	}
	return true;
};

Set.prototype.some = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	for(let i of this) {
		if(callback(i, this)) return true;
	}
	return false;
};

