module.exports = {
	recursive: true,
	extension: [ 'js' ],
	spec: [ '**/*-test.js', 'test/examples/*/test.js' ],
	ui: 'mocha-cakes-2',
	'node-option': [ 'experimental-vm-modules', 'no-warnings' ],
};
