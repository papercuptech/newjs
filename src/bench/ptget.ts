
function A() {}

function C() {}
let desc = Object.getOwnPropertyDescriptor(C, Symbol.hasInstance)
console.log(desc)

Object.defineProperty(C, Symbol.hasInstance, {value: function(instance) {console.log('test'); return true}})

desc = Object.getOwnPropertyDescriptor(C, Symbol.hasInstance)
console.log(desc)

let x = new C()
console.log({} instanceof C)