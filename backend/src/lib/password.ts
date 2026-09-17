import bcrypt  from "bcryptjs"
const SALT_ROUND =12;
export async  function hashPassword (password :string):Promise<string>{
    return bcrypt.hash(password,SALT_ROUND)
}
export async function comparepassword (
    password:string,
    storedHash:string,

):Promise<boolean>{
    return  bcrypt.compare(password,storedHash)
}