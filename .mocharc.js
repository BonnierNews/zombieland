module.exports = {
	recursive: true,
	extension: [ 'js' ],
	spec: [ '**/*-test.js', 'examples/*/test.js' ],
	ui: 'mocha-cakes-2',
	'node-option': [ 'experimental-vm-modules', 'no-warnings' ],
};
