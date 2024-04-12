const asyncHandler = (requestHnadler) =>{
    (req , res ,next) => {
       Promise.resolve(requestHnadler(req, res, next)).
       catch((err)=> next(err))
    }
}

export {asyncHandler}