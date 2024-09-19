

module.exports = class Layout {
	width = 0;
	height = 0;
	scrollWidth = 0;
	scrollHeight = 0;
	x = 0;
	y = 0;
	scrollX = 0;
	scrollY = 0;

	constructor (styles = {}) {
		for (const key of Object.keys(this)) {
			this[key] = styles[key] ?? this[key];
		}
		this.scrollWidth = Math.max(this.width, this.scrollWidth);
		this.scrollHeight = Math.max(this.height, this.scrollHeight);
		this.scrollX = Math.min(this.scrollX, this.scrollWidth - this.width);
		this.scrollY = Math.min(this.scrollY, this.scrollHeight - this.height);
		this.left = Math.min(this.x, this.x + this.width); // move to getBoundingClientRect()?
		this.right = Math.max(this.x + this.width, this.x); // move to getBoundingClientRect()?
		this.top = Math.min(this.y, this.y + this.height); // move to getBoundingClientRect()?
		this.bottom = Math.max(this.y + this.height, this.y); // move to getBoundingClientRect()?
		Object.preventExtensions(this);
	}
};
