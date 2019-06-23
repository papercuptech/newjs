import context, {log, _plog, stopPlg} from 'eldc'
import newjs, {box, SymUnboxed} from './index'

process.on('beforeExit', () => {
	stopPlg()
	_plog.forEach(line => console.log(line))
})
//const log = console.log

const MyContext = context({prop: "Zero"})




function test(fn, runs, load) {
	let runCount = runs
	//console.time('run')
	while(runCount--) {
		setTimeout(() => {
			console.time('load')
			let loadCount = load
			while(loadCount--)
				fn()
			console.timeEnd('load')
			console.log(process.memoryUsage())
		}, 5)
	}
	//console.timeEnd('run')
	//console.log(process.memoryUsage())
}

class MyBase {
	age:any = 0
	constructor() {
		this.age = 1
	}
	method() {
		return 'SomeBase: ' + this.age
	}
}

/*(
function MyBase() {
	this.age = 0
	this.age = 1
	return this
}

MyBase.prototype.method = function() {
	return 'SomeBase: ' + this.age
}


let SomeClass = function SomeClass() {
	const t = MyBase.call(this) || this
}
SomeClass.prototype = Object.create(MyBase.prototype)
SomeClass.prototype.method = function() {
	return MyBase.prototype.method.call(this) + 'SomeClass'
}
SomeClass = newjs(SomeClass)
*/

@newjs
class SomeClass extends MyBase {
	constructor() {
		super()
		this.age = 45
	}
	method() {
		return super.method() + 'SomeClass'
	}
}


@newjs
class SomeClassA extends MyBase {
	constructor() {
		super()
		this.age = 45
	}
	method() {
		return super.method() + 'SomeClass'
	}
}


;(() => {

	class Impl extends MyBase {
		constructor()  {
			super()
			this.age = 111
		}
		method() {
			return super.method() + 'Impl'
		}
	}

	box(
		//Class, {method() {return 'deep man'}},
		//Class, Impl
		SomeClass, class Patch extends Impl  {
			constructor() {
				super()
				this.age = 423
			}
			method() {
				return super.method() + 'mock'
				//return 'mock'
			}
			age = 24
		}
	)(function boxOne() {

		box(
			SomeClassA, class Wow extends SomeClass[SymUnboxed] {
				constructor() {
					super()
				}
				age = 121212
				method() {
					return ' Mocked ' + super.method()
				}
			}
		)(function boxTwo() {
			const p = new SomeClassA()
			const isa = p instanceof MyBase

			const x = new SomeClass()
			x.age = x.method()
			x.age = x.method()

			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
		})

		setTimeout(() => {
			console.log('hmm')
		}, 10)

		test(() => {
			const p = new SomeClass()
			const isa = p instanceof SomeClass
			//const p = SomeClass[SymNewJs]()
			//const p = SomeClass.NewJs()
			const x = p

			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			//p.age += SomeClass.Static
			//console.log(p.age)
			//p.age = p.method()
			//p.age = 21
		}, 10, 100000)
	})
})()


class SomeOldClass extends SomeClass {
	constructor() {
		super()
		this.age = 45
	}
	method() {
		return super.method() + 'SomeOldClass'
	}
}

class AnotherClass extends SomeOldClass {
	constructor() {
		super()
		this.age = 45
	}
	method() {
		return super.method() + 'AnotherClass'
	}
}

//const p = new AnotherClass()
//p.age = p.method()

;(() => {
	test(() => {
		const p = new AnotherClass()
		const isa = p instanceof AnotherClass
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		p.age = p.method()
		//p.age = 12
	}, 10, 100000)

})()

;(() => {

	class Impl extends MyBase {
		constructor()  {
			super()
			this.age = 111
		}
		method() {
			return super.method() + 'Impl'
		}
	}

	box(
		//Class, {method() {return 'deep man'}},
		//Class, Impl
		SomeClass, class Patch extends Impl  {
			constructor() {
				super()
				this.age = 423
			}
			method() {
				return super.method() + 'mock'
				//return 'mock'
			}
			age = 24
		}
	)(function boxOne() {

		box(
			SomeClassA, class Wow extends SomeClass[SymUnboxed] {
				constructor() {
					super()
				}
				age = 121212
				method() {
					return ' Mocked ' + super.method()
				}
			}
		)(function boxTwo() {
			const p = new SomeClassA()
			const isa = p instanceof MyBase

			const x = new SomeClass()
			x.age = x.method()
			x.age = x.method()

			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
		})

		setTimeout(() => {
			console.log('hmm')
		}, 10)

		test(() => {
			const p = new SomeClass()
			const isa = p instanceof SomeClass
			//const p = SomeClass[SymNewJs]()
			//const p = SomeClass.NewJs()
			const x = p

			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			p.age = p.method()
			//p.age += SomeClass.Static
			//console.log(p.age)
			//p.age = p.method()
			//p.age = 21
		}, 10, 100000)
	})
})()
