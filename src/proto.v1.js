const symBox = Symbol('[[LastBox]]')
const symCtor = Symbol('[[Constructor]')
const symInst = Symbol('[[BaseBound]]')
const symOff = Symbol('[[Off]]')

function isFn(thing) {return typeof thing === 'function'}
function isObj(thing) {return typeof thing === 'object'}
function isArr(thing) {return Array.isArray(thing)}

function defineStatics(Base, Patch, static, isMocked) {
	Object.getOwnPropertyNames(static).forEach(name => {
		const desc = Object.getOwnPropertyDescriptor(static, name)
		if(isObj(desc.value) && isFn(desc.value.get)) {
			const value = desc.value
			delete desc.value
			desc.get = value.get
			desc.set = value.set
		}
		Object.defineProperty(Patch[name], desc)
	})

	if(isMocked) return

	Base.getOwnPropertyNames().forEach(name =>
		Object.defineProperty(Patch, name, {
			configurable: true,
			enumerable: true,
			get() {return Base[symCtor][name]},
			set(v) {Base[sysCtor][name] = v}		
		})
	)
}

function getBase(Class) {
	let box = Box.Current
	while(box) {
		const proto = box.registry.get(Class)
		if(proto) return proto[symCtor]
		box = box.parent
	}
	throw new Error(`Class ${Class.name} not registered through newjs`)
}

function makePatch(Class, Impl, isMocked) {
	const Base = getBase(Class)
	const {ctor, static} = Impl
	const Patch = Function('Base', 'ctor', 'symInst', `
		return class ${Class.name}$${isMocked ? 'Mock' : 'Patch'} ${!isMocked && 'extends Base' || ''} {
			constructor(...args) {
				let _this = ctor ?
					${isMocked 
						? ' ctor(() => this, ...args) : this'
						: ' ctor(() => super(), ...args) : super(...args)'
					}
				if(!_this) _this = this
				if(_this) _this[symInst] = {}
				return _this
			}
		}
	`)(Base, ctor, symInst)

	if(static) defineStatics(Base, Patch, static, isMocked)

	const baseProto = Base.prototype
	const patchProto = Patch.prototype
	const names = Object.getOwnPropertyNames(Impl)

	names.forEach(name => {
		switch(name) {
		case 'constructor':
		case 'prototype':
		case 'static':
		case 'ctor':
			break;
		default:
			let propImpl = Object.getOwnPropertyDescriptor(Impl, name)
			if(isFn(propImpl.value)) {
				const implFn = propImpl.value
				propImpl = {
					configurable: true,
					enumerable: true,
					get: function() {
						let baseFn = !isMocked && baseProto[name]
						if(!isFn(baseFn)) baseFn = isMocked ? function() {} : undefined
						this[symInst][name] = baseFn && baseFn.bind(this)
						const value = function(...args) {return implFn.call(this, this[symInst], ...args)}
						Object.defineProperty(value, 'length', {value: implFn.length - 1})
						Object.defineProperty(this, name, {configurable: true, enumerable: true, writeable: true, value})
						return this[name]
					}
				}
			}
			Object.defineProperty(patchProto, name, propImpl)
			break
		}
	})

	return Patch
}

function ensureStatics(Class, Impl) {
	Object.getOwnPropertyNames(Impl).forEach(name => {
		if(name === 'constructor' || name === 'prototype' || Class.hasOwnProperty(name)) return
		Object.defineProperty(Class, name, {
			configurable: true,
			enumerable: Impl.propertyIsEnumerable(name),
			get() {
				if(this[symBox] !== Box.Current) Box.SwitchImplFor(this)
				return this[symCtor][name]
			},
			set(v) {
				if(this[symBox] !== Box.Current) Box.SwitchImplFor(this)
				this[sysCtor][name] = v
			}		
		})	
	})
}

class Box {
	static Register(Class, Impl) {Box.Current.register(Class, Impl)}

	static SwitchImplFor(Class) {
		let current = Box.Current
		Class[symBox] = current
		while(current) {
			var proto = current.registry.get(Class)
			if(proto) break
			current = current.parent
		}
		Class.prototype = proto
		return Class[symCtor] = proto[symCtor]					
	}

	static Box(...using) {
		const box = new Box(using)
		return function(fn) {return box.run(fn)}
	}

	constructor(using) {
		this.registry = new Map()
		this.parent = undefined
		this.using = using
	}

	register(Class, Impl) {
		Class[symBox] = undefined
		const {prototype: impl} = Impl
		impl[symCtor] = Impl
		impl.constructor = Class
		ensureStatics(Class, Impl)
		this.registry.set(Class, impl)
	}

	enter() {Box.Current = this}

	bind(using) {
		if(!(using = using || this.using)) return
		const len = using.length
		let i = 0
		while(i < len) {
			const Class = using[i++]
			if(isArr(Class)) this.bind(Class)
			else {
				let Impl = using[i++]	
				if(!Impl) throw ''
				if(!isFn(Impl)) {
					if(!isObj(Impl)) throw ''
					const isMocked = !isArr(Impl)
					if(!isMocked) Impl = Impl[0]
					Impl = makePatch(Class, Impl, isMocked)
				}
				this.register(Class, Impl)
			}
		}
	}

	run(fn) {
		const parent = Box.Current
		try {
			if(this.parent !== parent) {
				const within = !this.parent ? this : new Box(this.using)
				within.parent = parent
				within.enter()
				within.bind()
			}
			else this.enter()
			return fn()	
		}
		finally {parent.enter()}
	}
}
Box.Current = new Box()

function patchPromise() {
	const proto = Promise.prototype
	const {then, catch: catch_, finally: finally_} = proto
	proto.then = function(s, f) {
		const box = Box.Current
		const s_ = s && function(...args) {box.enter(); s.call(this, ...args)}
		const f_ = f && function(...args) {box.enter(); f.call(this, ...args)}
		return then.call(this, s_, f_)
	}
	proto.catch = function(f) {
		const box = Box.Current
		const f_ = f && function(...args) {box.enter(); f.call(this, ...args)}
		return catch_.call(this, f_)
	}
	proto.finally = function(f) {
		const box = Box.Current
		return finally_.call(this, function() {box.enter(); f.call(this)})
	}
}
patchPromise()

function newjs(ClassImpl) {
	const className = ClassImpl.name
	const Class = Function('symCtor', 'symBox', 'symOff', 'ClassImpl', 'Box', `
		return function ${className}(...args) {
			if(${className}[symOff]) return new ClassImpl(...args)
			if(${className}[symBox] !== Box.Current) Box.SwitchImplFor(${className})
			return new (${className}[symCtor])(...args)
		}
	`)(symCtor, symBox, symOff, ClassImpl, Box)
	Box.Register(Class, ClassImpl)
	return Class
}

function box(...using) {return Box.Box(...using)}

box.off = function off(Class) {Class[symOff] = true; Class[symBox] = undefined}
box.on = function off(Class) {Class[symOff] = false}

newjs.box = box
newjs.newjs = newjs
module.exports = newjs
module.exports.default = newjs