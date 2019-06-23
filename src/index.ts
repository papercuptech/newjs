'use strict'


import Context, {oFunction} from 'eldc'

const {
	create,
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
export const SymUnboxed = Symbol('newjs-boxed')
const symFaceSymbol = Symbol('newjs-impl-symbol')

const symBox = Symbol('newjs-box')

const symStatics = Symbol('newjs-statics')
//const symImpl = Symbol('newjs-impl')


let top:BoxContext
class BoxContext {
	// this always defined, declared here for typed access
	static Current:BoxContext

	// statics define contextualized properties and their defaults
	static faceImpls = []  // must ALWAYS set default value, even if 'null' or 'undefined'
	// define instance name to access from both static and instance methods
	faceImpls!:Array<any>



	initialize(parent) {
		parent && setPrototypeOf(this, parent) || (top = this)
		this.bindTemplate(this.faceImpls)
	}

	//softSwitch(from) {
	//}

	//hardSwitch(from) {
	//}


	bindTemplate(faceImpls) {
		const len = faceImpls.length
		let i = 0
		while(i < len) {
			const Face = faceImpls[i++]
			if(isArr(Face)) this.bindTemplate(Face)
			else {
				let Impl = faceImpls[i++]
					|| (class {constructor() {throw new Error(`${Face.name} de-implemented`)}})
				this.bind(Face, Impl)
			}
		}
	}

	bind(Face, Impl) {
		const symFace = Face[symFaceSymbol]
		if(!symFace) throw new Error('not a newjs class')
		defineProperty(Impl.prototype, 'constructor',
			{configurable: true, enumerable: true, writable: true, value: Face})
		this[symFace] = Impl


		 this[symFace][symStatics]
	}
}

const BoxFactory = Context(BoxContext)


function makeClassObjectCreator(Face, statics) {
	/*
	const props = Object.getOwnPropertyNames(Face)
	let idx = props.length
	while(idx--) {
		const name = props[idx]
		if(name === 'length' || name === 'prototype' || name === 'name') continue

	}

	defineProperty(Face, name, {
		configurable: true
	})

	return function() {
		const classObj = create(null)

	}
	*/
}


function newnew<T extends Function>(Class:T, isAlsoFn, statics) {
	if(!isFn(Class) || !Class.prototype) throw new Error('sorry... your core is iron.. going supernova')
	const faceName = Class.name
	const DefaultImpl = Class
	const symFace = Symbol(`eldc-face-${faceName}`)

	const newCode = isAlsoFn
		? `
			function ${faceName}() {
				const a = arguments, l = a.length
				const Impl = BoxContext.Current[symFace]
				if(new.target === ${faceName}) {
					return (
						l<1?new Impl():
						l<2?new Impl(a[0]):
						l<3?new Impl(a[0],a[1]):
						l<4?new Impl(a[0],a[1],a[2]):
						l<5?new Impl(a[0],a[1],a[2],a[3]):
						l<6?new Impl(a[0],a[1],a[2],a[3],a[4]):
						l<7?new Impl(a[0],a[1],a[2],a[3],a[4],a[5]):
						l<8?new Impl(a[0],a[1],a[2],a[3],a[4],a[5],a[6]):
						l<9?new Impl(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7]):
						new Impl(...a)
					)
				}
				return (
					l<1?Impl.call(this):
					l<2?Impl.call(this,a[0]):
					l<3?Impl.call(this,a[0],a[1]):
					l<4?Impl.call(this,a[0],a[1],a[2]):
					l<5?Impl.call(this,a[0],a[1],a[2],a[3]):
					l<6?Impl.call(this,a[0],a[1],a[2],a[3],a[4]):
					l<7?Impl.call(this,a[0],a[1],a[2],a[3],a[4],a[5]):
					l<8?Impl.call(this,a[0],a[1],a[2],a[3],a[4],a[5],a[6]):
					l<9?Impl.call(this,a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7]):
					Impl.apply(this,a)
				)
			}
			
			Object.defineProperty(${faceName}, Symbol.hasInstance, 
				{value: function(instance) {return instance instanceof BoxContext.Current[symFace]}})
				
			return ${faceName}		
		`
		: `
			return class ${faceName} extends ${faceName}$Impl {
				constructor() {
					const a = arguments, l = a.length
					const box = BoxContext.Current
					if(new.target === ${faceName}) {
						return (
							l<1?new box[symFace]():
							l<2?new box[symFace](a[0]):
							l<3?new box[symFace](a[0],a[1]):
							l<4?new box[symFace](a[0],a[1],a[2]):
							l<5?new box[symFace](a[0],a[1],a[2],a[3]):
							l<6?new box[symFace](a[0],a[1],a[2],a[3],a[4]):
							l<7?new box[symFace](a[0],a[1],a[2],a[3],a[4],a[5]):
							l<8?new box[symFace](a[0],a[1],a[2],a[3],a[4],a[5],a[6]):
							l<9?new box[symFace](a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7]):
							new box[symFace](...a)
						)
					}
					return (
						l<1?super():
						l<2?super(a[0]):
						l<3?super(a[0],a[1]):
						l<4?super(a[0],a[1],a[2]):
						l<5?super(a[0],a[1],a[2],a[3]):
						l<6?super(a[0],a[1],a[2],a[3],a[4]):
						l<7?super(a[0],a[1],a[2],a[3],a[4],a[5]):
						l<8?super(a[0],a[1],a[2],a[3],a[4],a[5],a[6]):
						l<9?super(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7]):
						super(...a)
					)
				}
				static [Symbol.hasInstance](instance) {
					return instance instanceof BoxContext.Current[symFace]
				}
			}
		`
	const Face = oFunction(`${faceName}$Impl`, 'BoxContext', 'symFace', newCode)(DefaultImpl, BoxContext, symFace)

	defineProperty(Face, 'length', {configurable: true, enumerable: true, value: DefaultImpl.length})
	Face[symFaceSymbol] = symFace
	defineProperty(Face, SymUnboxed, {get() {return BoxContext.Current[symFace]}})
	makeClassObjectCreator(Face, statics)
	top.bind(Face, DefaultImpl)
	return Face as T & {[SymUnboxed]: T}
}

//@newjs(['static_one', 'static_n'])

export function newjs(Class) {return newnew(Class, false, [])}
export function newfn(fn) {return newnew(fn, true, [])}

// if using ctor function in 'instanceof' checks on hosts not supporting Symbol.hasInstance (ie11)
export function oldnew(fn) {return null}


export default newjs

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
