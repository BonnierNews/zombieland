import globals from 'globals';
import js from '@eslint/js';

export default [
	{
		ignores: [
			'examples/**/*.mjs'
		],
		languageOptions: {
			globals: globals.node,
		},
	},
	{
		rules: {
			...js.configs.recommended.rules,
			'array-bracket-spacing': [ 1, 'always' ],
			'arrow-parens': [ 1, 'as-needed' ],
			'arrow-spacing': 1,
			'brace-style': [ 1, 'stroustrup', { allowSingleLine: false } ],
			'camelcase': 1,
			'comma-spacing': 1,
			'dot-notation': [ 1, { allowKeywords: true } ],
			'eol-last': 1,
			'eqeqeq': 2,
			'func-call-spacing': 1,
			'handle-callback-err': 2,
			'indent': [ 1, 'tab', { SwitchCase: 1, MemberExpression: 1 } ],
			'key-spacing': 1,
			'keyword-spacing': 1,
			'new-cap': [ 1, { capIsNew: false } ],
			'no-alert': 2,
			'no-array-constructor': 1,
			'no-case-declarations': 0,
			'no-console': 1,
			'no-duplicate-imports': 1,
			'no-eval': 2,
			'no-extend-native': 2,
			'no-extra-bind': 1,
			'no-extra-parens': [ 1, 'functions' ],
			'no-implied-eval': 2,
			'no-label-var': 2,
			'no-labels': 2,
			'no-lone-blocks': 1,
			'no-loop-func': 2,
			'no-multi-spaces': 1,
			'no-multiple-empty-lines': 1,
			'no-native-reassign': 2,
			'no-new-func': 2,
			'no-new-object': 2,
			'no-new-symbol': 2,
			'no-new-wrappers': 2,
			'no-new': 2,
			'no-octal-escape': 2,
			'no-proto': 2,
			'no-prototype-builtins': 0,
			'no-script-url': 2,
			'no-sequences': 2,
			'no-shadow': 2,
			'no-trailing-spaces': 1,
			'no-underscore-dangle': 1,
			'no-use-before-define': [ 2, { functions: false } ],
			'no-var': 2,
			'object-curly-spacing': [ 1, 'always' ],
			'prefer-arrow-callback': 1,
			'prefer-const': [ 1, { destructuring: 'all' } ],
			'quotes': [ 1, 'single' ],
			'quote-props': [ 1, 'consistent-as-needed' ],
			'semi-spacing': 1,
			'semi': [ 2, 'always' ],
			'space-before-blocks': 1,
			'space-before-function-paren': 1,
			'space-infix-ops': 1,
			'space-unary-ops': [ 1, { words: true, nonwords: false } ],
			'strict': [ 2, 'global' ],
			'yoda': [ 1, 'never' ]
		},
	},
	{
		files: [
		  '**/*-test.js',
			'examples/**/*.js',
		],
		languageOptions: {
			globals: {
				...globals.mocha,
  			And: true,
  			But: true,
  			Feature: true,
  			Given: true,
  			Scenario: true,
  			Then: true,
  			When: true
			}
		},
	},
	{
		files: [
			'examples/**/*.mjs',
		],
		languageOptions: {
			globals: globals.browser,
		},
	},
];
