export interface CloudinaryResponse {
    public_id: string;       
    secure_url: string;       
    resource_type: 'image' | 'video'; 
    width?: number;          
    height?: number;         
    duration?: number;       
    format: string;         
  }