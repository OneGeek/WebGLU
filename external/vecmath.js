/*
 * vecmath.js Demo (c) 2010 Peter Lueders <pl@jzone.de>
 * vecmath.js is a Javascript port of parts of the Java Vecmath Library.
 *
 * Vecmath: Copyright (C) 1997,1998,1999
 * Kenji Hiranabe, Eiwa System Management, Inc.
 * Java port of Bullet (c) 2008 Martin Dvorak <jezek2@advel.cz>
 * Bullet Continuous Collision Detection and Physics Library
 * Copyright (c) 2003-2008 Erwin Coumans  http://www.bulletphysics.com/
 *
 * This software is provided 'as-is', without any express or implied warranty.
 * In no event will the authors be held liable for any damages arising from
 * the use of this software.
 * 
 * Permission is granted to anyone to use this software for any purpose, 
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */


var Vecmath={};
(function(Vecmath) {
  Vecmath.Vec3=function() {
    if (arguments.length==3) this.set3(arguments[0],arguments[1],arguments[2]);
  }
  Vecmath.Vec3.prototype.x=0;
  Vecmath.Vec3.prototype.y=0;
  Vecmath.Vec3.prototype.z=0;
  Vecmath.Vec3.prototype.set3=function(x,y,z) {
    this.x=x;this.y=y;this.z=z;
  }
  Vecmath.Vec3.prototype.set1=function(v) {
    //if (v==null) throw arguments.callee.caller;
    ////throw Bullet.stacktrace();//throw "Vec3.set1:"+arguments.callee.caller;
    this.x=v.x;this.y=v.y;this.z=v.z;
  }
  Vecmath.Vec3.prototype.sub1=function(v) {
    this.x-=v.x;this.y-=v.y;this.z-=v.z;
  }
  Vecmath.Vec3.prototype.sub2=function(t1,t2) {
    this.x = t1.x - t2.x;
    this.	y = t1.y - t2.y;
    this.	z = t1.z - t2.z;
  }
  Vecmath.Vec3.prototype.cross=function(v1,v2) {
    this.set3(
      v1.y*v2.z - v1.z*v2.y,
      v1.z*v2.x - v1.x*v2.z,
      v1.x*v2.y - v1.y*v2.x
    );
  }
  Vecmath.Vec3.prototype.normalize0=function() {
    var d=this.length();
    this.x/=d;
    this.y/=d;
    this.z/=d;
  }
  Vecmath.Vec3.prototype.lengthSquared=function() {
    return this.x*this.x+this.y*this.y+this.z*this.z;
  }
  Vecmath.Vec3.prototype.length=function() {
    return Math.sqrt(this.lengthSquared());
  }
  Vecmath.Vec3.prototype.scale1=function(s) {
    this.x*=s;this.y*=s;this.z*=s;
  }
  Vecmath.Vec3.prototype.scale2=function(s,v) {
    this.x=s*v.x;this.y=s*v.y;this.z=s*v.z;
  }
  Vecmath.Vec3.prototype.scaleAdd=function(s,t1,t2) {
    this.x = s*t1.x + t2.x;
    this.	y = s*t1.y + t2.y;
    this.	z = s*t1.z + t2.z;
  }
  Vecmath.Vec3.prototype.dot=function(v1) {
    return this.x*v1.x + this.y*v1.y + this.z*v1.z;
  }
  Vecmath.Vec3.prototype.normalize1=function(v1) {
    this.set1(v1);
    this.normalize0();
  }
  Vecmath.Vec3.prototype.add1=function(v) {
    this.x+=v.x;this.y+=v.y;this.z+=v.z;
  }
  Vecmath.Vec3.prototype.add2=function(t1,t2) {
    this.x = t1.x + t2.x;
    this.	y = t1.y + t2.y;
    this.	z = t1.z + t2.z;
  }
  Vecmath.Vec3.prototype.negate0=function() {
    this.x=-this.x;this.y=-this.y;this.z=-this.z;
  }
  Vecmath.Vec3.prototype.negate1=function(t1) {
    this.x=-t1.x;this.y=-t1.y;this.z=-t1.z;
  }
  Vecmath.Vec3.prototype.toString=function() {
    return "V3["+this.x+","+this.y+","+this.z+"]";
  }
  Vecmath.Vec3.prototype.equals=function(v) {
    return (v!=null)&&(this.x==v.x)&&(this.y==v.y)&&(this.z==v.z);
  }
  Vecmath.Vec4=function() {
    if (arguments.length==1) this.set1(arguments[0]);
    if (arguments.length==4) this.set4(arguments[0],arguments[1],arguments[2],arguments[3]);
  }
  Vecmath.Vec4.prototype.x=0;
  Vecmath.Vec4.prototype.y=0;
  Vecmath.Vec4.prototype.z=0;
  Vecmath.Vec4.prototype.w=0;
  Vecmath.Vec4.prototype.set4=function(x,y,z,w) {
    this.x=x;this.y=y;this.z=z;this.w=w;
  }
  Vecmath.Vec4.prototype.set1=function(v) {
    this.x=v.x;this.y=v.y;this.z=v.z;this.w=v.w;
  }
  Vecmath.Vec4.prototype.absolute=function() {
    if (this.x < 0.0) this.x = -this.x;
    	if (this.y < 0.0) this.y = -this.y;
    	if (this.z < 0.0) this.z = -this.z;
    	if (this.w < 0.0) this.w = -this.w;
  }
  Vecmath.Vec4.prototype.toString=function() {
    return "Vec4["+this.x+","+this.y+","+this.z+","+this.w+"]";
  }
  Vecmath.Quat4=function() {
    if (arguments.length==1) this.set1(arguments[0]);
    if (arguments.length==4) this.set4(arguments[0],arguments[1],arguments[2],arguments[3]);
  }
  Vecmath.Quat4.prototype=new Vecmath.Vec4();
  Vecmath.Quat4.prototype.mul2=function(q1,q2) {
    if (q2==null) alert(Bullet.stacktrace());
    this.	set4(
        	    q1.x*q2.w + q1.w*q2.x + q1.y*q2.z - q1.z*q2.y,
        	    q1.y*q2.w + q1.w*q2.y + q1.z*q2.x - q1.x*q2.z,
        	    q1.z*q2.w + q1.w*q2.z + q1.x*q2.y - q1.y*q2.x,
        	    q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z
        	    );
  }
  Vecmath.Quat4.prototype.norm=function() {
    return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w;
  }
  Vecmath.Quat4.prototype.normalize=function() {
    var n=Math.sqrt(this.norm());
    this.	x /= n;
    this.	y /= n;
    this.	z /= n;
    this.	w /= n;
  }
  Vecmath.Quat4.prototype.toString=function() {
    return "Quat4["+this.x+","+this.y+","+this.z+","+this.w+"]";
  }
  Vecmath.Quat4.prototype.mul1=function(q1) {
    this.set4(
      this.x*q1.w + this.w*q1.x + this.y*q1.z - this.z*q1.y,
      this.y*q1.w + this.w*q1.y + this.z*q1.x - this.x*q1.z,
      this.z*q1.w + this.w*q1.z + this.x*q1.y - this.y*q1.x,
      this.w*q1.w - this.x*q1.x - this.y*q1.y - this.z*q1.z
    );
  }
  Vecmath.Mat3=function() {}
  Vecmath.Mat3.prototype.m00=0;
  Vecmath.Mat3.prototype.m01=0;
  Vecmath.Mat3.prototype.m02=0;
  Vecmath.Mat3.prototype.m10=0;
  Vecmath.Mat3.prototype.m11=0;
  Vecmath.Mat3.prototype.m12=0;
  Vecmath.Mat3.prototype.m20=0;
  Vecmath.Mat3.prototype.m21=0;
  Vecmath.Mat3.prototype.m22=0;
  Vecmath.Mat3.prototype.set9=function(m00,m01,m02,m10,m11,m12,m20,m21,m22) {
    	this.m00 = m00; this.m01 = m01; this.m02 = m02;
    	this.m10 = m10; this.m11 = m11; this.m12 = m12;
    	this.m20 = m20; this.m21 = m21; this.m22 = m22;
  }
  Vecmath.Mat3.prototype.set1=function(m1) {
    	this.m00 = m1.m00; this.m01 = m1.m01; this.m02 = m1.m02;
    	this.m10 = m1.m10; this.m11 = m1.m11; this.m12 = m1.m12;
    	this.m20 = m1.m20; this.m21 = m1.m21; this.m22 = m1.m22;
  }
  Vecmath.Mat3.prototype.seta=function(m) {
    	this.m00 = m[0]; this.m01 = m[1]; this.m02 = m[2];
    	this.m10 = m[3]; this.m11 = m[4]; this.m12 = m[5];
    	this.m20 = m[6]; this.m21 = m[7]; this.m22 = m[8];
  }
  Vecmath.Mat3.prototype.transform1=function(t) {
    this.transform2(t,t);
  }
  Vecmath.Mat3.prototype.transform2=function(t,result) {
    result.set3(
      this.m00*t.x + this.m01*t.y + this.m02*t.z,
      this.m10*t.x + this.m11*t.y + this.m12*t.z,
      this.m20*t.x + this.m21*t.y + this.m22*t.z
    );
  }
  Vecmath.Mat3.prototype.mul1=function(m1) {
    this.mul2(this,m1);
  }
  Vecmath.Mat3.prototype.mul2=function(m1,m2) {
    this.set9(
        	    m1.m00*m2.m00 + m1.m01*m2.m10 + m1.m02*m2.m20,
        	    m1.m00*m2.m01 + m1.m01*m2.m11 + m1.m02*m2.m21,
        	    m1.m00*m2.m02 + m1.m01*m2.m12 + m1.m02*m2.m22,
        
        	    m1.m10*m2.m00 + m1.m11*m2.m10 + m1.m12*m2.m20,
        	    m1.m10*m2.m01 + m1.m11*m2.m11 + m1.m12*m2.m21,
        	    m1.m10*m2.m02 + m1.m11*m2.m12 + m1.m12*m2.m22,
        
        	    m1.m20*m2.m00 + m1.m21*m2.m10 + m1.m22*m2.m20,
        	    m1.m20*m2.m01 + m1.m21*m2.m11 + m1.m22*m2.m21,
        	    m1.m20*m2.m02 + m1.m21*m2.m12 + m1.m22*m2.m22
      );
  }
  Vecmath.Mat3.prototype.transpose=function() {
    var tmp = this.m01;
    this.m01 = this.m10;
    this.m10 = tmp;
    
    	tmp = this.m02;
    this.	m02 = this.m20;
    this.m20 = tmp;
        
    	tmp = this.m12;
    this.	m12 = this.m21;
    this.	m21 = tmp;
  }
  Vecmath.Mat3.prototype.getRow=function(row,v) {
    	if (row == 0) {
        	    v.x = this.m00;
        	    v.y = this.m01;
        	    v.z = this.m02;
    	} else if (row == 1) {
        	    v.x = this.m10;
        	    v.y = this.m11;
        	    v.z = this.m12;
    	} else if (row == 2) {
        	    v.x = this.m20;
        	    v.y = this.m21;
        	    v.z = this.m22;
    	} else {
        	    alert("row must be 0 to 2 and is " + row);
    	}
  }
  Vecmath.Mat3.prototype.setRow=function(row,x,y,z) {
    if (row == 0) {
    	    this.m00 = x;
    	    this.m01 = y;
    	    this.m02 = z;
    	} else if (row == 1) {
    	    this.m10 = x;
    	    this.m11 = y;
    	    this.m12 = z;
    	} else if (row == 2) {
    	    this.m20 = x;
    	    this.m21 = y;
    	    this.m22 = z;
    	} else {
    	    alert("row must be 0 to 2 and is " + row);
    	}
  }
  Vecmath.Mat3.prototype.getElement=function(row,column) {
    if (row == 0)
    	    if (column == 0)
    		return this.m00;
    	    else if (column == 1)
    		return this.m01;
    	    else if (column == 2)
    		return this.m02;
    	    else
    	alert("column must be 0 to 2 and is " + column);
    	else if (row == 1)
    	    if (column == 0)
    		return this.m10;
    	    else if (column == 1)
    		return this.m11;
    	    else if (column == 2)
    		return this.m12;
    	    else
    		alert("column must be 0 to 2 and is " + column);
    
    	else if (row == 2)
    	    if (column == 0)
    		return this.m20;
    	    else if (column == 1)
    		return this.m21;
    	    else if (column == 2)
    		return this.m22;
    	    else
    		alert("column must be 0 to 2 and is " + column);
    	else
    		alert("row must be 0 to 2 and is " + row);
  }
  Vecmath.Mat3.prototype.setIdentity=function() {
    this.m00 = 1.0; this.m01 = 0.0; this.m02 = 0.0;
    this.m10 = 0.0; this.m11 = 1.0; this.m12 = 0.0;
    this.m20 = 0.0; this.m21 = 0.0; this.m22 = 1.0;
  }
  Vecmath.Mat3.prototype.toString=function() {
    return "M3("+this.m00+","+this.m01+","+this.m02+"..)";
  }
  Vecmath.Mat3.prototype.getColumn=function(column,v) {
    if (column == 0) {
      v.x = this.m00;
      v.y = this.m10;
      v.z = this.m20;
    } else if (column == 1) {
      v.x = this.m01;
      v.y = this.m11;
      v.z = this.m21;
    } else if (column == 2) {
      v.x = this.m02;
      v.y = this.m12;
      v.z = this.m22;
    } else {
      throw new Error("column must be 0 to 2 and is " + column);
    }
  }
  Vecmath.Mat4=function() {}
  Vecmath.Mat4.prototype.m00=0;
  Vecmath.Mat4.prototype.m01=0;
  Vecmath.Mat4.prototype.m02=0;
  Vecmath.Mat4.prototype.m03=0;
  Vecmath.Mat4.prototype.m10=0;
  Vecmath.Mat4.prototype.m11=0;
  Vecmath.Mat4.prototype.m12=0;
  Vecmath.Mat4.prototype.m13=0;
  Vecmath.Mat4.prototype.m20=0;
  Vecmath.Mat4.prototype.m21=0;
  Vecmath.Mat4.prototype.m22=0;
  Vecmath.Mat4.prototype.m23=0;
  Vecmath.Mat4.prototype.m30=0;
  Vecmath.Mat4.prototype.m31=0;
  Vecmath.Mat4.prototype.m32=0;
  Vecmath.Mat4.prototype.m33=0;
  Vecmath.Mat4.prototype.rotX=function(angle) {
    var c=Math.cos(angle);
    var s=Math.sin(angle);
    this.m00 = 1.0; this.m01 = 0.0; this.m02 = 0.0; this.m03 = 0.0;
    this.m10 = 0.0; this.m11 = c;   this.m12 = -s;  this.m13 = 0.0;
    this.m20 = 0.0; this.m21 = s;   this.m22 = c;   this.m23 = 0.0;
    this.m30 = 0.0; this.m31 = 0.0; this.m32 = 0.0; this.m33 = 1.0; 
  }
  Vecmath.Mat4.prototype.rotY=function(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    this.m00 = c;   this.m01 = 0.0; this.m02 = s;   this.m03 = 0.0;
    this.m10 = 0.0; this.m11 = 1.0; this.m12 = 0.0; this.m13 = 0.0;
    this.m20 = -s;  this.m21 = 0.0; this.m22 = c;   this.m23 = 0.0;
    this.m30 = 0.0; this.m31 = 0.0; this.m32 = 0.0; this.m33 = 1.0; 
  }
  Vecmath.Mat4.prototype.rotZ=function(angle) {
    var c=Math.cos(angle);
    var s=Math.sin(angle);
    this.m00 = c;   this.m01 = -s;  this.m02 = 0.0; this.m03 = 0.0;
    this.m10 = s;   this.m11 = c;   this.m12 = 0.0; this.m13 = 0.0;
    this.m20 = 0.0; this.m21 = 0.0; this.m22 = 1.0; this.m23 = 0.0;
    this.m30 = 0.0; this.m31 = 0.0; this.m32 = 0.0; this.m33 = 1.0; 
  }
  Vecmath.Mat4.prototype.transform2=function(vec,vecOut) {
    vecOut.set4(
      this.m00*vec.x + this.m01*vec.y + this.m02*vec.z + this.m03*vec.w,
      this.m10*vec.x + this.m11*vec.y + this.m12*vec.z + this.m13*vec.w,
      this.m20*vec.x + this.m21*vec.y + this.m22*vec.z + this.m23*vec.w,
      this.m30*vec.x + this.m31*vec.y + this.m32*vec.z + this.m33*vec.w
    ); 
  }
  Vecmath.Mat4.prototype.transform1=function(vec) {
    this.transform2(vec,vec);
  }
  Vecmath.Mat4.prototype.set16=function(m00,m01,m02,m03,m10,m11,m12,m13,m20,m21,m22,m23,m30,m31,m32,m33) {
    this.m00 = m00; this.m01 = m01; this.m02 = m02; this.m03 = m03;
    this.m10 = m10; this.m11 = m11; this.m12 = m12; this.m13 = m13;
    this.m20 = m20; this.m21 = m21; this.m22 = m22; this.m23 = m23;
    this.m30 = m30; this.m31 = m31; this.m32 = m32; this.m33 = m33;
  }
  Vecmath.Mat4.prototype.setM3=function(m1) {
    this.m00 = m1.m00; this.m01 = m1.m01; this.m02 = m1.m02; this.m03 = 0.0;
    this.	m10 = m1.m10; this.m11 = m1.m11; this.m12 = m1.m12; this.m13 = 0.0;
    this.	m20 = m1.m20; this.m21 = m1.m21; this.m22 = m1.m22; this.m23 = 0.0;
    this.	m30 =    0.0; this.m31 =    0.0; this.m32 =    0.0; this.m33 = 1.0;
  }
  Vecmath.Mat4.prototype.setM4=function(m1) {
    this.m00 = m1.m00; this.m01 = m1.m01; this.m02 = m1.m02; this.m03 = m1.m03;
    this.	m10 = m1.m10; this.m11 = m1.m11; this.m12 = m1.m12; this.m13 = m1.m13;
    this.	m20 = m1.m20; this.m21 = m1.m21; this.m22 = m1.m22; this.m23 = m1.m23;
    this.	m30 = m1.m30; this.m31 = m1.m31; this.m32 = m1.m32; this.m33 = m1.m33;
  }
  Vecmath.Mat4.prototype.mul2=function(m1,m2) {
    this.set16(
      m1.m00*m2.m00 + m1.m01*m2.m10 + m1.m02*m2.m20 + m1.m03*m2.m30,
      m1.m00*m2.m01 + m1.m01*m2.m11 + m1.m02*m2.m21 + m1.m03*m2.m31,
      m1.m00*m2.m02 + m1.m01*m2.m12 + m1.m02*m2.m22 + m1.m03*m2.m32,
      m1.m00*m2.m03 + m1.m01*m2.m13 + m1.m02*m2.m23 + m1.m03*m2.m33,
      m1.m10*m2.m00 + m1.m11*m2.m10 + m1.m12*m2.m20 + m1.m13*m2.m30,
      m1.m10*m2.m01 + m1.m11*m2.m11 + m1.m12*m2.m21 + m1.m13*m2.m31,
      m1.m10*m2.m02 + m1.m11*m2.m12 + m1.m12*m2.m22 + m1.m13*m2.m32,
      m1.m10*m2.m03 + m1.m11*m2.m13 + m1.m12*m2.m23 + m1.m13*m2.m33,
      m1.m20*m2.m00 + m1.m21*m2.m10 + m1.m22*m2.m20 + m1.m23*m2.m30,
      m1.m20*m2.m01 + m1.m21*m2.m11 + m1.m22*m2.m21 + m1.m23*m2.m31,
      m1.m20*m2.m02 + m1.m21*m2.m12 + m1.m22*m2.m22 + m1.m23*m2.m32,
      m1.m20*m2.m03 + m1.m21*m2.m13 + m1.m22*m2.m23 + m1.m23*m2.m33,
      m1.m30*m2.m00 + m1.m31*m2.m10 + m1.m32*m2.m20 + m1.m33*m2.m30,
      m1.m30*m2.m01 + m1.m31*m2.m11 + m1.m32*m2.m21 + m1.m33*m2.m31,
      m1.m30*m2.m02 + m1.m31*m2.m12 + m1.m32*m2.m22 + m1.m33*m2.m32,
      m1.m30*m2.m03 + m1.m31*m2.m13 + m1.m32*m2.m23 + m1.m33*m2.m33
    );
  }
  Vecmath.Mat4.prototype.mul1=function(m1) {
    this.mul2(this,m1);
  }
  Vecmath.Mat4.prototype.getRotationScale=function(m1) {
    	m1.m00 = this.m00; m1.m01 = this.m01; m1.m02 = this.m02;
    	m1.m10 = this.m10; m1.m11 = this.m11; m1.m12 = this.m12;
    	m1.m20 = this.m20; m1.m21 = this.m21; m1.m22 = this.m22;
  }
  Vecmath.Mat4.prototype.toString=function() {
    return "M4("+this.m00+","+this.m01+","+this.m02+","+this.m03+"..)";
  }
  Vecmath.Mat4.prototype.setIdentity=function() {
    this.m00 = 1.0; this.m01 = 0.0; this.m02 = 0.0; this.m03 = 0.0;
    this.m10 = 0.0; this.m11 = 1.0; this.m12 = 0.0; this.m13 = 0.0;
    this.m20 = 0.0; this.m21 = 0.0; this.m22 = 1.0; this.m23 = 0.0;
    this.m30 = 0.0; this.m31 = 0.0; this.m32 = 0.0; this.m33 = 1.0;
  }
  Vecmath.Mat4.prototype.setTranslation=function(trans) {
    this.m03 = trans.x;
    this.m13 = trans.y;  
    this.m23 = trans.z;
  }
  Vecmath.Mat4.prototype.posS=function() {
    return this.m03+","+this.m13+","+this.m23;
  }
}
)(Vecmath);
