import  type {JwtPayload} from "jsonwebtoken"


export interface UserPayload extends JwtPayload {
  email: string,
  userId: string,
} 