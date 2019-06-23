'use strict'


import {context, Context, oFunction} from 'eldc'

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
export const SymPatch = Symbol('newjs-patch')
const symFace = Symbol('newjs-face-symbol')

const symBox = Symbol('newjs-box')

const symImpl = Symbol('newjs-impl')

@context
export class Box extends Context {
	constructor(props, initial, parent) {
		super(props, initial)
		setPrototypeOf(this, parent) // how bad is this really? this early and only once?
		this.registerTemplate()
	}

	registerTemplate(template) {
		template = template || this.template
		const len = template.length
		let i = 0
		while(i < len) {
			const Face = template[i++]
			if(isArr(Face)) this.registerTemplate(Face)
			else {
				let Impl = template[i++]
					|| (class {constructor() {throw new Error(`${Face.name} de-implemented`)}})
				this.register(Face, Impl)
			}
		}
	}


	register(Face, Impl) {
		const faceSymbol = Face[symFace]
		if(!faceSymbol) throw new Error('not a newjs class')
		this[faceSymbol] = Impl
		Impl.prototype.constructor = Face

		// "statics"
		// do nothing
		//
	}

	setupStatics(Face, Impl) {

	}

	static template = undefined
}

export default function newjs(Class) {
	if(!isFn(Class) || !Class.prototype) throw new Error('sorry... your core is iron.. going supernova')
	const faceName = Class.name
	const Impl = Class
	const faceSymbol = Symbol(`eldc-face-${faceName}`)
	const Face = oFunction('Class', 'symBox', 'faceSymbol', 'symImpl', `
		class ${faceName} extends Class {
			constructor(...args) {
				const box = Context.Current[symBox]
				if(new.target)
					if(new.target !== ${faceName}) return super(...args)
					else return new box[faceSymbol](...args)
				else return box[faceSymbol].call(this, ...args)
			}
		}
	`)(Class, symBox, faceSymbol, symImpl)

	Face[symFace] = faceSymbol
	defineProperty(Face, SymPatch, {
		configurable: false,
		enumerable: false,
		get() {return Context.Current[symBox]}
	})
	Face[SymPatch] = Class
	Box.Top.register(Face, Impl)
	return Face
}

export function box(...template) {
	return function(fn) {
		const run = Box({template})
		return isFn(fn) ? run(fn) : fn => isFn(fn) ? run(fn) : fn => () => run(fn)
	}
}

