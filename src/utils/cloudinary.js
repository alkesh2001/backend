import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'  

cloudinary.config({ 
  cloud_name: process.env.CLOUDINAY_CLOUD_NAME, 
  api_key: process.env.CLOUDINAY_API_KEY, 
  api_secret: CLOUDINAY_API_SECRET   
});

const cloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary 
       const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        }) 
        //file has been uploaded successfull 
        console.log("file has been uploaded" , response.url)
        return response 
    } catch (error) {
        fs.unlinkSync(localFilePath)  //remove the locally saved temporary file as the upload operation got failed
        return null
    }
}
