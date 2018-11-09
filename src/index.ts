'use strict'


import defineContext, {oFunction} from 'eldc'

const {
	create: objCreate,
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

const symClassSym = Symbol('newjs-class-symbol')
export const SymNewJs = Symbol('newjs-new')

let nextId = 0
class Box {
	id = nextId++
	static Top
	static Current

	static Boxit(using) {
		return function(fn) {
			const run = Boxed(using)
			return isFn(fn) ? run(fn) : fn => isFn(fn) ? run(fn) : fn => () => run(fn)
		}
	}

	//---------------------------------------------------------------------------------

	reg:any

	constructor(public using?:any[]) {}

	register(Class, Impl) {
		const symClass = Class[symClassSym]
		return this.reg[symClass] = {
			box: this,
			symClass,
			Impl,
			statics: objCreate(Impl),
		}
	}

	bind(using?:any[]) {
		using = using || this.using
		if(!using) return
		const len = using.length
		let i = 0
		while(i < len) {
			const Class = using[i++]
			if(isArr(Class)) this.bind(Class)
			else {
				let Impl = using[i++]	|| (class {constructor() {throw new Error(`${Class.name} de-implemented`)}})
				this.register(Class, Impl)
			}
		}
	}

	enter(from) {
		if(!this.reg) {
			this.reg = objCreate(from.reg)
			this.bind()
		}
	}
}


const Boxed = defineContext({}, {
	create(using) {
		return new Box(using)
	},
	top(box) {
		box.reg = Object.create(null)
		Box.Top = Box.Current = box
	},
	enter(this:Box, from:Box) {
		this.enter(from)
		Box.Current = this
	}
})

export function box(...using) {return Box.Boxit(using)}


export function newjs(Impl) {
	let env
	let NewJs_ = Impl.NewJs || NewJs
	const symClass = Symbol(`newjs-${Impl.name}`)

	const classSource = `
		return class ${className} extends Base {
			constructor(...args) {
				if(new.target === ${className} return new ${className}[symCtor](...args)
				if(new.target) return super(...args)
				return Base.call(this, ...args)
			}
		}
	`
	const Class = oFunction()


	function Meta() {}
	const Class = new Proxy(Meta, {
		get(Meta, property) {
			if(property === symClassSym) return symClass
			if(property === 'NewJs') return NewJs_
			if(property === SymNewJs) return NewJs
			const {Current} = Box
			if(env.box !== Current) env = Current.reg[env.symClass]
			return env.statics[property]
		},
		set(Mets, property, value){
			if(property === 'NewJs') return NewJs_ = value
			if(property === SymNewJs) return
			const {Current} = Box
			if(env.box !== Current) env = Current.reg[env.symClass]
			return env.statics[property] = value
		}
	})
	Meta[symClassSym] = symClass
	function NewJs(...args) {return new Class(...args)}
	env = Box.Top.register(Meta, Impl)
	return Class
}


export default newjs
