const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}


export { asyncHandler }










/* HOC -> asyncHandler is defined as a higher-order function.
 A higher-order function is a function that takes another function as an argument or returns a function.
   // const asyncHandler = () => {}
   // const asyncHandler = (func) => () => {}
   // const asyncHandler = (func) => async () => {}
 */

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
