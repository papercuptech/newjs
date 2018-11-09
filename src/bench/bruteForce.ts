'use strict'

import defineContext, {oFunction} from 'eldc'
import setPrototypeOf = Reflect.setPrototypeOf;
import {isFunction} from 'util';

const {
	defineProperty,
	getOwnPropertyDescriptor,
	getOwnPropertyNames,
	getPrototypeOf,
	setPrototypeOf,
} = Object

const {
	isFunction: isFn,
	isObject: isObj,
	isArray: isArr
} = require('util')

const symBox = Symbol('newjs-box')
const symCtor = Symbol('newjs-ctor')
const symInst = Symbol('newjs-base-bound')
const symOff = Symbol('newjs-off')
const symStatic = Symbol('newjs-static')
const symBase = Symbol('newjs-base')
export const SymNewJs = Symbol('newjs-new')
let switchAll = true
try {
	Symbol && Symbol.hasInstance
	switchAll = false
}
catch{}

function makeStatics(Base, Patch, static_, isMocked) {
	if(!static_) return

	for(const name of getOwnPropertyNames(static_)) {
		const desc = getOwnPropertyDescriptor(static_, name)
		if(!desc) continue
		if(isObj(desc.value) && isFn(desc.value.get)) {
			const value = desc.value
			delete desc.value
			desc.get = value.get
			desc.set = value.set
		}
		defineProperty(Patch, name, desc)
	}

	if(isMocked) return

	for(const name of Base.getOwnPropertyNames())
		defineProperty(Patch, name, {
			configurable: true,
			enumerable: true,
			get() {return Base[symCtor][name]},
			set(v) {Base[symCtor][name] = v}		
		})
}

function makePatch(Class, Impl, isMocked) {
	const Base = Box.GetBase(Class)
	const {constructor_, static_} = Impl

	const Patch = oFunction('Base', 'ctor', 'symInst', `
		return class ${Class.name}$Mock {
			constructor(...args) {
				let _this = ctor ?
					${isMocked
						? 'ctor(() => this, ...args) : this'
						: 'ctor(() => super(), ...args) : super(...args)'
					}
				if(!_this) _this = this
				if(_this) _this[symInst] = {}
				return _this
			}
		}
	`)(Base, constructor_, symInst)

	makeStatics(Base, Patch, static_, isMocked)

	const baseProto = Base.prototype
	const patchProto = Patch.prototype
	const names = getOwnPropertyNames(Impl)

	for(const name of names) {
		switch(name) {
		case 'constructor':
		case 'prototype':
		case 'static_':
		case 'constructor_':
			break;
		default:
			let propImpl = getOwnPropertyDescriptor(Impl, name)
			if(!propImpl) break
			if(isFn(propImpl.value) && false) {
				const implFn = propImpl.value
				propImpl = {
					configurable: true,
					enumerable: true,
					get: function() {
						let baseFn = !isMocked && baseProto[name]
						if(!isFn(baseFn)) baseFn = isMocked ? function() {} : undefined
						this[symInst][name] = baseFn && baseFn.bind(this)
						const value = function(...args) {
							return implFn.call(this, this[symInst], ...args)
						}
						defineProperty(value, 'length', {value: implFn.length - 1})
						defineProperty(this, name, {configurable: true, enumerable: true, writable: true, value})
						return this[name]
					}
				}
			}
			defineProperty(patchProto, name, propImpl)
			break
		}
	}

	return Patch
}

class Box {
	static Top
	static Current
	static TouchedStaticProperties = new Set()

	static GetBase(Class) {
		let box:Box|undefined = Box.Current
		while(box) {
			const proto = box.registry.get(Class)
			if(proto) return proto[symCtor]
			box = box.parent
		}
		throw new Error(`class function ${Class.name} not registered through newjs`)	
	}

