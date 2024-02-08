const asyncHandler = (func) => async (req,res,next) => {
    try {
        await func(req,res,next)
    } catch (err) {
        res.status(500).json({
            error: err.message,
            code: err.statusCode
        })
        next(err)
    }
}
 
export { asyncHandler }
