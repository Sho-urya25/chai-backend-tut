const asyncHandler = () => {

}

export { asyncHandler }

// !higher order function which accepts func as variable inside a function 

//?example 
//! const asyncHandler = (newFunc)=>()=>{}
//? to make it async 
//! const asyncHandler = (newFunc)=>async()=>{}


// ?const asyncHnadeler = (func) => async (req, res, next) => {
//     try {
//         await func(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

//!OR 
/*
const asyncHandler = (requestHnader) => {
    (req, res, next) => {
        Promise.resolve(requestHnader(req, res, next)).catch(e => { next(e)})
    }
}
*/