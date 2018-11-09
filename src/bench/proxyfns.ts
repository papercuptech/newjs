import 'source-map-support/register'

if(!(<any>Symbol).asyncIterator)
	(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");

//const logLines = []
const log = console.log


/*
const ptest = new Proxy(fn, {
	apply(fn, this_, args) {
		return fn.apply(this_, args)
	}
})


process.hrtime
*/

async function* test(runs, work, fn, ...args) {
	let run = 0
	let totDurNs = 0
	let minMs = Number.MAX_SAFE_INTEGER
	let maxMs = 0
	let a = args[0]
	let b = args[1]
	let c = args[2]
	let d = args[3]
	let e = args[4]
	let len = args.length
	while(++run, runs--) {
		let worked = work
		const start = process.hrtime()
		while(worked--) {
			if(len === 0) fn()
			if(len === 1) fn(a)
			if(len === 2) fn(a,b)
			if(len === 3) fn(a,b,c)
			if(len === 4) fn(a,b,c,d)
			if(len === 5) fn(a,b,c,d,e)
		}
		const durNs = process.hrtime(start)[1]
		totDurNs = totDurNs + durNs
		const durMs = durNs / 1000000
		if(minMs > durMs) minMs = durMs
		if(maxMs < durMs) maxMs = durMs
		const totMs = totDurNs / 1000000
		const avgMs = totMs / run
		yield {run, durMs, minMs, maxMs, avgMs, totMs, mem: process.memoryUsage()}
		await new Promise(r => setTimeout(r, 1))
	}
}


function fn(count) {
	//const arr = []
	let arr
	while(count--)
		arr.push(`do some work ${count}`)
	return arr
}


function fn1() {
	return fn.apply(this, arguments)
}

function fn2() {
	return fn1.apply(this, arguments)
}

function fnA1(...args) {
	return fn.apply(this, args)
}

function fnA2(...args) {
	return fnA1.apply(this, args)
}


function fnC1(a, b) {
	return fn(a, b)
}

function fnC2(a, b) {
	return fnC1(a, b)
}



function fnS1(...args) {
	return fn.call(this, ...args)
}

function fnS2(...args) {
	return fnS1.call(this, ...args)
}


function fnX1(...args) {
	const a = args
	const len = a.length
	if(len === 0) return fn()
	if(len === 1) return fn(a[0])
	if(len === 2) return fn(a[1], a[2])
	if(len === 3) return fn(a[1], a[2], a[3])
}

function fnX2(...args) {
	const a = args
	const len = a.length
	if(len === 0) return fnX1.call(this)
	if(len === 1) return fnX1.call(this, a[0])
	if(len === 2) return fnX1.call(this, a[1], a[2])
	if(len === 3) return fnX1.call(this, a[1], a[2], a[3])
}


function fnXx1(a,b,c,d) {
	const len = arguments.length
	if(len === 0) return fn.call(this)
	if(len === 1) return fn.call(this, a)
	if(len === 2) return fn.call(this, a, b)
	if(len === 3) return fn.call(this, a, b, c)
}

function fnXx2(a,b,c,d) {
	const len = arguments.length
	if(len === 0) return fnXx1.call(this)
	if(len === 1) return fnXx1.call(this, a)
	if(len === 2) return fnXx1.call(this, a, b)
	if(len === 3) return fnXx1.call(this, a, b, c)
}

function pad(width, str, padWith = ' ') {
	str = str || ''
	const start = width > 0 || str.length < (-width) ? 0 : str.length + width
	let right = width > 0
	width = Math.abs(width)
	let padded = str.substring(start, start + width)
	let padLen = width > padded.length ? width - padded.length : 0
	while(padLen--)
		if(right)
			padded += padWith
		else
			padded = padWith + padded
	return padded
}


function fixd(int, frac, n) {
	return pad(-(int + (frac ? 1 : 0) + frac), n.toFixed(frac))
}

function f(n) {return fixd(5, 3, n)}

async function testLog(runs, work, desc, fn, ...args) {
	log(`"${desc}"`)
	log(`  runs: ${fixd(3, 0, runs)}   work: ${fixd(9, 0, work)}`)
	log('===================================================================')
	log('run       dur       min       avg       max       tot h-used  h-tot')
	log('--- --------- --------- --------- --------- --------- ------ ------')
	for await(const r of test(runs, work, fn, ...args)) {
		log(`${fixd(3, 0, r.run)} ${f(r.durMs)} ${f(r.minMs)} ${f(r.avgMs)} ${f(r.maxMs)} ${f(r.totMs)} ${fixd(4, 1, r.mem.heapUsed / 1000000)} ${fixd(4, 1, r.mem.heapTotal / 1000000)}`)
	}
	log('===================================================================\n\n')
}

function logVer() {
	log(`\n\nnode: ${process.versions.node}   v8: ${process.versions.v8}\n`)
}

;(async () => {
	const runs = 8
	const work = 10000000

	logVer()

	await testLog(runs, work, 'Direct Call', fn)

	await testLog(runs, work, 'one hop - fn(a,b)', fnC1, 0, 1)
	await testLog(runs, work, 'two hops - fn(a,b)', fnC2, 0, 1)

	await testLog(runs, work, 'one hop - len fn(a,b)', fnXx1, 0, 1)
	await testLog(runs, work, 'two hops - len fn(a,b)', fnXx2, 0, 1)

	await testLog(runs, work, 'one hop - apply(arguments)', fn1, 0, 1)
	await testLog(runs, work, 'two hops - apply(arguments)', fn2, 0, 1)

	await testLog(runs, work, 'one hop - apply(args)', fnA1, 0, 1)
	await testLog(runs, work, 'two hops - apply(args)', fnA2, 0, 1)

	return
})
//()

function stuffWithProps(count) {
	const obj = Object.create(null)
	const props = obj.props = []
	const map = obj.map = new Map()
	while(count--) {
		let propName = 'prop' + count
		let propSym = Symbol(propName)
		obj[propName] = propName
		obj[propSym] = propName
		map.set(propName, propName)
		map.set(propSym, propName)
		props.push(propName)
		props.push(propSym)
	}
	return obj
}

function shuffle(list, times) {
	while(times--) {
		let len = list.length
		while(len--) {
			const from = Math.floor(Math.random() * list.length)
			const to = Math.floor(Math.random() * list.length)
			const temp = list[from]
			list[from] = list[to]
			list[to] = temp
		}
	}
	return list
}

function access(col, props, list) {
	let idx = list.length
	while(idx--) list.push(col[props[idx]])
}

function testObj(obj) {
	let props = obj.props
	let len = props.length
	let arr = []
	while(len--) {
		arr.push(obj[props[len]])
	}
}

function testMap(obj) {
	let map = obj.map
	let props = obj.props
	let len = props.length
	let arr = []
	while(len--) {
		arr.push(map[props[len]])
	}
}

;(async () => {
	const obj = stuffWithProps(100000)
	shuffle(obj.props, 3)
	await testLog(8, 4, 'obj', testObj, obj)
	await testLog(8, 4, 'map', testMap, obj)
})
//()

;(async () => {
	function A() {}
	function B() {}
	await testLog(8, 1_000_000, 'setPr', function C() {
		Object.setPrototypeOf(A, B)
	})
})()