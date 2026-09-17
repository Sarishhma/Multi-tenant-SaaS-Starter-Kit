//communicates with database 

import { prisma } from "../../../lib/prisma.js";

export const twoFactorRepository ={

async findUserById(userId:string){
    return prisma.user.findUnique({
        where:{id:userId},
        select:{
            id:true,
            totpSecret:true,
            isTwoFactorEnabled:true
        }
    })
},
 
async saveTopSecrete(userId:string,totpSecret:string){
return prisma.user.update({
    where:{id:userId},
    data:{
        totpSecret
    },
    select:{
        id:true,
        totpSecret:true,
        isTwoFactorEnabled:true
    }
})
},

async enableTwoFactor(userId:string){
    return prisma.user.update({
        where:{id:userId},
        data:{
        isTwoFactorEnabled:true
        },
        select:{
            id:true,
            totpSecret:true,
            isTwoFactorEnabled:true
        }
    })
},

async disableTwoFactor(userId:string){
    return prisma.user.update({
        where:{id:userId},
        data:{
            totpSecret:null,
            isTwoFactorEnabled:false
        },

        select:{
            id:true,
            totpSecret:true,
            isTwoFactorEnabled:true
        }
    })
}


}