	static SwitchImplFor(Class) {
		let curBox:Box|undefined = Box.Current

		while(curBox) {
			var Impl = curBox.registry.get(Class)
			if(Impl) break
			curBox = curBox.parent
		}
		Class[symCtor] = Impl
		Class[symBox] = Box.Current
	}

	static SwitchImplForx(Class) {
		let curBox:Box|undefined = Box.Current

		while(curBox) {
			var proto = curBox.registry.get(Class)
			if(proto) break
			curBox = curBox.parent
		}
		//if(!proto[symBase])
			Class.prototype = proto
		Class[symCtor] = proto[symCtor]
		Class[symBox] = Box.Current
	}

	static Boxit(using) {
		return function(fn) {
			const run = Boxed(using)
			return isFn(fn) ? run(fn) : fn => isFn(fn) ? run(fn) : fn => () => run(fn)
		}
	}

	//---------------------------------------------------------------------------------

	registry = new Map()
	staticProperties = new Set()
	staticInstances = new Map()
	hasStatics = false
	parent!:Box
	constructor(public using?:any[]) {}
	
	ensureClassStatic(Class, Impl, name) {
		if(Class.hasOwnProperty(name)) return

		const classProp = Class[symStatic][name] = {
			configurable: true,
			enumerable: Impl.propertyIsEnumerable(name), 
			get() {
				classProp.fromBox = Box.Current
				Box.TouchedStaticProperties.add(classProp)
				const staticInstance = Box.Current.staticInstances.get(Class)
				const implProp = Impl[symStatic][name]
				if(implProp.writable) implProp.value = staticInstance[name]
				defineProperty(Class, name, implProp)
				return Class[name]
			},
			set(v) {
				classProp.fromBox = Box.Current
				Box.TouchedStaticProperties.add(classProp)
				defineProperty(Class, name, Impl[symStatic][name])
				Class[name] = v
			},
			fromBox: Box.Current,
			unhoist() {
				const implProp = Impl[symStatic][name]
				const staticInstance = this.fromBox.staticInstances.get(Class)
				if(implProp.writable) staticInstance[name] = Class[name]
				defineProperty(Class, name, classProp)
				Box.TouchedStaticProperties.delete(classProp)
			}
		}
		defineProperty(Class, name, classProp)
	}

	interceptStatics(Class, Impl) {
		let staticInstance

		for(const name of getOwnPropertyNames(Impl)) {
			if(name === 'length' || name === 'name' || name === 'prototype') continue

			staticInstance = staticInstance || Object.create(null)

			this.ensureClassStatic(Class, Impl, name)
			this.staticProperties.add(Class[symStatic][name])

			const implProp:any = Object.getOwnPropertyDescriptor(Impl, name) || (<any>{})
			implProp.configurable = true
			staticInstance[symStatic][name] = implProp

			defineProperty(Impl, name, {
				configurable: false,
				enumerable: implProp.enumerable,
				get() {return Class[name]},
				set(v) {Class[name] = v}
			})
		}

		if(!staticInstance) return

		this.hasStatics = true
		this.staticInstances.set(Class, staticInstance)
	}

	bindImplTo(Class, Impl) {
		//Impl.prototype[symCtor] = Impl
		//if(!this.registry.has(Class)) this.interceptStatics(Class, Impl)
		this.registry.set(Class, Impl)
	}

	bindImplTox(Class, Impl) {
		const {prototype: impl} = Impl
		impl[symCtor] = Impl

		const implSuper = getPrototypeOf(impl)
		if(implSuper.constructor === Class) {
			const newSuper = Object.create(implSuper)
			newSuper.constructor = impl[symBase] = Class.prototype[symCtor]
			setPrototypeOf(impl, newSuper)
		}

		impl.constructor = Class
		if(!impl[symBase])
			Class.prototype = impl

		//Class[symCtor] = Impl
		//Class[symBox] = Box.Current

		if(!this.registry.has(Class)) this.interceptStatics(Class, Impl)
		this.registry.set(Class, impl)
	}

