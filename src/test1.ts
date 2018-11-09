import defineContext, {log, _plog, stopPlg} from 'eldc'
import newjs, {box} from './index'

process.on('beforeExit', () => {
	stopPlg()
	_plog.forEach(line => console.log(line))
})
//const log = console.log

const MyContext = defineContext({prop: "Zero"})


function nap(ms, bomb?) {
	return new Promise(resolve => {setTimeout(() => {
		//throw new Error("BOOM")	
		resolve()
	},ms)})
}
async function* tick(tock, count, id) {
	while(count--) {
		//if(count === 6) throw new Error("BOOM")
		if(id !== MyContext.prop)
			log(`bfr ${id} ${MyContext.prop}`)
		await nap(tock, count)
		if(id !== MyContext.prop)
			log(`aft ${id} ${MyContext.prop}`)
		if(count === 3) throw new Error("BOOM")	
		yield count
		if(id !== MyContext.prop)
			log(`yld ${id} ${MyContext.prop}`)
	}
}

;(() => {
	MyContext(async () => {
		MyContext.prop = 'One'
		log(`*************************************catch ${MyContext.prop} !== "One"`)
		try {
			for await (const countDown of tick(10, 20, 'One'))
				log(`${MyContext.prop} === "One": ${countDown}`)
		
		}
		catch(ex) {
			if(MyContext.prop !== 'One')
				log(`catch ${MyContext.prop} !== "One"`)
			throw ex
		}
		finally{
			if(MyContext.prop !== 'One')
				log(`finally ${MyContext.prop} !== "One"`)
		}
		
	})	
})

;(() => {
	MyContext(async () => {
	
		MyContext.prop = 'Two'
		try {
			for await (const countDown of tick(20, 10, 'Two'))
				log(`${MyContext.prop} === "Two": ${countDown}`)
		}
		catch(ex){
			if(MyContext.prop !== 'Two')
				log(`catch ${MyContext.prop} !== "Two"`)
			throw ex
		}
		finally{
			if(MyContext.prop !== 'Two')
				log(`finally ${MyContext.prop} !== "Two"`)
		}
	})
	
})

;(() => {
	MyContext(async () => {
		MyContext.prop = 'One'

		//log(`0 bfr await ${MyContext.prop}`)
		//nap(10)
		//log(`0 aft await ${MyContext.prop}`)


		MyContext(async () => {
			MyContext.prop = 'Two'

			log(`2 bfr await ${MyContext.prop}`)

			await nap(10)

			log(`2 aft await ${MyContext.prop}`)
		})

		log(`1 bfr await ${MyContext.prop}`)
		await nap(100)
		log(`1 aft await ${MyContext.prop}`)
	})
})
//()
/*
MyContext(async () => {
	MyContext.prop = 'Two'
	for await (const countDown of tick(10, 20))
		log(`${MyContext.prop} === "Two": ${countDown}`)
})	
*/

;(() => {
	MyContext(async function ctxOne() {
		MyContext.prop = 'One'
		await nap(100)
		log(`${MyContext.prop} should be 'One'`)
	})

	MyContext(async function ctxTwo() {
		MyContext.prop = 'Two'

		MyContext(async function ctxTwoOne() {
			MyContext.prop = 'TwoOne'

			await nap(100)
			log(`${MyContext.prop} should be 'TwoOne'`)

			setTimeout(() => {
				log(`${MyContext.prop} should be 'TwoOne'`)
			}, 30)
		})

		await nap(10)
		log(`${MyContext.prop} should be 'Two'`)

		setTimeout(() => {
			log(`${MyContext.prop} should be 'Two'`)
		}, 10)
	})

	MyContext(function ctxThree() {
		MyContext.prop = 'Three'
		log(`${MyContext.prop} should be 'Three'`)
	})
})
//()

;(() => {
	@newjs
	class Class {
		method() {return 'Class'}
	}

	const x = new Class()
	log(x.method())

	box(
		Class, {
			method() {return 'deep man'}
		}
	)(async function boxOne() {

		await nap(100)
		const x = new Class()
		log('a', x.method() === 'deep man')	


		setTimeout(function timeoutZero() {
			const x = new Class()
			log(x.method())
		}, 30)

	})


	box(
		Class, {
			method() {return 'Test'}
		}
	)(async function boxTwo() {





		box(
			Class, {
				method() {return 'deep man'}
			}
		)(async function boxThree() {

			await nap(100, 'IDboxThree')
			const x = new Class()
			log('b', x.method() === 'deep man')	

			setTimeout(function timeoutOne()  {
				const x = new Class()
				log('d', x.method())	
			}, 30)
		})



		await nap(10)
		const x = new Class()
		log('c', x.method() === 'Test', x.method())	



		setTimeout(function timeoutTwo() {
			log('e', x.method())
		}, 10)
	})

	box(
		Class, {
			method() {return 'Mock'}
		}
	)(function boxFour() {
		const x = new Class()
		log('f', x.method())
	})
})
//()

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


;(() => {
	@newjs
	class Class {
		method() {return 'Class'}
		//age = 12
	}

	const x = new Class()
	log(x.method())

	const patch = box(
		Class, class extends Class {
			method() {
				return 'deep man' + super()
			}
		}
	)(function boxOne() {
		test(() => {
			const p = new Class()

			console.log(p.method())
			//p.age = 12
		}, 10, 10)
	})
})()


class Class {
	method() {return 'Class'}
	age = 12
}

test(() => {
	const p = new Class()
	p.age = p.method()
	p.age = 12
}, 10, 10)
