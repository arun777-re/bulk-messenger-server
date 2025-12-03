import multer from 'multer';


const storage = multer.diskStorage({
    destination:function(req,file,cb){
cb(null,'uploads/')
    },
    filename:function(req,file,cb){
        const uniqueIdentifier = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null,uniqueIdentifier + "-" + file.originalname);
    }
  });

const upload = multer({storage:storage,
    limits:{fileSize:5 * 1024 * 1024}, 
    fileFilter:function(req,file,cb){
        if(file.mimetype === 'text/csv'){
            cb(null,true);
        }else{
            cb(new Error('Only CSV files are allowed to upload'))
        }
    }
});

export default upload;
