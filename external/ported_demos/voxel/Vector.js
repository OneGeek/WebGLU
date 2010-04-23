// Vector class

// TODO: Examples
// v0 = v1 * 100 + v3 * 200; 
// v0 = v1.Multiply(100).Add(v2.Multiply(200));

// TODO: In the future maybe implement:
// VectorEval("%1 = %2 * %3 + %4 * %5", v0, v1, 100, v2, 200);

function ExtVector(x, y)
{
	this.__defineGetter__("Zero", function() { return new Vector(0, 0); });

	this.__defineGetter__("X", function() { return this.x; });
	this.__defineSetter__("X", function(value) { this.x = value });

	this.__defineGetter__("Y", function() { return this.y; });
	this.__defineSetter__("Y", function(value) { this.y = value });

	this.Add = function(v)
	{
		return new Vector(this.x + v.x, this.y + v.y);
	}

	this.Subtract = function(v)
	{
		return new Vector(this.x - v.x, this.y - v.y);
	}

	this.Multiply = function(s)
	{
		return new Vector(this.x * s, this.y * s);
	}

	this.Divide = function(s)
	{
		return new Vector(this.x / s, this.y / s);
	}

	this.ThisAdd = function(v)
	{
		this.x += v.x;
		this.y += v.y;
	}

	this.ThisSubtract = function(v)
	{
		this.x -= v.x;
		this.y -= v.y;
	}

	this.ThisMultiply = function(s)
	{
		this.x *= s;
		this.y *= s;
	}

	this.ThisDivide = function(s)
	{
		this.x /= s;
		this.y /= s;
	}

	this.Length = function()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	this.LengthSquared = function()
	{
		return this.x * this.x + this.y * this.y;
	}

	this.Normal = function()
	{
		return new Vector(-this.y, this.x);
	}

	this.ThisNormal = function()
	{
		var x = this.x;
		this.x = -this.y
		this.y = x;
	}

	this.Normalize = function()
	{
		var length = this.Length();
		if(length != 0)
		{
			return new Vector(this.x / length, this.y / length);
		}
	}

	this.ThisNormalize = function()
	{
		var length = this.Length();
		if (length != 0)
		{
			this.x /= length;
			this.y /= length;
		}
	}

	this.Negate = function()
	{
		return new Vector(-this.x, -this.y);
	}

	this.ThisNegate = function()
	{
		this.x = -this.x;
		this.y = -this.y;
	}

	this.Compare = function(v)
	{
		return Math.abs(this.x - v.x) < 0.0001 && Math.abs(this.y - v.y) < 0.0001;
	}

	this.Dot = function(v)
	{
		return this.x * v.x + this.y * v.y;
	}

	this.Cross = function(v)
	{
		return this.x * v.y - this.y * v.x;
	}

	this.Projection = function(v)
	{
		return this.Multiply(v, (this.x * v.x + this.y * v.y) / (v.x * v.x + v.y * v.y));
	}

	this.ThisProjection = function(v)
	{
		var temp = (this.x * v.x + this.y * v.y) / (v.x * v.x + v.y * v.y);
		this.x = v.x * temp;
		this.y = v.y * temp;
	}

	// If x and y aren't supplied, default them to zero
	if (x == undefined) this.x = 0; else this.x = x;
	if (y == undefined) this.y = 0; else this.y = y;
}
