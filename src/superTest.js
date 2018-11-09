class ActBaseOne {
	constructor() {
		console.log('ActBaseOne')
	}
}

class BaseOne extends ActBaseOne {
	constructor() {
		super()
		this.method()
	}
	method()  {
		console.log('BaseOne')
	}
}

class ActBaseTwo {
	constructor() {
		console.log('ActBaseTwo')
	}
}
class BaseTwo extends ActBaseTwo {
	constructor() {
		super()
	}
	method()  {
		console.log('BaseTwo')
	}
}

function Access(B) {
	return new B()
}

class Derived extends Access {
	constructor(B) {
		super(B)
		this.method()
	}
	method() {
		super.method()
	}
}


const Blank = new Proxy(BaseOne, {
	construct(target, args, proxy) {
		//return Reflect.construct(args[0], [])
		return Reflect.construct(args[0], args, proxy)
	}
})

class D2 extends Blank {
	constructor(B) {
		super(B)
		this.method()
	}
}

const d = new D2(BaseTwo)

