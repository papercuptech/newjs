'use strict'


import context, {Context, oFunction} from 'eldc'

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
export const SymBoxed = Symbol('newjs-boxed')
const symFace = Symbol('newjs-face-symbol')

const symBox = Symbol('newjs-box')

const symImpl = Symbol('newjs-impl')

class BoxContext extends Context {
	constructor(props, initial, parent) {
		super(props, initial, parent)
		parent && setPrototypeOf(this, parent)
		this.registerTemplate(initial.faceImpls)
	}

	registerTemplate(faceImpls) {
		const len = faceImpls.length
		let i = 0
		while(i < len) {
			const Face = faceImpls[i++]
			if(isArr(Face)) this.registerTemplate(Face)
			else {
				let Impl = faceImpls[i++]
					|| (class {constructor() {throw new Error(`${Face.name} de-implemented`)}})
				this.register(Face, Impl)
			}
		}
	}

	register(Face, Impl) {
		const faceSymbol = Face[symFace]
		if(!faceSymbol) throw new Error('not a newjs class')
		defineProperty(Impl.prototype, 'constructor', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: Face
		})
		this[faceSymbol] = Impl
	}

	// statics define contextualized properties and their defaults
	static faceImpls = []

	static Top:BoxContext
	static Current:BoxContext
}

const BoxFactory = context(BoxContext)


export default function newjs<T extends Function>(Class:T) {
	if(!isFn(Class) || !Class.prototype) throw new Error('sorry... your core is iron.. going supernova')
	const faceName = Class.name
	const Impl = Class
	const faceSymbol = Symbol(`eldc-face-${faceName}`)
	const Face = oFunction('DefaultImpl', 'BoxContext', 'faceSymbol', 'symImpl', `
		return class ${faceName} extends DefaultImpl {
			constructor(...args) {
				const box = BoxContext.Current
				if(new.target === ${faceName}) return new box[faceSymbol](...args)
				if(new.target) return super(...args)
				return box[faceSymbol].call(this, ...args)
			}
			static [Symbol.hasInstance](instance) {
				return instance instanceof BoxContext.Current[faceSymbol]
			}
		}
	`)(Class, BoxContext, faceSymbol, symImpl)

	Face[symFace] = faceSymbol
	defineProperty(Face, SymBoxed, {get() {return BoxContext.Current[faceSymbol]}})
	BoxContext.Top.register(Face, Impl)
	return Face as T & {[SymBoxed]: T}
}


/*
// immediately create a box from the template, and run function in box
box(
	ClassA, ImplA,
	ClassB, ImplB
)(() => {
	const x = new ClassA()
})

// here we create a box from the template, and return
// a 'runIn' function that always runs in the box using
// the context box created in

const boxed = box(
	ClassA, ImplA,
	ClassB, ImplB
)

boxed(() => {
	const x = new ClassA()
})



// here we create a template that returns a 'runIn' function.
// when runIn(fn) is called, the template is registered.
// this means Impl's may be from other boxes of higher context
const boxer = box(
	ClassA, ImplA,
	ClassB, ImplB
)()

boxer(() => {
	const x = new ClassA()
})





 */
export function box(...faceImpls) {
	const boundBox = BoxFactory({faceImpls})
	return fn => isFn(fn) ? boundBox(fn) : fn => BoxFactory({faceImpls})(fn)
}


/*
let nextId = 0
class Boxx {
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
*/

/*
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
*/
//export function box(...using) {return Box.Boxit(using)}

/*
export function newjsx(Impl) {
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
*/

//export default newjs
