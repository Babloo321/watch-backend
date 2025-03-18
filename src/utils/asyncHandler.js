// const asynHandler = (fn) => async(req,res,next)=>{   // HOF
//   try {
//     await fn(req, res,next);
//   } catch (error) {
//     req.status(error.statusCode).json({success:false,message:error.message});
//   }
// }


const asyncHandler = (requestHandler) =>{
  return (req,res,next)=>{
     Promise.resolve(requestHandler(req,res,next)).catch(err => next(err));
   }
 }
 
 export default asyncHandler;
 