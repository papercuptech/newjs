import 'source-map-support/register'

import newjs, {box} from './index'

import defineContext from 'eldc'

const log = console.log

const MyContext = defineContext({prop: "Zero"})


function nap(ms, bomb) {
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


MyContext(async () => {
	MyContext.prop = 'One'
	try {
		for await (const countDown of tick(10, 20, 'One'))
			log(`${MyContext.prop} === "One": ${countDown}`)
	
	}
	catch(ex) {
		//if(MyContext.prop !== 'One')
			log(`catch ${MyContext.prop} !== "One"`)
		throw ex
	}
	finally{
		if(MyContext.prop !== 'One')
			log(`finally ${MyContext.prop} !== "One"`)
	}
	
})


MyContext(async () => {
	
	MyContext.prop = 'Two'
	try {
		for await (const countDown of tick(20, 10, 'Two'))
			log(`${MyContext.prop} === "Two": ${countDown}`)
	}
	catch(ex){
		//if(MyContext.prop !== 'Two')
			log(`catch ${MyContext.prop} !== "Two"`)
		throw ex
	}
	finally{
		if(MyContext.prop !== 'Two')
			log(`finally ${MyContext.prop} !== "Two"`)
	}
})


/*
MyContext(async () => {
	MyContext.prop = 'Two'
	for await (const countDown of tick(10, 20))
		log(`${MyContext.prop} === "Two": ${countDown}`)
})	
*/

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
)(async () => {

	await nap(100)
	const x = new Class()
	log(x.method() === 'deep man')	

	/*
	setTimeout(() => {
		const x = new Class()
		log(x.method())	
	}, 30)
	*/
})



box(
	Class, {
		method() {return 'Test'}
	}
)(async () => {


	box(
		Class, {
			method() {return 'deep man'}
		}
	)(async () => {

		await nap(100)
		const x = new Class()
		log(x.method() === 'deep man')	

		/*
		setTimeout(() => {
			const x = new Class()
			log(x.method())	
		}, 30)
		*/
	})

	await nap(10)
	const x = new Class()
	log(x.method() === 'Test')	

	/*
	setTimeout(() => {
		log(x.method())
	}, 10)
	*/
})

box(
	Class, {
		method() {return 'Mock'}
	}
)(() => {
	const x = new Class()
	log(x.method())
})


})