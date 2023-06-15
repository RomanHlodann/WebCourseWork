const bind = (func, thisArg) => thisArg ? func.bind(thisArg) : func;

Map.prototype.map = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	const map = new Map();
	for(let [k, v] of this) {
		map.set(k, callback(v, k, this));
	}
	return map;
};

Map.prototype.filter = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	const map = new Map();
	for(let [k, v] of this) {
		if(callback(v, k, this)) map.set(k, v);
	}
	return map;
};

Map.prototype.find = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	for(let [k, v] of this) {
		if(callback(v, k, this)) return k;
	}
};

Map.prototype.every = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	for(let [k, v] of this) {
		if(!callback(v, k, this)) return false;
	}
	return true;
};

Map.prototype.some = function(callback, thisArg) {
	callback = bind(callback, thisArg);
	for(let [k, v] of this) {
		if(callback(v, k, this)) return true;
	}
	return false;
};

