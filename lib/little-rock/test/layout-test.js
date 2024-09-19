

import assert from 'assert/strict';
import Layout from '../layout.js';

describe('Layout', () => {
	[
		[ 'scrollWidth', 'width' ],
		[ 'scrollHeight', 'height' ],
	].forEach(([ scrollSide, side ]) => {
		it(`.${scrollSide} is not less than .${side}`, () => {
			const layout = new Layout({ [scrollSide]: 90, [side]: 100 });
			assert.equal(layout[scrollSide], 100);
		});
	});

	[
		[ 'scrollX', 'scrollWidth', 'width' ],
		[ 'scrollY', 'scrollHeight', 'height' ],
	].forEach(([ scrollCoord, scrollSide, side ]) => {
		it(`.${scrollCoord} is not greater than .${scrollSide} - .${side}`, () => {
			const layout = new Layout({ [scrollCoord]: 60, [scrollSide]: 150, [side]: 100 });
			assert.equal(layout[scrollCoord], 50);
		});
	});

	[
		'left',
		'top',
		'right',
		'bottom',
	].forEach(prop => {
		it(`.${prop} is not set from styles`, () => {
			const layout = new Layout({ [prop]: 1 });
			assert.equal(layout[prop], 0);
		});
	});

	[
		[ 'left', 'x', 'width' ],
		[ 'top', 'y', 'height' ],
	].forEach(([ alias, coord, side ]) => {
		it(`.${alias} matches .${coord}`, () => {
			const layout = new Layout({ [coord]: 10 });
			assert.equal(layout[alias], 10);
		});

		it(`.${alias} is product of .${coord} + .${side}`, () => {
			const layout = new Layout({ [coord]: 10, [side]: -100 });
			assert.equal(layout[alias], -90);
		});
	});

	[
		[ 'right', 'x', 'width' ],
		[ 'bottom', 'y', 'height' ],
	].forEach(([ prop, coord, side ]) => {
		it(`.${prop} matches .${coord} + .${side}`, () => {
			const layout = new Layout({ [coord]: 10, [side]: 100 });
			assert.equal(layout[prop], 110);
		});

		it(`.${prop} is not less than .${coord}`, () => {
			const layout = new Layout({ [coord]: 10, [side]: -100 });
			assert.equal(layout[prop], 10);
		});
	});
});
