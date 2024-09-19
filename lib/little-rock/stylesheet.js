

const specificity = require('specificity');

module.exports = class Stylesheet {
	rules = [];
	ruleSheet = {};

	constructor (...ruleSets) {
		this.add(...ruleSets);
	}

	add (...ruleSets) {
		Object.assign(this.ruleSheet, ...ruleSets);
		this.rules.length = 0;

		for (const [ selectorList, styles ] of Object.entries(this.ruleSheet)) {
			for (const selector of selectorList.split(',')) {
				this.rules.push([ selector, styles ]);
			}
		}
	}

	getMatchingStyles (element) {
		if (!element.nodeName) return [];
		return this.rules
			.filter(([ selector ]) => element.matches(selector))
			.map(([ selector, styles ]) => [ specificity.calculate(selector), styles ])
			.sort(([ selA ], [ selB ]) => specificity.compare(selA, selB))
			.map(([ , styles ]) => styles);
	}
};
