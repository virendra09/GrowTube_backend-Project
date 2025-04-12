class ApiError extends Error {
   
    constructor(
        statusCode,
        message="Something went wrong",
        errors = [],

        // error stack
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null,
        this.message = message,

        // here we are handling Api error not Api response.
        this.success = false
        this.errors = errors


        // this code can be avoid
       if(stack){
        this.stack = stack
       } else{
         Error.captureStackTrace(this, this.constructor)
       }
    }
}   

export {ApiError}