	bind(using?:any[]) {
		this.parent = Box.Current
		using = using || this.using
		if(!using) return
		const len = using.length
		let i = 0
		while(i < len) {
			/*
			if(i === len - 1) {
				const fn = using[i]
				if(!isFn(fn)) throw new Error('last unpaired argument must be a function')
				return fn
			}
			*/
			const Class = using[i++]
			if(isArr(Class)) this.bind(Class)
			else {
				let Impl = using[i++]	|| (class {constructor() {throw new Error(`${Class.name} de-implemented`)}})
				if(isObj(Impl)) Impl = makePatch(Class, Impl, true)
				this.bindImplTo(Class, Impl)
			}
		}
	}

	unhoistStatics() {
		let leftBox = this.staticProperties
		let rightBox = Box.TouchedStaticProperties
		if(Box.TouchedStaticProperties.size < this.staticProperties.size) {
			leftBox = rightBox
			rightBox = this.staticProperties
		}
		for(const touched of leftBox) rightBox.has(touched) && touched.unhoist()
	}

	detectChangedStatics() {}

	enter() {
		if(!this.parent) this.bind()
		if(this.hasStatics) this.unhoistStatics()
		//detectChangedStatics()
		if(switchAll) this.registry.forEach((_, Class)=> Box.SwitchImplFor(Class))
	}

	base(...using) {
		//const basedUsing:any[] = []
		//let current = this

		//while(current.using) basedUsing.unshift(current)

		return Box.Boxit([this.using, using])
	}

}


const Boxed = defineContext({}, {
	create(using) {return new Box(using)},
	top(box) {Box.Top = Box.Current =  box},
	enter(this:Box, from:Box) {
		this.enter()
		Box.Current = this
	}
})

export function box(...using) {return Box.Boxit(using)}
export namespace box {
	function _on(Class) {
		if(Class[symOff] === null) return;
		Class[symOff] = Class[symCtor]
		Box.SwitchImplFor(Class)	
	}
	export function on(Class?) {
		if(Class) return _on(Class)
		Box.Top.registry.forEach((_, Class) => _on(Class))
	}
	function _off(Class) {
		Class[symCtor] = Class[symOff]; 
		Class[symOff] = null	
	}
	export function off(Class?) {
		if(Class) return _off(Class)
		Box.Top.registry.forEach((_, Class) => _off(Class))
	}
	//export function base(...using) {return Box.Current.base(using)}
}

