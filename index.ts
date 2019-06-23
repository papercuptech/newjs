const symBox = Symbol('newjs-box')
const symCtor = Symbol('newjs-ctor')
const symInst = Symbol('newjs-base-bound')
const symOff = Symbol('newjs-off')
const symStatic = Symbol('newjs-static')

let switchAll = true
try {
	Symbol && Symbol.hasInstance
	switchAll = false
}
catch{}

function isFn(thing) {return typeof thing === 'function'}
function isObj(thing) {return thing !== null && typeof thing === 'object'}
function isArr(thing) {return Array.isArray(thing)}

function makeStatics(Base, Patch, static_, isMocked) {
	if(!static_) return
	Object.getOwnPropertyNames(static_).forEach(name => {
		const desc = Object.getOwnPropertyDescriptor(static_, name)
		if(!desc) return
		if(isObj(desc.value) && isFn(desc.value.get)) {
			const value = desc.value
			delete desc.value
			desc.get = value.get
			desc.set = value.set
		}
		Object.defineProperty(Patch, name, desc)
	})

	if(isMocked) return

	Base.getOwnPropertyNames().forEach(name =>
		Object.defineProperty(Patch, name, {
			configurable: true,
			enumerable: true,
			get() {return Base[symCtor][name]},
			set(v) {Base[symCtor][name] = v}		
		})
	)
}

function makePatch(Class, Impl, isMocked) {
	const Base = Box.GetBase(Class)
	const {constructor_, static_} = Impl
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
	`)(Base, constructor_, symInst)

	makeStatics(Base, Patch, static_, isMocked)

	const baseProto = Base.prototype
	const patchProto = Patch.prototype
	const names = Object.getOwnPropertyNames(Impl)

	names.forEach(name => {
		switch(name) {
		case 'constructor':
		case 'prototype':
		case 'static_':
		case 'constructor_':
			break;
		default:
			let propImpl = Object.getOwnPropertyDescriptor(Impl, name)
			if(!propImpl) break
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
						Object.defineProperty(this, name, {configurable: true, enumerable: true, writable: true, value})
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
			var proto = curBox.registry.get(Class)
			if(proto) break
			curBox = curBox.parent
		}
		if(switchAll) Class.prototype = proto
		Class[symCtor] = proto[symCtor]
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
				Object.defineProperty(Class, name, implProp)
				return Class[name]
			},
			set(v) {
				classProp.fromBox = Box.Current
				Box.TouchedStaticProperties.add(classProp)
				Object.defineProperty(Class, name, Impl[symStatic][name])
				Class[name] = v
			},
			fromBox: Box.Current,
			unhoist() {
				const implProp = Impl[symStatic][name]
				const staticInstance = this.fromBox.staticInstances.get(Class)
				if(implProp.writable) staticInstance[name] = Class[name]
				Object.defineProperty(Class, name, classProp)
				Box.TouchedStaticProperties.delete(classProp)
			}
		}
		Object.defineProperty(Class, name, classProp)
	}

	interceptStatics(Class, Impl) {
		let staticInstance

		Object.getOwnPropertyNames(Impl).forEach(name => {
			if(name === 'length' || name === 'prototype' || name === 'name') return

			staticInstance = staticInstance || Object.create(null)

			this.ensureClassStatic(Class, Impl, name)
			this.staticProperties.add(Class[symStatic][name])

			const implProp:any = Object.getOwnPropertyDescriptor(Impl, name) || (<any>{})
			implProp.configurable = true
			staticInstance[symStatic][name] = implProp

			Object.defineProperty(Impl, name, {
				configurable: false,
				enumerable: implProp.enumerable,
				get() {return Class[name]},
				set(v) {Class[name] = v}
			})
		})

		if(!staticInstance) return

		this.hasStatics = true
		this.staticInstances.set(Class, staticInstance)
	}

	bindImplTo(Class, Impl) {
		const {prototype: impl} = Impl
		impl[symCtor] = Impl
		impl.constructor = Class
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
			if(i === len - 1) {
				const fn = using[i]
				if(!isFn(fn)) throw new Error('last unpaired argument must be a function')
				return fn
			}
			const Class = using[i++]
			if(isArr(Class)) this.bind(Class)
			else {
				let Impl = using[i++]	|| {constructor_() {throw new Error(`${Class.name} de-implemented`)}}
				if(!isFn(Impl)) {
					const isMocked = !isArr(Impl)
					if(!isMocked) Impl = Impl[0]
					if(!isObj(Impl)) throw `${isMocked ? 'mock' : 'patch'} implementation must be an object`
					Impl = makePatch(Class, Impl, isMocked)
				}
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
		leftBox.forEach(touched => rightBox.has(touched) && touched.unhoist())
	}

	detectChangedStatics() {}

	enter() {
		if(!this.parent) this.bind()
		if(this.hasStatics) this.unhoistStatics()
		//detectChangedStatics()
		if(switchAll) this.registry.forEach(Class => Box.SwitchImplFor(Class))		
	}

	base(...using) {
		//const basedUsing:any[] = []
		//let current = this

		//while(current.using) basedUsing.unshift(current)

		return Box.Boxit([this.using, using])
	}

}

import defineContext from 'eldc'

const Boxed = defineContext(
{
	create(using) {return new Box(using)},
	top(box) {Box.Top = Box.Current =  box},
	enter() {
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

export function newjs(Base) {
	const className = Base.name
	const Class = switchAll
		? Function('Box', 'symBox', 'symCtor', `
				return function ${className}(...args) {
					return new (${className}[symCtor])(...args)
				}
			`)(Box, symBox, symCtor)

		: Function('Box', 'symBox', 'symCtor', 'symOff', `
				return class ${className} {
					constructor(...args) {
						if(${className}[symBox] !== Box.Current && ${className}[symOff]) 
							Box.SwitchImplFor(${className})
						return new (${className}[symCtor])(...args)
					}
					static [Symbol.hasInstance](instance) {
						if(${className}[symBox] !== Box.Current && ${className}[symOff]) 
							Box.SwitchImplFor(${className})
						return instance instanceof ${className}[symCtor]
					}
				}	
			`)(Box, symBox, symCtor, symOff)

	Class[symOff] = Base
	Box.Top.bindImplTo(Class, Base)
	return Class
}

export default newjs
