
const GiveMeSomeContext = defineContext({yourPurposeIs: 'hello'})
//export GiveMeSomeContext

// import {GiveMeSomeContext MyWorld} ..
function imNothingWithoutContext() {
	log(GiveMeSomeContext.yourPurposeIs)
}


import http from 'http'
//const d = new http.ClientRequest('http://news.google.com', () => {})

//const y = d

function _patch(a) {}



try {
	patch(wrapThese.node['10.11.0'])
	_patch({
		'zlib.Gzip': {p: ['close', 'flush', 'params']}
	})  
}
catch{}


const log = console.log

@newjs
export class IServiceBase {
	subMethod() {return 'Ap'}

	method() {return this.subMethod()}
}
// 'old' school
// function IServiceBase() {}
// IServiceBase.prototype.method = function() {return 'to me my love'}
// module.exports = newjs(IServiceBase) // function will have same name
// var ISvcB = retired('./ioldservicebase')



//@newjs
export class Consumer {
	service = new IServiceBase()
	useMethod() {return this.service.method()}
}

function doReallyImportantStuff() {
	const con = new Consumer()
	log('con instanceof IServiceBase: ', con instanceof IServiceBase)
	log(con.useMethod())
}

doReallyImportantStuff()




//@newjs
export class Provider {
	method() {return 'Provider'}
}

//faceCheck<T>(Class:T, Impl:T) {return [Class, Impl]}

box(IServiceBase, Provider)(doReallyImportantStuff)


function patchxx(using) {return [using]}
function mock(using) {return using}

box(IServiceBase, patch({
	subMethod() {
		return 'look mom, im a patch!'
	}})
)(doReallyImportantStuff)

box(IServiceBase, patch({
	method(base) {
		return base.subMethod() + ' (but not really... shh)'
	}})
)(doReallyImportantStuff)

box(IServiceBase, mock({
	method(base) {
		// throws.. mocks are a total mockery, a sham, a flim-flam
		return base.subMethod() + ' (but not really... shh)'
	}})
)(doReallyImportantStuff)





import api from './patchtest'
import { box } from 'proto';

const x = api.Result

function _patchApply(a,b) {}

_patchApply(api, {
	c: true,
	p: [
		'method',
		{e: {
			onResult: ['method']
		}},
		{p: [
			{
				methods: [

				], 
				props: [

				]
			}
		]}
	],
	s: [
		'method',
		{e: {
			onResult: ['method']
		}},
		{p: [
			{
				methods: [

				], 
				props: [

				]
			}
		]}
	],
	//Result: {p: ['protoMethod']},
})


//api.method('test', console.log)

_plog.forEach(
	line => console.log(line)
)

const MyContext = defineContext({
	test: 'hello',
	enter(from) {
		plg('enter')
	}
})

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

_plog.length = 0
/*
MyContext(() => {
	console.log(MyContext.test)
	MyContext.test = 'world'

	console.log(MyContext.test)

	MyContext(() => {
		MyContext.test ='sub1'

		for(let i = 0; i < 100; ++i) {
			setTimeout(() => {
				if(MyContext !== 'sub1')
					plg(`should be sub1 ${MyContext.test}`)
			}, getRandomInt(10, 400))  
		}
	})

	MyContext(() => {
		MyContext.test ='sub2'

		for(let i = 0; i < 80; ++i) {
			setTimeout(() => {
				if(MyContext !== 'sub2')
					plg(`should be sub2 ${MyContext.test}`)
			}, getRandomInt(1, 600))  
		}
	})

	console.log(MyContext.test)
})

setTimeout(() => {
	_plog.forEach(
		line => console.log(line)
	)	
}, 1000)
*/6