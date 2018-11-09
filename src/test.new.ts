import defineContext, {log, _plog, stopPlg} from 'eldc'
import newjs, {box, SymNewJs} from './index'

process.on('beforeExit', () => {
	stopPlg()
	_plog.forEach(line => console.log(line))
})
//const log = console.log

const MyContext = defineContext({prop: "Zero"})



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
	age = 0
	constructor() {
		this.age = 1
	}
	method() {
		return 'SomeBase'
	}
}

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
			age: 24
		}
	)(function boxOne() {

		setTimeout(() => {
			console.log('hmm')
		}, 10)

		test(() => {
			const p = new SomeClass()
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