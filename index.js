

module.exports = {
	...require('jsdom'),
	...require('./lib/tallahassee'),
	...require('./lib/little-rock'),
	...require('./lib/wichita'),
};