const isSevenOrLess = parseInt(process.versions.node.split('.')[0]) <= 7
export function newjs(Base) {
	const className = Base.name + '$'
	const demandSwitch = `
		${!switchAll && `
			if(${className}[symBox] !== Box.Current && ${className}[symOff]) 
				Box.SwitchImplFor(${className})
		`}
	`
	const oldNew = isSevenOrLess && `
		var ctor = ${className}[symCtor]
		var a = arguments
		var l = a.length
		if(l === 0) return new ctor()
		if(l === 1) return new ctor(a[0])
		if(l === 2) return new ctor(a[0],a[1])
		if(l === 3) return new ctor(a[0],a[1],a[2])
		if(l === 4) return new ctor(a[0],a[1],a[2],a[3])
		if(l === 5) return new ctor(a[0],a[1],a[2],a[3],a[4])
		if(l === 6) return new ctor(a[0],a[1],a[2],a[3],a[4],a[5])
		if(l === 7) return new ctor(a[0],a[1],a[2],a[3],a[4],a[5],a[6])
		if(l === 8) return new ctor(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7])
		if(l === 9) return new ctor(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8])
		if(l === 10)return new ctor(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8],a[9])
		return new ctor(...a)
	`
	const build = `
		/*
		var inNew = false
		${isSevenOrLess
			? `
				function ${className}() {
					${oldNew}
					var ctor = ${className}[symCtor]
					var a = arguments
					var l = a.length
					if(l === 0) return ctor.call(this)
					if(l === 1) return ctor.call(this,a[0])
					if(l === 2) return ctor.call(this,a[0],a[1])
					if(l === 3) return ctor.call(this,a[0],a[1],a[2])
					if(l === 4) return ctor.call(this,a[0],a[1],a[2],a[3])
					if(l === 5) return ctor.call(this,a[0],a[1],a[2],a[3],a[4])
					if(l === 6) return ctor.call(this,a[0],a[1],a[2],a[3],a[4],a[5])
					if(l === 7) return ctor.call(this,a[0],a[1],a[2],a[3],a[4],a[5],a[6])
					if(l === 8) return ctor.call(this,a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7])
					if(l === 9) return ctor.call(this,a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8])
					if(l === 10)return ctor.call(this,a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8],a[9])
					return ctor.apply(this, a)
				}
			```
			: `
				function ${className}(...args) {
					if(inNew) {
						inNew = false
						return new Base(...args)
					}
				
					${demandSwitch}

					console.log('this instanceof Base ', this instanceof Base) 
					console.log('this instanceof ${className} ', this instanceof ${className}) 
					console.log('this instanceof ${className}[symCtor] ', this instanceof ${className}[symCtor]) 
					console.log('${className}[symCtor] === Base ', ${className}[symCtor] === Base)
					const proto = this && this.__proto__
					if(proto) {
					  console.log('proto === ${className}.prototype', proto === ${className}.prototype)
						console.log('Base === proto[symBase] ', Base === proto[symBase]) 
						console.log('${className} === proto[symBase] ', ${className} === proto[symBase]) 
						console.log('${className}[symCtor] === proto[symBase] ', ${className}[symCtor] === proto[symBase]) 
					}
					

					
					const Impl = ${className}[symCtor]
					if(this instanceof Base) {
						if(this instanceof ${className})
							if(this instanceof Impl)
								//return new Base(...args)
								return this
							else
								//return new Base(...args)
								return new Impl(...args)
						else {
							inNew = true
							return new Impl(...args)
							//return new Base(...args)
						}
					}
					else if(this instanceof ${className})
						return new Impl(...args)
					else
						return Impl.call(this, ...args)
				}
			`
		}

		${isSevenOrLess
			? `
				function NewJs() {
					${demandSwitch}
					${oldNew}
				}
			`
			: `
				function NewJs(...args) {
					${demandSwitch}
					return new (${className}[symCtor])(...args)
				}
			`
		}
		*/
		
		

		${className}[SymNewJs] = NewJs
		
		if(Object.getOwnPropertyDescriptor(${className}, 'NewJs') === undefined)
			Object.defineProperty(${className}, 'NewJs', {
				configurable: true,
				enumerable: true,
				get() {return NewJs},
				set(value) {
					Object.defineProperty(${className}, 'NewJs', {
						configurable: true,
						enumerable: true,
						writable: true,
						value
					})
				}
			})

		return ${className}
	`
	/*
	const Class = oFunction('Box', 'symBox', 'symCtor', 'symOff', 'SymNewJs', 'Base', 'symBase',
		build
	)(Box, symBox, symCtor, symOff, SymNewJs, Base, symBase)




	Class[symOff] = Base
	Box.Top.bindImplTo(Class, Base)
	Class.prototype = Base.prototype
	Class[symCtor] = Base
	return Class

	*/

	const Class = new Proxy(function(){}, {
		construct(_, args) {
			if(Class[symBox] !== Box.Current && Class[symOff]) Box.SwitchImplFor(Class)
			return Reflect.construct(Class[symCtor], args)
		}
	})
	Class[symOff] = Class[symCtor] = Base
	Box.Top.bindImplTo(Class, Base)
	return Class
}

/*
if in require(), then newjs needs to return whats passed, but
defer registration until after all loading is done
 */

export default newjs
