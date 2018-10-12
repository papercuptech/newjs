const api:any = {}
export default api

api.method = function(arg1, cb) {
	setTimeout(() => cb(arg1), 100)
}

class Result {
	protoMethod(arg1, cb) {
		setTimeout(() => cb(arg1), 100)
	}
}
api.Result = Result

api.onResult = function(arg1) {
	const result:any = new Result()
	result.method = function(cb) {
		setTimeout(() => cb(arg1), 100)
	}
	return result
}

api.onResultProto = function(arg1) {
	return new Result()
}

api.Class = class {
	method(arg1, cb) {
		setTimeout(() => cb(arg1), 100)
	}
}



