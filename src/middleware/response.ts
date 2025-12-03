import { Response } from "express";

export const customResponse = ({
  res,
  status,
  message,
  data,
  length,
  success
}: {
  res: Response;
  status: number;
  message: string;
  data?: any;
  length?: number;
  success:boolean;
}) => {
  return res.status(status).json({
    success: success,
    message,
    data,
  });
};


export const errorResponse = ({res,status,error}:{res:Response,status:number,error:Error})=>{
    return res.status(status).json({
        success:false,
        message:'An error occurred',
        error:error.message || error
    });
}
